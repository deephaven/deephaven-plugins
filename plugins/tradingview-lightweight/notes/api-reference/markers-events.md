# Markers & Events

## SeriesMarker

Union type: `SeriesMarkerBar | SeriesMarkerPrice`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `time` | `Time` | Yes | Marker timestamp |
| `position` | `SeriesMarkerPosition` | Yes | Position relative to bar or price |
| `shape` | `SeriesMarkerShape` | Yes | Visual shape |
| `color` | `string` | Yes | Marker color |
| `id?` | `string` | No | Unique identifier |
| `text?` | `string` | No | Label text |
| `size?` | `number` | No | Size multiplier (default: 1) |
| `price?` | `number` | Conditional | Required for price-based positions |

### SeriesMarkerShape
`'circle' | 'square' | 'arrowUp' | 'arrowDown'`

### SeriesMarkerPosition
Bar positions: `'aboveBar' | 'belowBar' | 'inBar'`
Price positions: `'atPriceTop' | 'atPriceBottom' | 'atPriceMiddle'` (require `price` property)

---

## ISeriesMarkersPluginApi

Created by `createSeriesMarkers(series, markers?, options?)`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `setMarkers()` | `(markers: SeriesMarker[]) → void` | Set all markers |
| `markers()` | `() → readonly SeriesMarker[]` | Current markers |
| `detach()` | `() → void` | Detach plugin from series |
| `getSeries()` | `() → ISeriesApi` | Get parent series |
| `applyOptions()` | `(options) → void` | Apply plugin options |

---

## MouseEventParams

Passed to click/dblClick/crosshairMove handlers.

| Property | Type | Optional | Description |
|----------|------|----------|-------------|
| `time` | `Time` | Yes | Time at mouse position (undefined if outside data) |
| `logical` | `Logical` | Yes | Logical index |
| `point` | `Point` | Yes | Pixel coordinates (undefined if outside chart) |
| `paneIndex` | `number` | Yes | Pane index |
| `seriesData` | `Map<ISeriesApi, DataItem>` | No | Data for all series at this position |
| `hoveredSeries` | `ISeriesApi` | Yes | Series under cursor |
| `hoveredObjectId` | `unknown` | Yes | Object under cursor |
| `hoveredItem` | `HoveredItem` | Yes | Structured info about the hovered chart element (v5.2+) |
| `hoveredTarget` | `HoveredTargetType` | Yes | Coarse target category (`'series'`, `'priceScale'`, `'timeScale'`, etc.) (v5.2+) |
| `sourceEvent` | `TouchMouseEventData` | Yes | Raw mouse/touch event data |

> **Python plugin note.** `MouseEventParams` is a JS-runtime payload delivered to
> `subscribeClick` / `subscribeCrosshairMove` handlers. The Deephaven Python plugin
> is a static config builder and does not subscribe to mouse events from Python,
> so neither the legacy fields nor the v5.2 `hoveredItem` / `hoveredTarget`
> additions are reachable from the Python `chart()` API. They are listed here for
> completeness and for any future bidirectional event-channel work.

### Point
```ts
interface Point {
  x: Coordinate;
  y: Coordinate;
}
```

### TouchMouseEventData

| Property | Type | Description |
|----------|------|-------------|
| `clientX` | `Coordinate` | DOM-relative X |
| `clientY` | `Coordinate` | DOM-relative Y |
| `pageX` | `Coordinate` | Page X |
| `pageY` | `Coordinate` | Page Y |
| `screenX` | `Coordinate` | Screen X |
| `screenY` | `Coordinate` | Screen Y |
| `localX` | `Coordinate` | Chart-relative X |
| `localY` | `Coordinate` | Chart-relative Y |
| `ctrlKey` | `boolean` | Ctrl pressed |
| `altKey` | `boolean` | Alt pressed |
| `shiftKey` | `boolean` | Shift pressed |
| `metaKey` | `boolean` | Meta/Cmd pressed |

---

## MouseEventHandler

```ts
type MouseEventHandler<HorzScaleItem> = (param: MouseEventParams<HorzScaleItem>) => void;
```

---

## Range / LogicalRange

```ts
interface IRange<T> {
  from: T;
  to: T;
}

type LogicalRange = IRange<Logical>;
// from/to can be fractional (e.g., 5.2 means 6th bar is 20% visible)
```
