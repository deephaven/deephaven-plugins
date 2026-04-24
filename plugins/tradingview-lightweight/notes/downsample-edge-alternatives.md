# Alternatives for Downsample Edge Spacing

## The Problem (recap)

The hybrid merge produces a table sorted by time:

```
[bg sparse]  [fg dense]  [bg sparse]
 1hr gaps     90sec gaps   1hr gaps
```

LWC assigns one logical index per row, uniform pixel spacing. So a background
point representing 1 hour gets the same bar width as a foreground point
representing 90 seconds. At the bg→fg transition, the data visually "compresses"
on the x-axis.

## Confirmed: LWC Bar Spacing is Architecturally Uniform

The core pixel mapping (from LWC source):
```javascript
coordinate = width - (deltaFromRight + 0.5) * barSpacing - 1
```

`timeWeight` only affects tick mark labels, not positioning. `IHorzScaleBehavior`
controls formatting/keying, not spacing. There is no hook to make bar N wider
than bar N+1. Whitespace injection (adding empty bar slots) is the **only** LWC
mechanism for proportional spacing.

---

## Alternative Ideas

### 1. Graduated Density Transition (Server-Side)

**Concept**: Instead of a sharp bg/fg boundary, create a density gradient. The
server would compute intermediate zoom levels between background and foreground,
producing a smooth ramp in point density.

**How it works**:
```
[bg: 1000pts]  [transition: variable]  [fg: 5000pts]  [transition: variable]  [bg: 1000pts]
 full range     ramp up density          zoom range       ramp down                full range
```

The transition zone would use progressively smaller bins as you approach the
foreground. E.g., for a range [0, 100h] with foreground at [40h, 60h]:
- bg bins: ~6min each (1000 pts / 100h)
- transition [35h-40h]: bins gradually shrink from 6min → 90sec
- fg bins: ~90sec each (5000 pts / 20h)
- reverse transition [60h-65h]

**Implementation**: In `compute_hybrid()`, instead of a single fg downsample
+ raw bg filter, compute 3-5 intermediate downsample zones with different
`num_bins`:

```python
zones = [
    (bg_start, fg_start - buffer, 200),  # near-bg transition
    (fg_start - buffer, fg_start, 500),  # ramp-up
    (fg_start, fg_end, FOREGROUND_POINTS),  # high-fi
    (fg_end, fg_end + buffer, 500),  # ramp-down
    (fg_end + buffer, bg_end, 200),  # near-bg transition
]
for (z_from, z_to, z_bins) in zones:
    table, ints = self._downsample(z_bins, z_from, z_to)
```

**Pros**:
- No client changes
- No whitespace needed
- Smooth visual transition
- Points are still real original rows

**Cons**:
- More complex server logic (multiple downsample passes)
- Total point count increases (bg 1000 + transitions ~1400 + fg 5000 = ~7400)
- Multiple `_downsample()` calls = more intermediate tables, more DH ops
- The transition zones still have density jumps (just smaller ones)
- Diminishing returns: 3-zone vs 5-zone vs continuous gradient

**Verdict**: Worth considering. Moderate complexity for a meaningful improvement.
The visual improvement would be noticeable but not perfect — there'd still be
density steps, just smaller ones. Could be combined with other approaches.


### 2. Foreground-Only When Zoomed

**Concept**: When the user zooms in, only show the foreground data. Don't merge
with background at all. The chart shows high-fi data for the visible range and
nothing outside it.

**How it works**:
- Initial load: background only (full range, 1000 pts) — no edge problem
- On zoom: server sends only foreground (5000 pts for visible range + buffer)
- Chart calls `setVisibleRange()` to show just the foreground
- User sees uniform density everywhere (all foreground)
- Panning past the data edge shows... empty space

**Why we moved away from this**: The original v1 approach was foreground-only,
and the problem was empty space when panning past the visible data edge. The
hybrid merge was designed to solve exactly this.

**But**: Now that we have `fixLeftEdge: true, fixRightEdge: true`, the user
**can't** pan past the data edges. So the empty-space problem doesn't occur.
The user would just hit the edge and stop.

Wait — that's not quite right. `fixLeftEdge/fixRightEdge` prevents scrolling
past the first/last data point. If we only send foreground data, the "first data
point" is the start of the foreground range, not the start of the full dataset.
The user wouldn't be able to pan to see the rest of the data — they'd be trapped
in the foreground window.

**Modified version**: Send foreground-only, but set `fixLeftEdge: false`. When
the user pans to the edge, detect it and send a new ZOOM for the panned range.
This is essentially "lazy loading" — the server sends data on demand as the user
pans.

**Pros**:
- Uniform density always (no edge problem)
- Simpler server logic (no merge)
- Fewer total points sent

**Cons**:
- User can't see the global context (the sparse background)
- Panning feels "laggy" — every pan past the buffer triggers a server round-trip
- Double-click to reset needs to show full range, which means reverting to
  background (which has different density)
- This was the v1 approach that had problems

**Verdict**: Not recommended as the primary approach. The hybrid merge was a
deliberate upgrade from this.


### 3. Uniform Time Grid (Snap to Grid)

**Concept**: Instead of keeping original timestamps, snap all downsampled points
to a uniform time grid. The grid spacing equals `totalDuration / numPoints`.
Each point is assigned the center time of its bin rather than its original time.

**How it works**: After the hybrid merge, post-process on the server:
```text
grid_interval = (range_max - range_min) / merged_table.size
for each row i:
    row.time = range_min + i * grid_interval
```

Or more practically, the client does this in `transformTableData()`:
```typescript
// After getting real data points, remap times to uniform grid
const interval = (data[data.length-1].time - data[0].time) / (data.length - 1);
for (let i = 0; i < data.length; i++) {
    data[i].time = data[0].time + i * interval;
}
```

**Pros**:
- Perfectly uniform bar spacing
- No whitespace needed
- Trivial to implement (5 lines on client)

**Cons**:
- **Destroys time accuracy**: The x-axis labels become meaningless. A point that
  represents 2pm would be displayed at a grid position that might say 1:47pm.
- **Crosshair tooltip lies**: Hovering shows a fabricated time, not the real time
- **setVisibleRange/getVisibleRange break**: These operate on time values, and
  the grid times don't correspond to real times. Zoom/pan detection would need
  to map between grid times and real times.
- **Misleading**: The user sees evenly-spaced points and assumes even sampling,
  but the actual data has variable density.

**Verdict**: Not recommended. Trading accuracy for aesthetics is the wrong
tradeoff for a data visualization tool.


### 4. Dual-Zone Rendering (Foreground Locks Viewport)

**Concept**: Accept the density difference but prevent the user from ever seeing
the transition zone. When zoomed, the visible range is always locked to the
foreground region. Background data exists (for the full time axis range) but is
never in the visible viewport simultaneously with foreground data.

**How it works**:
- On zoom: server sends hybrid merge as today
- Client calls `setVisibleRange()` to show only the foreground region
- User can only see foreground data (uniform density)
- If they zoom out enough to see background, a new ZOOM fires and the foreground
  expands to cover the new range
- On reset: background only (uniform density)

**The key insight**: The transition zone is only visible when the chart's pixel
width spans both bg and fg regions. If we always set the visible range to cover
*just* the foreground (+ small buffer), the bg data is off-screen.

**Current behavior**: This is basically what we already do! `setVisibleRange()`
after data update locks to `lastZoomRangeRef`. The bg data is off-screen left
and right. But the user CAN scroll to see it (panning), and when they do, they
see the transition.

**To make this work better**: Don't merge bg and fg at all. Send two separate
responses: bg for the full range (used only when zoomed all the way out or on
reset) and fg for the zoomed range. The chart shows one or the other, never both.

**Pros**:
- No edge problem (user never sees the transition)
- Simpler mental model

**Cons**:
- Loses the key benefit of hybrid merge: being able to pan through the
  transition smoothly
- When the user scrolls to the edge, there's nothing there (back to the v1
  empty-space problem)
- Extra complexity to manage two datasets

**Verdict**: This is essentially "don't solve the problem, hide it." Not ideal
but worth noting that the current implementation already mostly hides the
transition because `setVisibleRange` keeps the foreground centered.


### 5. Client-Side Interpolation to Uniform Grid (Display Only)

**Concept**: Keep the real data internally, but for display purposes, resample
to a uniform time grid using linear interpolation. The chart shows uniformly
spaced points with interpolated values. Crosshair and axis labels use real times.

**How it works**:
```typescript
function resampleToUniformGrid(
    data: {time: number, value: number}[],
    targetPoints: number
): {time: number, value: number}[] {
    const tMin = data[0].time;
    const tMax = data[data.length - 1].time;
    const step = (tMax - tMin) / (targetPoints - 1);
    const result = [];
    let j = 0;
    for (let i = 0; i < targetPoints; i++) {
        const t = tMin + i * step;
        // Binary search or linear scan for bracketing points
        while (j < data.length - 1 && data[j + 1].time <= t) j++;
        if (j >= data.length - 1) {
            result.push({ time: t, value: data[data.length - 1].value });
        } else {
            const frac = (t - data[j].time) / (data[j+1].time - data[j].time);
            const v = data[j].value + frac * (data[j+1].value - data[j].value);
            result.push({ time: Math.floor(t), value: v });
        }
    }
    return result;
}
```

**Pros**:
- Perfectly uniform spacing
- Axis labels are accurate (times are real, evenly spaced)
- No whitespace needed
- Client-only, no server changes
- ~30 lines of code

**Cons**:
- **Synthetic values**: The y-values are interpolated, not from the source data.
  This contradicts the downsampler's design philosophy of always showing real
  original rows.
- **Min/max distortion**: The downsampler carefully selects min/max rows to
  preserve extremes. Interpolation smooths them away.
- **OHLC incompatible**: Can't interpolate candlestick data (open/high/low/close
  don't interpolate meaningfully).
- **Marker alignment**: Markers reference specific data rows. Interpolated points
  don't correspond to real rows.

**Verdict**: Violates the "real rows only" principle. Not recommended for the
primary path, but could be offered as an optional "smooth display" mode.


### 6. Background-Aware Buffer Sizing

**Concept**: Instead of a fixed 50% buffer around the foreground range, size the
buffer so that the transition zone is always off-screen. The foreground covers
more than the visible range, so by the time the user pans to the bg→fg
transition, a new ZOOM has already fired.

**How it works**:
Currently in `processRangeChange()`:
```typescript
const buf = visDur * 0.5;  // 50% buffer on each side
const from = Math.max(fullRange[0], visFrom - buf);
const to = Math.min(fullRange[1], visTo + buf);
model.sendZoom(from, to);
```

With this approach, increase the buffer:
```typescript
const buf = visDur * 1.5;  // 150% buffer — 1.5 screen widths on each side
```

The foreground range is now 4x the visible range (0.5 screen left + 1 screen
visible + 0.5 screen right → with 1.5x buffer it's 1.5 + 1 + 1.5 = 4 screens).
The bg→fg transition is 1.5 screens off-screen. By the time the user pans there,
the 20% center-shift threshold triggers a new ZOOM, which moves the foreground
to cover the new area.

**But wait**: This means the foreground covers 4x the visible range with 5000
points. That's 1250 points per screen-width, which is still quite dense. The
background transition is off-screen, so the user never sees it.

**The numbers**: With `centerShift > 0.2` (pan 20% of visible range), a new ZOOM
fires. With 1.5x buffer, the user has to pan 1.5 screen widths before seeing
background. At 20% trigger, the ZOOM fires after 0.2 screen widths of panning.
So the new ZOOM arrives (and replaces data) well before the user reaches the
transition zone. **The transition is never visible.**

**Pros**:
- Almost no code change (just increase the buffer multiplier)
- No whitespace, no interpolation, no client complexity
- Transition is never visible
- Real data, real timestamps
- Works today

**Cons**:
- Wastes some of the 5000-point foreground budget on off-screen data
- The wider foreground range means lower density within the visible portion
  (5000 pts over 4 screens vs 2 screens = half the density per screen)
- At extreme zoom levels, the foreground might not have enough points to be
  visually smooth within the visible area
- Doesn't solve the problem conceptually — just hides it more aggressively

**Practical impact**: With a 1200px chart, we currently send ~5000 pts for 2x
the visible range = 2500 pts per screen width. With 1.5x buffer, it's 5000 pts
for 4x = 1250 pts per screen. That's still more than 1 pt per pixel, so
visually it would look identical. And the background zone is guaranteed off-screen.

**Verdict**: **This is the simplest practical solution.** Increase the buffer
from 0.5 to 1.0-1.5x, and the density transition is never visible. No new code,
no new concepts, no whitespace, no synthetic data. The tradeoff (slightly lower
foreground density) is negligible at 1250+ pts per screen width.


### 7. Smooth Transition via Overlapping Downsample Zones

**Concept**: Like idea #1 (graduated density) but simpler: compute two
overlapping downsample zones instead of a sharp boundary.

```text
# Instead of:
fg = downsample(source, fg_start, fg_end, 5000)
bg_outside = bg.where(time < fg_start || time > fg_end)

# Do:
fg_wide = downsample(source, fg_start - overlap, fg_end + overlap, 5000)
# Don't filter bg — just merge all points and deduplicate
merged = merge([bg, fg_wide]).sort(time).select_distinct(time)
```

The overlap zone has points from both bg and fg downsamples. Since fg uses
smaller bins, it naturally adds more points in the overlap region. The bg points
in the overlap are either duplicated by fg (and deduped) or interspersed,
creating a gradual density increase.

**Pros**:
- Simple: just widen the fg range and merge without filtering
- Natural density gradient in overlap zone
- All real rows

**Cons**:
- Total point count is unpredictable (merge + dedup)
- Might not produce a visually smooth gradient
- More points to transfer and render

**Verdict**: Interesting but unpredictable. Hard to control the total point count.


### 8. Accept It (Status Quo + Better UX Cues)

**Concept**: The edge compression is a minor visual artifact. Instead of
engineering around it, acknowledge it and add subtle visual cues that help the
user understand the density change.

**Possible cues**:
- A faint vertical line or gradient at the bg→fg boundary
- Series opacity slightly lower in bg regions
- A "density indicator" in the debug overlay
- Tooltip showing "approximate" when hovering bg points

**Pros**:
- Zero code complexity
- Honest representation of the data
- The user already sees the data "pop" to higher density on zoom — they
  understand intuitively that the edges are lower-fi

**Cons**:
- Doesn't fix the proportionality issue
- Extra visual elements might confuse more than help

**Verdict**: Reasonable fallback. The current behavior is already usable.


---

## Recommendation

### Short term: Increase buffer (Idea #6)

Change the buffer from `visDur * 0.5` to `visDur * 1.0` (or even `1.5`).

```typescript
const buf = visDur * 1.0;  // was 0.5
```

This one-line change ensures the bg→fg transition is always off-screen. The
20% pan threshold fires a new ZOOM well before the user scrolls to the
transition. The cost (slightly lower foreground density per screen) is
negligible at 1250+ points per screen width.

This is the lowest-risk, highest-impact change. It doesn't fix the underlying
proportionality issue, but it makes it invisible to the user.

### Medium term: Graduated density (Idea #1) or whitespace anchor

If the buffer approach proves insufficient (e.g., at very deep zoom levels where
the buffer ratio becomes problematic), consider either:

- **Graduated density** (server-side, ~50 lines in `compute_hybrid()`): produces
  smooth transitions but more complex, more DH table ops
- **Hidden whitespace anchor** (client-side, ~90 lines): proper proportional
  spacing but conceptually heavier

### Long term: Neither

If LWC ever adds a proportional time mode (requested by many users in their
GitHub issues), that would solve this natively. Until then, the buffer approach
is pragmatic.
