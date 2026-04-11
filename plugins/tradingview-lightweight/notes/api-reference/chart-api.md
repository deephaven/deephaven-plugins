# IChartApi & Chart Options

## IChartApi

Returned by `createChart()`. 26 methods total.

### Chart Lifecycle
| Method | Signature | Description |
|--------|-----------|-------------|
| `remove()` | `() → void` | Removes chart and all DOM elements (irreversible) |

### Sizing
| Method | Signature | Description |
|--------|-----------|-------------|
| `resize()` | `(width, height, forceRepaint?) → void` | Set fixed dimensions; ignored if `autoSize` enabled |
| `paneSize()` | `(paneIndex?) → PaneSize` | Plot surface dimensions excluding scales |
| `autoSizeActive()` | `() → boolean` | Whether ResizeObserver auto-sizing is active |

### Series Management
| Method | Signature | Description |
|--------|-----------|-------------|
| `addSeries()` | `(definition, options?, paneIndex?) → ISeriesApi` | Create series (v5: pass `LineSeries`, `CandlestickSeries`, etc.) |
| `addCustomSeries()` | `(customPaneView, options?, paneIndex?) → ISeriesApi<"Custom">` | Create custom-rendered series |
| `removeSeries()` | `(seriesApi) → void` | Remove a series (irreversible) |

### Event Subscriptions
| Method | Signature | Description |
|--------|-----------|-------------|
| `subscribeClick()` | `(handler: MouseEventHandler) → void` | Chart click |
| `unsubscribeClick()` | `(handler) → void` | Remove click handler |
| `subscribeDblClick()` | `(handler) → void` | Double-click |
| `unsubscribeDblClick()` | `(handler) → void` | Remove double-click handler |
| `subscribeCrosshairMove()` | `(handler) → void` | Crosshair movement |
| `unsubscribeCrosshairMove()` | `(handler) → void` | Remove crosshair handler |

### Scale APIs
| Method | Signature | Description |
|--------|-----------|-------------|
| `priceScale()` | `(priceScaleId, paneIndex?) → IPriceScaleApi` | Access a price scale |
| `timeScale()` | `() → ITimeScaleApi` | Access the time scale |
| `horzBehaviour()` | `() → IHorzScaleBehavior` | Horizontal scale behavior |

### Configuration
| Method | Signature | Description |
|--------|-----------|-------------|
| `applyOptions()` | `(options: DeepPartial<TimeChartOptions>) → void` | Apply new chart options |
| `options()` | `() → Readonly<ChartOptionsImpl>` | Current options with defaults |

### Visualization
| Method | Signature | Description |
|--------|-----------|-------------|
| `takeScreenshot()` | `(addTopLayer?, includeCrosshair?) → HTMLCanvasElement` | Generate screenshot canvas |
| `chartElement()` | `() → HTMLDivElement` | Container div for custom listeners |

### Pane Management
| Method | Signature | Description |
|--------|-----------|-------------|
| `addPane()` | `(preserveEmptyPane?) → IPaneApi` | Add a new pane |
| `panes()` | `() → IPaneApi[]` | All pane APIs |
| `removePane()` | `(index) → void` | Remove pane by index |
| `swapPanes()` | `(first, second) → void` | Swap two panes |

### Crosshair
| Method | Signature | Description |
|--------|-----------|-------------|
| `setCrosshairPosition()` | `(price, horizontalPosition, seriesApi) → void` | Position crosshair explicitly (for multi-chart sync) |
| `clearCrosshairPosition()` | `() → void` | Remove crosshair |

---

## ChartOptionsBase

Top-level options passed to `createChart()`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `0` | Chart width in pixels (0 = from container) |
| `height` | `number` | `0` | Chart height in pixels (0 = from container) |
| `autoSize` | `boolean` | `false` | Auto-resize via ResizeObserver |
| `layout` | `LayoutOptions` | — | Layout/appearance options |
| `leftPriceScale` | `PriceScaleOptions` | — | Left price scale |
| `rightPriceScale` | `PriceScaleOptions` | — | Right price scale |
| `overlayPriceScales` | `OverlayPriceScaleOptions` | — | Overlay price scale defaults |
| `timeScale` | `HorzScaleOptions` | — | Time scale options |
| `crosshair` | `CrosshairOptions` | — | Crosshair options |
| `grid` | `GridOptions` | — | Grid line options |
| `handleScroll` | `boolean \| HandleScrollOptions` | — | Scroll control |
| `handleScale` | `boolean \| HandleScaleOptions` | — | Scale/zoom control |
| `kineticScroll` | `KineticScrollOptions` | — | Momentum scrolling |
| `trackingMode` | `TrackingModeOptions` | — | Mobile tracking mode |
| `localization` | `LocalizationOptionsBase` | — | Locale/formatting |
| `addDefaultPane` | `boolean` | `true` | Create default pane automatically |

---

## LayoutOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `background` | `Background` | `{ type: 'solid', color: '#FFFFFF' }` | Chart background (solid or vertical gradient) |
| `textColor` | `string` | `'#191919'` | Text color on scales |
| `fontSize` | `number` | `12` | Font size (px) |
| `fontFamily` | `string` | `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif` | Font family |
| `panes` | `LayoutPanesOptions` | `{ enableResize: true, separatorColor: '#2B2B43', separatorHoverColor: 'rgba(178, 181, 189, 0.2)' }` | Pane separator options |
| `attributionLogo` | `boolean` | `true` | Show TradingView logo |
| `colorSpace` | `ColorSpace` | `'srgb'` | Canvas color space (set at creation only) |
| `colorParsers` | `CustomColorParser[]` | `[]` | Custom color parser functions |

---

## GridOptions

| Property | Type | Description |
|----------|------|-------------|
| `vertLines` | `GridLineOptions` | Vertical grid lines |
| `horzLines` | `GridLineOptions` | Horizontal grid lines |

### GridLineOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string` | `'#D6DCDE'` | Line color |
| `style` | `LineStyle` | `LineStyle.Solid` | Line style |
| `visible` | `boolean` | `true` | Show lines |

---

## CrosshairOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `CrosshairMode` | `Magnet` | Crosshair behavior mode |
| `vertLine` | `CrosshairLineOptions` | — | Vertical line options |
| `horzLine` | `CrosshairLineOptions` | — | Horizontal line options |
| `doNotSnapToHiddenSeriesIndices` | `boolean` | `false` | Skip hidden series when snapping |

### CrosshairLineOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string` | `'#758696'` | Line color |
| `width` | `LineWidth` | `1` | Line width |
| `style` | `LineStyle` | `LargeDashed` | Line style |
| `visible` | `boolean` | `true` | Show line |
| `labelVisible` | `boolean` | `true` | Show label on scale |
| `labelBackgroundColor` | `string` | `'#4c525e'` | Label background |

---

## Watermark Options

### TextWatermarkOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | `boolean` | `true` | Show watermark |
| `horzAlign` | `HorzAlign` | `'center'` | Horizontal alignment |
| `vertAlign` | `VertAlign` | `'center'` | Vertical alignment |
| `lines` | `TextWatermarkLineOptions[]` | `[]` | Text lines |

### TextWatermarkLineOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` | `''` | Watermark text (no word wrap) |
| `color` | `string` | `'rgba(0,0,0,0.5)'` | Text color |
| `fontSize` | `number` | `48` | Font size (px) |
| `lineHeight` | `number?` | `1.2 * fontSize` | Line height (px) |
| `fontFamily` | `string` | system default | Font family |
| `fontStyle` | `string` | `''` | Font style (e.g. `'italic'`) |

### ImageWatermarkOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxWidth` | `number?` | — | Maximum image width |
| `maxHeight` | `number?` | — | Maximum image height |
| `padding` | `number` | `0` | Padding from chart edges |
| `alpha` | `number` | `1` | Opacity (0–1) |

---

## HandleScrollOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mouseWheel` | `boolean` | `true` | Scroll with mouse wheel |
| `pressedMouseMove` | `boolean` | `true` | Scroll by dragging |
| `horzTouchDrag` | `boolean` | `true` | Horizontal touch scroll |
| `vertTouchDrag` | `boolean` | `true` | Vertical touch scroll |

## HandleScaleOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mouseWheel` | `boolean` | `true` | Scale with mouse wheel |
| `pinch` | `boolean` | `true` | Pinch-to-zoom |
| `axisPressedMouseMove` | `boolean \| AxisPressedMouseMoveOptions` | — | Scale by dragging axis |
| `axisDoubleClickReset` | `boolean \| AxisDoubleClickOptions` | — | Reset scale on double-click |

## KineticScrollOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `touch` | `boolean` | `true` | Kinetic scroll on touch |
| `mouse` | `boolean` | `false` | Kinetic scroll on mouse |

---

## LocalizationOptionsBase

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `locale` | `string` | `navigator.language` | Locale for date formatting |
| `priceFormatter` | `PriceFormatterFn?` | — | Custom price formatter |
| `tickmarksPriceFormatter` | `TickmarksPriceFormatterFn?` | — | Custom price tick marks formatter |
| `percentageFormatter` | `PercentageFormatterFn?` | — | Custom percentage formatter |
| `tickmarksPercentageFormatter` | `TickmarksPercentageFormatterFn?` | — | Custom percentage tick formatter |
