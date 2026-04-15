# Downsampling v2 — Design Plan

## Problem Statement

Large tables (>30K rows) need downsampling for performance. The DH server's
`runChartDownsample(source, xCol, yCols, pixelCount, zoomRange)` returns a
live table with:
- **HEAD** rows: low-fidelity summary of data BEFORE zoomRange (4-6 rows, experimentally)
- **BODY** rows: high-fidelity WITHIN zoomRange (NOT equal to pixelCount — determined by
  internal bucket sizes; e.g. px=200 and px=50 may both produce ~1700 body rows)
- **TAIL** rows: low-fidelity summary of data AFTER zoomRange (4-6 rows)
- Head=0 when zoom starts at data start. Tail=0 when zoom ends at data end.

When `zoomRange=null`: no head/tail. Row count depends on internal bucket sizing,
NOT directly on pixelCount (e.g. 100K source with px=50 and px=200 both → 941 rows,
px=800 → 1851). First/last rows span the full source extent.

For **ticking tables**: the downsampled table grows as source ticks.
`subscribe()` + `ChartData` delivers incremental updates (added=N per tick).
The table is NOT fixed at pixelCount — it grows proportionally to source.

Lightweight-charts uses **fixed bar spacing** (uniform pixels per bar). This
means head/tail rows sit in adjacent bar slots to body rows, causing:
1. Vertical "spike" at transitions (value jumps from head→body or body→tail)
2. Distorted time axis (months compressed into one bar slot)

Plotly doesn't have this problem because it x-positions by time value.

## Solution: Companion Whitespace Series + Transition Gaps

### Two series per downsampled chart

1. **Whitespace series** (`visible: false`): Establishes the time grid by
   placing bar slots at uniform time intervals matching body density. Covers
   `[bodyStart - margin, bodyEnd + margin]`.

2. **Data series** (visible): The actual line/area with head + body + tail
   points. WhitespaceData entries inserted at head→body and body→tail
   transitions to break the line (prevent spikes).

### Why this works

- The whitespace series forces lightweight-charts to create bar slots at
  correct time intervals within the body region.
- Body data points land on matching grid slots → proper time scaling.
- Head/tail points are outside the grid, separated by whitespace gaps →
  no line connects them to body → no spike.
- Head/tail remain in the data for context (user can scroll to see them).

### Whitespace grid sizing

Grid covers `[bodyStart - 10%, bodyEnd + 10%]` at body density.
Points = chartWidth × 1.2 ≈ ~1500 points (constant regardless of zoom).

On zoom: regenerate grid for new body range and density.
On pan within body: no change.

## Architecture

### State (in TradingViewChartModel)

```
originalTable        — user's source table (never changes)
downsampledTable     — current live downsampled table from server
subscription         — active table.subscribe() on downsampledTable
chartData            — dh.plot.ChartData for delta processing
lastDownsampledRange — [from, to] as Date/DateWrapper, or null (full)
chartWidth           — from timeScale.width() (plot area pixels)
```

### Subscription model

Match plotly-express: `table.subscribe(columns)` + `ChartData` for delta
processing. NOT `setViewport()`.

```ts
const chartData = new dh.plot.ChartData(downsampledTable);
const subscription = downsampledTable.subscribe(columns);
subscription.addEventListener(dh.Table.EVENT_UPDATED, handler);
```

ChartData handles incremental updates efficiently — only new/changed rows
get translated. Stable translator function references enable caching.

### Event detection

Use lightweight-charts native subscriptions, not raw DOM events:

- **`subscribeVisibleLogicalRangeChange`** (debounced 250ms): Detect zoom
  vs pan. `to - from` = visible bar count. If bar count changes → zoom.
  If same but shifted → pan.

- **`subscribeSizeChange`**: Detect chart resize. Read `timeScale.width()`
  for new pixel count. Re-downsample.

- **`dblclick` on time axis** (y > container.height - timeScale.height()):
  Reset to full range.

### Zoom detection via logical range

```ts
timeScale.subscribeVisibleLogicalRangeChange(debounce((range) => {
  if (!range || suppressRangeEvents) return;
  const barCount = range.to - range.from;

  if (lastBarCount != null && Math.abs(barCount - lastBarCount) / lastBarCount > 0.02) {
    // ZOOM: bar count changed → re-downsample
    handleZoom();
  } else {
    // PAN: bar count same → check if outside body coverage
    handlePan();
  }
  lastBarCount = barCount;
}, 250));
```

### Flow: Initialization

1. `runChartDownsample(source, xCol, yCols, timeScale.width(), null)`
2. No head/tail (range=null). No whitespace series needed.
3. `subscribe()` + `ChartData` → data arrives → `setData` → `fitContent`
4. Subscribe to `subscribeVisibleLogicalRangeChange`
5. Subscribe to `subscribeSizeChange`

### Flow: Zoom

1. Detect via `subscribeVisibleLogicalRangeChange` (bar count changed)
2. Read time range: `timeScale.getVisibleRange()` → `{from, to}`
3. `runChartDownsample(source, xCol, yCols, timeScale.width(), [from, to])`
4. Subscribe to new table via `ChartData`
5. On data arrival:
   a. Classify rows into head/body/tail based on zoom range
   b. Generate whitespace grid for body region
   c. Build data with gap markers at transitions
   d. Save visible range: `timeScale.getVisibleRange()`
   e. `whitespaceSeries.setData(grid)`
   f. `dataSeries.setData(dataWithGaps)`
   g. Restore: `timeScale.setVisibleRange(savedRange)`
6. `suppressRangeEvents` flag prevents the restore from triggering re-zoom

### Flow: Pan

1. Detect via `subscribeVisibleLogicalRangeChange` (bar count same, shifted)
2. If within body coverage: no-op (lightweight-charts pans natively)
3. If outside body coverage: treat as zoom (re-downsample for new position)
   - Use same density (same bar count) but shifted range

### Flow: Reset (dblclick time axis)

1. `runChartDownsample(source, xCol, yCols, timeScale.width(), null)`
2. No whitespace series (range=null → no head/tail)
3. `dataSeries.setData(fullRangeData)`
4. `whitespaceSeries.setData([])` — clear grid
5. `fitContent()`

### Flow: Resize

1. Detect via `subscribeSizeChange`
2. `newWidth = timeScale.width()`
3. Re-downsample with current range at new pixel count
4. Regenerate whitespace grid
5. Update both series

### Save/restore around setData

Per lightweight-charts issue #1127: `setData()` shifts the chart regardless
of `shiftVisibleRangeOnNewBar`. Must save/restore:

```ts
suppressRangeEvents = true;
const savedRange = timeScale.getVisibleRange();
whitespaceSeries.setData(newGrid);
dataSeries.setData(newDataWithGaps);
if (savedRange) {
  timeScale.setVisibleRange(savedRange);
}
suppressRangeEvents = false;
```

### Row classification: head vs body vs tail

After receiving data from subscription, classify each row by comparing
its time value against the zoom range:

```ts
const fromSec = zoomRange[0]; // TZ-shifted seconds
const toSec = zoomRange[1];

for (const row of rows) {
  const t = row.time;
  if (t < fromSec) headRows.push(row);
  else if (t > toSec) tailRows.push(row);
  else bodyRows.push(row);
}
```

### Whitespace grid generation

```ts
function generateWhitespaceGrid(fromSec, toSec, pointCount) {
  const margin = (toSec - fromSec) * 0.1;
  const start = fromSec - margin;
  const end = toSec + margin;
  const step = (end - start) / pointCount;
  const points = [];
  for (let t = start; t <= end; t += step) {
    points.push({ time: Math.floor(t) });
  }
  return points;
}
```

### Data with gap markers

```ts
function buildDataWithGaps(head, body, tail) {
  const result = [];
  result.push(...head);
  if (head.length > 0 && body.length > 0) {
    // Whitespace between head and body — breaks the line
    const gap = Math.floor((head.at(-1).time + body[0].time) / 2);
    result.push({ time: gap });
  }
  result.push(...body);
  if (body.length > 0 && tail.length > 0) {
    // Whitespace between body and tail
    const gap = Math.floor((body.at(-1).time + tail[0].time) / 2);
    result.push({ time: gap });
  }
  result.push(...tail);
  return result;
}
```

## Experiment Results (verified 2026-04-14)

All experiments run against lightweight-charts 5.0.5 (CDN) and
deephaven-server 41.5 (local). Test files in `notes/experiments/`.

| # | Test | Result | Key Data |
|---|------|--------|----------|
| 1 | Hidden series establishes time grid | **PASS** | Chart A: 1 bar. Chart B (+hidden ws): 4 bars. |
| 2 | Whitespace breaks Line & Area | **PASS** | Visual gap confirmed in both series types. |
| 3 | Same-time collision across series | **PASS** | No errors; renders correctly. |
| 4 | getVisibleRange roundtrips time values | **PASS** | 0s difference on input/output. |
| 5 | timeScale.width() excludes price scale | **PASS** | 744px vs 800px container (56px = price scale). |
| 6 | Sequential setData + restore | **PARTIAL** | `from` shifted by 1 bar (86400s) after restore — snaps to nearest bar. |
| 7 | Logical range bar count stability | **PASS** | Pan: constant. Zoom: changes. Test index was off but behavior correct. |
| 8 | subscribeSizeChange on DH panel resize | SKIPPED | Needs full DH UI. Test during implementation. |
| 9 | runChartDownsample head/tail | **PASS** | 4-6 head + body + 4-6 tail (see table below). |
| 10 | subscribe+ChartData vs setViewport | **PASS** | Both return identical row counts (927=927). |

### Experiment 9 detail: Head/tail and row counts

**Zoomed downsample (10M source, Feb→Mar zoom, varying pixelCount):**

| pixelCount | Head | Body | Tail | Total |
|------------|------|------|------|-------|
| 50 | 6 | 1704 | 6 | 1716 |
| 200 | 6 | 1704 | 6 | 1716 |
| 800 | 6 | 2614 | 6 | 2626 |
| 1200 | 6 | 4432 | 5 | 4443 |
| 2000 | 6 | 4432 | 5 | 4443 |

NOTE: body count is NOT equal to pixelCount. Internal bucket sizes
determine the count. px=50 and px=200 produce identical 1704 body rows.
px=1200 and px=2000 also identical (same bucket size chosen).

**Null-range downsample (no head/tail, various tables):**

| Source | pixelCount | Rows |
|--------|------------|------|
| 100K | 50 | 941 |
| 100K | 200 | 941 |
| 100K | 800 | 1851 |
| 1M | 200 | 1228 |
| 10M | 200 | 1805 |
| 10M | 1200 | 6819 |

Confirmed: null-range spans full source extent. No head/tail rows.

**Ticking table:**
- Full-range downsample compressed 1632→912 rows (55.9%).
- subscribe+ChartData delivers incremental updates: added=10 per tick.
- Downsampled table GROWS as source ticks (not capped at pixelCount).

### Experiment 6 detail: setVisibleRange snap

Saved: `{from: 1704067200, to: 1704240000}`.
After setData+restore: `{from: 1704153600, to: 1704240000}`.
`from` shifted right by 86400s (1 day/bar). setVisibleRange snaps to
nearest bar in the NEW data. Minor imprecision we accept.

### Key implications for design

1. pixelCount is a HINT, not exact. Body can be 4-40x larger. Don't
   assume row count = pixelCount.
2. Head/tail are always small (4-6 rows). Whitespace gap approach works.
3. Ticking tables grow the downsampled table. Must handle incremental
   appends via ChartData, not just full-replace.
4. setVisibleRange snaps to nearest bar — ~1 bar imprecision on restore.

## Changes from Current Implementation

| Current (v1) | New (v2) |
|---------------|----------|
| `setViewport(0, 1e9)` | `table.subscribe(columns)` + `ChartData` |
| Raw DOM events (mousedown/up/wheel) | `subscribeVisibleLogicalRangeChange` |
| `ResizeObserver` + `setChartWidth()` | `subscribeSizeChange` + `timeScale.width()` |
| Duration comparison for zoom detection | Bar count comparison (integer, stable) |
| ISO string range tracking | Time values from getVisibleRange() |
| `applyFilter` to strip head/tail | Whitespace gaps + companion grid series |
| Complex in-flight/pending state machine | Simple suppress flag around setData |
| `handleViewportUpdate` + `handleTableUpdate` | Single subscription handler via ChartData |
| `preserveVisibleRange` flag threading | Explicit save/restore with suppress |

## Files to Modify

| File | Changes |
|------|---------|
| `TradingViewChartModel.ts` | Replace subscription model, event handling, downsample flow |
| `TradingViewChart.tsx` | Remove DOM event listeners, ResizeObserver downsample trigger; add dblclick handler |
| `TradingViewChartRenderer.ts` | Add whitespace series management |
| `TradingViewUtils.ts` | Add `buildDataWithGaps`, `generateWhitespaceGrid`, row classification |
| `TradingViewTypes.ts` | Update event types, remove viewport-specific fields |
