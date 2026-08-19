# DH-1376 — Histogram binning gaps + borders (continuous bars)

Split out of [DH-1376-tradingview-lightweight-review.md](DH-1376-tradingview-lightweight-review.md)
(Phase 7). **Status: PARKED / future work.** A first implementation attempt was made and
then fully reverted at the maintainer's request. This file preserves the root-cause
analysis, everything learned from the reverted attempt, and a recommended strategy so a
future attempt can resume without re-deriving it.

## Symptoms

([docs/histogram.md](../plugins/tradingview-lightweight/docs/histogram.md#L68) line 68 = visible borders between bars; [#L122](../plugins/tradingview-lightweight/docs/histogram.md#L122) line 122 = large gaps):

- The plugin renders histograms with LWC's **built-in `HistogramSeries`**, which draws a **fixed pixel-width bar per data point** (`round(barSpacing) − 1`), _not_ a bar spanning the time-bin width. That inherent 1px gap is the "borders between bars" (line 68) — LWC has no touching-bar / `bargap=0` option.
- To fake a proportional time axis on LWC's ordinal scale, the plugin adds a **dense whitespace "scaffold" series** (~`width*2` points across the full range; `minBarSpacing: 0.01`) whenever it resamples/auto-bins ([TradingViewChart.tsx `updateScaffold`](../plugins/tradingview-lightweight/src/js/src/TradingViewChart.tsx#L417)). Server autobin drops empty bins (`agg_by(by=["__Bin"])` in [auto_bin.py](../plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/auto_bin.py#L212)). Combined, sparse bins land at their true time positions among thousands of scaffold slots → **thin bars separated by large time-proportional gaps** (line 122). (The `replayAllData` comment claiming "just two bookend whitespace points" for autobin is **stale**; `updateScaffold` always goes dense.)
- The client already has what a custom renderer would need: `binWidthNs` + `fullRangeNs` per series via `getAutoBinMeta()` ([TradingViewTypes.ts `TvlAutoBinMeta`](../plugins/tradingview-lightweight/src/js/src/TradingViewTypes.ts#L38)).

## Attempted fix (custom histogram series) — reverted

A custom LWC series (`chart.addCustomSeries` + `ICustomSeriesPaneView`,
`ContinuousBarsSeries.ts`) covering all three ordinal types (Histogram/Candlestick/Bar),
opt-in via a per-series `continuous=True` and a chart-level `continuous_bars=True`. All of
it was reverted: `ContinuousBarsSeries.ts` + tests, the `createSeries` routing in
`TradingViewChartRenderer.ts`, `continuous?` on `TvlSeriesConfig`, the mock's
`addCustomSeries`/`customSeriesDefaultOptions`, the Python `continuous`/`continuous_bars`
params in `series.py`/`chart.py`, `TestContinuousBars`, and the histogram/candlestick/bar
doc mentions.

### What was tried, in order, and what each taught us

1. **Global bin-pixel width** (`min` adjacent `bars[i+1].x − bars[i].x`, draw every bar that wide, centered). → Correct at some zooms, wrong at others. **Why:** the dense scaffold is spaced by an _evenly-spaced-in-time_ whitespace grid, and `binWidthNs / scaffoldStep` is non-integer, so the scaffold-index count between adjacent bins **jitters ±1**. A single global width can't tile jittered positions — borders/overlaps at some zooms only.
2. **Neighbor-midpoint edges with a median-bin threshold** (a bar meets its neighbor at the shared pixel midpoint when the gap is ≤ ~1.5× the median gap; else keep its own width). → Still gappy/inconsistent. **Why:** a pixel-based "is this an empty bin?" threshold is fundamentally ambiguous when scaffold jitter and real empty-bin gaps are similar sizes.
3. **Time-based adjacency** (decide bins from each bar's _time_ — `bar.originalData.time`, exact integer epoch seconds; `binCount = round(Δtime / minΔtime)`; fill `Δpixels / (2·binCount)` toward each neighbor, so adjacent bars share the exact midpoint and n-bin gaps stay proportional). → **Verified correct in isolation:** simulating the real shipped auto-bin data (`build_histogram_view` on `large_prices` at full / 1-day / 1-hour zoom) and running this logic on the actual time deltas gives `binCount = 1` for every body bin at every zoom (bodies are contiguous; the only large deltas are the far-off head/tail anchors). Jest geometry tests (jitter regression + large-gap) passed. **But the browser still showed thin, gappy bars.**

### Key blockers (the reasons it's parked)

- **The custom series never actually rendered on the auto-bin path in-browser.** Thin far-apart bars on a dense scaffold are the signature of the **built-in `HistogramSeries`**, i.e. the `continuous` flag/routing was being lost between the wire and `createSeries` **specifically for auto-binned series** (non-auto-binned continuous series _did_ render touching). Not yet traced — prime suspect is the `AUTOBIN_FIGURE` / figure-rebuild path in [listener.py](../plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/communication/listener.py) dropping `continuous`, **or** a stale cached browser bundle (reinstalls need a hard reload + re-running the script).
- **Proportional gaps require the scaffold, which only exists when resampling.** `enableScaffold = model.isResampling()` ([TradingViewChart.tsx](../plugins/tradingview-lightweight/src/js/src/TradingViewChart.tsx#L522)). A histogram below the auto-bin threshold (`AUTO_BIN_THRESHOLD = 2 × TARGET_BINS = 500` rows) renders on the plain **ordinal** scale, where equal index spacing **collapses real time gaps** to one step — so a small, non-auto-binned histogram can never show a proportional gap regardless of the renderer. A future "continuous" feature must decide whether to force the scaffold on for continuous ordinal series (bigger change) or restrict the feature to the resampled path.

## Recommended strategy (rethink before retrying)

The reverted attempt fought scaffold jitter in the renderer. Both prior geometry failures
(#1, #2) trace back to the same root: **empty bins are absent and the scaffold is an
independent, non-integer-aligned time grid**. Attack that root server-side instead.

### 1. Zero-fill empty bins server-side (promote from "optional" to primary)

If `build_histogram_view` emits **every** bin — including zero-height ones — instead of
`agg_by` dropping empties, the binned output is **uniformly spaced in time**. On a
uniform grid the ordinal scale _is_ proportional, which collapses the problem:

- The dense scaffold becomes unnecessary for auto-binned histograms — and with it the
  ±1-index jitter that killed geometry attempts #1 and #2 disappears entirely.
- The "large gaps" bug fixes itself: empty bins render as explicit 0-height bars, not
  scaffold voids.
- The remaining defect is only the built-in `HistogramSeries`' 1px border
  (`round(barSpacing) − 1`). On a uniform grid a custom series' geometry is trivial —
  every bar is exactly `barSpacing` wide, no adjacency inference needed; attempt #3's
  time-based math reduces to a constant. Or decide 1px separators on touching uniform
  bars are acceptable and **skip the custom series entirely**.
- Deephaven mechanics: generate the full bin range (a bin-index table from the data's
  min/max, or `range_join`/`aj` against the aggregated bins) and left-join the counts
  with a 0 default. Prototype in
  [auto_bin.py](../plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/auto_bin.py)
  **before touching any JS**. Watch ticking semantics: the join must stay refresh-safe,
  and the bin range must extend as new data arrives.
- Cost check: zero-fill bounds the row count at ~`TARGET_BINS` per viewport, so the
  payload stays small; empty-heavy distributions just send explicit zeros.

### 2. Settle the lost-`continuous` mystery with instrumentation, not inspection

Cheap way to distinguish all three suspects in one browser session:

- Log the received series configs inside the `AUTOBIN_FIGURE` handler in
  [TradingViewChartModel.ts](../plugins/tradingview-lightweight/src/js/src/TradingViewChartModel.ts#L801)
  and inside `configureSeries` in
  [TradingViewChartRenderer.ts](../plugins/tradingview-lightweight/src/js/src/TradingViewChartRenderer.ts#L609).
- If the log itself doesn't appear → **stale bundle** (hard-reload after
  `plugin_builder.py --js --reinstall`; this has bitten before).
- If it appears without `continuous` → the figure rebuild in
  [listener.py](../plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/communication/listener.py)
  reserializes series specs from a source that never carried the flag — trace where the
  rebuild copies series fields.
- If it appears **with** `continuous` → the bug is in `createSeries` routing, which the
  reverted diff would have exercised.

Note: with strategy #1, this trace may become moot for histograms (no custom series
needed), but it stays relevant if Candlestick/Bar continuous rendering is ever revived.

### 3. Small-table (no-scaffold) behavior mostly evaporates under #1

Zero-fill gives small *binned* histograms the same uniform grid — no scaffold decision
needed. Only *unbinned* histograms (below `AUTO_BIN_THRESHOLD`, raw rows) keep pure
ordinal spacing; document that as a limitation instead of forcing the scaffold on.

### Retry checklist

1. Prototype zero-fill in `build_histogram_view` (server-only, verify with a live table:
   uniform `__Bin` spacing, zeros present, still refresh-safe while ticking).
2. Drop the scaffold for zero-filled auto-binned histograms; verify the ordinal scale
   now lays bins out proportionally in-browser.
3. Decide whether the built-in series' 1px border is acceptable. If not, reintroduce a
   custom series with constant-width geometry (trivial on the uniform grid) — resume
   from attempt #3's validated time-based logic if any non-uniform case remains.
4. Rule out bundle caching (hard reload) before trusting any in-browser observation.
5. In-browser visual validation is mandatory — jest geometry tests are necessary but not
   sufficient. Check full / 1-day / 1-hour zooms on `large_prices`.
6. Update the flagged histogram examples + regenerate snapshots.

## Done when

Borders are gone on contiguous bins, gaps appear only for genuinely-empty bins, the
behavior is stable across zoom levels and verified in-browser, and the example + snapshot
are updated.
