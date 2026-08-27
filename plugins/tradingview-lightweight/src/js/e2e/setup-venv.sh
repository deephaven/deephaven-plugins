#!/usr/bin/env bash
#
# One-time provisioning for the Playwright e2e suite.
#
# Creates a Python venv with deephaven-server and installs this plugin into it
# (so the DH server can serve the TVL JS bundle). Run once; afterwards
# `npm run test:e2e` boots the server and runs the tests on its own.
#
# Re-run this only when the Python deps change. After *JS* changes you do NOT
# need to re-run it — `npm run test:e2e` rebuilds the bundle and start-server.sh
# syncs it into the venv on every run.
#
# Override the venv location with TVL_E2E_VENV (defaults to <plugin>/.venv).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$HERE/../../.." && pwd)"   # e2e -> js -> src -> <plugin root>
VENV="${TVL_E2E_VENV:-$PLUGIN_ROOT/.venv}"

if ! command -v uv >/dev/null 2>&1; then
  echo "[e2e:setup] 'uv' is required (https://docs.astral.sh/uv/). Aborting." >&2
  exit 1
fi

echo "[e2e:setup] venv: $VENV"
uv venv "$VENV" >/dev/null 2>&1 || true

echo "[e2e:setup] installing deephaven-server + plugin runtime deps..."
uv pip install --python "$VENV/bin/python" \
  deephaven-server "deephaven-plugin-utilities>=0.0.2"

echo "[e2e:setup] building the JS bundle..."
npm run build --prefix "$PLUGIN_ROOT/src/js"

echo "[e2e:setup] installing the plugin into the venv..."
uv pip install --python "$VENV/bin/python" --force-reinstall --no-deps "$PLUGIN_ROOT"

echo "[e2e:setup] done. Run the suite with:  npm run test:e2e  (from src/js)"
