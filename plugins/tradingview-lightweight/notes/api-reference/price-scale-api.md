# Price Scale & Price Lines

## IPriceScaleApi

Returned by `chart.priceScale(id)` or `series.priceScale()`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `applyOptions()` | `(options: DeepPartial<PriceScaleOptions>) → void` | Apply new options |
| `options()` | `() → Readonly<PriceScaleOptions>` | Current options |
| `width()` | `() → number` | Width in px (0 if invisible) |
| `setVisibleRange()` | `(range: IRange<number>) → void` | Set visible price range |
| `getVisibleRange()` | `() → IRange<number>` | Get visible price range |
| `setAutoScale()` | `(on: boolean) → void` | Enable/disable autoscaling |

---

## PriceScaleOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoScale` | `boolean` | `true` | Auto-adjust to fit visible data |
| `mode` | `PriceScaleMode` | `Normal` | Normal / Logarithmic / Percentage / IndexedTo100 |
| `invertScale` | `boolean` | `false` | Invert price direction |
| `alignLabels` | `boolean` | `true` | Prevent label overlap |
| `scaleMargins` | `PriceScaleMargins` | `{ top: 0.2, bottom: 0.1 }` | Top/bottom margins (0–1) |
| `borderVisible` | `boolean` | `true` | Show border |
| `borderColor` | `string` | `'#2B2B43'` | Border color |
| `textColor?` | `string` | — | Override text color |
| `entireTextOnly` | `boolean` | `false` | Only show labels if fully visible |
| `visible` | `boolean` | `true` (right) / `false` (left) | Scale visibility |
| `ticksVisible` | `boolean` | `false` | Small tick lines on labels |
| `minimumWidth` | `number` | `0` | Minimum width (px) |
| `ensureEdgeTickMarksVisible` | `boolean` | `false` | Ensure ticks at boundaries |

### PriceScaleMargins

| Property | Type | Description |
|----------|------|-------------|
| `top` | `number` | Top margin (0–1, percentage of pane height) |
| `bottom` | `number` | Bottom margin (0–1, percentage of pane height) |

### OverlayPriceScaleOptions
Same as `PriceScaleOptions` but without `visible` and `autoScale`.
Used for overlay series that don't affect the main price scales.

---

## PriceLineOptions

Options for `series.createPriceLine()`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id?` | `string` | — | Optional identifier |
| `price` | `number` | `0` | Price level |
| `color` | `string` | `''` | Line color |
| `lineWidth` | `LineWidth` | `1` | Width (px) |
| `lineStyle` | `LineStyle` | `Solid` | Style |
| `lineVisible` | `boolean` | `true` | Show line |
| `axisLabelVisible` | `boolean` | `true` | Show label on price scale |
| `title` | `string` | `''` | Title on chart pane |
| `axisLabelColor` | `string` | `''` | Label background (empty = line color) |
| `axisLabelTextColor` | `string` | `''` | Label text color |

---

## IPriceLine

Returned by `series.createPriceLine()`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `applyOptions()` | `(options: Partial<PriceLineOptions>) → void` | Update options |
| `options()` | `() → Readonly<PriceLineOptions>` | Current options |
