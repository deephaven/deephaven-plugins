# PR #1376 — TradingView Lightweight Charts: Review Response Plan

Source PR: [deephaven/deephaven-plugins#1376](https://github.com/deephaven/deephaven-plugins/pull/1376)
Reviewer: `jnumainville` — **CHANGES_REQUESTED**

## Reviewer summary

> I tried to skim through the docs and run all examples. My main feedback here is
> that I think the documentation could be clarified and simplified at points, there
> are some erroneous/confusing/weird examples, and that we might want to reconsider
> how many variables we surface in one place throughout the API, especially when
> many of them have verbose, similar, and confusing names. I'm not sure how much
> code review we'll want to do here as it's not going to be reasonably feasible for
> one person in a reasonable amount of time. Maybe targeted review of the core
> functionality.

The feedback is grouped into six sequential phases below. **Work them in order** —
Phase 1 (the API refactor) rewrites every `chart()` call, so doing it first means the
example fixes in later phases are only written once. Each phase lists its tasks and a
"Done when" gate; finish a phase (including regenerating snapshots) before starting the
next. The final section is a single verification pass to run before requesting re-review.

**Phase map:**

1. API surface refactor (grouped config objects) — foundational, touches every example.
2. Fix broken examples (`ii` refresh errors).
3. Functional / rendering bug fixes (code).
4. Contrast / rendering polish in examples.
5. Documentation clarity, pruning, and comments.
6. Code style in examples.
7. Histogram binning gaps + borders — **parked / future work** (do after the others).
8. Frozen price scale (`auto_scale=False`) — **parked / future work**.

---

## Phase 1 — API surface refactor (grouped config objects)

**Do this first.** It changes the shape of every `chart()` call, so all later phases
edit examples against the new API instead of rewriting them twice.

**Why:** Reviewer feedback ([docs/price-scale.md](plugins/tradingview-lightweight/docs/price-scale.md#L182) line 182):
the API exposes many verbose, similar-sounding variables at one level, easily confused
by users/AI; suggests a structure closer to `dx` (plotly express) rather than flattening
everything into one top-level surface.

**Current state (verified):** `chart()` in
[chart.py](plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/chart.py#L359)
carries ~560 lines of flat keyword parameters, dominated by repeated clusters that mirror
the TVL JS nested config:

- `right_price_scale_*`, `left_price_scale_*`, `overlay_price_scale_*` — the same ~15
  options **triplicated** across three scales (~45 kwargs).
- `crosshair_vert_line_*`, `crosshair_horz_line_*` — same options duplicated per line.
- `vert_lines_*` / `horz_lines_*` (grid), plus the flat layout/crosshair-mode knobs.

The codebase already has precedent for grouped config objects: `PriceFormat` (TypedDict)
and `WatermarkLine` dataclass + `watermark_line()` factory + `watermark_lines=[...]`, all
of which take snake_case Python args and serialize to camelCase JS keys internally.

**Decided design (Option C — hybrid):** group only the repeating/large clusters into
typed factory objects, and keep genuinely common single knobs flat.

- **Group into objects:** the three price scales, the two crosshair lines, and grid.
  Reuse one factory across the left/right/overlay slots so the ~45 price-scale kwargs
  collapse to a single reusable `price_scale(...)`.
- **Keep flat:** common single knobs — `chart_type`, `background_color`, `text_color`,
  `font_size`, `crosshair_mode`, etc.
- **Grouping rule of thumb:** move a cluster into an object when it repeats across ≥2
  slots or has ≥~5 sub-options; otherwise leave it flat.
- **Naming:** grouped factories take **snake_case** Python args and serialize to
  **camelCase** JS keys internally (same as `WatermarkLine` / `PriceFormat`). No
  verbatim-passthrough surface — this also resolves the price-formats naming question
  ([docs/price-formats.md](plugins/tradingview-lightweight/docs/price-formats.md#L23) line 23).

Target shape:

```python
scale = tvl.price_scale(border_visible=True, text_color="#666", tick_mark_density=2.0)
chart = tvl.chart(
    tvl.histogram(volume, timestamp="Timestamp", value="Volume", price_scale_id="vol"),
    right_price_scale=scale,
    overlay_price_scale=scale,  # same factory reused, no re-typed prefix
    crosshair=tvl.crosshair(mode="magnet", vert_line=tvl.crosshair_line(color="#aaa")),
    grid=tvl.grid(vert=tvl.grid_lines(visible=False)),
    background_color="#111",  # common knobs stay flat
)
```

### Tasks

- [x] Decide the deprecation path for the removed flat kwargs up front (hard break vs.
      temporary acceptance with a warning), since it dictates how `chart()` is edited.
      **Decided: hard break** — the plugin is unreleased (initial feature PR), so the flat
      kwargs are removed outright.
- [x] Define the grouped factories/dataclasses following the `watermark_line` pattern:
      `price_scale(...)`, `crosshair(...)` + `crosshair_line(...)`, `grid(...)` +
      `grid_lines(...)`. Snake_case args in, camelCase JS keys out. (in `options.py`)
- [x] Update `chart()` to accept the grouped params (`right_price_scale=`,
      `left_price_scale=`, `overlay_price_scale=`, `crosshair=`, `grid=`) and drop the
      flat `*_price_scale_*` / `crosshair_*_line_*` / `*_lines_*` kwargs. The
      `yield_curve` / `options_chart` / `custom_numeric` convenience constructors keep a
      flat `crosshair_mode=` that is translated to `Crosshair(mode=...)` internally.
- [x] Keep the identified common knobs flat.
- [x] Audit any spot that passes raw camelCase keys through to JS and normalize it to the
      snake_case-in / camelCase-out convention (all grouped factories serialize internally).
- [x] Export the new factories/types from the package `__init__` (+ `__all__`) and add
      unit tests for their snake→camel serialization (`TestGroupedConfigObjects`).
- [x] Migrate every docs example that configures a price scale, crosshair, or grid to the
      grouped shape (styling.md, price-scale.md, multiple-axes.md, chart.md, tooltip.md;
      API-reference `dhautofunction` blocks added).
- [ ] **Regenerate doc snapshots** — deferred: snapshot filenames are content hashes of
      the doc code blocks, so the migrated pages need a docs-snapshot pipeline run
      (Docker + Deephaven server). The emitted `chartOptions` JSON is byte-identical to
      the old flat API (verified), so the regenerated output will match.

**Done when:** the grouped factories exist with tests, `chart()` uses them, all docs
examples use the new shape, and snapshots for the migrated pages are regenerated.

---

## Phase 1b — Group the remaining large `chart()` clusters

Extends Phase 1's grouping to the other flat clusters that meet the same rule (≥~5
sub-options or a `bool`-or-object JS shape). Same conventions: snake_case in → camelCase
JS out, `None` omitted, factories mirror the `watermark_line` pattern.

**Group these:**

- **`time_scale(...)` → `timeScale`** (26 flat opts, biggest win). Drops the inconsistent
  `time_scale_*` / bare-name mix (`time_visible`, `seconds_visible`, `bar_spacing`, …)
  into one object; `visible` / `border_visible` / `border_color` / `ticks_visible` /
  `minimum_height` lose the `time_scale_` prefix.
- **`watermark(...)` → `watermark`** (unifies the single-line shortcut + `lines=[...]`
  multi-line form). Mutual-exclusion validation (text vs lines; single-line styling vs
  lines) moves into the object. `watermark_line()` / `WatermarkLine` stay as the entries
  for `lines=`.
- **`watermark_image(...)` → `imageWatermark`** (6 opts; independent object, can coexist
  with a text watermark).
- **`tooltip(...)` → `tooltip`** (5 opts, master switch). Constructing a `tooltip(...)`
  implies `visible=True`; the "details require visible" validation moves into the object.
- **`handle_scroll: bool | Scroll`** via `scroll(...)` → `handleScroll`, and
  **`handle_scale: bool | Scale`** via `scale(...)` → `handleScale`. The `Union[bool, …]`
  keeps the "all on/off" bool shortcut, which matches the JS API shape exactly.

**Leave flat (deliberately):**

- **localization** (`price_formatter`, `locale`, `tickmarks_price_formatter`, …) — names
  aren't prefix-confusable, so low payoff.
- **panes** — `pane_separator_*` / `pane_enable_resize` are styling, but
  `pane_stretch_factors` / `pane_preserve_empty` are structural per-pane arrays fed to the
  `TvlChart` constructor; grouping would mix two concepts.
- **kinetic scroll** (`kinetic_scroll_touch/mouse`) — only 2 opts, below the threshold.

### Tasks

- [x] Add factories/dataclasses in `options.py`: `time_scale`/`TimeScale`,
      `watermark`/`Watermark`, `watermark_image`/`WatermarkImage`, `tooltip`/`Tooltip`,
      `scroll`/`Scroll`, `scale`/`Scale`.
- [x] Update `chart()`: remove the flat time-scale / watermark / watermark-image /
      tooltip clusters; change `handle_scroll` / `handle_scale` to `Optional[bool | X]`;
      add `watermark=`, `watermark_image=`, `time_scale=`, `tooltip=` params. Update body + docstring. (kinetic scroll + localization + panes stay flat.)
- [x] Translate the `watermark_text=` convenience on `yield_curve` / `options_chart` /
      `custom_numeric` to `watermark=Watermark(text=...)`.
- [x] Export the new factories/types from `__init__` (+ `__all__`).
- [x] Migrate `test_chart.py` (time-scale, watermark, tooltip, scroll/scale suites) and
      extend `TestGroupedConfigObjects`. Also fixed `WatermarkImage.to_dict()` to return
      `{}` without a `url` (an image watermark needs an image).
- [x] Migrate docs (chart, downsampling, large-data, multi-series, styling, time-scale,
      titles-legends, tooltip, watermark) + `dhautofunction` blocks for every new name.

**Done when:** all six factories exist with tests, `chart()` uses them, the full Python
suite + ruff pass, and the affected docs use the new shape. **DONE** — 645 tests pass,
ruff format + lint clean.

---

## Phase 2 — Fix broken examples (`ii` refresh errors)

Several examples throw at runtime. Fix them against the Phase 1 API.

**Root cause (verified):** The example data helpers in
[data.py](plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/data.py)
default to `ticking=True` (they merge a static seed with a `time_table("PT1S")`).
The docs then chain `.update(...)` / `.update_view(...)` formulas that reference
`ii` (or `i`/`k`/column-array vars) onto those ticking tables. Deephaven rejects
`ii`-based formulas on a refreshing table:

```
java.lang.IllegalArgumentException: Formula '...' uses i, ii, k, or column array
variables, and is not safe to refresh.
```

### Affected examples (all fixed)

- [docs/custom-numeric.md](plugins/tradingview-lightweight/docs/custom-numeric.md) — 4 examples (`X = (double)ii`)
- [docs/markers.md](plugins/tradingview-lightweight/docs/markers.md) — 3 examples (`ii % N` filters / `Side = (ii % 20 < 10) ? ...` / `Note = ... + i`)
- [docs/multi-pane.md](plugins/tradingview-lightweight/docs/multi-pane.md) — RSI example (`Math.sin(ii * 0.15)`)
- **[docs/multi-series.md](plugins/tradingview-lightweight/docs/multi-series.md) — SMA example (`Close_[i-1]` column-array), not originally flagged by the reviewer but same root cause.**
- **[docs/price-lines.md](plugins/tradingview-lightweight/docs/price-lines.md) — running-mean example (`avg(Close)` column-array aggregation), same root cause.**

### Fix strategy — **DECIDED: fix in the data package, keep examples ticking**

The examples should stay ticking (that's the point of the fixtures). The real fix is
in [data.py](plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/data.py),
mirroring how `plotly-express` example data works:

1. **Expose a materialized `Index` column** on every fixture (`ohlc`, `stocks`, `volume`,
   `values`, `large_prices` all `.view([..., "Index"])`). `_seeded` already builds `Index`
   safely inside the generator; it was just being dropped by the final `view`. Reading a
   real column downstream is refresh-safe on a ticking table — unlike the `ii`
   pseudo-column. Examples now write `X = (double)Index`, `Index % 20`, `Math.sin(Index * ...)`,
   `where("Index % 10 == 0")` on the still-ticking tables.
2. **Use `update_by` (tick-based rolling ops) for genuine windows.** The two column-array
   cases (SMA `Close_[i-1]`, running mean `avg(Close)`) can't be expressed with `Index`;
   they use `rolling_avg_tick(...)` instead, which is refresh-safe and the idiomatic
   Deephaven way (plotly-express uses `update_by` throughout its generators).

Rejected: `ticking=False` (defeats the ticking fixtures) and re-asserting the
`AddOnly`/`AppendOnly` table attributes after `update_by` (a hack that fights the engine —
`update_by` legitimately drops those attributes).

### Tasks

- [x] Audit every `.update`/`.update_view`/`.where` in the docs for `i`/`ii`/`k`/column-array
      usage on a ticking source. Found the 5 files above; other `update_view` calls use
      only column refs / constants / ternaries and are refresh-safe on ticking tables.
- [x] **data.py:** revert `_seeded` to the plotly-express-style `merge(static, time_table)`
      (no append-only tricks) and add `Index` to every generator's `.view([...])`; document
      the new column.
- [x] **docs:** replace `ii`/`i` with `Index` (custom-numeric, markers, multi-pane) and
      convert the two window formulas to `update_by(rolling_avg_tick(...))` (multi-series
      SMA, price-lines MA). All examples stay ticking.
- [x] Validate against a live embedded Deephaven server: `Index` is exposed, tables are
      refreshing, and every corrected formula runs without the "not safe to refresh" error.
- [ ] Regenerate the affected doc snapshots (server-backed docs pipeline; same dependency
      as Phase 1). Note: exposing `Index` adds a column to the raw-table widgets shown in a
      few `order=...,ohlc` snapshots.

**Done when:** all flagged snippets run without error and their snapshots are regenerated.
**Code fix DONE and live-validated**; only snapshot regen remains (server pipeline).

---

## Phase 3 — Functional / rendering bug fixes

Behavioral issues that need reproduction and likely code (not just docs) fixes.

### Tasks

- [x] **Time-scale resets on tick** — [docs/time-scale.md](plugins/tradingview-lightweight/docs/time-scale.md#L27) line 27 (reviewer: "I zoomed in but the layout is resetting on tick"). **Fixed:** the zoom/pan-interaction tracking (which arms `userInteractedRef` so ticks stop re-fitting) lived inside `setupDownsampleSubscriptions`, only called when `model.isResampling()`. Plain ticking charts never tracked interaction, so every tick hit `fitContent()`. Now `setupDownsampleSubscriptions` runs for all charts ([TradingViewChart.tsx](plugins/tradingview-lightweight/src/js/src/TradingViewChart.tsx#L935)); its `performResample`/`performAutoBin` calls are already no-ops when not resampling. Regression test added (`tracks zoom on a non-resampled ticking chart…`).
- [x] **Events viewport churn** — [docs/events.md](plugins/tradingview-lightweight/docs/events.md#L125) line 125 (reviewer: "constantly 'waiting for viewport' and I only get one event in there"). **Not a code bug:** `table_publisher` returns a **blink** table (rows live one cycle), so the widget shows one press then clears. Server-side repro confirmed all presses land (6/6 into an append-only view). **Fixed the example** to expose `clicks = blink_to_append_only(clicks_blink)` so presses accumulate.
- [x] **Price-scale example shows no data** — [docs/price-scale.md](plugins/tradingview-lightweight/docs/price-scale.md#L85) line 85 (reviewer: "this starts showing no data"). **Root cause:** `auto_scale=False` was applied before any data, so LWC froze the scale at a default range with the series off-screen. Freezing a scale at a _fitted_ range isn't achievable via the LWC API (no set-price-range; `setAutoScale(false)` after data raced the internal fit and locked a bad range in testing). **Resolution:** the renderer now coerces `autoScale:false` → `true` (per-series and chart-level) so the data is always visible, and the misleading "lock the visible range" doc example was removed. Renderer tests updated. _(Freezing-at-a-fixed-range is not supported; `auto_scale` currently always auto-fits.)_
- [x] **Multiple-axes behavior mismatch** — [docs/multiple-axes.md](plugins/tradingview-lightweight/docs/multiple-axes.md#L165) line 165 (reviewer: "This is the opposite of what I see"). **Root cause:** LWC's `tickMarkDensity` is inverted — _"A higher value results in more spacing … and thus fewer tick marks"_ (typings.d.ts). The docs claimed higher = more ticks. **Fixed the prose + example values** in `multiple-axes.md`, `price-scale.md`, and the `tick_mark_density` docstring in `options.py`.

> **Histogram binning gaps + borders** ([docs/histogram.md](plugins/tradingview-lightweight/docs/histogram.md#L68) lines 68 & 122) has been moved to **Phase 7** (parked / future work) below.

**Done when:** each bug is reproduced, fixed (or confirmed not-a-bug with the doc
corrected), and the relevant example + snapshot updated. _(Code/doc fixes done; doc
snapshots for the affected pages still need a pipeline run.)_

---

## Phase 4 — Contrast / rendering polish in examples

Multiple examples use low-contrast gray styling that is unreadable in dark mode.

### Tasks

- [x] [docs/candlestick.md](plugins/tradingview-lightweight/docs/candlestick.md#L126) — line 126: replace the gray demo palette with a dark-mode-legible one. **Done:** bumped the neutral `gray-500`/`gray-400` demo tokens to higher-contrast `gray-800`/`gray-700`.
- [x] [docs/multi-pane.md](plugins/tradingview-lightweight/docs/multi-pane.md#L131) — line 131: same gray-contrast issue. **Done:** volume fills `rgba(120,120,120,0.5)` → visible `rgba(96,165,250,0.5)`.
- [x] [docs/price-scale.md](plugins/tradingview-lightweight/docs/price-scale.md#L114) — line 114: poor contrast. **Done:** dark `#444`/`#666` scale text → `#a0a0a0`.
- [x] [docs/titles-legends.md](plugins/tradingview-lightweight/docs/titles-legends.md#L196) — line 196: "quite difficult to see". **Done:** black watermarks (invisible on the dark theme) → mid-gray `rgba(150,150,150,…)`.
- [x] Global sweep for the shared gray palette; standardized volume fills, scale text, and watermark colors across chart/multi-series/multiple-axes/watermark pages.

**Done when:** dark-mode screenshots confirm legible contrast on all flagged pages and
snapshots are regenerated. _(Color edits done; screenshots + snapshot regen pending a pipeline run.)_

---

## Phase 5 — Documentation clarity, pruning, and comments

Tighten prose, remove redundant/overly-technical material, and add code comments.

### Prune / simplify

- [x] [docs/autobin.md](plugins/tradingview-lightweight/docs/autobin.md#L148) — removed the internal "Current status" section (notes/todo, commit hashes, source line refs).
- [x] [docs/autobin.md](plugins/tradingview-lightweight/docs/autobin.md#L39) — replaced the technical "Algorithm" section with a light "How the bin width is chosen" summary.
- [x] [docs/downsampling.md](plugins/tradingview-lightweight/docs/downsampling.md#L12) — raised the intro to a higher level (automatic / transparent).
- [x] [docs/downsampling.md](plugins/tradingview-lightweight/docs/downsampling.md#L128) — fixed the misleading "turn it off" heading ("Downsampling is always on").
- [x] [docs/downsampling.md](plugins/tradingview-lightweight/docs/downsampling.md#L66) — added the ~30s large-fixture init note. (Also de-duplicated a repeated `fix_left_edge` sentence.)
- [x] [docs/large-data.md](plugins/tradingview-lightweight/docs/large-data.md#L12) — kept but reframed as the "sizing + cost model" overview (points to downsampling/autobin for mechanics), reducing redundancy rather than dropping the page.
- [x] [docs/large-data.md](plugins/tradingview-lightweight/docs/large-data.md#L149) — clarity pass (intro reframe + benchmarking removal).
- [x] [docs/large-data.md](plugins/tradingview-lightweight/docs/large-data.md#L188) — removed the internal "Benchmarking notes" section (`AGENTS.md`, `dh exec`, `notes/` scripts).
- [x] [docs/markers.md](plugins/tradingview-lightweight/docs/markers.md#L209) — made the JS-connection mention terse.

### Clarify wording

- [x] [docs/multiple-axes.md](plugins/tradingview-lightweight/docs/multiple-axes.md#L26) — let the variables speak: `price_scale_id` options are `"left"` and `"right"` (the default).

### Add code comments

- [x] [docs/multi-series.md](plugins/tradingview-lightweight/docs/multi-series.md#L89) — added inline comments to the SMA/watermark overlay example.

**Done when:** flagged pages are trimmed/clarified, redundant pages merged or removed
(sidebar/index updated), and comments added. _(Editorial edits done; large-data kept-and-reframed rather than dropped.)_

---

## Phase 6 — Code style in examples

- [x] [docs/line.md](plugins/tradingview-lightweight/docs/line.md#L107) — replaced the two unpacked `*[… for …]` list comprehensions (line-styles, line-types) with a named helper (`styled_line` / `typed_line`) + an explicit list. Both blocks validated against a live server.

**Done when:** the comprehension (and any similar occurrences) is replaced with a clearer
named-function form and the examples still run. **DONE.**

---

## Phase 7 — Histogram binning gaps + borders (parked / future work)

**Status: PARKED.** A first implementation attempt was made and then fully reverted at the
maintainer's request; do the other phases first. This section preserves the root-cause
analysis and everything learned so a future attempt can resume without re-deriving it.

**Symptoms** ([docs/histogram.md](plugins/tradingview-lightweight/docs/histogram.md#L68) line 68 = visible borders between bars; [#L122](plugins/tradingview-lightweight/docs/histogram.md#L122) line 122 = large gaps):

- The plugin renders histograms with LWC's **built-in `HistogramSeries`**, which draws a **fixed pixel-width bar per data point** (`round(barSpacing) − 1`), _not_ a bar spanning the time-bin width. That inherent 1px gap is the "borders between bars" (line 68) — LWC has no touching-bar / `bargap=0` option.
- To fake a proportional time axis on LWC's ordinal scale, the plugin adds a **dense whitespace "scaffold" series** (~`width*2` points across the full range; `minBarSpacing: 0.01`) whenever it resamples/auto-bins ([TradingViewChart.tsx `updateScaffold`](plugins/tradingview-lightweight/src/js/src/TradingViewChart.tsx#L417)). Server autobin drops empty bins (`agg_by(by=["__Bin"])` in [auto_bin.py](plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/auto_bin.py#L212)). Combined, sparse bins land at their true time positions among thousands of scaffold slots → **thin bars separated by large time-proportional gaps** (line 122). (The `replayAllData` comment claiming "just two bookend whitespace points" for autobin is **stale**; `updateScaffold` always goes dense.)
- The client already has what a custom renderer would need: `binWidthNs` + `fullRangeNs` per series via `getAutoBinMeta()` ([TradingViewTypes.ts `TvlAutoBinMeta`](plugins/tradingview-lightweight/src/js/src/TradingViewTypes.ts#L38)).

**Attempted fix (custom histogram series) — reverted.** A custom LWC series
(`chart.addCustomSeries` + `ICustomSeriesPaneView`, `ContinuousBarsSeries.ts`) covering all
three ordinal types (Histogram/Candlestick/Bar), opt-in via a per-series `continuous=True`
and a chart-level `continuous_bars=True`. All of it was reverted: `ContinuousBarsSeries.ts`

- tests, the `createSeries` routing in `TradingViewChartRenderer.ts`, `continuous?` on
  `TvlSeriesConfig`, the mock's `addCustomSeries`/`customSeriesDefaultOptions`, the Python
  `continuous`/`continuous_bars` params in `series.py`/`chart.py`, `TestContinuousBars`, and
  the histogram/candlestick/bar doc mentions.

**What was tried, in order, and what each taught us:**

1. **Global bin-pixel width** (`min` adjacent `bars[i+1].x − bars[i].x`, draw every bar that wide, centered). → Correct at some zooms, wrong at others. **Why:** the dense scaffold is spaced by an _evenly-spaced-in-time_ whitespace grid, and `binWidthNs / scaffoldStep` is non-integer, so the scaffold-index count between adjacent bins **jitters ±1**. A single global width can't tile jittered positions — borders/overlaps at some zooms only.
2. **Neighbor-midpoint edges with a median-bin threshold** (a bar meets its neighbor at the shared pixel midpoint when the gap is ≤ ~1.5× the median gap; else keep its own width). → Still gappy/inconsistent. **Why:** a pixel-based "is this an empty bin?" threshold is fundamentally ambiguous when scaffold jitter and real empty-bin gaps are similar sizes.
3. **Time-based adjacency** (decide bins from each bar's _time_ — `bar.originalData.time`, exact integer epoch seconds; `binCount = round(Δtime / minΔtime)`; fill `Δpixels / (2·binCount)` toward each neighbor, so adjacent bars share the exact midpoint and n-bin gaps stay proportional). → **Verified correct in isolation:** simulating the real shipped auto-bin data (`build_histogram_view` on `large_prices` at full / 1-day / 1-hour zoom) and running this logic on the actual time deltas gives `binCount = 1` for every body bin at every zoom (bodies are contiguous; the only large deltas are the far-off head/tail anchors). Jest geometry tests (jitter regression + large-gap) passed. **But the browser still showed thin, gappy bars.**

**Key blockers (the reasons it's parked):**

- **The custom series never actually rendered on the auto-bin path in-browser.** Thin far-apart bars on a dense scaffold are the signature of the **built-in `HistogramSeries`**, i.e. the `continuous` flag/routing was being lost between the wire and `createSeries` **specifically for auto-binned series** (non-auto-binned continuous series _did_ render touching). Not yet traced — prime suspect is the `AUTOBIN_FIGURE` / figure-rebuild path in [listener.py](plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/communication/listener.py) dropping `continuous`, **or** a stale cached browser bundle (reinstalls need a hard reload + re-running the script).
- **Proportional gaps require the scaffold, which only exists when resampling.** `enableScaffold = model.isResampling()` ([TradingViewChart.tsx](plugins/tradingview-lightweight/src/js/src/TradingViewChart.tsx#L522)). A histogram below the auto-bin threshold (`AUTO_BIN_THRESHOLD = 2 × TARGET_BINS = 500` rows) renders on the plain **ordinal** scale, where equal index spacing **collapses real time gaps** to one step — so a small, non-auto-binned histogram can never show a proportional gap regardless of the renderer. A future "continuous" feature must decide whether to force the scaffold on for continuous ordinal series (bigger change) or restrict the feature to the resampled path.

**Retry checklist (future):**

1. Trace `continuous` through `listener.py`'s figure rebuild and the client figure parse to confirm whether the built-in series is what renders on the auto-bin path.
2. Rule out bundle caching (hard reload) before trusting any in-browser observation.
3. If routing is fixed, resume from the **time-based geometry (attempt #3)** — it's the validated approach.
4. Decide the small-table (no-scaffold) behavior.
5. In-browser visual validation is mandatory — jest geometry tests are necessary but not sufficient.
6. Optional: **zero-fill empty bins server-side** in `build_histogram_view` so "empty bin" reads as an explicit 0-height bar rather than absent (cleaner semantics once the renderer draws fixed bin-width rects).

**Done when:** borders are gone on contiguous bins, gaps appear only for genuinely-empty
bins, the behavior is stable across zoom levels and verified in-browser, and the example +
snapshot are updated.

---

## Phase 8 — Frozen price scale (`auto_scale=False`) (parked / future work)

**Status: PARKED.** In Phase 3 the reviewer's "shows no data" bug was resolved by
coercing `autoScale:false` → `true` so the data is always visible — but that means
`auto_scale=False` no longer actually **freezes** the scale (it always auto-fits). This
phase is to restore a working "freeze the price scale at a fixed range" behavior, which
several attempts could not land reliably.

**Goal:** `auto_scale=False` should fit the visible data **once** on load, then hold that
range so the axis numbers don't rescale as the user zooms (per the original doc promise).

**What was tried (Phase 3) and why each failed:**

- **Per-series `priceScale().applyOptions({autoScale:false})` before data** → LWC freezes at a default range with the series off-screen (the original "no data").
- **Force `autoScale:true`, then `setAutoScale(false)` after the first data update (per-series + chart-level via `chart.priceScale('right')`)** → froze at a bad range; the whole series squished to a dot at the top of the pane. LWC computes the price range lazily during its own paint, so freezing in the same handler locks a pre-fit range.
- **Defer the freeze one frame (`requestAnimationFrame`)** → same squish; our rAF still ran before LWC's internal fit.
- **Freeze on the _second_ data-present update (deterministic, skip the first "fit + paint" pass)** → still squished. Could not reliably observe when LWC's fit had actually applied.

**Root difficulty:** lightweight-charts exposes **no public "set price range"** API and no
signal for "the auto-fit has been computed." `IPriceScaleApi` has only `setAutoScale(on)`,
`applyOptions`, `options`, `width`. So "fit once then freeze" depends on winning a race
against LWC's lazy range computation, which we couldn't do blind.

**Retry ideas (need live browser inspection — don't do this blind):**

1. **Use browser devtools / the agent browser tools** to inspect the actual price range on the LWC scale after data loads (e.g. read back via `priceToCoordinate` at known values) — establishes ground truth for _when_ the fit lands and _what_ range gets frozen. All four failed attempts were blind; this is the missing piece.
2. **Capture the fitted range explicitly and re-apply it.** After the first painted data, sample `series.priceToCoordinate()` at the data min/max to derive the visible price range, then hold it — LWC has no setter, but a `MutationObserver`/`ResizeObserver`-driven re-assert, or a very small custom price-scale, could pin it.
3. **Freeze on a paint signal, not a guess.** A double-`requestAnimationFrame`, or subscribing to LWC's own crosshair/size events as a "has painted" proxy, may land after the lazy fit where single-rAF / second-update did not.
4. **Upstream option.** Check whether a newer lightweight-charts exposes a set-visible-price-range (or file a feature request); it would make this trivial.
5. **Reinstate the doc example** ("Turn off auto-scale to lock the visible range") and the honest `auto_scale` docstring only once the freeze actually works in-browser.

**Done when:** `auto_scale=False` renders the data framed correctly **and** the axis stays
fixed across zoom, verified in-browser; the price-scale doc example + `options.py`
docstring are restored to describe real behavior.

---

## Final verification (run before requesting re-review)

- [ ] Every doc code snippet runs without error against a live server.
- [ ] Dark-mode screenshots confirm readable contrast on the flagged pages.
- [ ] All doc snapshots regenerated and committed.
- [ ] JS/Python unit tests pass (including the new grouped-config factory tests).
- [ ] Reply to each review thread with the resolution (fixed / clarified).
