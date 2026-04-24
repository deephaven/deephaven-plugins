# Whitespace API for Downsample Edge Accuracy

## Problem Statement

When downsampled data is displayed, the time values of the selected points are
their **original** timestamps. Because the downsampler selects a sparse subset
(e.g., 1000 points from 10M), adjacent bars may represent timestamps hours or
days apart. LWC renders each bar at equal pixel spacing by default — each data
point occupies one "bar slot" regardless of the time gap between it and its
neighbors.

This creates a visual distortion at the **edges** of the zoomed foreground
region. At the transition between background (~1000 pts, low-fi) and foreground
(~5000 pts, high-fi), the point density changes sharply. Background points might
be 8 hours apart, while foreground points might be 90 seconds apart. Because LWC
treats them all equally, the background zone looks compressed on the x-axis
(points too close together) and the foreground zone looks stretched (points too
far apart), relative to their true time spacing.

In a non-downsampled chart, each point has a consistent time interval (e.g., one
point per second), so bar spacing and time spacing are proportional. The
downsample breaks this proportionality.

## LWC Whitespace API

### WhitespaceData Type

```typescript
interface WhitespaceData<HorzScaleItem = Time> {
    time: HorzScaleItem;
    customValues?: Record<string, unknown>;
}
```

A `WhitespaceData` entry is a data point with a `time` but **no value**. It
occupies a slot on the time axis without rendering any visible mark.

### How It Works

1. **Mixed data**: `setData()` accepts arrays where entries can be either real
   data (`LineData`, `CandlestickData`, etc.) or `WhitespaceData`. The type
   union is built into the `SeriesDataItemTypeMap`:
   ```typescript
   Line: LineData | WhitespaceData;
   Area: AreaData | WhitespaceData;
   Candlestick: CandlestickData | WhitespaceData;
   // etc.
   ```

2. **Time axis effect**: Each whitespace entry creates a bar slot at that time.
   The time scale distributes bar slots evenly. So if you have:
   ```
   [t=100 value=10], [t=200], [t=300], [t=400 value=50]
   ```
   The chart draws 4 equally-spaced bar slots. The line connects t=100 to t=400,
   but the x-axis correctly shows 4 ticks and the endpoints are separated by
   3 bar widths, not 1.

3. **Visual gaps**: Whitespace entries create gaps in line/area series — the line
   is broken where whitespace entries appear between real data points. This is
   important for our use case.

4. **Multiple series**: Whitespace entries in one series don't affect other
   series. The time axis is the union of all series' time points.

### Related Options

| Option | Default | Effect |
|--------|---------|--------|
| `ignoreWhitespaceIndices` | `false` | When `true`, whitespace-only time slots don't get grid lines, tick marks, or crosshair snapping |
| `allowShiftVisibleRangeOnWhitespaceReplacement` | `false` | When `true`, replacing a whitespace point with real data shifts the view |

### Verified Behavior (from lwc-experiments.html)

The existing experiments in `notes/experiments/lwc-experiments.html` confirmed:

- **Experiment 1**: A hidden series with whitespace entries establishes the time
  grid — the chart shows more bar slots even though the visible data only has 2 points.
- **Experiment 2**: Whitespace entries break lines in Line and Area series.
- **Experiment 3**: Same-time points across a whitespace series and data series
  don't conflict.
- **Experiment 6**: Sequential `setData()` on two series + `setVisibleRange()`
  restore works without errors.


## Approach Analysis

### Approach A: Inject Whitespace Points into Data Array

**Concept**: Before calling `series.setData()`, scan adjacent data points for
time gaps that exceed some threshold (e.g., 2x the local median interval).
Insert `WhitespaceData` entries at regular intervals within those gaps to
"stretch" the x-axis proportionally.

**Implementation sketch** (in `transformTableData` or a new post-processing step):

```typescript
function injectWhitespace(
    data: Record<string, unknown>[],
    maxPointsBudget: number = 500
): Record<string, unknown>[] {
    if (data.length < 3) return data;

    // Compute the median interval between consecutive points
    const intervals: number[] = [];
    for (let i = 1; i < data.length; i++) {
        intervals.push((data[i].time as number) - (data[i - 1].time as number));
    }
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    if (medianInterval <= 0) return data;

    // Threshold: gaps larger than this get whitespace fill
    const threshold = medianInterval * 3;

    // First pass: count how many whitespace points we'd need
    let totalNeeded = 0;
    const gaps: Array<{ index: number; count: number }> = [];
    for (let i = 1; i < data.length; i++) {
        const gap = (data[i].time as number) - (data[i - 1].time as number);
        if (gap > threshold) {
            const count = Math.round(gap / medianInterval) - 1;
            gaps.push({ index: i, count });
            totalNeeded += count;
        }
    }

    if (totalNeeded === 0) return data;

    // Scale down if we'd exceed the budget
    const scale = totalNeeded > maxPointsBudget
        ? maxPointsBudget / totalNeeded
        : 1;

    // Second pass: build result with whitespace injected
    const result: Record<string, unknown>[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
        const gapInfo = gaps.find(g => g.index === i);
        if (gapInfo) {
            const actualCount = Math.max(1, Math.round(gapInfo.count * scale));
            const startTime = data[i - 1].time as number;
            const endTime = data[i].time as number;
            const step = (endTime - startTime) / (actualCount + 1);
            for (let j = 1; j <= actualCount; j++) {
                result.push({ time: Math.floor(startTime + step * j) });
            }
        }
        result.push(data[i]);
    }
    return result;
}
```

**Pros**:
- Pure client-side, no server changes
- Data points keep their exact original timestamps
- x-axis spacing becomes proportional to real time
- Works with all series types
- `ignoreWhitespaceIndices: true` can hide whitespace ticks from axis

**Cons**:
- **Line breaks**: Whitespace entries break line/area series at every gap. The
  visual line would be discontinuous at the bg/fg boundary. This is a major
  problem for Line and Area charts. *(See mitigation below.)*
- **Point budget**: With 1000 background + 5000 foreground points, we have room
  for ~500-1000 whitespace points before hitting rendering performance concerns.
  But the number of whitespace points needed depends on the gap size — a
  bg→fg transition spanning hours needs many whitespace entries to fill
  proportionally.
- **deduplicateByTime**: Must run before whitespace injection (or whitespace
  times must be unique/not collide with real data times).
- **Candlestick/Bar**: Whitespace doesn't cause line breaks in these types,
  but the visual gap (empty slot) may look odd.

#### Mitigation for Line Breaks

**Option A1: Hidden "anchor" series**

Use a second invisible series to establish the time grid. This series contains
only whitespace entries (or whitespace + tiny sentinel values). The real data
series stays unmodified and draws continuous lines. The hidden series stretches
the time axis.

```typescript
// Hidden series with whitespace entries to establish time grid
hiddenSeries.setData(whitespaceEntries);
// Real data series — continuous line, no breaks
dataSeries.setData(realData);
```

The hidden series establishes bar slots at the whitespace times, which stretches
the time axis, but the real data series only has values at the real data times
and draws a continuous line between them.

**Caveat**: This works because LWC's time axis is the union of all series' time
points. But the real data series will have its real data points spaced across
those bar slots. Between two real data points, there may be many empty bar slots
(from the hidden series) — the line will visually span those slots, which is
exactly what we want (the line stretches across the time gap, proportional to
real time).

**This is the most promising approach** because:
1. No line breaks in visible series
2. x-axis reflects true time proportions
3. All the "stretching" comes from the invisible series
4. `ignoreWhitespaceIndices: true` keeps the axis clean

**Option A2: Fill whitespace with duplicated values**

Instead of pure `WhitespaceData`, fill gaps with entries that repeat the nearest
real value. This avoids line breaks but creates flat segments in the line where
there's actually no data, which is misleading.

**Verdict: Not recommended** — visually dishonest.


### Approach B: Use Real Timestamps Instead of Sequential Bar Slots

**Concept**: LWC already supports `UTCTimestamp` (epoch seconds) as the time
type. Our data already uses real timestamps. The "compression" happens because
LWC's default rendering assigns equal bar spacing regardless of time gaps. But
LWC *does* have an alternate mode when using `BusinessDay` or sequential time
that can be overridden.

Actually, looking more carefully: LWC with `UTCTimestamp` values **already
spaces bars based on time**. If you give it times 100, 200, 300, it puts them at
equal spacing because they ARE equally spaced. If you give it 100, 200, 10000,
it puts bars 1-2 close together and bar 3 far away.

Wait — this contradicts the observed behavior. Let me reconsider.

**Key insight**: LWC uses a "logical index" internally. Each data point gets a
sequential logical index (0, 1, 2, ...). The bar spacing is applied uniformly
per logical index, NOT per time difference. The time values only affect axis
label formatting, `getVisibleRange()` results, and `setVisibleRange()` targeting.

So `{time: 100, value: 10}, {time: 200, value: 20}, {time: 10000, value: 30}`
renders as 3 equally-spaced bars at logical indices 0, 1, 2 — even though
the time gap between bars 2 and 3 is 50x larger than between 1 and 2.

**This is the fundamental reason the edges look compressed.** There is no
built-in way to tell LWC "this bar slot should be wider than that one."
Whitespace is the only mechanism to add extra slots.


### Approach C: Server-Side Gap Fill

**Concept**: The server's `_downsample()` method (or a new post-processing step)
inserts placeholder rows at regular intervals within time gaps. These rows would
have `NULL` values for data columns. The client would then need to convert
NULL-value rows into `WhitespaceData` entries.

**Pros**:
- Accurate time proportions computed on the server with full data knowledge
- Server can calculate optimal whitespace density based on source data statistics

**Cons**:
- Increases table size and network transfer
- Requires schema changes (NULL-able value columns)
- More complex server logic
- Client still needs to handle the whitespace conversion

**Verdict**: Server-side seems like overkill for what's fundamentally a rendering
concern. Client-side injection is simpler and more flexible.


## Recommended Approach: Hidden Anchor Series (A1)

### Architecture

```
Server sends downsampled table (real data only, no changes)
          ↓
Client receives table via handleDataUpdate()
          ↓
transformTableData() produces [{time, value}, ...]
          ↓
New step: computeWhitespaceGrid(data, fullRange, pointBudget)
  → produces [{time}, {time}, ...] for the hidden anchor series
          ↓
hiddenAnchorSeries.setData(whitespaceGrid)
dataSeries.setData(realData)  // unchanged, continuous line
          ↓
setVisibleRange() or fitContent()
```

### Algorithm: computeWhitespaceGrid

The goal is to produce a time grid that makes bar spacing proportional to real
time. The algorithm:

1. **Determine the base interval**: Look at the foreground region (densest area).
   Take the median interval between consecutive foreground points. This becomes
   the "base interval" — one bar slot = one base interval of real time.

2. **Budget**: Allow ~500-1000 whitespace points total (on top of the ~6000 data
   points). This keeps total bar count under ~7000.

3. **Scan for large gaps**: Walk through the sorted data and identify gaps
   between consecutive points that are > 2x the base interval.

4. **Fill gaps**: For each large gap, insert `ceil(gapDuration / baseInterval) - 1`
   whitespace entries, evenly spaced. Cap per-gap insertions if needed to stay
   within budget.

5. **Time dedup**: Ensure no whitespace time collides with a real data time
   (offset by ±1 second if needed).

### Example

Data (after downsample): 6 points with a bg/fg density change
```
[t=0, t=3600, t=7200, t=7290, t=7380, t=7470]
 |----bg----|  |-------fg--------|
 1hr gaps       90sec gaps
```

Base interval: 90 seconds (from the foreground median)

Gap from t=0 to t=3600: 3600/90 = 40 bar slots needed, 39 whitespace entries
Gap from t=3600 to t=7200: same, 39 whitespace entries

With budget of 500: 78 whitespace points easily fits.

Result: 6 real data + 78 whitespace = 84 total bar slots. The background region
(0-7200) occupies 80 bar slots, while the foreground region (7200-7470) occupies
4 bar slots. The x-axis now correctly shows that the background span is 20x
longer than the foreground span.

### Interaction with setVisibleRange

Currently, `handleDataUpdate()` calls `setVisibleRange({from, to})` using
TZ-shifted epoch seconds. With the hidden anchor series expanding the time grid,
`setVisibleRange()` still targets the correct time range — LWC will zoom to show
those timestamps, and the proportional spacing comes naturally from the
whitespace grid.

### Interaction with processRangeChange

The `processRangeChange()` function reads `getVisibleRange()` which returns
real timestamps, then computes `durChange` and `centerShift`. These calculations
are unaffected by whitespace because they operate on time values, not bar counts.

### When NOT to Add Whitespace

- **Initial load / reset view** (`fitContent()`): All 1000 background points
  are roughly evenly spaced across the full range. No gaps to fill. Skip.
- **Small tables** (not downsampled): Points already have consistent intervals.
- **Candlestick/Bar series**: Debatable. Equal-width bars with time gaps might
  look acceptable. Whitespace would create visible empty bar slots.

### Performance

Adding 500-1000 whitespace entries to a 6000-point dataset is negligible:
- `setData()` on 7000 entries: ~1-2ms
- Extra memory: trivial (each entry is just `{time: number}`)
- No extra rendering cost — whitespace entries are invisible


## Edge Cases and Concerns

### 1. Bi-modal Density
The hybrid merge produces a sharp transition from ~1000 pts/full-range to
~5000 pts/zoom-range. The whitespace algorithm must handle this gracefully.

**Approach**: Use the foreground median interval as the base. Background gaps
will get many whitespace entries (correctly expanding them to their true time
width). The foreground region, already dense, gets few or no whitespace entries.

### 2. Multiple fg/bg Transitions
The merged table has the structure:
```
[bg outside left] [fg region] [bg outside right]
```
There are two transition points. Each may have a large gap. Both need whitespace
fill.

### 3. Time Collision
If a whitespace entry has the exact same time as a real data point, LWC may
behave unpredictably. The injection algorithm must ensure unique times.

### 4. fitContent Behavior
After `setData()` + whitespace, `fitContent()` will show all bar slots including
whitespace. Since we want proportional spacing on fitContent, this is correct
behavior. But the chart may look "zoomed out" compared to before (because the
background region is now visually wider). This is actually more accurate.

### 5. Ticking Updates
For streaming data, we currently use `series.update()` for append-only updates.
The hidden anchor series would need its whitespace grid recomputed only when
the data changes significantly (downsample response), not on every tick. Since
whitespace injection only happens during downsample data replacement (full
`setData()`), ticking is unaffected.

### 6. "by" (partition) Charts
Multi-series "by" charts share a single time axis. The anchor series approach
works naturally — one hidden anchor series establishes the grid for all visible
series.

### 7. Series Type Limitations
- **Line, Area, Baseline**: Work perfectly with hidden anchor approach (no breaks)
- **Histogram**: Whitespace creates empty bar slots between histogram bars — may
  look odd but is time-proportional
- **Candlestick, Bar**: Not currently downsample-eligible (only Line/Area/Baseline
  are in `DOWNSAMPLE_ELIGIBLE_TYPES`), so this concern is moot


## Alternative: Conflation API

LWC v5.1 added a conflation feature:

```typescript
timeScale: {
    enableConflation: true,
    conflationThresholdFactor: 1.0,
}
```

Conflation **combines** points when spacing < 0.5px. This is the opposite
direction — it handles too-dense data, not too-sparse data. It won't help
with edge proportionality. We already set `minBarSpacing: 0.01` which achieves
a similar effect at the rendering level.


## Implementation Complexity Estimate

### Minimal Viable Implementation
1. **New utility function** `computeWhitespaceGrid()` in `TradingViewUtils.ts` (~50 lines)
2. **Hidden anchor series** creation in `TradingViewChartRenderer.ts` (~15 lines)
3. **Inject whitespace** in `handleDataUpdate()` in `TradingViewChart.tsx` (~20 lines)
4. **Skip for non-downsampled / initial / reset** (~5 lines of conditions)

Total: ~90 lines of new code, no server changes, no protocol changes.

### Key Decision Points for Implementation
1. **Budget**: How many whitespace points to allow? 500 is conservative; 1000 is
   generous. Should be configurable or auto-calculated.
2. **Base interval**: Median vs mean vs min of foreground intervals?
3. **Gap threshold**: 2x median? 3x? Should be tuned visually.
4. **When to apply**: Only on ZOOM responses? Or also on initial load?
5. **Per-series vs shared anchor**: One hidden anchor series, or one per visible
   series? One shared anchor is simpler and ensures consistent time grid.


## Conclusion

The **hidden anchor series** approach (A1) is the cleanest path to proportional
x-axis spacing for downsampled data. It requires no server changes, no protocol
changes, and ~90 lines of client-side code. The key mechanism:

- A single invisible `LineSeries` with `visible: false` establishes the time grid
- It contains `WhitespaceData` entries spaced at the foreground's native interval
- This stretches background-region bar slots proportionally to their real time span
- Real data series are unmodified — continuous lines, no breaks
- `ignoreWhitespaceIndices: true` keeps the axis clean

The main risk is that the total bar count (~7000 with whitespace) might affect
rendering performance, but given LWC handles 100K+ bars fine with conflation,
7000 is well within budget.
