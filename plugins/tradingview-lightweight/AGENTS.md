# Local Development & Testing

tradingview-lightweight charts I call tvl for short.

## Quick Start

```bash
# Start server (builds JS, installs plugin, launches DH server on port 10000)
bash start-server.sh

# Stop server (kills all DH processes, closes browser)
bash stop-server.sh
```

After code changes, re-run `bash start-server.sh` — it rebuilds and restarts automatically.

## Live-refresh dev loop (faster iteration)

For tight edit cycles, use `dev-server.sh` instead:

```bash
bash dev-server.sh     # Ctrl-C to stop (shuts down Vite + DH cleanly)
```

It replaces the wheel-rebuild loop with:
- A one-time wheel install (per fresh venv) for entry-point registration
- `site-packages/deephaven/plot/tradingview_lightweight/` symlinked to the source tree so Python edits are live (editable install doesn't work — see note below)
- `_js/dist` symlinked to `src/js/dist` so Vite output goes live
- `vite build --watch` running in the background (log: `.dev-vite.log`)
- a `tvl_reload()` helper exposed in the DH console

Why not `pip install -e .`? `deephaven-server` ships `deephaven/plot/__init__.py` as a regular package, which shadows the editable install's `.pth` path entry. Python finds `deephaven.plot` in site-packages and never looks in `src/`, so the plugin sub-package never resolves. Symlinking the sub-package directly into the existing regular package avoids the conflict.

Per-host config: drop a `dev-server.env.$(hostname -s)` next to `dev-server.sh` to override `PY_UV` / `PY` / `VENV` (gitignored). Each host gets its own `.server-venv-<hostname>/` so a shared working tree can hold multiple venvs side by side.

| Change | Action |
|---|---|
| `src/js/src/**` (JS/TS) | Vite rebuilds; **hard-refresh browser** (Ctrl+Shift+R) |
| `src/deephaven/.../chart.py`, `series.py`, `markers.py`, `options.py`, etc. | Call `tvl_reload()` in the console, then re-run your construction expression |
| `tests/app.d/tradingview_lightweight.py` | DH app mode reloads automatically (fixture is symlinked, not copied) |
| `_register.py`, new chart type, entry-point changes | Restart `dev-server.sh` — registration is frozen at server startup |

Not hot-reloadable: the `TvlChartType` registration itself and the `JsPlugin` manifest path. Only *construction* code inside the tvl package picks up `importlib.reload`.

`dev-server.sh` removes both dev-only symlinks on exit (the site-packages plugin dir, and `_js/dist`) so a subsequent `start-server.sh` wheel build/uninstall runs cleanly without following the symlink into the source tree.

The ticking/by tests require `deephaven-plugin-ui`:
```bash
# One-time: install deephaven-plugin-ui into the server venv
.server-venv/bin/pip install deephaven-plugin-ui
```

## Testing with agent-browser

After the server is running:

```bash
# Open the IDE and set viewport
agent-browser open http://localhost:10000/ide/
agent-browser wait --load networkidle
agent-browser wait 5000
agent-browser set viewport 1920 1080
```

### Running code in the DH console

The DH IDE opens panels for **new variable assignments**, not bare expressions.
Typing `tvl_line` alone will not open a panel. You must assign to a new name:

```bash
# 1. Find the console editor
agent-browser snapshot -i          # look for the textbox ref
agent-browser click @e15           # click the editor (ref may vary)

# 2. Type a variable assignment and execute
agent-browser keyboard type "my_chart = tvl_line"
agent-browser press Escape         # dismiss autocomplete
agent-browser wait 100
agent-browser press Enter          # execute (Enter works; Ctrl+Enter may not)
agent-browser wait 5000            # wait for panel to open and data to load

# 3. Move mouse away and screenshot
agent-browser mouse move 0 0
agent-browser wait 500
agent-browser screenshot /tmp/tvl_test.png
```

Multi-statement commands work the same way:
```bash
agent-browser keyboard type "from deephaven.plot import tradingview_lightweight as tvl"
agent-browser press Escape && agent-browser wait 100 && agent-browser press Enter
agent-browser wait 2000

agent-browser keyboard type "my_by = tvl.line(_by_table, time='Timestamp', value='Price', by='Sym')"
agent-browser press Escape && agent-browser wait 100 && agent-browser press Enter
agent-browser wait 5000
```

To verify a panel opened, check the Golden Layout tabs:
```bash
agent-browser eval "JSON.stringify(Array.from(document.querySelectorAll('.lm_tab')).map(e => e.textContent).filter(t => t.length > 0))"
# Should include your variable name, e.g. ["Console","Log","Command History","File Explorer","my_chart"]
```

### Opening widgets from the Panels menu (alternative)

The Panels menu lists all exported variables. This approach does NOT
reliably open widget panels — it works for tables but may silently
fail for plugin widgets. Prefer the console assignment method above.

```bash
agent-browser snapshot -i -c
agent-browser click @e3            # "Panels" button — ref may vary
agent-browser wait 500
agent-browser snapshot -i -c       # find the search box ref
agent-browser fill @e7 "tvl_candlestick"
agent-browser wait 500
agent-browser snapshot -i -c       # find the button ref
agent-browser click @e11           # ref may vary
agent-browser wait 3000
```

### Screenshotting an individual chart

After opening a chart panel, isolate the chart and screenshot:

```bash
# Move mouse off chart to avoid hover tooltips
agent-browser mouse move 0 0
agent-browser wait 500

# Screenshot the full page (chart will be visible in the panel area)
agent-browser screenshot plugins/tradingview-lightweight/notes/tmp/tvl_chart.png

# Or check for chart elements
agent-browser eval "document.querySelectorAll('.dh-tvl-chart').length"
```

View the screenshot with the `Read` tool on the image path. Always screenshot into the local directory so the user can also verify if needed.

### Important Notes

- **Refs change between snapshots.** Always run `agent-browser snapshot -i` before clicking to get fresh refs.
- **Charts render on canvas.** Use screenshots to verify chart content — DOM queries won't see rendered lines/candles.
- **Use variable assignments** to open widget panels (e.g., `my_chart = tvl_line`). Bare expressions evaluate but don't open panels.
- **Enter, not Ctrl+Enter.** Plain `Enter` executes single-line commands. `Ctrl+Enter` may insert a newline instead.
- **Dismiss autocomplete** with `agent-browser press Escape` before pressing Enter, otherwise it may select a completion instead of executing.
- **Zombie processes.** If the server seems stale (serving old JS), run `bash stop-server.sh` which kills all DH-related processes aggressively.

## How It Works

`start-server.sh`:
1. Creates `.server-venv/` with `deephaven-server` + `deephaven-plugin-utilities` (skipped if exists)
2. Builds JS via `npm run build` in `src/js/`
3. Builds a Python wheel and installs it into `.server-venv/`
4. Copies test fixtures from `tests/app.d/` into `.app.d/`
5. Starts the DH server on port 10000 using the Python Server API
6. Waits for the server to be ready

The DH web client loads the JS plugin via `/js-plugins/manifest.json`. The CJS bundle uses `require()` for modules the DH client provides (react, @deephaven/plugin, etc.) — these are resolved by the client's built-in require shim.

## API Reference Notes

Comprehensive TradingView Lightweight Charts v5.1 API documentation is in `notes/api-reference/`.

**Index:** `notes/api-reference/INDEX.md` — links to all sub-pages with quick lookup tables.

| File | What's Covered |
|------|---------------|
| `enumerations.md` | All 11 enums (LineStyle, CrosshairMode, PriceScaleMode, TickMarkType, etc.) |
| `chart-api.md` | `IChartApi` (26 methods), `ChartOptionsBase`, layout, grid, crosshair, watermark, scroll/scale options |
| `series-api.md` | `ISeriesApi` (5 props, 20 methods) — setData/update, price lines, primitives |
| `series-types.md` | Data interfaces per series type + all style options with defaults |
| `time-scale-api.md` | `ITimeScaleApi` (22 methods), `TimeScaleOptions` (25+ props), Time/BusinessDay/UTCTimestamp |
| `price-scale-api.md` | `IPriceScaleApi`, `PriceScaleOptions`, `PriceLineOptions`, `IPriceLine` |
| `markers-events.md` | SeriesMarker, MouseEventParams, marker shapes/positions, touch events |
| `functions-variables.md` | createChart, createYieldCurveChart, watermark/marker factories, series definition variables |
| `panes-api.md` | `IPaneApi` (15 methods), stretch factors, pane primitives |
| `utility-types.md` | DeepPartial, Coordinate, Logical, LineWidth, PriceFormat, Background |

Use these when you need to look up available properties/methods, default values, or type signatures without fetching the web docs.

## Running Unit Tests

```bash
# Python (uses uv-managed Python 3.13)
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pip install pytest --break-system-packages
$PY -m pytest test/ -v

# JavaScript
cd src/js
npx jest --verbose

# TypeScript type check
cd src/js
npx tsc --noEmit
```
