# TradingView Lightweight Charts v5.1 — API Reference

Complete API reference for the [lightweight-charts](https://tradingview.github.io/lightweight-charts/docs/api) library.

## Reference Files

| File | Contents |
|------|----------|
| [enumerations.md](enumerations.md) | All 11 enums: ColorType, CrosshairMode, LineStyle, LineType, PriceScaleMode, TickMarkType, etc. |
| [chart-api.md](chart-api.md) | `IChartApi` (26 methods), `ChartOptionsBase`, `LayoutOptions`, `GridOptions`, `CrosshairOptions`, `WatermarkOptions`, scroll/scale/kinetic/localization options |
| [series-api.md](series-api.md) | `ISeriesApi` (5 properties, 20 methods) — data management, price lines, primitives, pane management |
| [series-types.md](series-types.md) | Data interfaces (AreaData, BarData, CandlestickData, LineData, BaselineData, HistogramData) + all style options per series type + `SeriesOptionsCommon` |
| [time-scale-api.md](time-scale-api.md) | `ITimeScaleApi` (22 methods), `TimeScaleOptions` (25+ properties), `Time` type, `BusinessDay`, `UTCTimestamp` |
| [price-scale-api.md](price-scale-api.md) | `IPriceScaleApi` (6 methods), `PriceScaleOptions` (13 properties), `PriceLineOptions` (10 properties), `IPriceLine` |
| [markers-events.md](markers-events.md) | `SeriesMarker`, `MouseEventParams`, `ISeriesMarkersPluginApi`, `TouchMouseEventData`, marker shapes/positions |
| [functions-variables.md](functions-variables.md) | `createChart`, `createChartEx`, `createYieldCurveChart`, watermark/marker factories, series definition variables |
| [panes-api.md](panes-api.md) | `IPaneApi` (15 methods), `PaneSize`, stretch factors, pane primitives |
| [utility-types.md](utility-types.md) | `DeepPartial`, `Coordinate`, `Logical`, `LineWidth`, `PriceFormat`, `Background`, `PriceScaleMargins` |

## Quick Lookup

### Chart Creation
```ts
createChart(container, options?) → IChartApi
createYieldCurveChart(container, options?) → IYieldCurveChartApi
```

### Adding Series (v5 API)
```ts
import { LineSeries, CandlestickSeries, ... } from 'lightweight-charts';
const series = chart.addSeries(LineSeries, options?, paneIndex?);
```

### Series Types
`Line` | `Area` | `Baseline` | `Candlestick` | `Bar` | `Histogram` | `Custom`

### Time Values
- `UTCTimestamp`: seconds since epoch (number)
- `BusinessDay`: `{ year, month, day }`
- ISO string: `'2021-02-03'`

### Key Enums
- `LineStyle`: Solid=0, Dotted=1, Dashed=2, LargeDashed=3, SparseDotted=4
- `LineType`: Simple=0, WithSteps=1, Curved=2
- `CrosshairMode`: Normal=0, Magnet=1, Hidden=2, MagnetOHLC=3
- `PriceScaleMode`: Normal=0, Logarithmic=1, Percentage=2, IndexedTo100=3
- `TickMarkType`: Year=0, Month=1, DayOfMonth=2, Time=3, TimeWithSeconds=4
