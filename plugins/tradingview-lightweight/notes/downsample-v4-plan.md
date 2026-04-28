# Replace TVL Python-side Downsample with JS `runChartDownsample` + Whitespace Scaffold

## Context

The TVL plugin currently downsamples on the Python side using custom `agg_by` logic (~600 lines across `downsample.py` + listener.py). This is complex, buggy, and slower than the built-in `dh.plot.Downsample.runChartDownsample` JSAPI that plotly-express already uses successfully.

The new approach:
1. Python sends **original tables** to JS (no computation)
2. JS calls `runChartDownsample(table, xCol, yCols, width, range)` to get a **live ticking** downsampled table
3. A hidden `LineSeries` (`visible: false`) with whitespace `{time}` entries provides proportional time axis spacing
4. On zoom/pan, JS re-calls `runChartDownsample` with the new range (plotly-express pattern)
5. Scaffold density scales with zoom level (~1K at full zoom, up to ~10K zoomed in, max ~30K)

**Prototype confirmed:** Hidden whitespace series establishes time grid, lines render continuously across scaffold bar positions, `setData` performance is fine up to 30K points.

---

## Phase 1: Python Simplification

### 1.1 Delete `downsample.py`
- **File:** `src/deephaven/plot/tradingview_lightweight/downsample.py` (332 lines)
- Delete entirely. `DownsampleState`, `_downsample()`, hybrid merge, `compute_reset()` — all replaced by JSAPI.

### 1.2 Simplify `listener.py`
- **File:** `src/deephaven/plot/tradingview_lightweight/communication/listener.py`

**Remove:**
- `DownsampleState` import and `DOWNSAMPLE_ELIGIBLE_TYPES` constant
- `_downsample_states` dict, `_active_tables` dict
- `_handle_zoom()` method entirely
- `_handle_reset()` method entirely
- ZOOM/RESET dispatch in `process_message()`
- Downsample cleanup in `close()`

**Modify `_handle_retrieve()`:**
- Remove eligibility checks and `DownsampleState` creation
- Always export **original** tables
- Send lightweight `downsampleMeta` instead of `downsampleInfo`:
  ```python
  downsample_meta[str(i)] = {
      "tableSize": table.size,
      "timeCol": time_col,
      "valueCols": list(value_cols),
      "seriesTypes": [s.series_type for s in series_for_table],
  }
  ```
- JS side uses this metadata to decide eligibility and call `runChartDownsample`

**Simplified `process_message()`:** Only handles `RETRIEVE`. ZOOM/RESET no longer flow through Python.

---

## Phase 2: JS Model Refactoring

### 2.1 Update types (`TradingViewTypes.ts`)

**Add:**
```typescript
export interface TvlDownsampleMeta {
  tableSize: number;
  timeCol: string;
  valueCols: string[];
  seriesTypes: string[];
}
```

**Remove:** `DownsampleReadyMessage`, `TvlDownsampleTableInfo` (no longer sent from Python)

**Modify:** `TvlFigureData` — replace `downsampleInfo` with `downsampleMeta`

### 2.2 Refactor `TradingViewChartModel.ts`

**Remove (Python-downsample state):**
- `pythonDownsampled`, `downsampledTableIds`, `pendingDownsample`, `pendingZoomParams`, `expectingReset`
- `isPythonDownsampled()`, `sendZoom()`, `sendReset()`, `handleDownsampleReady()`
- `handleViewportUpdate()`, viewport subscription code path
- `DOWNSAMPLE_READY` handler in `listenToWidget()`
- `resetPendingForTable`, `viewportSubscriptionMap`, `viewportRangeMap`

**Add (JS-downsample state):**
```
originalTableMap: Map<number, DhType.Table>      // stored for re-downsample
downsampledTableMap: Map<number, DhType.Table>    // current live DS tables
jsDownsampledTableIds: Set<number>                // which tables are downsampled
downsampleMeta: Record<string, TvlDownsampleMeta> // from Python
pendingDownsample: boolean                        // in-flight flag
pendingZoomParams                                 // queued zoom
```

**Add `downsampleTable(tableId, range?, width?)`:**
- Calls `dh.plot.Downsample.runChartDownsample(originalTable, xCol, yCols, width, xRange)`
- Range converted: UTC seconds → `dh.DateWrapper.ofJsDate(new Date(utcSec * 1000))`
- Closes old downsampled table, installs new one, subscribes
- On error: falls back to original table

**Add `performDownsample(range, width)`:**
- Called by the view on zoom/pan/reset
- Queues if already pending (like current `sendZoom`)
- Emits `DOWNSAMPLE_PENDING` events (keeps scrim UX)
- Calls `downsampleTable()` for each JS-downsampled table
- Drains pending queue when done

**Modify `init()`:**
- Read `downsampleMeta` from `figureData`
- Check eligibility per table (standard chart, Line/Area/Baseline, size > threshold)
- Store original in `originalTableMap`, call `downsampleTable(id)` for initial full-range downsample
- Ineligible tables: subscribe directly as before

**Simplify `subscribeTable()`:**
- Remove viewport subscription branch entirely
- All tables use full `table.subscribe()` with `ChartData` (downsampled tables are small enough)

**Add public API:**
- `isDownsampled(): boolean`
- `getDownsampleMeta()`

### 2.3 Table lifecycle
- Original tables stored in `originalTableMap`, never closed until `close()`
- Downsampled tables closed and replaced on each re-downsample
- `close()` cleans up both maps

---

## Phase 3: View & Renderer Integration

### 3.1 Add scaffold to `TradingViewChartRenderer.ts`

**Add state:** `private scaffoldSeries: ISeriesApi | null`

**Add `createScaffold()`:** Creates hidden `LineSeries` with `visible: false`

**Add `setScaffoldData(minTime, maxTime, count)`:**
- Generates `count` evenly-spaced `{time}` whitespace entries
- Caps at 30K for performance
- Called after each data update with the actual data's time extent

**Modify `configureSeries()`:**
- Accept `enableScaffold` parameter
- Create scaffold FIRST (before data series) so it occupies base time positions
- Clean up scaffold on series reconfiguration

### 3.2 Modify `TradingViewChart.tsx`

**Modify `setupDownsampleSubscriptions()` → `processRangeChange()`:**
- Instead of `model.sendZoom(from, to, width)` → call `model.performDownsample([from, to], width)`
- Same threshold logic (>10% duration or >20% center shift)
- Same buffering (50% on each side)
- Convert TZ-shifted seconds to UTC via existing `unconvertTime()`

**Modify double-click reset handler:**
- Instead of `model.sendReset()` → call `model.performDownsample(null, width)`

**Modify `handleDataUpdate()`:**
- After setting series data, update scaffold with data's time extent
- Scale scaffold density: `Math.min(30000, Math.max(1000, timeScale.width() * 3))`
- Keep all existing UX: scrim/status bar, range locking (`lockRangeOnNextUpdateRef`), suppress flag, snap-to-live

**Modify `handleFigureUpdate()`:**
- Pass `enableScaffold: model.isDownsampled()` to `configureSeries()`

**Replace:** `isPythonDownsampled()` checks → `isDownsampled()`

---

## Phase 4: Testing

### Python tests
- Remove tests referencing `DownsampleState`, ZOOM/RESET handlers
- Add test: `_handle_retrieve()` sends original tables + `downsampleMeta`

### JS tests
- Update model tests: remove `sendZoom`/`sendReset`/`handleDownsampleReady` tests
- Add: `downsampleTable()` calls `runChartDownsample` with correct params
- Add: scaffold data generation produces correct whitespace entries

### Manual test scenarios
1. Large static table (>30K rows): auto-downsample, scrim, proportional rendering
2. Zoom in/out: re-downsample with range, scrim, data updates
3. Double-click reset: full-range re-downsample, fitContent
4. Ticking table: live updates (runChartDownsample returns live table)
5. Small table (<1K rows): no downsample, render directly
6. Non-eligible types (Candlestick): no downsample
7. Chart resize: re-downsample with new width
8. `by` partitioned charts: per-partition downsample, shared scaffold

---

## Critical Files

| File | Action |
|------|--------|
| `src/deephaven/.../downsample.py` | DELETE |
| `src/deephaven/.../communication/listener.py` | SIMPLIFY (remove ~200 lines) |
| `src/js/src/TradingViewTypes.ts` | MODIFY (swap downsampleInfo → downsampleMeta) |
| `src/js/src/TradingViewChartModel.ts` | MAJOR REFACTOR (remove Python-ds, add JS-ds) |
| `src/js/src/TradingViewChart.tsx` | MODIFY (zoom → performDownsample, scaffold mgmt) |
| `src/js/src/TradingViewChartRenderer.ts` | ADD scaffold series + setScaffoldData |

## Key Patterns to Reuse

- **plotly-express downsample pattern** (`PlotlyExpressChartUtils.ts:283-298`): `dh.plot.Downsample.runChartDownsample()` call with DateWrapper range conversion
- **Existing TVL zoom detection** (`TradingViewChart.tsx:733-793`): threshold logic, buffering, debounce — keep as-is, just change the target from `sendZoom` to `performDownsample`
- **Existing TVL scrim UX** (`TradingViewChart.tsx:94-111`): progressive reveal — keep as-is, driven by same `DOWNSAMPLE_PENDING` events
- **Existing range locking** (`TradingViewChart.tsx:445-465`): `lockRangeOnNextUpdateRef` — keep as-is
