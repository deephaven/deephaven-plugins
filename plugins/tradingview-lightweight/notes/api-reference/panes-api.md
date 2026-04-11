# Panes API

## IPaneApi

Returned by `chart.addPane()`, `chart.panes()`, or `series.getPane()`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getHeight()` | `() → number` | Pane height (px) |
| `setHeight()` | `(height: number) → void` | Set pane height (px) |
| `moveTo()` | `(paneIndex: number) → void` | Move pane to new index (0-based) |
| `paneIndex()` | `() → number` | Current pane index |
| `getSeries()` | `() → ISeriesApi[]` | All series in this pane |
| `getHTMLElement()` | `() → HTMLElement` | Underlying HTML element |
| `priceScale()` | `(priceScaleId: string) → IPriceScaleApi` | Get price scale by ID |
| `getStretchFactor()` | `() → number` | Stretch factor (default: 1) |
| `setStretchFactor()` | `(factor: number) → void` | Set relative sizing vs other panes |
| `setPreserveEmptyPane()` | `(preserve: boolean) → void` | Keep pane when empty |
| `preserveEmptyPane()` | `() → boolean` | Current preservation setting |
| `addSeries()` | `(definition, options?) → ISeriesApi` | Add series to this pane |
| `addCustomSeries()` | `(customPaneView, options?) → ISeriesApi` | Add custom series |
| `attachPrimitive()` | `(primitive: IPanePrimitive) → void` | Attach drawing primitive |
| `detachPrimitive()` | `(primitive: IPanePrimitive) → void` | Detach drawing primitive |

## PaneSize

| Property | Type | Description |
|----------|------|-------------|
| `height` | `number` | Pane height (px) |
| `width` | `number` | Pane width (px) |

## Pane Management via IChartApi

```ts
const pane = chart.addPane(preserveEmptyPane?);  // Add new pane
chart.panes();                                     // Get all panes
chart.removePane(index);                           // Remove by index
chart.swapPanes(first, second);                    // Swap positions
```

## Stretch Factors

Stretch factors control relative pane sizes. Default is 1 for all panes.

```ts
// Make bottom pane half the height of top
chart.panes()[0].setStretchFactor(2);
chart.panes()[1].setStretchFactor(1);
```

## Layout Pane Options

Set via `chart.applyOptions({ layout: { panes: { ... } } })`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableResize` | `boolean` | `true` | Allow drag-resizing |
| `separatorColor` | `string` | `'#2B2B43'` | Separator line color |
| `separatorHoverColor` | `string` | `'rgba(178,181,189,0.2)'` | Separator hover color |
