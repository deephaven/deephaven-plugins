# Local Development & Testing

tradingview-lightweight charts I call tvl for short.

## Quick Start

Use the root `tools/plugin_builder.py` to build the JS bundle + Python wheel
and bring up a Deephaven server with the plugin installed. From the repo root:

```bash
python tools/plugin_builder.py --js --reinstall --server tradingview-lightweight
```

The plugin name is a positional argument — there is no `--plugin` flag.
`--js` builds the JS bundle, `--reinstall` rebuilds and force-reinstalls the
wheel (needed when the version number hasn't changed), and `--server` (`-s`)
starts the Deephaven server. After code changes, re-run the same command to
rebuild and restart. Run `python tools/plugin_builder.py --help` for all flags.

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

`tools/plugin_builder.py --js --reinstall --server tradingview-lightweight`:

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
| `src/js/src/TradingViewChartModel.ts`         | Model — widget messages, table subscriptions, autobin/EVENT       |
| `src/js/src/TradingViewChartRenderer.ts`      | LWC wrapper — chart creation, series CRUD, markers, price lines   |
| `src/js/src/TradingViewEventPayload.ts`       | Builds the press-event payload sent to Python (hit test, series)  |
| `src/js/src/TradingViewChart.css`             | Downsample scrim/status bar styles (inlined via `?inline` import) |
| `src/deephaven/.../auto_bin.py`               | Server-side time-bin aggregation for Histogram/Candlestick/Bar    |
| `src/deephaven/.../events.py`                 | Press-event payloads + handler plumbing (`wrap_callable`)         |
| `src/deephaven/.../communication/listener.py` | Message handler — RETRIEVE/AUTOBIN_ZOOM/AUTOBIN_RESET/EVENT        |

### CSS Injection

Plugin CSS files aren't loaded by the DH client. TVL uses Vite's `?inline` import to embed CSS as a string, injected via a `<style>` tag in the component. The `WidgetPanel`'s CSS (LoadingOverlay, scrim) comes from `@deephaven/dashboard-core-plugins` which is loaded by the IDE.

Z-index note: `.dh-tvl-panel > .fill-parent-absolute { z-index: 50 }` ensures WidgetPanel's LoadingOverlay renders above the chart's `position: relative` container.

### Downsample / Autobin Architecture

There are two distinct density-reduction paths depending on series type:

**Line / Area / Baseline — JS-side downsample** (`runChartDownsample`):
min/max-per-bin reduction performed client-side over the data the model has
already received.

**Histogram / Candlestick / Bar — server-side autobin** (`auto_bin.py`):
these can't be min/max downsampled, so the server time-bin aggregates them.

- `build_histogram_view()` / `build_ohlc_view()` aggregate via
  `update_view(["Bin = upperBin(time, w)"])` + `agg_by(..., by=["Bin"])`
- Bin width is chosen from the visible range and snapped to a "nice" duration
  (`nice_bin_width()`); target bin count derives from pixel width (`BAR_PX`)
- On zoom, the listener handles `AUTOBIN_ZOOM` and swaps in a finer
  aggregation; `AUTOBIN_RESET` returns to the full-range view
- Works on ticking tables (no `ii`/`k`/`where_in`)

**JS-side downsample UX:**

- Progressive scrim: 200ms delay → scrim sweeps down (150ms CSS transition), 500ms → status bar with indeterminate animation
- Scrim stays until `DATA_UPDATED` (not `DOWNSAMPLE_PENDING(false)` which fires before data arrives)
- `lockRangeOnNextUpdateRef` prevents tick updates from snapping viewport back after zoom
- Snap-to-live: auto-scrolls when right edge is within 1% of latest data point
- Double-click resets both time scale (`fitContent`) and price scales (`setAutoScale(true)`)

### Press Events

A chart can call back into Python on press / double-press, following the
deephaven.ui event convention (`on_press` / `on_double_press`, a plain Python
callable receiving one camelCase-keyed event dict, or no argument).

- Handlers are accepted on `tvl.chart(...)` and on every per-type constructor
  (`line`, `area`, `candlestick`, `bar`, `baseline`, `histogram`)
- **JS side** (`TradingViewEventPayload.ts`): on press, builds a payload that
  mirrors lightweight-charts' `MouseEventParams` — `time` under the cursor,
  `point`, `logical`, `paneIndex`, `seriesData` (every series' data at the
  location, keyed by friendly id), the hovered series as `hoveredSeries`
  (friendly id) + `hoveredSeriesId` (stable `series_<n>`), and the modifier
  keys — and sends an `EVENT` message to the model. Two deviations from raw
  `MouseEventParams`: the hovered `ISeriesApi` becomes a string id, and `time`
  becomes a Deephaven timestamp server-side.
- **Python side** (`events.py`): the listener dispatches the `EVENT` to the
  registered handler. `wrap_callable` (ported from deephaven.ui) adapts the
  handler so it can be called with one positional arg regardless of its arity;
  `build_press_event` converts the client payload into a `TvlPressEvent`. Event
  keys are **camelCase**, matching `MouseEventParams` and deephaven.ui's own
  event payloads (its `PressEvent` uses `shiftKey` etc.), so the wire → event
  copy is verbatim. The `timestamp` mirrors the hovered series' time-column
  dtype (resolved via `hoveredSeriesId`).
- Unresolved fields are omitted rather than set to `None` (e.g. a press outside
  the data range omits `timestamp`; not over a series omits `hoveredSeries`)
- User-facing docs: `docs/events.md`

### Disconnect Handling

Uses `WidgetPanel` from `@deephaven/dashboard-core-plugins` for session-level disconnect detection. Panel wrapper passes `onSessionClose`/`onSessionOpen` callbacks that set error state → WidgetPanel's LoadingOverlay shows "Chart disconnected". Model also listens for `Widget.EVENT_CLOSE` and `Table.EVENT_DISCONNECT/RECONNECT`.

### Timezone Handling

Lightweight-charts has no timezone support, so the model shifts every time
value by the user's timezone offset (`convertTime` in `TradingViewUtils.ts`)
before it reaches the chart; axis labels then read in the configured zone.

The timezone comes from the user's Deephaven setting via Redux
(`useSelector(getTimeZone)` in `TradingViewChart.tsx`), falling back to the
browser's local zone — matching the plotly-express plugin.

> **Build gotcha:** `@deephaven/redux` must be **bundled**, not externalized —
> it is intentionally absent from `vite.config.ts` `external`. The DH client's
> plugin require shim does not provide `@deephaven/redux`, so externalizing it
> makes the plugin fail to load entirely (`Could not require '@deephaven/redux'`).
> `react-redux`/`redux` ARE client-provided and stay externalized. plotly-express
> does the same (bundles `@deephaven/redux`, externalizes `react-redux`).

When the user
changes their timezone in Settings, a dedicated effect calls
`model.setTimeZone(tz)`, which re-subscribes every active table so its time
columns re-convert in the new zone (mirrors plotly-express's
`fireTimeZoneUpdated`) — no full teardown. The current downsample / auto-bin
scope is preserved (the already-subscribed table is reused), and if the user
had zoomed/panned the viewport is re-anchored to the same wall-clock window by
re-projecting the visible range through the old and new offsets
(`unconvertTime(old)` → `convertTime(new)`).

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

## End-to-End Tests (Playwright)

The unit tests (jest + jsdom) simulate the DOM. The **e2e** suite under
`src/js/e2e/` runs the real plugin in a real Deephaven IDE in Chromium via
Playwright, so it catches wiring / serialization / render bugs the unit tests
can't. It is self-booting: Playwright's `webServer` starts and tears down the
Deephaven server for you.

### One-time setup

```bash
cd src/js
npm run test:e2e:setup           # provision a venv with deephaven-server + this plugin
```

`test:e2e:setup` runs `e2e/setup-venv.sh`: it `uv venv`s `<plugin>/.venv`,
installs `deephaven-server` + `deephaven-plugin-utilities`, builds the JS
bundle, and installs the plugin into that venv. Re-run it only when the
**Python** deps change — after JS changes you don't need to (see below).

**Browser.** The config resolves Chromium in this order: `TVL_E2E_CHROMIUM`
env var → a system Chromium at `/usr/bin/chromium` → Playwright's bundled
browser. So if a system Chromium is present (common in CI images and this
sandbox) nothing extra is needed. Otherwise install the bundled browser once:

```bash
npx playwright install chromium chromium-headless-shell
```

> Browsers live in the shared `~/.cache/ms-playwright`. There is no separate
> "plugin" vs "root" Playwright — both use the repo-root `@playwright/test`
> and the same browser cache. `npx playwright install` prunes builds that
> don't match the installed Playwright version, so install once and reuse.
> Chromium runs with `--no-sandbox` (required as root).

### Running

```bash
cd src/js
npm run test:e2e                 # builds JS, boots a server, runs the specs, tears it down
```

`test:e2e` = `build` then `test:e2e:run` (Playwright). On each run
`e2e/start-server.sh` **syncs the freshly built bundle into the installed
package**, so the suite always exercises HEAD — you never reinstall the wheel
after a JS change, just `npm run test:e2e` again. For fast iteration against a
server you already have up, `reuseExistingServer` is on locally, so a running
server on :10000 is reused instead of booting a new one.

### How the server is launched (two load-bearing quirks)

`e2e/start-server.sh` boots Deephaven with anonymous auth and
`-Ddeephaven.application.dir=e2e/app.d` (which auto-opens the
`tooltip_demo.py` chart as a panel). Two things are required in this sandbox
and are easy to get wrong:

1. **stdin must stay open.** The `deephaven` CLI prints "Press Control-C to
   exit" and reads stdin; on stdin EOF (what a backgrounded/non-TTY process
   gets) it aborts immediately with `Aborted!`. We feed it `tail -f /dev/null |`
   so stdin never closes. (`< /dev/zero` does NOT work — that floods stdin with
   bytes and the CLI exits.)
2. **stdout must be a pipe, not a file.** We append `| cat`. Redirecting the
   server's stdout to a file makes the JVM abort.

Letting Playwright's `webServer` own the process handles teardown cleanly and
sidesteps the sandbox rule that a hand-backgrounded JVM gets reaped.

> **Never use shell `sleep` in this sandbox — it exits 144 and kills the
> script.** Wait via Playwright's own APIs (`page.waitForSelector`,
> `page.waitForTimeout`) or a `timeout … bash -c 'until curl -sf URL; do :; done'`
> busy-loop, not `sleep`.

### Writing e2e tests

Add a `*.spec.ts` under `src/js/e2e/`. Assert against the DOM seams the
components publish rather than screenshotting the canvas:

- `.tvl-tooltip` + its `data-tvl-tooltip` attribute — the tracking tooltip's
  rendered `title | value | date` (see `tooltip.spec.ts`).
- `data-tvl-last-event` on the chart container — the last press-event payload.

Hover the chart via `page.mouse.move(...)` over the `.dh-tvl-chart` bounding
box; the tooltip follows the crosshair just like a real cursor.
