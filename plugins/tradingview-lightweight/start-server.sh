#!/usr/bin/env bash
# Start a local Deephaven server with the TVL plugin installed.
# Re-run after code changes to rebuild and restart.
set -euo pipefail
cd "$(dirname "$0")"
PLUGIN_DIR="$(pwd)"
REPO_ROOT="$(cd ../.. && pwd)"

VENV="$PLUGIN_DIR/.server-venv"
PY_UV="$HOME/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu"
PY="$PY_UV/bin/python3.13"
APP_DIR="$PLUGIN_DIR/.app.d"

# 1. Create venv (only if missing)
if [ ! -f "$VENV/bin/python" ]; then
  echo "==> Creating venv..."
  "$PY" -m venv "$VENV"
  curl -sS https://bootstrap.pypa.io/get-pip.py | "$VENV/bin/python"
  "$VENV/bin/pip" install -q deephaven-server build deephaven-plugin-utilities
fi

# 2. Build JS bundle
echo "==> Building JS..."
cd "$PLUGIN_DIR/src/js"
if [ ! -d node_modules ]; then
  npm install --silent
fi
npm run build 2>&1 | tail -3
cd "$PLUGIN_DIR"

# 3. Build + install plugin wheel (clean old artifacts to avoid caching)
echo "==> Building wheel..."
rm -rf "$PLUGIN_DIR"/dist "$PLUGIN_DIR"/build "$PLUGIN_DIR"/src/*.egg-info
"$VENV/bin/python" -m build --wheel --outdir "$PLUGIN_DIR/dist" "$PLUGIN_DIR" 2>&1 | tail -1
echo "==> Installing wheel..."
"$VENV/bin/pip" install -q --force-reinstall --no-deps "$PLUGIN_DIR"/dist/*.whl

# 4. Set up app.d (copy test fixtures)
# Load the fixture file. The ticking/by tests require deephaven-plugin-ui.
# Pass FIXTURES env var to override: FIXTURES="tradingview_lightweight.py"
mkdir -p "$APP_DIR"
rm -f "$APP_DIR"/*.py "$APP_DIR/tests.app"

FIXTURES="${FIXTURES:-tradingview_lightweight.py}"
idx=0
MANIFEST="type=script\nscriptType=python\nenabled=true\nid=tvl.test\nname=TVL Test"
for f in $FIXTURES; do
  if [ -f "$REPO_ROOT/tests/app.d/$f" ]; then
    cp "$REPO_ROOT/tests/app.d/$f" "$APP_DIR/"
    MANIFEST="${MANIFEST}\nfile_${idx}=$f"
    idx=$((idx + 1))
  fi
done
printf "$MANIFEST\n" > "$APP_DIR/tests.app"

# 5. Kill any existing server on port 10000 and zombies
echo "==> Killing existing server processes..."
lsof -ti:10000 2>/dev/null | xargs kill -9 2>/dev/null || true
ps aux | grep -E "[d]eephaven.*server-venv" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 2

# 6. Start server using the Python API (the deephaven CLI aborts when backgrounded)
echo "==> Starting Deephaven server on port 10000..."
LD_LIBRARY_PATH="$PY_UV/lib:${LD_LIBRARY_PATH:-}" \
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
echo "Server PID: $SERVER_PID"

# 7. Wait for ready
echo "==> Waiting for server..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:10000/ide/ 2>/dev/null | grep -q 200; then
    echo "==> Server ready: http://localhost:10000/ide/"
    exit 0
  fi
  sleep 2
done
echo "ERROR: Server did not start within 120 seconds"
exit 1
