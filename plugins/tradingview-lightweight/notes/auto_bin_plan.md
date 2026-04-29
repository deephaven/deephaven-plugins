# Auto Time-Bin Aggregation for TVL Histogram & Candlestick

## Context

TVL currently auto-downsamples Line / Area / Baseline series via `dh.plot.Downsample.runChartDownsample` (v4, JS-side, threshold 1000 rows in `listener.py:19`). Histogram, Candlestick and Bar are excluded — `runChartDownsample` does min/max-per-bin, which is wrong for OHLC and wrong for "sum volume per time bucket". As a result, those series types ship the raw table to the client and render every row, which is fine for pre-aggregated input but bad if a user does the natural thing and passes raw trade ticks (`Timestamp`, `Price`, `Size`).

This change makes "raw ticks → time-binned bars" automatic: when the source table is large enough and the series is histogram / candlestick / bar, the plugin transparently aggregates the table on the server into time-binned form, ships the aggregated table to the client, and re-aggregates with a finer bin width on zoom. Same scrim/status-bar UX as the existing downsample flow. Opt-out via `auto_bin=False`.

## Design

### Why server-side, not JS-side

The v4 line/area path runs aggregation on the client through `runChartDownsample`. We can't reuse it because it's hardcoded to min/max-per-y-column. There is no JSAPI primitive for OHLC or sum-per-bin. The idiomatic DH alternative is `table.update_view("Bin = upperBin(time, w)").agg_by([...], by="Bin")` — server-side, ticking-friendly, the same pattern TVL's deleted `downsample.py` v3 used. We do that on RETRIEVE and on zoom messages from the client.

### Aggregation spec per series type

| Series type               | Raw input (typical)                                 | Aggregation per bin                                                                                            | Output cols                      |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `Histogram` (volume bars) | `(time, value)`                                     | `sum(value)` (default), or `count` / `avg` / `last` via `agg=`                                                 | `(time, value)`                  |
| `Candlestick`             | `(time, open, high, low, close)` OR `(time, price)` | `first(open)`, `max(high)`, `min(low)`, `last(close)` — when only `price` is given, all four come from `price` | `(time, open, high, low, close)` |
| `Bar`                     | same as candlestick                                 | same as candlestick                                                                                            | same as candlestick              |

`time` in each output bin is the bin-start (`upperBin(time, w)`).

### Bin-width strategy

- **Initial:** `bin_width = full_time_range_ns / TARGET_BINS` where `TARGET_BINS = 5000`. Rounded to a "nice" duration (1ns, 1µs, 1ms, 1s, 5s, 15s, 1m, 5m, 15m, 1h, 1d) to keep bar boundaries readable.
- **On zoom:** if the user zooms in such that fewer than `MIN_VISIBLE_BINS = 200` of the current binning fall in the visible range, recompute `bin_width = visible_range_ns / TARGET_BINS` and swap the table reference. A bit of buffer (~25%) outside the visible range so panning doesn't immediately re-trigger.
- **On reset (double-click):** revert to the full-range bin width.

### Threshold

`AUTO_BIN_THRESHOLD = 5000` rows (separate from `DOWNSAMPLE_THRESHOLD = 1000`). Histogram/Candlestick/Bar only — Line/Area/Baseline keep using `runChartDownsample`. Both constants live in `listener.py` and are independently overridable via env var (mirroring the existing pattern if present; otherwise add `TVL_AUTO_BIN_THRESHOLD`).

### Wire protocol

New message types alongside the existing `RETRIEVE` / downsample ones:

- `AUTOBIN_ZOOM { tableRef, fromNs, toNs, targetWidthPx }` — client → server. Server recomputes `bin_width`, builds a new aggregated view, replaces the table reference for that series, sends back a delta `figure` with the new ref.
- `AUTOBIN_RESET { tableRef }` — client → server. Reverts to the initial full-range bin width.

New figure-data field `autoBinMeta` parallel to `downsampleMeta` (`listener.py:112-117`):

```ts
interface TvlAutoBinMeta {
  originalTableRef: number; // raw table ref, kept on server
  timeCol: string;
  binWidthNs: number; // current bin width
  fullRangeNs: [number, number]; // for "reset" + nice bin-width snapping
  series: Record<
    string,
    {
      // keyed by series id
      type: 'Histogram' | 'Candlestick' | 'Bar';
      agg: 'sum' | 'count' | 'avg' | 'last' | 'ohlc';
      valueCols: string[]; // ['value'] for hist, ['open','high','low','close'] or ['price'] for OHLC
    }
  >;
}
```

### Python-side changes

**New module:** `src/deephaven/plot/tradingview_lightweight/auto_bin.py`

- `nice_bin_width(range_ns: int, target_bins: int) -> int` — rounds to the bucket list above.
- `build_histogram_view(raw, time_col, value_col, bin_width_ns, agg='sum') -> Table`
- `build_ohlc_view(raw, time_col, ohlc_cols_or_price, bin_width_ns) -> Table`
  - if `ohlc_cols_or_price` is one column: `agg.first/max_/min_/last` all on that col, output named `Open/High/Low/Close`.
  - if four cols: `first(Open)`, `max_(High)`, `min_(Low)`, `last(Close)`.
- All views use `update_view("Bin = upperBin(time_col, bin_width_ns)").agg_by([...], by=["Bin"]).update_view("time_col = Bin").drop_columns("Bin")` so the output schema matches what the renderer already expects (no JS schema changes for the wire data itself).

**`series.py`:**

- Add `auto_bin: Optional[bool] = None`, `bin_width: Optional[str] = None`, `bin_count: Optional[int] = None`, and (histogram only) `agg: str = "sum"` to `histogram_series`, `candlestick_series`, `bar_series`.
- Same params on the shorthand functions in `chart.py` (`histogram`, `candlestick`, `bar`).
- These are stored on `SeriesSpec` (new fields) and forwarded to the listener on RETRIEVE — the listener decides whether to actually trigger auto-bin.

**`communication/listener.py`:**

- Add `AUTO_BIN_THRESHOLD = 10_000` and `AUTO_BIN_ELIGIBLE_TYPES = {"Histogram", "Candlestick", "Bar"}` next to the existing `DOWNSAMPLE_*` constants.
- Extend `_handle_retrieve` (lines 92-117): for each table, after the existing downsample-eligibility block, run a parallel auto-bin-eligibility block. If a series is auto-bin eligible, call into `auto_bin.build_*_view(...)`, swap the wire table for the aggregated one, retain the raw table in a per-widget map (analogous to `originalTableMap` on the JS side, but server-side here), and emit `autoBinMeta`.
- New `_handle_autobin_zoom` and `_handle_autobin_reset` methods that recompute the view, replace the table reference in `new_references`, and send a `FIGURE_UPDATE` message.
- `auto_bin=False` short-circuits the eligibility check; `bin_width=` overrides `nice_bin_width`; `bin_count=` overrides `TARGET_BINS`.

### JS-side changes

**`TradingViewTypes.ts`:**

- Add `TvlAutoBinMeta` interface (above) and `autoBinMeta?: TvlAutoBinMeta` field on `TvlFigureData`.

**`TradingViewChartModel.ts`:**

- Mirror the downsample plumbing: `autoBinTableIds`, `originalAutoBinTableMap` (only needed for tracking — the raw table stays server-side, but we keep the _current_ aggregated table's ref so we can unsubscribe on swap), `pendingAutoBin`.
- `performAutoBin(range, widthPx)` parallel to `performDownsample` (lines 413-458). Sends `AUTOBIN_ZOOM`. On the resulting `FIGURE_UPDATE`, swap subscription to the new aggregated table.
- Emit the same `DOWNSAMPLE_PENDING` event so the UX layer doesn't need to differentiate. (Rename internally to `RESAMPLE_PENDING` if we want to be cleaner — bikeshed in review.)

**`TradingViewChart.tsx`:**

- The zoom callsite (`TradingViewChart.tsx:782`) currently calls `model.performDownsample(...)`. Change it to a single `model.performResample(...)` that internally dispatches per-table to either `performDownsample` or `performAutoBin` depending on which meta is present. Same for reset (line 827) and pan (line 847).
- Scrim/status-bar UX, `restoreRangeRef`, `lockRangeOnNextUpdateRef`, snap-to-live: unchanged. They key off the generic pending event, not on which path is running.

**`TradingViewChartRenderer.ts`:** no changes. The aggregated table's schema matches what the histogram/candlestick renderer already consumes (`time`, `value` or `time`, `open/high/low/close`).

### Edge cases & decisions

- **Ticking tables.** `agg_by` on a refreshing table is supported and produces a refreshing result. The aggregated table will tick when new data lands in an existing bin or a new bin starts. JS subscribes to the aggregated table directly — same as v4.
- **Zoom below `bin_width`.** If the user zooms in past the resolution of the current bins, we re-aggregate at finer width. If they zoom past the finest sensible width (e.g., 1 ns), we cap at the raw resolution and just stop re-aggregating.
- **Color column on histogram.** `histogram_series` supports `color_column`. With sum aggregation, "color" is ill-defined per bin. Decision: when `auto_bin` is active and `color_column` is set, emit a warning and use `last(color_column)` for the bin. User can disable auto-bin if they want exact behavior.
- **`base` parameter on histogram.** Pass through unchanged — it's a render setting, not a data setting.
- **Markers / price lines.** Anchored to `time` values in the raw table; if `time` no longer appears in the binned table (because `time` got rounded to a bin boundary), markers may drift. Decision: round marker times to the nearest bin-start before rendering, when auto-bin is active. Add a TODO if more precision is needed.
- **Multi-series on one table with mixed types.** Already a constraint for downsample (all series must be eligible types). Auto-bin: each _series_ gets its own aggregated view, so mixing Histogram + Candlestick on the same raw table is fine — they share the `originalTableRef` but produce different aggregated outputs. Mixing Line + Histogram: line goes through downsample, histogram goes through auto-bin, both produce different derived tables from the same source. Listener has to handle both metas on the same source table.
- **Pre-aggregated input.** If a user already passed a small / pre-aggregated table (size ≤ threshold), no aggregation, no `autoBinMeta`. Behaves exactly as today.

## Files to modify

| File                                                                                     | Change                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/auto_bin.py` | **NEW** — `nice_bin_width`, `build_histogram_view`, `build_ohlc_view`                                                                              |
| `.../tradingview_lightweight/series.py`                                                  | Add `auto_bin`, `bin_width`, `bin_count`, `agg` params to `histogram_series`, `candlestick_series`, `bar_series`; persist on `SeriesSpec`          |
| `.../tradingview_lightweight/chart.py`                                                   | Mirror those params on `histogram`, `candlestick`, `bar` shorthand functions (lines 1132-1171, 835-889, plus bar)                                  |
| `.../tradingview_lightweight/communication/listener.py`                                  | Add `AUTO_BIN_THRESHOLD`, `AUTO_BIN_ELIGIBLE_TYPES`; extend `_handle_retrieve` (lines 92-117); add `_handle_autobin_zoom`, `_handle_autobin_reset` |
| `.../tradingview_lightweight/_types.py`                                                  | Add fields on `SeriesSpec` if not generic enough                                                                                                   |
| `src/js/src/TradingViewTypes.ts`                                                         | Add `TvlAutoBinMeta`, extend `TvlFigureData`                                                                                                       |
| `src/js/src/TradingViewChartModel.ts`                                                    | Add auto-bin tracking + `performAutoBin`; unify pending state                                                                                      |
| `src/js/src/TradingViewChart.tsx`                                                        | Replace direct `performDownsample` callsites with a router; UX state stays                                                                         |
| `src/js/src/TradingViewChartRenderer.ts`                                                 | No changes expected                                                                                                                                |

## Verification

**Python unit tests** (`tests/`):

- `nice_bin_width(range, target)` — boundary cases (1ns, 1d, 1y, target=1, target=10⁶).
- `build_histogram_view` — given a fixture of (time, value) over 10s, bin_width=1s → 10 rows with correct sums.
- `build_ohlc_view` from a single price column — first/max/min/last per bin match.
- `build_ohlc_view` from existing OHLC columns — first(open), max(high), min(low), last(close).
- Listener: large fixture (50K rows) triggers auto-bin; small (5K) doesn't; `auto_bin=False` opts out; ticking table aggregated view also ticks.

**JS unit tests** (`src/js/`):

- Model emits `RESAMPLE_PENDING` (or whatever we end up calling it) when `performAutoBin` is in flight.
- Reducer for `FIGURE_UPDATE` from `AUTOBIN_ZOOM` correctly swaps the subscribed table.

**Manual e2e via `agent-browser`:**

1. Add a fixture in `tests/app.d/`: 10M raw ticks (`Timestamp`, `Price`, `Size`) over 1 day. Small fixture: 5K pre-aggregated.
2. `bash dev-server.sh`, open IDE, run `tvl_big_hist = tvl.histogram(big_ticks, time='Timestamp', value='Size')`, screenshot — should show ~5000 bars over the full day.
3. Zoom into 1 hour — verify scrim flashes, bars get finer. Screenshot.
4. Double-click — verify scrim flashes, bars revert to coarse. Screenshot.
5. Same with `tvl_big_cs = tvl.candlestick(big_ticks, time='Timestamp', open='Price', high='Price', low='Price', close='Price')`.
6. Verify the small fixture (`tvl.histogram(small_pre_agg, ...)`) doesn't trigger auto-bin (no scrim flash on initial load, no `autoBinMeta` in the figure payload — check via `agent-browser eval` reading from the network tab is overkill; instead add a TS-side `console.debug` and grep the page console).
7. Ticking: write a fixture that appends a new row every 100ms; verify the rightmost bar updates without a full re-aggregation, and snap-to-live still works.

**Benchmark** (per the existing `notes/bench_*.py` pattern):

- `dh exec notes/bench_auto_bin_hist.py` — compare initial-render time on a 100M-row table with auto-bin vs. with the user pre-aggregating manually. Should be within ~10%.

## Open questions to confirm before implementing

1. **OHLC from a single price column** — is this a real use case, or do users always pass pre-OHLC'd data? If always pre-OHLC, drop the single-column path (simpler). My instinct: keep it; it's the most natural input from raw trade ticks.
2. **`bin_width` as a string (`'PT1S'`) vs. an int (nanoseconds) vs. a `Duration` object.** Pick one. Recommend ISO 8601 string to match the rest of DH.
3. **Default `agg` for histogram.** I assumed `sum`. For volume bars, that's right. For "tick count" use cases, `count` is right. Default `sum`, document the alternative.
4. **`MIN_VISIBLE_BINS = 200`, `TARGET_BINS = 5000`** — these are guesses. We should benchmark on a real 100M-row dataset and tune.
