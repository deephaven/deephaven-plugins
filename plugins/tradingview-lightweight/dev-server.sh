#!/usr/bin/env bash
# Live-refresh dev server for the TVL plugin.
#
# Differences vs. start-server.sh:
#   - Builds + installs the wheel ONCE (per fresh venv) for entry-point
#     registration, then replaces site-packages/deephaven/plot/tradingview_lightweight/
#     with a symlink to the source tree so Python edits are live.
#     (We can't use `pip install -e .` here: deephaven-server ships
#     deephaven/plot/__init__.py as a regular package, which shadows the
#     editable install's .pth path entry. Symlinking the sub-package into
#     the existing regular package is the workaround.)
#   - Inside _js/, replaces dist/ with a symlink to src/js/dist so Vite's
#     output goes live. (_js/ itself must stay a real directory because the
#     DH plugin loader reads _js/package.json at its root.)
#   - Runs `vite build --watch` in the background; JS rebuilds on save, and a
#     browser hard-refresh picks up the new bundle.
#   - Writes a tvl_dev.py fixture into .app.d/ that exposes tvl_reload() for
#     picking up Python edits in the console without a server restart.
#
# Workflow:
#   JS edit           -> vite rebuilds       -> hard-refresh browser (Ctrl+Shift+R)
#   Python widget edit -> call tvl_reload() in console, then re-run your expression
#   Fixture edit       -> DH app mode reloads automatically
#   _register.py edit  -> restart this script (new chart types register at boot)
#
# Ctrl-C shuts down both Vite and the DH server, and removes the dev-only
# symlinks (site-packages plugin dir + _js/dist) so a subsequent
# `bash start-server.sh` wheel build/uninstall runs cleanly without
# accidentally following symlinks into the source tree.
set -euo pipefail
cd "$(dirname "$0")"
PLUGIN_DIR="$(pwd)"
REPO_ROOT="$(cd ../.. && pwd)"

# Per-host env file: sourced if present. Use this to override PY_UV / PY /
# VENV without touching your shell rc. Create one per host, both live in the
# shared working tree and are gitignored.
#   dev-server.env.$(hostname -s)   — host-specific (preferred)
#   dev-server.env.local            — fallback if no host-specific file exists
HOST_ENV="$PLUGIN_DIR/dev-server.env.$(hostname -s)"
if [ -f "$HOST_ENV" ]; then
  # shellcheck disable=SC1090
  . "$HOST_ENV"
elif [ -f "$PLUGIN_DIR/dev-server.env.local" ]; then
  # shellcheck disable=SC1091
  . "$PLUGIN_DIR/dev-server.env.local"
fi

# Per-host overrides (venvs are not portable across hosts — bin/python is an
# absolute symlink, so each host needs its own). Export these in your shell
# rc if the defaults don't match your environment:
#   PY_UV  — root of a uv-managed CPython install (dir containing bin/ and lib/).
#            Set to empty string if using a system Python that doesn't need
#            LD_LIBRARY_PATH tweaks.
#   PY     — the python interpreter to seed the venv with.
#   VENV   — venv dir. Defaults to a host-specific name so a shared working
#            tree can hold multiple venvs side by side.
PY_UV="${PY_UV-$HOME/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu}"
if [ -n "$PY_UV" ]; then
  PY="${PY:-$PY_UV/bin/python3.13}"
else
  PY="${PY:-$(command -v python3.13 || command -v python3)}"
fi
VENV="${VENV:-$PLUGIN_DIR/.server-venv-$(hostname -s)}"
APP_DIR="$PLUGIN_DIR/.app.d"
JS_DIST="$PLUGIN_DIR/src/js/dist"
SRC_PKG_DIR="$PLUGIN_DIR/src/deephaven/plot/tradingview_lightweight"
JS_LINK="$SRC_PKG_DIR/_js"
VITE_LOG="$PLUGIN_DIR/.dev-vite.log"
# SP_DIR is resolved after the venv exists (need python version). Set in step 4.
SP_DIR=""

VITE_PID=""
SERVER_PID=""
cleanup() {
  echo ""
  echo "==> Shutting down dev server..."
  if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
    kill "$VITE_PID" 2>/dev/null || true
  fi
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  # Remove the site-packages -> source symlink. Without this, a subsequent
  # `pip install --force-reinstall` (start-server.sh) would uninstall by
  # iterating the dist-info RECORD and unlinking each file path *through*
  # the symlink, which would delete the actual source files.
  if [ -n "$SP_DIR" ] && [ -L "$SP_DIR" ]; then
    rm -f "$SP_DIR"
  fi
}
trap cleanup EXIT INT TERM

# 1. Create venv (only if missing)
if [ ! -f "$VENV/bin/python" ]; then
  echo "==> Creating venv..."
  "$PY" -m venv "$VENV"
  curl -sS https://bootstrap.pypa.io/get-pip.py | "$VENV/bin/python"
  "$VENV/bin/pip" install -q deephaven-server build deephaven-plugin-utilities deephaven-plugin-ui deephaven-plugin-plotly-express
fi

# 1b. Ensure core deps exist (catches venvs created before a dep was added).
# Each check is a fast import probe; only missing packages trigger pip.
ensure_pkg() {
  local mod="$1" pkg="$2"
  if ! "$VENV/bin/python" -c "import $mod" 2>/dev/null; then
    echo "==> Installing missing dep: $pkg..."
    "$VENV/bin/pip" install -q "$pkg"
  fi
}
ensure_pkg deephaven_server         deephaven-server
ensure_pkg build                    build
ensure_pkg deephaven.plugin.utilities deephaven-plugin-utilities
ensure_pkg deephaven.ui             deephaven-plugin-ui
ensure_pkg deephaven.plot.express   deephaven-plugin-plotly-express

# 2. npm install (only if missing)
cd "$PLUGIN_DIR/src/js"
if [ ! -d node_modules ]; then
  echo "==> Installing JS deps..."
  npm install --silent
fi
cd "$PLUGIN_DIR"

# 3. Initial JS build so dist/ exists before we symlink + start the server
echo "==> Initial JS build..."
(cd "$PLUGIN_DIR/src/js" && npm run build 2>&1 | tail -3)

# 4. Resolve site-packages plugin path now that the venv exists.
PYV=$("$VENV/bin/python" -c "import sys; print(f'python{sys.version_info.major}.{sys.version_info.minor}')")
SP_DIR="$VENV/lib/$PYV/site-packages/deephaven/plot/tradingview_lightweight"
DIST_INFO_GLOB="$VENV/lib/$PYV/site-packages/deephaven_plugin_tradingview_lightweight-*.dist-info"

# 5. Wheel install (only when no dist-info present). The wheel:
#    - registers the deephaven.plugin entry point (this is the only reason
#      we need a real install; without it the plugin never loads).
#    - populates _js/ in site-packages with the correct npm-pack layout
#      (package.json + dist/bundle/index.js).
# A previous broken `pip install -e` may have left a dist-info + .pth file
# behind — clear those before reinstalling.
echo "==> Ensuring wheel install..."
# Reinstall only when dist-info is missing — SP_DIR being absent is normal
# after a clean exit (cleanup removes the symlink), and step 6 below recreates
# it from the existing source tree without needing a fresh wheel build.
if ! ls $DIST_INFO_GLOB >/dev/null 2>&1; then
  # Clean slate: uninstall any prior install (editable or wheel) so we don't
  # mix layouts. Also clear our dev symlinks so setup.py's package_js can
  # rebuild _js/ in source-tree without conflict.
  [ -L "$JS_LINK/dist" ] && rm -f "$JS_LINK/dist"
  [ -L "$JS_LINK" ] && rm -f "$JS_LINK"
  "$VENV/bin/pip" uninstall -y -q deephaven-plugin-tradingview-lightweight 2>/dev/null || true

  echo "==> Building wheel..."
  rm -rf "$PLUGIN_DIR"/dist "$PLUGIN_DIR"/build "$PLUGIN_DIR"/src/*.egg-info
  "$VENV/bin/python" -m build --wheel --outdir "$PLUGIN_DIR/dist" "$PLUGIN_DIR" 2>&1 | tail -1
  echo "==> Installing wheel..."
  "$VENV/bin/pip" install -q --force-reinstall --no-deps "$PLUGIN_DIR"/dist/*.whl
fi

# 6. Replace site-packages plugin dir with a symlink to source. Editable
# install doesn't work because deephaven-server's deephaven/plot/__init__.py
# makes deephaven.plot a regular package, which won't pick up sub-packages
# from a .pth path entry. Symlinking the sub-package directly into the regular
# parent package is the workaround.
if [ ! -L "$SP_DIR" ]; then
  echo "==> Linking site-packages tradingview_lightweight -> source..."
  # If source is missing _js/, copy it from the freshly-installed site-packages
  # version (which has the correct npm-pack layout from setup.py's package_js).
  if [ ! -f "$JS_LINK/package.json" ] && [ -d "$SP_DIR/_js" ]; then
    rm -rf "$JS_LINK"
    cp -a "$SP_DIR/_js" "$JS_LINK"
  fi
  rm -rf "$SP_DIR"
  ln -s "$SRC_PKG_DIR" "$SP_DIR"
fi

# 7. Ensure _js/dist/bundle exists. Vite (started in step 10) writes directly
# into this path via --outDir, avoiding the symlink approach: the DH server's
# Jetty-based static handler doesn't follow symlinks by default, so requests
# to _js/dist/bundle/index.js through a symlink return 404 and the JS plugin
# silently fails to load (manifesting as "Unknown object type" in the IDE).
mkdir -p "$JS_LINK/dist/bundle"
# If a leftover symlink exists from a prior version of this script, clear it.
if [ -L "$JS_LINK/dist" ]; then
  rm -f "$JS_LINK/dist"
  mkdir -p "$JS_LINK/dist/bundle"
fi

# 8. Set up .app.d: symlink fixtures from tests/app.d/ (live edits)
#    and write a tvl_dev.py with the tvl_reload helper.
mkdir -p "$APP_DIR"
rm -f "$APP_DIR"/*.py "$APP_DIR/tests.app"

FIXTURES="${FIXTURES:-tradingview_lightweight.py}"
idx=0
MANIFEST="type=script\nscriptType=python\nenabled=true\nid=tvl.dev\nname=TVL Dev"
for f in $FIXTURES; do
  if [ -f "$REPO_ROOT/tests/app.d/$f" ]; then
    ln -sf "$REPO_ROOT/tests/app.d/$f" "$APP_DIR/$f"
    MANIFEST="${MANIFEST}\nfile_${idx}=$f"
    idx=$((idx + 1))
  fi
done

# tvl_dev.py — exposes tvl_reload() in the console.
cat > "$APP_DIR/tvl_dev.py" <<'PYEOF'
"""Dev helpers exposed by dev-server.sh.

Call tvl_reload() in the console to re-import every tradingview_lightweight
module currently loaded. Then re-run your chart construction expression to
pick up Python-side changes without a server restart.

Does NOT re-register the JsPlugin or TvlChartType — those are frozen at
server startup. Changes to _register.py or new chart types still require
re-running dev-server.sh.
"""
import importlib
import sys


def tvl_reload():
    prefix = "deephaven.plot.tradingview_lightweight"
    # Reload submodules before parent packages so the package sees fresh children.
    names = sorted(
        (n for n in list(sys.modules) if n == prefix or n.startswith(prefix + ".")),
        key=lambda n: -n.count("."),
    )
    reloaded = []
    for name in names:
        try:
            importlib.reload(sys.modules[name])
            reloaded.append(name)
        except Exception as e:
            print(f"  reload failed: {name}: {e}")
    print(
        f"Reloaded {len(reloaded)} tradingview_lightweight modules. "
        f"Re-run your construction expression to see changes."
    )
    return reloaded
PYEOF
MANIFEST="${MANIFEST}\nfile_${idx}=tvl_dev.py"

printf "$MANIFEST\n" > "$APP_DIR/tests.app"

# 9. Kill any existing server on port 10000 and zombies
echo "==> Killing existing server processes..."
lsof -ti:10000 2>/dev/null | xargs kill -9 2>/dev/null || true
ps aux | grep -E "[d]eephaven.*\.server-venv" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 2

# 10. Start vite in watch mode, writing directly into _js/dist/bundle/.
# The --outDir override (passed through `npm run start --` to vite) avoids
# needing a symlink — vite's output IS the served path. emptyOutDir is
# auto-disabled when outDir is outside the project root, so package.json next
# to dist/ won't get clobbered.
echo "==> Starting Vite watcher (log: $VITE_LOG)..."
(cd "$PLUGIN_DIR/src/js" && npm run start -- --outDir "$JS_LINK/dist/bundle" --emptyOutDir > "$VITE_LOG" 2>&1) &
VITE_PID=$!
echo "    Vite PID: $VITE_PID"

# 11. Start DH server
echo "==> Starting Deephaven server on port 10000..."
LD_LIBRARY_PATH="${PY_UV:+$PY_UV/lib:}${LD_LIBRARY_PATH:-}" \
"$VENV/bin/python" -c "
from deephaven_server import Server
s = Server(port=10000, jvm_args=[
    '-Ddeephaven.application.dir=$APP_DIR',
    '-DAuthHandlers=io.deephaven.auth.AnonymousAuthenticationHandler',
    '-Ddeephaven.console.type=python',
    '-Xmx4g',
])
s.start()
print('Server started: http://localhost:10000/ide/')
import time
while True:
    time.sleep(60)
" &
SERVER_PID=$!
echo "    Server PID: $SERVER_PID"

# 12. Wait for ready
echo "==> Waiting for server..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:10000/ide/ 2>/dev/null | grep -q 200; then
    echo ""
    echo "====================================================================="
    echo " Dev server ready: http://localhost:10000/ide/"
    echo ""
    echo "  JS edits       -> Vite auto-rebuilds. Hard-refresh browser."
    echo "  Python edits   -> call tvl_reload() in console, then re-run expr."
    echo "  Vite log       -> tail -f $VITE_LOG"
    echo "  Stop           -> Ctrl-C (shuts down Vite + DH, unlinks _js)"
    echo "====================================================================="
    # Foreground wait: exits when either child dies or user hits Ctrl-C.
    wait -n "$VITE_PID" "$SERVER_PID"
    exit $?
  fi
  sleep 2
done
echo "ERROR: Server did not start within 120 seconds"
echo "       Check Vite log: $VITE_LOG"
exit 1
