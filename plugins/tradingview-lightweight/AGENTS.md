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
| `src/js/src/TradingViewLegend.tsx`            | In-chart legend overlay — rows/detailed layouts, toggling         |
| `src/js/src/TradingViewLegendModel.ts`        | Legend's pure logic — value formatting, row capping/promotion     |
| `src/js/src/TradingViewTooltip.tsx`           | Tracking tooltip overlay — focused series, cursor-clamped box     |
| `src/js/src/TradingViewOverlayTypes.ts`       | Shared overlay types + series value formatting                    |
| `src/js/src/TradingViewChart.css`             | Overlay styles — legend, tooltip, scrim (inlined via `?inline`)   |
| `src/deephaven/.../auto_bin.py`               | Server-side time-bin aggregation for Histogram/Candlestick/Bar    |
| `src/deephaven/.../events.py`                 | Press-event payloads + handler plumbing (`wrap_callable`)         |
| `src/deephaven/.../communication/listener.py` | Message handler — RETRIEVE/AUTOBIN_ZOOM/AUTOBIN_RESET/EVENT       |

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

### Legend

An opt-in overlay (`tvl.chart(legend=tvl.legend())`) listing every series with
its color, title, and value. Built on the same pattern as the tracking tooltip.

- **JS side** (`TradingViewLegend.tsx`): a React component rendered as a
  sibling of the chart host, like the downsample scrim — the renderer builds
  no DOM for it and only exposes data (`getLegendEntries`, `getLastSeriesPoint`)
  and subscriptions. Two layouts (`rows` / `detailed`); `rows` flows vertically
  or as wrapping chips. With no crosshair it falls back to each series' last
  rendered point, so it is populated on first paint. Under a crosshair it does
  not: a series with no point at that time shows a blank value, because its
  last point is from some other time. The time line at rest is the latest of
  the displayed rows' times (`latestTime`); under a crosshair, the hovered one.
- **Update path**: the renderer owns a `Set` of overlay-update handlers and
  calls `notifyOverlayUpdate()` after data changes; the component bumps a
  counter and re-reads entries. Deliberately NOT React state set from the data
  path — doing that re-runs the effect that sets it and loops forever.
- **Crosshair snapshot**: the component keeps `{ time, focusedId }`, not the
  raw `MouseEventParams`. That object is keyed by series API and frozen at the
  last mouse move, so it went blank after `configureSeries` rebuilt the series
  and kept an old value when a tick rewrote the hovered bar. Values are
  re-read by id and time through `renderer.getSeriesPointAt()` instead.
- **Capping**: `max_rows` (default 6) bounds the height, with a `+N more`
  line. The crosshair-focused series is always shown — it *replaces* the last
  visible row rather than being appended, so the legend's height never changes
  as the cursor moves.
- **Toggling**: rows are `<button>`s that call `renderer.setSeriesVisible()`.
  Visibility is read from `series.options().visible`, so a series hidden from
  Python (`visible=False`) is dimmed on first paint. Legend toggles are also
  recorded in `TradingViewChartRenderer.visibilityOverrides` and reapplied in
  `configureSeries`, because a chart-type change or a late `by=` partition
  rebuilds every series and would otherwise undo them. Hidden series keep a
  dimmed row (dropping it would make them unreachable).
- **Python side**: `Legend` in `options.py`. `variant="auto"` is resolved in
  `chart()`, where the series are known — `detailed` only for a single static
  series, always `rows` when a `by=` template is present (its key count is a
  runtime fact, and auto-detection would flip the layout mid-stream).
- **`on_series_toggle`**: optional callback, advertised as the `seriesToggle`
  handler. The chart applies toggles itself; the event is informational and is
  only put on the wire when a handler is wired. Unlike press, it carries no
  timestamp, so the listener skips time-column resolution for it.
- Pointer events: `.tvl-legend` is `pointer-events: none` with rows re-enabling
  them, so only the rows themselves are a crosshair dead zone.
- DOM seams: `data-tvl-legend` (rendered text) and `data-tvl-last-toggle` (last
  toggle payload, kept separate from `data-tvl-last-event`).
- User-facing docs: `docs/legend.md`, `docs/titles.md`

### Disconnect Handling

Uses `WidgetPanel` from `@deephaven/dashboard-core-plugins` for session-level disconnect detection. Panel wrapper passes `onSessionClose`/`onSessionOpen` callbacks that set error state → WidgetPanel's LoadingOverlay shows "Chart disconnected". Model also listens for `Widget.EVENT_CLOSE` and `Table.EVENT_DISCONNECT/RECONNECT`.

### Timezone Handling

Lightweight-charts has no timezone support. The chart coordinate is therefore
kept as **true UTC** (`convertTime` in `TradingViewUtils.ts` returns UTC epoch
seconds and takes an explicit `'ms' | 'ns' | 's'` unit — magnitude is never
inferred). Display in the user's zone is handled by a custom horizontal scale
behavior (`TimeZoneHorzScaleBehavior.ts`, installed via `createChartEx`) which
shifts only for tick weighting and label formatting.

Shifting the *data* instead would make the coordinate local wall-clock time,
which is ambiguous across a DST "fall back" — both instants of the repeated
hour collapse onto one slot and a row is silently dropped.

The zone comes from the user's Deephaven setting via Redux
(`useSelector(getTimeZone)` in `TradingViewChart.tsx`), falling back to the
browser's local zone — matching plotly-express.

On a zone change the data is untouched (it is already UTC): the effect calls
`renderer.setTimeZone(tz)`, re-renders series data and the scaffold, refreshes
markers, and restores the saved visible range. Two non-obvious requirements:

- `chart.applyOptions({ timeScale: {} })` is needed to invalidate the tick
  label cache — only the time scale's own `applyOptions` calls
  `_invalidateTickMarks()`, and an empty top-level object won't do it.
- `localization.timeFormatter` must apply the offset itself; LWC calls it
  outside the horizontal scale behavior.

> **Build gotcha:** `@deephaven/redux` must be **bundled**, not externalized —
> it is intentionally absent from `vite.config.ts` `external`. The DH client's
> plugin require shim does not provide `@deephaven/redux`, so externalizing it
> makes the plugin fail to load entirely (`Could not require '@deephaven/redux'`).
> `react-redux`/`redux` ARE client-provided and stay externalized. plotly-express
> does the same (bundles `@deephaven/redux`, externalizes `react-redux`).

### Test Fixtures

Server-side fixtures are Application-mode scripts under `tests/app.d/` at the
repo root, registered by a `file_N=` line in `tests/app.d/tests.app`. A spec
opens one by field name with `openPanel(page, '<field>')`. TVL's are
`tradingview_lightweight.py`, `tvl_events.py`, `tvl_tooltip.py`, and
`tvl_legend.py`.

Both overlays publish a display-based contract: `.tvl-tooltip` stays mounted
and toggles `display` rather than unmounting, so "off the data" is a hidden
element, not a missing one.

## Running Unit Tests

```bash
# Python (from the plugin directory)
cd plugins/tradingview-lightweight && tox -e py3.12

# JavaScript (from the repo root)
npm run test:unit -- --testPathPattern="plugins/tradingview-lightweight"

# Lint
npx jest --config jest.config.lint.cjs --testPathPattern="plugins/tradingview-lightweight"

# TypeScript type check — use the root script; the per-plugin `tsc --noEmit`
# does not cover every test file and has let CI failures through.
npm run types
```

## End-to-End Tests (Playwright)

The unit tests (jest + jsdom) simulate the DOM. The **e2e** suite runs the real
plugin in a real Deephaven IDE via Playwright, so it catches wiring /
serialization / render bugs the unit tests can't.

TVL uses the **repo-root** Playwright harness, same as every other plugin —
there is no plugin-local config. Specs live in `tests/` at the repo root and
run in Docker:

```bash
npm run e2e:docker -- ./tests/tradingview_lightweight.spec.ts --reporter=list
npm run e2e:update-snapshots -- ./tests/tradingview_lightweight.spec.ts
```

Current TVL specs: `tradingview_lightweight.spec.ts` (render snapshots),
`_autobin`, `_events`, `_tooltip`, and `_legend`.

Stale containers from an interrupted run will block the next one:

```bash
docker ps -a --format '{{.Names}}' | grep tests- | xargs -r docker rm -f
```

### Fixtures

Server-side fixtures are Application-mode scripts in `tests/app.d/`, registered
by adding a `file_N=` line to `tests/app.d/tests.app`. A spec opens one by field
name with `openPanel(page, '<field>')`.

### Writing e2e tests

Add a `*.spec.ts` under `tests/` and reuse the shared helpers from
`tests/utils.ts` (`gotoPage`, `openPanel`, `waitForTvlSettled`) rather than
hand-rolling panel-opening logic. Prefer the DOM seams the components publish
over screenshotting the canvas:

- `.tvl-tooltip` + its `data-tvl-tooltip` attribute — the tracking tooltip's
  rendered `title | value | date` (see `tradingview_lightweight_tooltip.spec.ts`).
- `.tvl-legend` + its `data-tvl-legend` attribute — the legend's rendered rows
  (see `tradingview_lightweight_legend.spec.ts`).
- `data-tvl-last-event` on the chart container — the last press-event payload.
- `data-tvl-state` on the chart container — drives `waitForTvlSettled`; always
  settle before a screenshot, and in an `afterEach` so a teardown mid-snapshot
  doesn't spray "Stream was terminated by error" into other sessions' logs.

Hover the chart via `page.mouse.move(...)` over the `.dh-tvl-chart` bounding
box; the tooltip follows the crosshair just like a real cursor.
