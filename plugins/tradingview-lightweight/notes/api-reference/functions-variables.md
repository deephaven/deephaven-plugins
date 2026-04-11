# Functions & Variables

## Chart Creation

### createChart()
```ts
createChart(container: string | HTMLElement, options?: DeepPartial<TimeChartOptions>): IChartApi
```
Main entry point. Creates a time-based chart.

### createChartEx()
```ts
createChartEx<HorzScaleItem>(
  container: string | HTMLElement,
  horzScaleBehavior: THorzScaleBehavior,
  options?: DeepPartial<...>
): IChartApiBase<HorzScaleItem>
```
Flexible horizontal scale. Use `createChart()` for standard time-based charts.

### createYieldCurveChart()
```ts
createYieldCurveChart(
  container: string | HTMLElement,
  options?: DeepPartial<YieldCurveChartOptions>
): IYieldCurveChartApi
```
Specialized yield curve chart with linearly-spaced horizontal scale in monthly duration units.

---

## Watermark Factories

### createTextWatermark()
```ts
createTextWatermark<T>(
  pane: IPaneApi<T>,
  options: DeepPartial<TextWatermarkOptions>
): ITextWatermarkPluginApi<T>
```
Creates text watermark on a pane. Returns API with `applyOptions()` and `detach()`.

### createImageWatermark()
```ts
createImageWatermark<T>(
  pane: IPaneApi<T>,
  imageUrl: string,
  options: DeepPartial<ImageWatermarkOptions>
): IImageWatermarkPluginApi<T>
```
Creates image watermark on a pane.

---

## Marker Factories

### createSeriesMarkers()
```ts
createSeriesMarkers<HorzScaleItem>(
  series: ISeriesApi,
  markers?: SeriesMarker[],
  options?: ...
): ISeriesMarkersPluginApi<HorzScaleItem>
```
Creates marker plugin attached to a series. Returns API with `setMarkers()`, `markers()`, `detach()`.

### createUpDownMarkers()
```ts
createUpDownMarkers<T>(
  series: ISeriesApi,
  options?: UpDownMarkersPluginOptions
): ISeriesUpDownMarkerPluginApi<T>
```
Creates up/down visual markers on series data.

---

## Utility Functions

### isBusinessDay()
```ts
isBusinessDay(time: Time): time is BusinessDay
```
Type guard: checks if time is a `BusinessDay` object.

### isUTCTimestamp()
```ts
isUTCTimestamp(time: Time): time is UTCTimestamp
```
Type guard: checks if time is a numeric UTC timestamp.

### version()
```ts
version(): string
```
Returns library version string (e.g., `"5.1.0"`).

---

## Series Definition Variables

Used with `chart.addSeries()` in v5:

```ts
import { LineSeries, CandlestickSeries, ... } from 'lightweight-charts';
const series = chart.addSeries(LineSeries, options?);
```

| Variable | Type | Description |
|----------|------|-------------|
| `LineSeries` | `SeriesDefinition<"Line">` | Line series definition |
| `AreaSeries` | `SeriesDefinition<"Area">` | Area series definition |
| `BaselineSeries` | `SeriesDefinition<"Baseline">` | Baseline series definition |
| `CandlestickSeries` | `SeriesDefinition<"Candlestick">` | Candlestick series definition |
| `BarSeries` | `SeriesDefinition<"Bar">` | Bar series definition |
| `HistogramSeries` | `SeriesDefinition<"Histogram">` | Histogram series definition |
| `customSeriesDefaultOptions` | `CustomSeriesOptions` | Default options template for custom series |
