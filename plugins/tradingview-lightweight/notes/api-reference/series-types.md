# Series Data Types & Style Options

## Data Interfaces

### SingleValueData (base for Line, Area, Baseline, Histogram)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `time` | `Time` | Yes | Timestamp |
| `value` | `number` | Yes | Price value |
| `customValues?` | `Record<string, unknown>` | No | Custom data for plugins |

### OhlcData (base for Candlestick, Bar)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `time` | `Time` | Yes | Timestamp |
| `open` | `number` | Yes | Open price |
| `high` | `number` | Yes | High price |
| `low` | `number` | Yes | Low price |
| `close` | `number` | Yes | Close price |
| `customValues?` | `Record<string, unknown>` | No | Custom data for plugins |

### LineData (extends SingleValueData)
Additional per-point overrides:
- `color?` — line color for this point

### AreaData (extends SingleValueData)
Additional per-point overrides:
- `lineColor?` — line color
- `topColor?` — top fill color
- `bottomColor?` — bottom fill color

### BaselineData (extends SingleValueData)
Additional per-point overrides:
- `topFillColor1?`, `topFillColor2?`, `topLineColor?`
- `bottomFillColor1?`, `bottomFillColor2?`, `bottomLineColor?`

### HistogramData (extends SingleValueData)
Additional per-point overrides:
- `color?` — bar color for this point

### CandlestickData (extends OhlcData)
Additional per-point overrides:
- `color?` — candle body color
- `borderColor?` — border color
- `wickColor?` — wick color

### BarData (extends OhlcData)
Additional per-point overrides:
- `color?` — bar color

---

## SeriesOptionsCommon (shared by ALL series types)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lastValueVisible` | `boolean` | `true` | Show label with latest price on price scale |
| `title` | `string` | `''` | Series name (shown on label) |
| `priceScaleId?` | `string` | `'right'` | Target price scale ID |
| `visible` | `boolean` | `true` | Series visibility (hides everything when false) |
| `priceLineVisible` | `boolean` | `true` | Show horizontal last-price line |
| `priceLineSource` | `PriceLineSource` | `LastBar` | Source for price line value |
| `priceLineWidth` | `LineWidth` | `1` | Price line width |
| `priceLineColor` | `string` | `''` | Price line color (empty = last bar color) |
| `priceLineStyle` | `LineStyle` | `Dashed` | Price line style |
| `priceFormat` | `PriceFormat` | `{ type: 'price', precision: 2, minMove: 0.01 }` | Price formatting |
| `baseLineVisible` | `boolean` | `true` | Baseline visibility (percentage/indexed modes) |
| `baseLineColor` | `string` | `'#B2B5BE'` | Baseline color |
| `baseLineWidth` | `LineWidth` | `1` | Baseline width |
| `baseLineStyle` | `LineStyle` | `Solid` | Baseline style |
| `autoscaleInfoProvider?` | `AutoscaleInfoProvider` | — | Custom autoscaling |
| `conflationThresholdFactor?` | `number` | — | Series-specific conflation |

---

## Line Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string` | `'#2196f3'` | Line color |
| `lineStyle` | `LineStyle` | `Solid` | Line style |
| `lineWidth` | `LineWidth` | `3` | Width (px) |
| `lineType` | `LineType` | `Simple` | Simple/stepped/curved |
| `lineVisible` | `boolean` | `true` | Show line |
| `pointMarkersVisible` | `boolean` | `false` | Circle markers on each point |
| `pointMarkersRadius?` | `number` | — | Marker radius (px) |
| `crosshairMarkerVisible` | `boolean` | `true` | Show crosshair marker |
| `crosshairMarkerRadius` | `number` | `4` | Marker radius (px) |
| `crosshairMarkerBorderColor` | `string` | `''` | Border color (empty = series color) |
| `crosshairMarkerBackgroundColor` | `string` | `''` | Background color (empty = series color) |
| `crosshairMarkerBorderWidth` | `number` | `2` | Border width (px) |
| `lastPriceAnimation` | `LastPriceAnimationMode` | `Disabled` | Animation mode |

---

## Area Style Options

Inherits all Line Style Options plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `topColor` | `string` | `'rgba(46, 220, 135, 0.4)'` | Top fill color |
| `bottomColor` | `string` | `'rgba(40, 221, 100, 0)'` | Bottom fill color |
| `lineColor` | `string` | `'#33D778'` | Line color |
| `relativeGradient` | `boolean` | `false` | Gradient relative to base value |
| `invertFilledArea` | `boolean` | `false` | Fill above line instead |

---

## Baseline Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `baseValue` | `BaseValuePrice` | `{ type: 'price', price: 0 }` | Base value |
| `topFillColor1` | `string` | `'rgba(38, 166, 154, 0.28)'` | Top area top fill |
| `topFillColor2` | `string` | `'rgba(38, 166, 154, 0.05)'` | Top area bottom fill |
| `topLineColor` | `string` | `'rgba(38, 166, 154, 1)'` | Top area line |
| `bottomFillColor1` | `string` | `'rgba(239, 83, 80, 0.05)'` | Bottom area top fill |
| `bottomFillColor2` | `string` | `'rgba(239, 83, 80, 0.28)'` | Bottom area bottom fill |
| `bottomLineColor` | `string` | `'rgba(239, 83, 80, 1)'` | Bottom area line |
| `lineWidth` | `LineWidth` | `3` | Width (px) |
| `lineStyle` | `LineStyle` | `Solid` | Style |
| `lineType` | `LineType` | `Simple` | Type |
| `lineVisible` | `boolean` | `true` | Show line |
| `relativeGradient` | `boolean` | `false` | Gradient relative to base |
| `pointMarkersVisible` | `boolean` | `false` | Point markers |
| `pointMarkersRadius?` | `number` | — | Marker radius |
| `crosshairMarkerVisible` | `boolean` | `true` | Show crosshair marker |
| `crosshairMarkerRadius` | `number` | `4` | Radius |
| `crosshairMarkerBorderColor` | `string` | `''` | Border color |
| `crosshairMarkerBackgroundColor` | `string` | `''` | Background color |
| `crosshairMarkerBorderWidth` | `number` | `2` | Border width |
| `lastPriceAnimation` | `LastPriceAnimationMode` | `Disabled` | Animation mode |

---

## Candlestick Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `upColor` | `string` | `'#26a69a'` | Rising candle body |
| `downColor` | `string` | `'#ef5350'` | Falling candle body |
| `wickVisible` | `boolean` | `true` | Show wicks |
| `borderVisible` | `boolean` | `true` | Show borders |
| `borderColor` | `string` | `'#378658'` | Default border |
| `borderUpColor` | `string` | `'#26a69a'` | Rising border |
| `borderDownColor` | `string` | `'#ef5350'` | Falling border |
| `wickColor` | `string` | `'#737375'` | Default wick |
| `wickUpColor` | `string` | `'#26a69a'` | Rising wick |
| `wickDownColor` | `string` | `'#ef5350'` | Falling wick |

---

## Bar Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `upColor` | `string` | `'#26a69a'` | Rising bar |
| `downColor` | `string` | `'#ef5350'` | Falling bar |
| `openVisible` | `boolean` | `true` | Show open tick |
| `thinBars` | `boolean` | `true` | Thin stick style |

---

## Histogram Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string` | `'#26a69a'` | Column color |
| `base` | `number` | `0` | Base level for columns |
