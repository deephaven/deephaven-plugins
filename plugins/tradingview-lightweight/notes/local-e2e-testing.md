# Local E2E Testing (without Docker)

Run the TradingView Lightweight Charts plugin in a local Deephaven server and verify visually with `agent-browser`.

## Prerequisites

- Python 3.13 with shared libraries (the uv-managed install at `~/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/` works)
- Node.js (for building the JS bundle)
- `agent-browser` CLI (pre-installed globally)

## 1. Fix / Create the venv

The repo venv may have broken symlinks. Recreate it with a Python that has shared libraries (required by `jpy` / `deephaven-server`):

```bash
cd /home/sandbox/deephaven-plugins

# Python 3.13 from uv has libpython3.13.so
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13

# Recreate venv (--without-pip because ensurepip may not be available)
rm -rf .venv
$PY -m venv .venv

# Bootstrap pip
curl -sS https://bootstrap.pypa.io/get-pip.py | .venv/bin/python
```

## 2. Install dependencies

```bash
# Deephaven server
.venv/bin/pip install deephaven-server

# Build the JS bundle
cd plugins/tradingview-lightweight/src/js
npm run build
cd /home/sandbox/deephaven-plugins

# Build and install the plugin wheel (non-editable, avoids namespace package conflicts)
.venv/bin/python -m build --wheel plugins/tradingview-lightweight
.venv/bin/pip install --force-reinstall --no-deps plugins/tradingview-lightweight/dist/*.whl
```

After changing Python code, rebuild and reinstall the wheel:
```bash
.venv/bin/python -m build --wheel plugins/tradingview-lightweight
.venv/bin/pip install --force-reinstall --no-deps plugins/tradingview-lightweight/dist/*.whl
```

After changing JS/TS code, rebuild the JS bundle:
```bash
cd plugins/tradingview-lightweight/src/js && npm run build && cd /home/sandbox/deephaven-plugins
```

## 3. Start the server

Create a minimal app.d that only loads the tradingview test fixtures (avoids needing other plugin dependencies like `deephaven.plot.express`):

```bash
mkdir -p /tmp/tvl_app.d
cp tests/app.d/tradingview_lightweight.py /tmp/tvl_app.d/
cat > /tmp/tvl_app.d/tests.app << 'EOF'
type=script
scriptType=python
enabled=true
id=tvl.test
name=TVL Test
file_0=tradingview_lightweight.py
EOF
```

Start the server (must set `LD_LIBRARY_PATH` so jpy can find `libpython3.13.so`):

```bash
LD_LIBRARY_PATH=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/lib:$LD_LIBRARY_PATH \
.venv/bin/python -c "
from deephaven_server import Server
s = Server(port=10000, jvm_args=[
    '-Ddeephaven.application.dir=/tmp/tvl_app.d',
    '-DAuthHandlers=io.deephaven.auth.AnonymousAuthenticationHandler',
    '-Ddeephaven.console.type=python',
    '-Xmx4g',
])
s.start()
print('Server started on port 10000')
import time
while True:
    time.sleep(60)
" &
```

Wait for it to be ready:
```bash
until curl -s -o /dev/null -w "%{http_code}" http://localhost:10000/ide/ | grep -q 200; do sleep 2; done
echo "Server ready"
```

Note: Use the Python API with `time.sleep()` loop instead of `deephaven server` CLI, because the CLI's `input()` call causes an abort when backgrounded.

## 4. Test with agent-browser

```bash
# Open the IDE
agent-browser open http://localhost:10000/ide/
agent-browser wait 3000

# Get interactive elements to find the Panels button
agent-browser snapshot -i -c

# Click Panels (use the @ref from snapshot output)
agent-browser click @e3    # adjust ref as needed
agent-browser wait 500

# Search for a specific widget
agent-browser snapshot -i -c   # find the searchbox ref
agent-browser fill @e7 "tvl_panes_basic"
agent-browser wait 500

# Click the result
agent-browser snapshot -i -c   # find the button ref
agent-browser click @e11
agent-browser wait 3000

# Reset mouse position (avoid hover effects) and screenshot
agent-browser mouse move 0 0
agent-browser wait 500
agent-browser screenshot /tmp/tvl_panes_basic.png
```

To view the screenshot, use the `Read` tool on the image path.

## 5. Clean up

```bash
# Stop the server
kill %1

# Close the browser
agent-browser close
```

## Tips

- The `@ref` values (e.g., `@e3`, `@e7`) change between snapshots. Always run `agent-browser snapshot -i -c` to get current refs before clicking.
- Use `agent-browser snapshot -i -c` (interactive + compact) for a concise view of clickable elements.
- Screenshots are the primary way to verify chart rendering since there's no DOM-level assertion for canvas content.
- The test fixtures are in `tests/app.d/tradingview_lightweight.py`. Edit that file and restart the server to test new fixtures.
