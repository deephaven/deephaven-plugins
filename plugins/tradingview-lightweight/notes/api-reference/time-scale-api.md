# ITimeScaleApi & Time Types

## ITimeScaleApi

Returned by `chart.timeScale()`. 22 methods total.

### Scrolling & Position

| Method | Signature | Description |
|--------|-----------|-------------|
| `scrollPosition()` | `() → number` | Distance in bars from right edge to latest bar |
| `scrollToPosition()` | `(position, animated) → void` | Scroll to bar position |
| `scrollToRealTime()` | `() → void` | Restore default scroll (always animated) |

### Visible Range

| Method | Signature | Description |
|--------|-----------|-------------|
| `getVisibleRange()` | `() → Range<Time> \| null` | Current visible time range |
| `setVisibleRange()` | `(range: Range<Time>) → void` | Set visible time range |
| `getVisibleLogicalRange()` | `() → LogicalRange \| null` | Visible range as logical indexes |
| `setVisibleLogicalRange()` | `(range: Range<number>) → void` | Set visible logical range |

### Display Controls

| Method | Signature | Description |
|--------|-----------|-------------|
| `resetTimeScale()` | `() → void` | Reset zoom and scroll to defaults |
| `fitContent()` | `() → void` | Auto-fit to show all data |
| `width()` | `() → number` | Time scale width (px) |
| `height()` | `() → number` | Time scale height (px) |

### Coordinate Conversion

| Method | Signature | Description |
|--------|-----------|-------------|
| `logicalToCoordinate()` | `(logical) → Coordinate` | Logical index → x pixel |
| `coordinateToLogical()` | `(x) → Logical` | x pixel → logical index |
| `timeToIndex()` | `(time, findNearest?) → Logical` | Time → index |
| `timeToCoordinate()` | `(time) → Coordinate` | Time → x pixel |
| `coordinateToTime()` | `(x) → Time` | x pixel → time |

### Event Subscriptions

| Method | Signature | Description |
|--------|-----------|-------------|
| `subscribeVisibleTimeRangeChange()` | `(handler) → void` | Time range change (zoom/pan) |
| `unsubscribeVisibleTimeRangeChange()` | `(handler) → void` | Remove handler |
| `subscribeVisibleLogicalRangeChange()` | `(handler) → void` | Logical range change |
| `unsubscribeVisibleLogicalRangeChange()` | `(handler) → void` | Remove handler |
| `subscribeSizeChange()` | `(handler) → void` | Size change |
| `unsubscribeSizeChange()` | `(handler) → void` | Remove handler |

### Configuration

| Method | Signature | Description |
|--------|-----------|-------------|
| `applyOptions()` | `(options) → void` | Apply new time scale options |
| `options()` | `() → Readonly<TimeScaleOptions>` | Current options |

---

## TimeScaleOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| **Spacing & Layout** | | | |
| `rightOffset` | `number` | `0` | Margin in bars from right edge |
| `rightOffsetPixels?` | `number` | — | Pixel-based right margin (overrides rightOffset) |
| `barSpacing` | `number` | `6` | Space between bars (px) |
| `minBarSpacing` | `number` | `0.5` | Minimum bar spacing |
| `maxBarSpacing` | `number` | `0` | Maximum bar spacing (0 = no limit) |
| **Scroll & Edge** | | | |
| `fixLeftEdge` | `boolean` | `false` | Prevent scrolling past first bar |
| `fixRightEdge` | `boolean` | `false` | Prevent scrolling past last bar |
| `lockVisibleTimeRangeOnResize` | `boolean` | `false` | Maintain range during resize |
| `rightBarStaysOnScroll` | `boolean` | `false` | Prevent hovered bar from moving |
| **Visual** | | | |
| `borderVisible` | `boolean` | `true` | Show border line |
| `borderColor` | `string` | `'#2B2B43'` | Border color |
| `visible` | `boolean` | `true` | Show the time scale |
| `timeVisible` | `boolean` | `false` | Show time in addition to date |
| `secondsVisible` | `boolean` | `true` | Show seconds for intraday |
| `ticksVisible` | `boolean` | `false` | Draw vertical lines on labels |
| `allowBoldLabels` | `boolean` | `true` | Bold font for major labels |
| **Data Behavior** | | | |
| `shiftVisibleRangeOnNewBar` | `boolean` | `true` | Shift right on new bars |
| `allowShiftVisibleRangeOnWhitespaceReplacement` | `boolean` | `false` | Shift on whitespace replacement |
| `ignoreWhitespaceIndices` | `boolean` | `false` | Exclude whitespace points from grid |
| **Performance** | | | |
| `enableConflation` | `boolean` | `false` | Combine points at <0.5px spacing |
| `conflationThresholdFactor?` | `number` | `1.0` | Smoothing factor (1.0–8.0+) |
| `precomputeConflationOnInit` | `boolean` | `false` | Pre-compute conflation chunks |
| `precomputeConflationPriority` | `string` | `'background'` | Task scheduling priority |
| **Formatting** | | | |
| `tickMarkMaxCharacterLength?` | `number` | — | Override default 8-char max for labels |
| `tickMarkFormatter?` | `TickMarkFormatter` | — | Custom tick mark label formatter |
| `uniformDistribution` | `boolean` | — | Draw marks at same weight consistently |
| `minimumHeight` | `number` | `0` | Minimum time scale height (px) |

### TickMarkFormatter signature
```ts
type TickMarkFormatter = (
  time: Time,
  tickMarkType: TickMarkType,
  locale: string
) => string | string[];
```

---

## Time Type

```ts
type Time = UTCTimestamp | BusinessDay | string;
```

### UTCTimestamp
- Numeric: seconds since Unix epoch
- Example: `1529899200 as UTCTimestamp` (June 25, 2018)
- Note: JS `Date.now()` returns milliseconds — divide by 1000

### BusinessDay
```ts
interface BusinessDay {
  year: number;
  month: number;
  day: number;
}
```
Example: `{ year: 2019, month: 6, day: 1 }`

### ISO String
Example: `'2021-02-03'`
