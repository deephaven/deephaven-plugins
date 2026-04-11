# Plan: Auto-Downsampling for TVL Charts

## Goal

When a user passes a large table (>30K rows) to a TVL line/area chart, the
plugin should automatically downsample to ~1 point per pixel using the
server-side LTTB algorithm. When the user zooms or pans, the chart should
re-downsample for the visible range, giving more detail where the user is
looking. The user should not need to do anything — it just works.

## Design

### Data flow (new)

```
User table (10M rows)
      |
  [JS Model] init() — check table.size
      |
      v  size > 30K and series is Line/Area/Baseline?
  [Java] dh.plot.Downsample.runChartDownsample(table, xCol, yCols, width, null)
      |
      v
  Downsampled table (~chartWidth rows) — live/ticking, maintained by server
      |
  [JS Model] subscribe to downsampled table, render normally
      |
      v  user zooms/pans
  [JS] chart.timeScale().subscribeVisibleTimeRangeChange(handler)
      |  handler extracts [min, max] of visible range
      |
  [Java] dh.plot.Downsample.runChartDownsample(table, xCol, yCols, width, [min, max])
      |
      v
  New downsampled table — more detail in visible range
      |
  [JS Model] tear down old subscription, subscribe to new table
```

### Eligibility rules

A series can be downsampled when ALL of:
1. Table size > `AUTO_DOWNSAMPLE_SIZE` (30,000 rows)
2. Series type is `Line`, `Area`, or `Baseline` (single-value y)
3. Chart type is `standard` (not yieldCurve or options — those use
   non-time x-axes)
4. The x-axis column is a DH Instant or long (required by LTTB API)

Series that CANNOT be downsampled:
- `Candlestick`, `Bar` — OHLC has 4 y-values per point; LTTB is
  single-value. (Future: could use time-bucketed rollups, but out of scope
  for v1.)
- `Histogram` — often used for volume with specific bucket semantics.
- Charts with `by` parameter — each partition table is typically small
  (the full table was split), so unlikely to need downsampling.

### What changes, file by file

#### `TradingViewChartModel.ts` — core changes

**New fields:**
```typescript
private downsampleMap: Map<number, DownsampleInfo> = new Map();
// Stores original table + downsample params per tableId, for re-sampling.

private chartWidth: number = 0;
// Current chart plot-area width in pixels.

private visibleRangeCleanup: (() => void) | null = null;
// Cleanup for timeScale visible range listener.
```

**New type (in TradingViewTypes.ts):**
```typescript
interface DownsampleInfo {
  originalTable: DhType.Table;
  xCol: string;
  yCols: string[];
  width: number;
  range: [number, number] | null;  // epoch millis or null for autorange
}
```

**Modified: `init()`**
After fetching each table, before subscribing:
1. Check `table.size > AUTO_DOWNSAMPLE_SIZE`
2. Check if the series using this table is eligible (Line/Area/Baseline)
3. If eligible: call `dh.plot.Downsample.runChartDownsample()`, store
   original in `downsampleMap`, subscribe to the downsampled table instead
4. If not eligible but table is huge: log a warning (don't block rendering)

**New: `downsampleTable(tableId, table, seriesConfig)`**
```typescript
private async downsampleTable(
  tableId: number,
  table: DhType.Table,
  xCol: string,
  yCols: string[]
): Promise<DhType.Table> {
  const info: DownsampleInfo = {
    originalTable: table,
    xCol,
    yCols,
    width: this.chartWidth || 800,  // fallback before first resize
    range: null,
  };
  this.downsampleMap.set(tableId, info);
  return this.dh.plot.Downsample.runChartDownsample(
    table, xCol, yCols, info.width, null
  );
}
```

**New: `updateDownsample(tableId, newRange, newWidth)`**
Called when visible range or chart width changes:
1. Compare new range/width against stored `DownsampleInfo`
2. If same → skip
3. If different → cleanup old subscription, call `runChartDownsample` with
   new params, subscribe to result

**New: `setChartWidth(width)` / `setVisibleRange(range)`**
Called from the React component. Triggers `updateDownsample()` for all
entries in `downsampleMap`.

#### `TradingViewChart.tsx` — wire up events

**On renderer creation:**
After the `TradingViewChartRenderer` is created, attach a visible time
range listener:

```typescript
const timeScale = renderer.getChart().timeScale();
const handleVisibleRangeChange = (range: TimeRange | null) => {
  if (!range) return;
  // range.from and range.to are Time values (UTC seconds for standard charts)
  // Convert to epoch millis for the Downsample API
  const min = (range.from as number) * 1000;
  const max = (range.to as number) * 1000;
  model.setVisibleRange([min, max]);
};
timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
// Store cleanup for useEffect teardown
```

**On ResizeObserver callback:**
In addition to calling `renderer.resize()`, also call
`model.setChartWidth(width)` so the model knows the plot width for
downsampling.

**Debounce:** Both visible range and resize callbacks should be debounced
(~200ms) to avoid hammering the server during smooth pan/drag.

#### `TradingViewChartRenderer.ts` — expose chart API

Add a method to get the chart width (minus any internal padding):
```typescript
getPlotWidth(): number {
  // lightweight-charts manages its own margins internally
  // The chart container width is a good approximation
  return this.container.clientWidth;
}
```

#### `TradingViewTypes.ts` — new interfaces

```typescript
interface DownsampleInfo {
  originalTable: unknown;  // DhType.Table
  xCol: string;
  yCols: string[];
  width: number;
  range: [number, number] | null;
}
```

### What does NOT change

- **Python side**: No changes. The Python API, serialization, and
  communication layer are unaffected. Downsampling is purely a JS-side
  decision calling a Java API.
- **Renderer**: Series creation, data setting, markers, price lines — all
  unchanged. The renderer receives the same shaped data, just fewer points.
- **Non-eligible charts**: Candlestick, bar, histogram, yield curve, options
  charts continue to fetch full data as today.

## Implementation Steps

### Step 1: Core downsampling in model

Modify `TradingViewChartModel.ts`:
- Add `downsampleMap`, `chartWidth` fields
- Add `isDownsampleEligible(seriesConfig)` helper
- Modify `init()` to check table size and downsample if eligible
- Add `downsampleTable()` method
- Add `setChartWidth()` / `setVisibleRange()` methods
- Add `updateDownsample()` that compares old/new params and re-samples

### Step 2: Wire up visible range events

Modify `TradingViewChart.tsx`:
- After renderer creation, subscribe to `timeScale().subscribeVisibleTimeRangeChange()`
- On range change, call `model.setVisibleRange([min, max])`
- On resize, call `model.setChartWidth(width)`
- Add debounce (~200ms) to both callbacks
- Clean up listeners on unmount

### Step 3: Test fixture — 10M rows over 10 years

Add to `tests/app.d/tradingview_lightweight.py`:
```python
# 10M rows: ~2,740 rows per day over 10 years
# Simulates high-frequency trading data
_big_start = to_j_instant("2014-01-01T00:00:00 ET")
big_table = empty_table(10_000_000).update(
    [
        "Timestamp = _big_start + (ii * 31_536_000_000_000_000L / 10_000_000)",  # spread over 10 years in nanos
        "Price = 100 + Math.sin(ii * 0.0001) * 50 + (ii * 0.000005)",  # trending sine wave
    ]
)

tvl_big_line = tvl.line(
    big_table,
    time="Timestamp",
    value="Price",
)
```

### Step 4: Verification test (Playwright)

Add to `tests/tradingview_lightweight.spec.ts`:

```typescript
test.describe('TradingView Lightweight - Downsampling', () => {
  test('10M row line chart loads with downsampling', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_line');

    // Chart should render (not hang or crash)
    await expect(tvlChart(page)).toBeVisible();
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});
```

### Step 5: Manual verification with agent-browser

This is the critical test. After the server is running:

```bash
# Open tvl_big_line
agent-browser keyboard type "my_big = tvl_big_line"
agent-browser press Escape && agent-browser press Enter
agent-browser wait 8000
agent-browser screenshot notes/tmp/downsample_initial.png
```

**Verify initial render:**
- Chart should load in <5 seconds (10M raw rows would take minutes)
- Visual: smooth line spanning 10 years

**Verify data point count:**
Use JS eval to check how many data points are actually in the series:
```bash
agent-browser eval "
  var charts = document.querySelectorAll('.dh-tvl-chart canvas');
  // Can't inspect series data directly from DOM, but we can check
  // the model's tableDataMap size via a debug hook
"
```

Better approach — add a temporary debug accessor to the model during
development:
```typescript
// In TradingViewChartModel, temporarily:
getDebugInfo(): { tableId: number, rowCount: number, isDownsampled: boolean }[] {
  return Array.from(this.tables.entries()).map(([id, table]) => ({
    tableId: id,
    rowCount: table.size,
    isDownsampled: this.downsampleMap.has(id),
  }));
}
```

Expose it on the window during dev to verify from agent-browser:
```bash
agent-browser eval "JSON.stringify(window.__tvlDebug?.getDebugInfo())"
# Expected: [{ tableId: 0, rowCount: ~1200, isDownsampled: true }]
# (1200 ≈ chart width in pixels)
```

**Verify zoom re-samples:**
```bash
# Zoom to a 1-month range via the timeScale API
agent-browser eval "
  var chart = document.querySelector('.dh-tvl-chart').__chart;
  // Or use the TVL API if we expose it
"
```

Alternative: use Plotly-style approach — scroll/zoom via mouse events:
```bash
# Scroll to zoom in
agent-browser scroll down 500 --selector ".dh-tvl-chart"
agent-browser wait 2000
agent-browser screenshot notes/tmp/downsample_zoomed.png
```

Then check debug info again — `rowCount` should still be ~chartWidth, but
the range in `DownsampleInfo` should have changed.

**Verify pan re-samples:**
```bash
# Click and drag to pan
agent-browser mouse move 500 400  # center of chart
agent-browser mouse down
agent-browser mouse move 200 400  # drag left
agent-browser mouse up
agent-browser wait 2000
agent-browser screenshot notes/tmp/downsample_panned.png
```

### Step 6: Unit tests

In `src/js/src/__tests__/`:

```typescript
describe('downsampling', () => {
  it('should downsample tables larger than AUTO_DOWNSAMPLE_SIZE', () => {
    // Mock table with size > 30K
    // Verify runChartDownsample was called
    // Verify the downsampled table is subscribed, not the original
  });

  it('should not downsample tables smaller than AUTO_DOWNSAMPLE_SIZE', () => {
    // Mock table with size < 30K
    // Verify runChartDownsample was NOT called
    // Verify original table is subscribed
  });

  it('should not downsample Candlestick series', () => {
    // Even if table is large, OHLC series should use original table
  });

  it('should re-downsample when visible range changes', () => {
    // Call setVisibleRange with new range
    // Verify runChartDownsample called again with new range
    // Verify old subscription cleaned up
  });

  it('should skip re-downsample when range is unchanged', () => {
    // Call setVisibleRange with same range
    // Verify runChartDownsample NOT called again
  });

  it('should re-downsample when chart width changes', () => {
    // Call setChartWidth with new width
    // Verify runChartDownsample called with new width
  });
});
```

## Verification Checklist

For the 10M row test case:

- [ ] Chart loads in <5 seconds (vs minutes without downsampling)
- [ ] Initial render shows a smooth line spanning 2014-2024
- [ ] Downsampled table has ~chartWidth rows (check via debug accessor)
- [ ] `downsampleMap` has an entry for the table (isDownsampled = true)
- [ ] Zooming in triggers re-downsample with narrower [min, max] range
- [ ] After zoom, data points are still ~chartWidth (not more or fewer)
- [ ] Panning triggers re-downsample with shifted range
- [ ] Zooming out to full range returns to range=null (autorange)
- [ ] Small tables (<30K rows) are NOT downsampled
- [ ] Candlestick charts are NOT downsampled (even if large)
- [ ] Ticking data on the downsampled table still updates the chart

## Open Questions

1. **Debounce timing:** 200ms is a guess. Too short = too many server calls
   during smooth drag. Too long = noticeable lag. May need tuning. Plotly
   avoids this by only re-sampling on `setDimensions()` (which fires less
   frequently than continuous drag events).

2. **OHLC downsampling (future):** For candlestick/bar with millions of
   rows, we'd need time-bucketed rollups via `table.aggBy()` — group by
   time bucket, aggregate Open=first, High=max, Low=min, Close=last,
   Volume=sum. This is a separate feature.

3. **`by` + downsampling:** If a partitioned table has large constituent
   tables, each could independently be downsampled. The current design
   supports this since each partition table gets its own tableId and could
   have its own `DownsampleInfo`. Low priority since partition constituents
   are usually small.

4. **Error handling:** If `runChartDownsample` fails (e.g., column type
   not supported), should we fall back to full fetch (with a size warning)
   or show an error? Plotly shows a confirmation dialog. For TVL v1, falling
   back to full fetch with a console warning seems reasonable.

## Key Files to Modify

| File | Changes |
|---|---|
| `src/js/src/TradingViewChartModel.ts` | Downsampling logic, re-sample on range change |
| `src/js/src/TradingViewChart.tsx` | Wire up visible range listener, debounce, pass width |
| `src/js/src/TradingViewTypes.ts` | `DownsampleInfo` interface |
| `src/js/src/TradingViewChartRenderer.ts` | `getPlotWidth()` accessor |
| `tests/app.d/tradingview_lightweight.py` | 10M row test fixture |
| `tests/tradingview_lightweight.spec.ts` | Playwright test for downsampled chart |
| `src/js/src/__tests__/TradingViewChartModel.test.ts` | Unit tests for downsampling |
