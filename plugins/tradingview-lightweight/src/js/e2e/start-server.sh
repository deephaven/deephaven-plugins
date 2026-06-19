#!/usr/bin/env bash
#
# Boot a Deephaven server for the Playwright e2e suite. Invoked by Playwright's
# `webServer` config; not meant to be run by hand (though it works).
#
# Two sandbox-specific quirks are handled here, both load-bearing:
#   1. stdin must stay OPEN. The `deephaven` CLI prints "Press Control-C to
#      exit" and reads stdin; on stdin EOF (which is what a backgrounded /
#      non-TTY process gets) it aborts immediately. `tail -f /dev/null |` feeds
#      it an endless, dataless stdin so it never sees EOF.
#   2. stdout must be a PIPE, not a file. `| cat` keeps it a pipe.
#
# It also syncs the freshly built JS bundle into the installed package, because
# uv's build isolation can package a stale bundle — without this the server
# could serve old JS and the tests would pass/fail against the wrong code.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$HERE/../../.." && pwd)"   # e2e -> js -> src -> <plugin root>
VENV="${TVL_E2E_VENV:-$PLUGIN_ROOT/.venv}"
DEEPHAVEN="$VENV/bin/deephaven"
PORT="${TVL_E2E_PORT:-10000}"

if [[ ! -x "$DEEPHAVEN" ]]; then
  echo "[e2e] deephaven-server not found in $VENV." >&2
  echo "[e2e] Provision it once with:  bash $HERE/setup-venv.sh" >&2
  exit 1
fi

# Sync the current bundle into the installed package so the e2e exercises HEAD.
DEST=$(ls -d "$VENV"/lib/python*/site-packages/deephaven/plot/tradingview_lightweight/_js/dist 2>/dev/null | head -1)
if [[ -n "${DEST:-}" && -d "$PLUGIN_ROOT/src/js/dist" ]]; then
  cp -rf "$PLUGIN_ROOT/src/js/dist/." "$DEST"/
  echo "[e2e] synced freshly built JS bundle into the installed package"
else
  echo "[e2e] WARNING: could not sync JS bundle (built dist or install missing)" >&2
fi

echo "[e2e] starting deephaven server on :$PORT (anonymous auth, app.d=$HERE/app.d)"
tail -f /dev/null | "$DEEPHAVEN" server --no-browser --port "$PORT" \
  --jvm-args "-Ddeephaven.application.dir=$HERE/app.d -DAuthHandlers=io.deephaven.auth.AnonymousAuthenticationHandler" \
  2>&1 | cat
