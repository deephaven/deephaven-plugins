# How Plotly-Express Implements Downsampling

Research notes for planning a similar implementation in the TVL plugin.

## Architecture Overview

The downsampling is **not** a Python-side operation. It uses a **Java-side
LTTB algorithm** exposed via the Deephaven JS API as
`dh.plot.Downsample.runChartDownsample()`. The JS chart model decides when
to downsample, calls the server, receives a smaller table back, and
subscribes to that instead of the original.

```
User table (1M rows)
      |
      v
[JS] addTable() — checks size & eligibility
      |
      v  (if eligible)
[Java/Server] dh.plot.Downsample.runChartDownsample(table, xCol, yCols, width, range)
      |
      v
Downsampled table (~800 rows, one per pixel)
      |
      v
[JS] subscribe & render
      |
      v  (user zooms/pans)
[JS] setDimensions() — detects range change
      |
      v
[Java/Server] re-downsample with new [min, max] range
      |
      v
New downsampled table with more detail in visible range
```

## Thresholds

Defined in `PlotlyExpressChartModel.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `AUTO_DOWNSAMPLE_SIZE` | 30,000 | Below this: fetch all rows, no downsampling |
| `MAX_FETCH_SIZE` | 1,000,000 | Above this: refuse to fetch raw (only applies when downsampling is NOT possible) |

Decision matrix:

| Table size | Can downsample? | Action |
|---|---|---|
| 0-30K | n/a | Full fetch, no downsampling |
| 30K+ | Yes (line chart, linear axis) | Downsample via LTTB (**no upper limit**) |
| 30K-1M | No (scatter, log axis, etc.) | Show confirmation dialog ("may be slow") |
| >1M | No | Reject: "Too many items to plot" |

The `MAX_FETCH_SIZE` cap only guards against sending millions of raw,
un-downsampleable points to the browser. When LTTB can run, there is no
size limit — the server reduces any table to ~`width` points regardless
of input size.

## Eligibility Checks

`getDownsampleInfo()` returns a `DownsampleInfo` object if downsampling is
possible, or a string error message if not. Checks (in order):

1. **All series must be line type** — `isLineSeries(series)` checks that the
   trace type is a line (scatter with mode='lines'). Bars, scatter markers,
   histograms, etc. are excluded.
2. **Single x-column** — all series must share the same x-column name.
   Multiple x-columns = cannot downsample.
3. **Linear or auto x-axis** — the axis type must be `linear`, `date`, or
   unset (auto). Log, category, multicategory axes are excluded.
4. **Linear or auto y-axis** — same check for all y-axes.

## The Downsample Call

```typescript
// PlotlyExpressChartUtils.ts:283-298
export function downsample(
  dh: typeof DhType,
  info: DownsampleInfo
): Promise<DhType.Table> {
  return dh.plot.Downsample.runChartDownsample(
    info.originalTable,   // the full table
    info.xCol,            // e.g. "Timestamp"
    info.yCols,           // e.g. ["Price", "Volume"]
    info.width,           // pixels available (chart width minus margins)
    info.range?.map(val =>
      info.rangeType === 'date'
        ? dh.DateWrapper.ofJsDate(new Date(val))
        : dh.LongWrapper.ofString(val)
    )                     // [min, max] or undefined for autorange
  );
}
```

**Parameters:**
- `originalTable`: the original DH table (stays in memory for re-sampling)
- `xCol`: the x-axis column (must be monotonic/sortable)
- `yCols`: all y-axis columns to preserve in the output
- `width`: number of pixels = target number of output points
- `range`: `[min, max]` for the visible x-axis window, or `undefined`/`null`
  for the full range (autorange). Dates are wrapped in `DateWrapper`, numbers
  in `LongWrapper`.

**Returns:** a new `Table` with ~`width` rows, selected by LTTB.

**Algorithm (server-side):** LTTB (Largest Triangle Three Buckets). Divides
the data into `width` buckets and picks the point in each bucket that
maximizes the triangle area with its neighbors. Preserves peaks, valleys,
and visual shape while reducing to exactly `width` points.

## The DownsampleInfo Structure

```typescript
// PlotlyExpressChartUtils.ts:254-281
interface DownsampleInfo {
  type: 'linear';
  originalTable: DhType.Table;  // kept for re-sampling on zoom
  xCol: string;
  yCols: string[];
  width: number;                // pixels
  range: string[] | null;       // [min, max] or null for autorange
  rangeType: 'date' | 'number';
}
```

Stored in `downsampleMap: Map<tableId, DownsampleInfo>` so the model can
re-downsample with new parameters when the viewport changes.

## How Zoom/Pan Triggers Re-sampling

### 1. User zooms or pans the chart

Plotly updates `layout.xaxis.range` internally.

### 2. `setDimensions()` is called

```typescript
// PlotlyExpressChartModel.ts:877-883
override setDimensions(rect: DOMRect): void {
  super.setDimensions(rect);
  ChartUtils.getLayoutRanges(this.layout);
  this.downsampleMap.forEach((_, id) => {
    this.updateDownsampledTable(id);
  });
}
```

Called when the chart container resizes **or** the layout changes (which
includes zoom/pan). Iterates all downsampled tables.

### 3. `updateDownsampledTable()` compares old vs new

```typescript
// PlotlyExpressChartModel.ts:678-712
async updateDownsampledTable(id: number): Promise<void> {
  const oldInfo = this.downsampleMap.get(id);
  const newInfo = this.getDownsampleInfo(id, oldInfo.originalTable);

  // Skip if range AND width are unchanged
  if (areSameAxisRange(newInfo.range, oldInfo.range) &&
      newInfo.width === oldInfo.width) {
    return;
  }

  // Clean up old subscriptions, re-add with new params
  this.cleanupSubscriptions(id);
  this.tableReferenceMap.delete(id);
  this.addTable(id, oldInfo.originalTable);  // triggers new downsample
}
```

The range comparison (`areSameAxisRange`) prevents unnecessary re-samples
when nothing visible has changed.

### 4. `addTable()` runs the new downsample

Same flow as initial load, but now with a specific `range: [min, max]`
extracted from the current `layout.xaxis.range`. The LTTB algorithm focuses
its bucket selection within this range, giving more detail where the user
is looking.

## Width Calculation

```typescript
// PlotlyExpressChartModel.ts:954-964
getPlotWidth(): number {
  return Math.max(
    this.rect.width - (this.layout.margin?.l ?? 0) - (this.layout.margin?.r ?? 0),
    0
  );
}
```

The target number of downsampled points = actual pixel width of the plot
area (excluding margins). One data point per pixel is the sweet spot: fewer
would lose detail, more would waste bandwidth.

## Data Subscription After Downsampling

After `addTable()` gets the downsampled table:

1. Store in `tableReferenceMap`
2. `subscribeTable(id)` creates a `ChartData` object and subscribes to the
   needed columns via `table.subscribe(columns)`
3. `Table.EVENT_UPDATED` fires on each tick
4. `handleFigureUpdated()` processes deltas via `ChartData.update()`
5. Column arrays are extracted and stored in `tableDataMap`
6. `fireUpdate(getData())` sends the hydrated plotly data to the renderer

## Key Design Decisions

1. **Original table kept in memory.** The `DownsampleInfo.originalTable`
   is never closed. It's needed for re-downsampling on zoom/pan.

2. **No Python round-trip for zoom.** The `dh.plot.Downsample` API is
   called directly from JS. Zoom/pan never sends a message to the Python
   widget — it calls the Java server directly via the JS API.

3. **One point per pixel.** The `width` parameter = plot area pixel width.
   This is the optimal number: no sub-pixel detail wasted, no aliasing.

4. **Fail gracefully.** If downsampling is not possible (wrong chart type,
   log axis, etc.), the user gets a confirmation dialog rather than a crash.
   Tables >1M rows are rejected outright.

5. **Subscriptions are cleaned up and recreated.** On each re-sample, old
   subscriptions are torn down and new ones created for the new downsampled
   table. This avoids stale data.

## Implications for TVL Plugin

### What we can reuse directly
- `dh.plot.Downsample.runChartDownsample()` — same Java API, available in
  any DH JS client context.
- The 30K auto-downsample threshold is a sensible default.
- The "one point per pixel" width calculation.

### What differs for TVL
- **TradingView Lightweight Charts handles its own rendering** — it does not
  use Plotly's data array model. Data is fed via `series.setData()` or
  `series.update()`.
- **TVL's time scale is independent** — zoom/pan events come from the TVL
  library's `timeScale().subscribeVisibleTimeRangeChange()`, not from
  Plotly layout changes.
- **TVL already supports incremental updates** via `series.update()`. After
  downsampling, we can still use this for ticking data within the visible
  range.
- **Multiple panes** — TVL supports multiple panes with different y-axes.
  Each pane's series could be downsampled independently.
- **OHLC data** — Candlestick/bar charts aggregate differently than lines.
  LTTB is designed for line data. For OHLC, we'd need to bucket by time
  and take the first open, max high, min low, last close per bucket —
  essentially a rollup/aggregation, not LTTB.

### Suggested approach for TVL
1. On `init()`, check table size against thresholds.
2. If downsampling needed and series is Line/Area/Baseline:
   - Call `dh.plot.Downsample.runChartDownsample()` with plot width.
   - Subscribe to the downsampled table.
3. Listen to `timeScale().subscribeVisibleTimeRangeChange()` for zoom/pan.
4. On visible range change, re-downsample with `[min, max]` range.
5. For Candlestick/Bar, use a different strategy (time-bucketed rollup via
   DH table operations like `aggBy` or a custom aggregation).
6. Keep the original table reference for re-sampling.

### Key files to reference
- `plugins/plotly-express/src/js/src/PlotlyExpressChartModel.ts` — main model, lines 628-808 for downsampling logic
- `plugins/plotly-express/src/js/src/PlotlyExpressChartUtils.ts` — `DownsampleInfo` interface (line 254), `downsample()` function (line 283)
