# Plan: TradingView Lightweight Charts Plugin for Deephaven

## Context

We are building a new plugin `tradingview-lightweight` for the deephaven-plugins monorepo that wraps the [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/) JS library. Users will write Python code to create financial charts that render in the Deephaven web UI. The import pattern is:

```python
from deephaven.plot import tradingview_lightweight as tvl
```

The plugin follows the established patterns from `plotly-express` (BidirectionalObjectType, MessageStream, JS WidgetPlugin) but renders via lightweight-charts instead of Plotly.

---

## Agent Team Strategy

The coordinator spawns specialized agents and tracks progress. **No code or research by the coordinator** -- all work delegated to agents.

### Agent Assignments

| # | Agent | Responsibility | Dependencies |
|---|-------|---------------|-------------|
| 1 | **Scaffold Agent** | Create the full directory structure, build configs, namespace packages | None |
| 2 | **Python Core Agent** | TvlChart, SeriesSpec, registration, connection, listener | Agent 1 |
| 3 | **Python API Agent** | Series functions, chart(), convenience functions, options, markers | Agent 2 |
| 4 | **JS Plugin Agent** | TradingViewPlugin.ts, index.ts, package.json, vite.config.ts, tsconfig.json | Agent 1 |
| 5 | **JS Renderer Agent** | TradingViewChartRenderer.ts (imperative wrapper around lightweight-charts) | Agent 4 |
| 6 | **JS Model Agent** | TradingViewChartModel.ts (table subscriptions, data hydration) | Agent 4 |
| 7 | **JS Component Agent** | TradingViewChart.tsx, TradingViewChartPanel.tsx, hooks, theming | Agents 5, 6 |
| 8 | **Python Tests Agent** | Unit tests for Python side following plotly-express test patterns | Agent 3 |
| 9 | **JS Tests Agent** | Unit tests for JS side following plotly-express Jest patterns | Agent 7 |
| 10 | **Integration Agent** | Build verification, agent-browser visual testing | Agents 8, 9 |

### Execution Waves

- **Wave 1** (parallel): Agents 1 + 4 (scaffold + JS boilerplate)
- **Wave 2** (parallel): Agents 2 + 5 + 6 (Python core + JS renderer + JS model)
- **Wave 3** (parallel): Agents 3 + 7 (Python API + JS components)
- **Wave 4** (parallel): Agents 8 + 9 (tests)
- **Wave 5**: Agent 10 (integration + verification)

---

## File Structure

```
plugins/tradingview-lightweight/
├── setup.cfg                    # Python package metadata + entry point
├── setup.py                     # JS packaging (package_js)
├── pyproject.toml               # Build system config
├── tox.ini                      # Python test config
├── Makefile                     # Build helpers
├── README.md
├── LICENSE
├── src/
│   ├── deephaven/
│   │   └── plot/
│   │       └── tradingview_lightweight/
│   │           ├── __init__.py          # Exports + TvlChartType (BidirectionalObjectType)
│   │           ├── _register.py         # TvlRegistration class
│   │           ├── _types.py            # Type aliases (TableLike, etc.)
│   │           ├── chart.py             # TvlChart class + chart() + convenience fns
│   │           ├── series.py            # Series creation functions (6 types)
│   │           ├── options.py           # Literal types, PriceFormat, etc.
│   │           ├── markers.py           # marker(), price_line(), markers_from_table()
│   │           ├── communication/
│   │           │   ├── __init__.py
│   │           │   ├── connection.py    # TvlChartConnection (MessageStream)
│   │           │   └── listener.py      # TvlChartListener (table listeners)
│   │           └── _js/                 # Auto-populated by package_js at build
│   └── js/
│       ├── package.json                 # @deephaven/js-plugin-tradingview-lightweight
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── jest.config.cjs
│       └── src/
│           ├── index.ts                 # Plugin export
│           ├── TradingViewPlugin.ts     # WidgetPlugin definition
│           ├── TradingViewChart.tsx      # Main React component
│           ├── TradingViewChartPanel.tsx # Panel wrapper
│           ├── TradingViewChartModel.ts  # Data model (table subs, events)
│           ├── TradingViewChartRenderer.ts # Imperative chart wrapper
│           ├── TradingViewTheme.ts       # CSS var -> chart options mapping
│           ├── TradingViewTheme.module.css # DH theme CSS var references
│           ├── TradingViewTypes.ts       # Shared TS types
│           ├── TradingViewUtils.ts       # Data transform utilities
│           ├── useChartLifecycle.ts      # Chart create/update/destroy hook
│           ├── useResizeObserver.ts      # Container resize hook
│           ├── DashboardPlugin.tsx       # Legacy dashboard plugin
│           └── __tests__/
│               ├── TradingViewChartModel.test.ts
│               ├── TradingViewChartRenderer.test.ts
│               └── TradingViewUtils.test.ts
└── test/
    └── deephaven/
        └── plot/
            └── tradingview_lightweight/
                ├── test_chart.py
                ├── test_series.py
                └── test_markers.py
```

---

## Python API Design

### Approach: Hybrid (Composable primary, convenience wrappers)

TradingView charts naturally compose multiple series. The primary API uses `tvl.chart(*series)` with series created by typed functions. Convenience functions wrap single-series use cases.

### Series Functions (in `series.py`)

Each returns a `SeriesSpec` dataclass:

```text
def candlestick_series(table, time="Timestamp", open="Open", high="High",
                       low="Low", close="Close", up_color=None, down_color=None,
                       title=None, price_scale_id=None, markers=None,
                       price_lines=None, ...) -> SeriesSpec

def bar_series(table, time, open, high, low, close, ...) -> SeriesSpec
def line_series(table, time, value, color=None, line_width=None, ...) -> SeriesSpec
def area_series(table, time, value, line_color=None, top_color=None, ...) -> SeriesSpec
def baseline_series(table, time, value, base_value=0.0, ...) -> SeriesSpec
def histogram_series(table, time, value, color=None, color_column=None, ...) -> SeriesSpec
```

### Chart Function (in `chart.py`)

```text
def chart(*series: SeriesSpec,
          background_color=None, text_color=None,
          crosshair_mode=None, time_visible=None, seconds_visible=None,
          right_price_scale_visible=None, left_price_scale_visible=None,
          watermark_text=None, width=None, height=None,
          ...) -> TvlChart
```

### Convenience Functions (also in `chart.py`)

```text
def candlestick(table, time="Timestamp", open="Open", ...) -> TvlChart
def line(table, time="Timestamp", value="Value", ...) -> TvlChart
def area(table, ...) -> TvlChart
def bar(table, ...) -> TvlChart
def baseline(table, ...) -> TvlChart
def histogram(table, ...) -> TvlChart
```

### Annotations (in `markers.py`)

```text
def marker(time, position="above_bar", shape="circle", color="#2196F3", text="") -> Marker
def price_line(price, color=None, line_width=None, title=None) -> PriceLine
def markers_from_table(table, time, position, shape, color, text) -> MarkerSpec
```

### Usage Examples

```python
# Simple
chart = tvl.candlestick(
    ohlc_table, time="Timestamp", open="Open", high="High", low="Low", close="Close"
)

# Multi-series overlay
chart = tvl.chart(
    tvl.candlestick_series(
        ohlc_table, time="Timestamp", open="Open", high="High", low="Low", close="Close"
    ),
    tvl.line_series(
        sma_table, time="Timestamp", value="SMA_20", color="#2962FF", title="SMA 20"
    ),
    tvl.histogram_series(
        vol_table, time="Timestamp", value="Volume", price_scale_id="volume"
    ),
    crosshair_mode="magnet",
    time_visible=True,
    watermark_text="AAPL",
)
```

---

## JavaScript Architecture

### Plugin Registration (`TradingViewPlugin.ts`)

```typescript
export const TradingViewPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/tradingview-lightweight',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.plot.tradingview_lightweight.TvlChart',
  component: TradingViewChart,
  panelComponent: TradingViewChartPanel,
  icon: vsGraph,
};
```

### Three-Layer JS Architecture

1. **TradingViewChart.tsx** (React) -- calls `fetch()`, creates Model + Renderer, wires them together
2. **TradingViewChartModel.ts** (Data) -- manages widget messages, table subscriptions, emits data events
3. **TradingViewChartRenderer.ts** (Rendering) -- imperative wrapper around `createChart()` / `ISeriesApi`

### Data Flow

```
Python TvlChart.to_json() → JSON message with chart config + table refs
    ↓
JS Widget fetch() → parse config, get exported table objects
    ↓
TradingViewChartModel subscribes to tables → receives column data
    ↓
Model transforms columns into {time, open, high, low, close} arrays
    ↓
TradingViewChartRenderer.setSeriesData() / .updateSeries()
```

### Message Protocol

- Client → Server: `{ "type": "RETRIEVE" }`
- Server → Client: `{ "type": "NEW_FIGURE", "figure": {...}, "revision": N, "new_references": [...], "removed_references": [...] }`

### Real-Time Updates

- Single-row append → `series.update(point)` (O(1))
- Multi-row change → `series.setData(allData)` (full refresh)
- Config change → `chart.applyOptions()` + series reconfiguration

### Theming

`TradingViewTheme.module.css` maps `--dh-color-chart-*` CSS variables. Resolved at runtime via `getComputedStyle`. Applied to chart via `chart.applyOptions()`. Re-applied on theme change.

---

## Critical Files to Reference

| Purpose | File |
|---------|------|
| Registration pattern | `plugins/plotly-express/src/deephaven/plot/express/_register.py` |
| BidirectionalObjectType | `plugins/plotly-express/src/deephaven/plot/express/__init__.py:57-113` |
| MessageStream connection | `plugins/plotly-express/src/deephaven/plot/express/communication/DeephavenFigureConnection.py` |
| Table listener | `plugins/plotly-express/src/deephaven/plot/express/communication/DeephavenFigureListener.py` |
| JS WidgetPlugin | `plugins/plotly-express/src/js/src/PlotlyExpressPlugin.ts` |
| JS chart component | `plugins/plotly-express/src/js/src/PlotlyExpressChart.tsx` |
| JS chart model | `plugins/plotly-express/src/js/src/PlotlyExpressChartModel.ts` |
| Vite config | `plugins/plotly-express/src/js/vite.config.ts` |
| setup.py packaging | `plugins/plotly-express/setup.py` |
| setup.cfg metadata | `plugins/plotly-express/setup.cfg` |
| Theme CSS vars | `plugins/theme-pack/src/js/src/*.css` (for `--dh-color-chart-*` variables) |

---

## Build Configuration

### Python (`setup.cfg`)
```
name = deephaven-plugin-tradingview-lightweight
entry_point = deephaven.plot.tradingview_lightweight._register:TvlRegistration
deps = deephaven-core>=0.41.1, deephaven-plugin>=0.6.0, deephaven-plugin-utilities>=0.0.2
```

### JS (`package.json`)
```
name = @deephaven/js-plugin-tradingview-lightweight
deps: lightweight-charts ^5.1.0, @deephaven/plugin, @deephaven/components, @deephaven/icons, etc.
lightweight-charts is BUNDLED (not externalized) -- it's only ~45KB gzipped
```

### Vite
- CJS output to `dist/bundle/index.js`
- Externalize: react, react-dom, redux, @deephaven/* packages
- DO NOT externalize: `lightweight-charts` (bundle it)

---

## Testing Strategy

### Python Tests (`test/`)
- Unit tests for `TvlChart` serialization (chart config → JSON)
- Unit tests for `SeriesSpec` creation (column mappings, options)
- Unit tests for markers and price lines
- Pattern: `unittest.TestCase`, following `plugins/plotly-express/test/`

### JS Tests (`src/js/src/__tests__/`)
- `TradingViewChartModel.test.ts` -- mock widget/table, verify data hydration
- `TradingViewChartRenderer.test.ts` -- mock lightweight-charts, verify API calls
- `TradingViewUtils.test.ts` -- data transformation unit tests
- Pattern: Jest with `@deephaven/test-utils` mocks, following plotly-express

### Integration / Visual
- Use agent-browser to load a Deephaven session, create a chart, and screenshot
- Verify chart renders in the panel with correct data

---

## Verification Plan

1. **Build**: `cd plugins/tradingview-lightweight/src/js && npm install && npm run build`
2. **Python package**: `python -m build --wheel plugins/tradingview-lightweight`
3. **JS tests**: `npx jest --config plugins/tradingview-lightweight/src/js/jest.config.cjs`
4. **Python tests**: `cd plugins/tradingview-lightweight && python -m pytest test/`
5. **Visual**: Use agent-browser to load in Deephaven and confirm chart renders
6. **Lint**: `npx eslint plugins/tradingview-lightweight/src/js/src/`
