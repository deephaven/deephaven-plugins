# Local Development & Testing

tradingview-lightweight charts I call tvl for short.

## Quick Start

Use the root `tools/plugin_builder.py` to build the JS bundle + Python wheel
and bring up a Deephaven server with the plugin installed. From the repo root:

```bash
python tools/plugin_builder.py --plugin tradingview-lightweight
```

After code changes, re-run the same command to rebuild and restart.

App.d fixtures for local dev/snapshot capture live under `app.d/` at the
plugin root (`disconnect_test.py`, `downsample_compare.py`). Point the
Deephaven server at this directory with `-Ddeephaven.application.dir=$(pwd)/app.d`
when you need the fixtures pre-loaded.

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
agent-browser screenshot /tmp/tvl_chart.png

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
- **Zombie processes.** If the server seems stale (serving old JS), kill any
  lingering `deephaven_server` processes (`pkill -f deephaven_server`) and
  re-run `tools/plugin_builder.py`.

## How It Works

`tools/plugin_builder.py --plugin tradingview-lightweight`:

1. Builds the JS bundle via `npm run build` in `src/js/`.
2. Builds the Python wheel and installs it into a Deephaven server venv.
3. Starts the DH server on port 10000.

The DH web client loads the JS plugin via `/js-plugins/manifest.json`. The
CJS bundle uses `require()` for modules the DH client provides (react,
`@deephaven/plugin`, etc.) — these are resolved by the client's built-in
require shim.

## API Reference Notes

For TradingView Lightweight Charts v5.2 API documentation, fetch the
upstream docs at https://tradingview.github.io/lightweight-charts/docs (the
local notes/api-reference/ snapshot has been removed to keep the plugin
tree clean).

## Architecture Overview

### JS Component Hierarchy

```
TradingViewPlugin (plugin registration)
├── component: TradingViewChart         — for inline/embedded use
└── panelComponent: TradingViewChartPanel — for standalone panels
    └── WidgetPanel (@deephaven/dashboard-core-plugins)
        ├── Session disconnect/reconnect detection
        ├── LoadingOverlay (spinner + error + disconnect)
        └── TradingViewChart
            ├── TradingViewChartModel  — data pipeline, table subscriptions
            └── TradingViewChartRenderer — LWC chart instance, series management
```

### Key Files

| File                                          | Role                                                              |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `src/js/src/TradingViewChartPanel.tsx`        | WidgetPanel wrapper — session disconnect, loading overlay         |
| `src/js/src/TradingViewChart.tsx`             | Main component — init, data updates, zoom/pan, downsample UX      |
| `src/js/src/TradingViewChartModel.ts`         | Model — widget messages, table subscriptions, ZOOM/RESET          |
| `src/js/src/TradingViewChartRenderer.ts`      | LWC wrapper — chart creation, series CRUD, markers, price lines   |
| `src/js/src/TradingViewChart.css`             | Downsample scrim/status bar styles (inlined via `?inline` import) |
| `src/deephaven/.../downsample.py`             | Python-side downsample — v3 direct aggregation output             |
| `src/deephaven/.../communication/listener.py` | Message handler — RETRIEVE/ZOOM/RESET                             |

### CSS Injection

Plugin CSS files aren't loaded by the DH client. TVL uses Vite's `?inline` import to embed CSS as a string, injected via a `<style>` tag in the component. The `WidgetPanel`'s CSS (LoadingOverlay, scrim) comes from `@deephaven/dashboard-core-plugins` which is loaded by the IDE.

Z-index note: `.dh-tvl-panel > .fill-parent-absolute { z-index: 50 }` ensures WidgetPanel's LoadingOverlay renders above the chart's `position: relative` container.

### Downsample Architecture

**Python-side** (v3 direct aggregation output):

- `_downsample()` uses `agg_by` with `first`/`last`/`sorted_first`/`sorted_last` to capture all output columns directly from min/max rows per bin
- No `ii`/`k`/`where_in` — works on ticking tables
- Background (~1000 bins, full range) + Foreground (~4000 bins, zoom area) merged server-side
- `compute_reset()` invalidates cached time range for ticking tables

**JS-side** downsample UX:

- Progressive scrim: 200ms delay → scrim sweeps down (150ms CSS transition), 500ms → status bar with indeterminate animation
- Scrim stays until `DATA_UPDATED` (not `DOWNSAMPLE_PENDING(false)` which fires before data arrives)
- `lockRangeOnNextUpdateRef` prevents tick updates from snapping viewport back after zoom
- Snap-to-live: auto-scrolls when right edge is within 1% of latest data point
- Double-click resets both time scale (`fitContent`) and price scales (`setAutoScale(true)`)

### Disconnect Handling

Uses `WidgetPanel` from `@deephaven/dashboard-core-plugins` for session-level disconnect detection. Panel wrapper passes `onSessionClose`/`onSessionOpen` callbacks that set error state → WidgetPanel's LoadingOverlay shows "Chart disconnected". Model also listens for `Widget.EVENT_CLOSE` and `Table.EVENT_DISCONNECT/RECONNECT`.

### Test Fixtures

Hand-written app.d fixtures live under `app.d/` at the plugin root. Point
the DH server at this directory with `-Ddeephaven.application.dir=$(pwd)/app.d`
to pre-load them as panels:

- `disconnect_test.py` — grid + plotly + tvl for disconnect comparison
- `downsample_compare.py` — 100K table for downsample size comparison

The docs snapshotter (`tools/image-snapshotter`) generates its own per-block
app.d into `snapshot-results/<plugin>-app.d/` at run time; that directory
is build output and not checked in.

## Downsample Benchmarking

Use `dh exec` to benchmark downsample approaches headlessly. **Each approach must run in its own `dh exec` process** — the JVM warms up (JIT compilation, memory pools) across runs within a single process, biasing later approaches to look faster.

### How to run

1. Write each approach as a standalone `.py` file under a scratch dir.
2. Run with: `dh exec bench_my_experiment.py 2>&1 | grep "^RESULT:"`
3. Compare approaches by running each in a separate `dh exec` invocation, or use `bench_isolated.sh` which automates this.

### Writing a benchmark script

```python
"""Benchmark: <description>. Run with: dh exec bench_<name>.py"""
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
NUM_BINS = 1000

big = empty_table(ROW_COUNT).update(
    [
        "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
        "Price = 100 + Math.sin(ii * 0.0001) * 50",
        "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
        "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
    ]
)

tc = "Timestamp"
value_cols = ["Price", "Volume", "Spread"]
out_cols = [tc] + value_cols
# ... get rmin, rmax, bw from head/tail ...

times = []
for i in range(5):
    t0 = time.perf_counter()
    # ... approach under test ...
    _ = merged.size  # force materialization
    times.append(time.perf_counter() - t0)

print(
    f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}"
)
```

### Key pitfalls

- Always call `_.size` or similar to force materialization — DH operations are lazy.
- Run 5+ iterations per script to capture warm-JVM timing within a single process.
- Compare across scripts (separate processes) for fair cold-start comparisons.
- The `agg_by` scan dominates cost (~89%). Post-agg steps (merge, sort on ~8K rows) are cheap.
- `merge_sorted` throws `UnsupportedOperationException` on refreshing (ticking) tables.

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
