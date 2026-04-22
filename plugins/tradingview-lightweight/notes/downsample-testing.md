# Downsample Manual Testing Checklist

Use `tvl_big_line` (10M rows, ~10 year range) from the test fixture.

## Setup
1. Start server: `bash start-server.sh`
2. Open IDE, run: `t1 = tvl_big_line`
3. Wait for chart to load (debug overlay should show `pythonDs: true`)

## Test Cases

### 1. Initial Load
- [ ] Chart shows full range (~2014 to ~2024)
- [ ] Debug: `table ~10K rows`, `viewport [0, ~10K]`, `pendingDs: false`
- [ ] Data is visually smooth (not a solid block of color)

### 2. Zoom In (scroll wheel up on chart)
- [ ] Visible range narrows (e.g. 10yr -> 1yr -> months)
- [ ] Debug: table size INCREASES (higher-res downsample), ~10K colData rows
- [ ] Chart shows higher fidelity data at the zoomed level
- [ ] Chart settles immediately (no wiggle/oscillation)

### 3. Zoom Out (scroll wheel down on chart)
- [ ] Visible range widens
- [ ] Debug: table size DECREASES (lower-res re-downsample)
- [ ] Data fills the visible area (no empty gaps on edges)
- [ ] Continues to work through multiple zoom-out steps back to full range

### 4. Zoom Out via X-Axis Drag
- [ ] Click and drag RIGHT on the x-axis time labels area
- [ ] Range expands, data fills in on both sides
- [ ] No persistent empty gaps (may briefly show empty then fill on next cycle)

### 5. Pan (click-drag on chart body)
- [ ] Drag left/right to scroll through time
- [ ] Data remains continuous while panning
- [ ] Can pan well past the initial viewport (e.g. 3+ months from start)
- [ ] Debug: viewport expands in pan direction (edge detection triggers)
- [ ] **CRITICAL**: After many consecutive pans, data never collapses to a
  single point / vertical line (the old bug was a degenerate viewport)

### 6. Double-Click Reset
- [ ] Double-click on chart body
- [ ] Chart returns to full range with `fitContent`
- [ ] Debug: `isReset=true`, table back to ~10K rows

### 7. Stability After Interactions
- [ ] After any zoom/pan, wait 5 seconds
- [ ] Debug should show `pendingDs: false` (settled)
- [ ] No repeated data updates (add count stable)
- [ ] Chart doesn't jump or oscillate

### 8. Zoom In -> Zoom Out Round-Trip
- [ ] Zoom in deeply (e.g. to 1 month)
- [ ] Then zoom out back to full range
- [ ] Data should cover the full range again, no gaps
- [ ] Table re-downsamples at lower density each zoom-out step

## Debug Overlay Fields
- `pythonDs` — true if downsampling is active
- `fullRange` — source table's time extent (never changes)
- `table[0]: size=N` — current downsampled table row count on server
- `colData: N rows` — rows delivered to client via viewport
- `pendingDs` — true while waiting for server response
- `viewport[0]: [start, end]` — current viewport window on server table
- `visRange` — what LWC is currently displaying

## What To Watch For
- **Wiggle**: chart oscillates between two states after a zoom
- **Empty gaps**: visible area extends beyond data, left/right side is blank
- **Degenerate viewport**: colData drops to very few rows, visRange shows 0d
- **Stuck pending**: `pendingDs: true` never clears
- **Browser lockup**: too many rows sent to client (table size too large)
