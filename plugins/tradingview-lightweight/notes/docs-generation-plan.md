# Detailed Prompt Plan — Comprehensive Docs for `tradingview-lightweight`

Plan for using sub-agents to generate comprehensive docs for the TVL plugin
that match the structure, tone, and level of detail of `plugins/ui/docs/`
and `plugins/plotly-express/docs/`.

Reference reading done:
- `plugins/plotly-express/docs/` — full tree (README, sidebar.json, index.rst,
  candlestick.md, line.md, multiple-axes.md, plot-by.md, titles-legends.md,
  example-data.md, limitations.md)
- `plugins/ui/docs/` — sidebar.json, button.md, installation.md
- `plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/`
  — `__init__.py`, `chart.py`, `series.py`, `markers.py`, `options.py`, `utils.py`
- `plugins/tradingview-lightweight/notes/api-reference/` (referenced via INDEX)

---

## 1. Reverse-engineered doc conventions (the "house style")

Both `plotly-express/docs/` and `ui/docs/` share the same patterns. New docs must conform.

| Convention | Rule |
|---|---|
| **Page opener** | One paragraph defining the chart/concept; one paragraph saying when to use it; bulleted "What are X useful for?" with 2–4 items. |
| **Examples** | Each example has a 1–2 sentence lead-in, then a fenced ```python order=var1,var2,table``` block. The `order=` directive lists every variable created in the snippet, table dependencies last. Snippets must be **runnable as-is** in a DH console. |
| **Imports inside every snippet** | Every code block re-imports (`from deephaven.plot import tradingview_lightweight as tvl`) and re-creates demo data. No "see above". |
| **API Reference tail** | Closing block: ```{eval-rst} .. dhautofunction:: deephaven.plot.tradingview_lightweight.<name>``` — once per function described on the page. |
| **No cross-page state** | Each page stands alone. Cross-references use relative `[link](page.md)` only. |
| **Top-level files** | `README.md` (intro + card grid), `index.rst` (`:glob: *`), `sidebar.json` (Salmon-Sync schema), `installation.md`, `example-data.md`, `limitations.md`. `_assets/` for SVG card icons; `snapshots/` for diff testing. |
| **Tone** | Direct, technical, third-person. No emojis. No marketing voice. Sentences end with periods, not exclamations. |

---

## 2. Surface area to cover (extracted from source)

This is the canonical inventory each agent must hit. The completeness auditor (Wave 5) checks docs against this list — anything not appearing in at least one example is a coverage gap.

**Chart constructors** (10): `chart`, `candlestick`, `line`, `area`, `bar`, `baseline`, `histogram`, `yield_curve`, `options_chart`, `custom_numeric`.

**Series builders** (6): `candlestick_series`, `bar_series`, `line_series`, `area_series`, `baseline_series`, `histogram_series`.

**Markers/lines** (7): `Marker`, `marker()`, `up_down_markers()`, `MarkerSpec`, `markers_from_table()`, `PriceLine`, `price_line()`.

**chart() kwarg groups** (~150 kwargs total — every one needs an example): chart_type, yield curve options, layout (background solid+gradient, text_color, font_size, attribution_logo, color_space), grid (vert/horz × visible/color/style), crosshair (mode + vert+horz: width/color/style/visible/label_visible/label_bg + do_not_snap), right/left/overlay price scale (visible/border/auto_scale/mode/invert/align_labels/text_color/entire_text_only/ticks_visible/min_width/ensure_edge/margins), time scale (time_visible, seconds_visible, border, right_offset, right_offset_pixels, bar_spacing min/max, fix_left/right_edge, lock_visible, right_bar_stays, shift_visible_range, allow_shift_whitespace, ticks_visible, tick_mark_max_chars, uniform_distribution, minimum_height, allow_bold_labels, ignore_whitespace, **conflation** (enable, threshold_factor, precompute_on_init, precompute_priority), visible), watermark (text path × multi-line `WatermarkLine` × image path: url/max_w/max_h/padding/alpha/visible), scroll (handle_scroll bool + 4 sub-bools), scale (handle_scale bool + 4 sub-bools), kinetic (touch/mouse), localization (price_formatter, locale, tickmarks_price_formatter, percentage_formatter, tickmarks_percentage_formatter), panes (separator color/hover, enable_resize, stretch_factors, preserve_empty), sizing (width/height/auto_size), tracking_mode_exit_mode, add_default_pane.

**Per-series kwarg groups**: visual (color/up_color/down_color/border*/wick* per type, top/bottom colors, base_value, relative_gradient, invert_filled_area, line_width/style/type/visible, point_markers, crosshair_marker, last_price_animation), common (last_value_visible, title, visible, price_scale_id, price_format, price_line_*, base_line_*), price-scale-options (auto_scale, scale_margin_top/bottom, scale_mode, scale_invert, scale_align_labels, scale_border_visible/color, scale_text_color, scale_entire_text_only, scale_visible, scale_ticks_visible, scale_minimum_width, scale_ensure_edge_tick_marks_visible), data (color_column/border_color_column/wick_color_column/etc.), pane, markers, price_lines, marker_spec.

**Enums** (every literal value documented): `LineStyle` (5), `LineType` (3), `LineWidth` (4), `CrosshairMode` (4), `HorzAlign` (3), `VertAlign` (3), `PriceScaleMode` (4), `MarkerShape` (4), `MarkerPosition` (6), `PriceFormatter` (7), `TickmarksPriceFormatter` (7), `PercentageFormatter` (4), `TickmarksPercentageFormatter` (4), `ChartType` (4), `ColorSpace` (2), `PrecomputeConflationPriority` (3), `ColorType` (2), `LastPriceAnimationMode` (3), `MarkerSign` (3), `MismatchDirection` (3), `PriceLineSource` (2), `TickMarkType` (5), `TrackingModeExitMode` (2). Plus `PriceFormat` TypedDict, `WatermarkLine` dataclass, `BusinessDay`/`business_day`, `is_business_day`, `is_utc_timestamp`.

**Concepts**: multi-series via `chart(*series)`, multi-pane (`pane=` + `pane_stretch_factors` + `pane_preserve_empty`), partition `by=` (line/area), markers (static list), markers from table, dynamic price line (column-driven), ticking tables + liveness, downsampling (zoom/double-click reset), yield-curve / options / custom-numeric x-axes.

**Limitations**: PriceFormatCustom blocked, `createChartEx`/horzScaleBehavior unsupported, `colorParsers` unsupported, callable tick mark formatters unsupported, `attachPrimitive` unsupported, custom series unsupported, font customization disallowed (Fira fixed), single-line vs. multi-line watermark exclusivity, gradient background mutual exclusion.

---

## 3. Target doc tree (what the agents will produce)

```
plugins/tradingview-lightweight/docs/
├── README.md                  # intro + card grid + quickstart
├── index.rst                  # :glob: *
├── sidebar.json               # Salmon-Sync schema
├── installation.md
├── example-data.md            # demo tables for every example
├── limitations.md
├── tutorial.md                # hello-world → multi-pane finance dashboard
├── chart-types/
│   ├── candlestick.md         # candlestick() + candlestick_series()
│   ├── bar.md                 # bar() + bar_series()
│   ├── line.md                # line() + line_series()
│   ├── area.md
│   ├── baseline.md
│   ├── histogram.md
│   ├── yield-curve.md
│   ├── options-chart.md
│   └── custom-numeric.md
└── concepts/
    ├── multi-series.md        # chart(*series) — overlays, mixed types
    ├── plot-by.md             # partition_by `by=`
    ├── panes.md               # multi-pane layout, stretch factors
    ├── markers.md             # Marker / up_down_markers / markers_from_table
    ├── price-lines.md         # PriceLine static + column-driven
    ├── price-scales.md        # left/right/overlay, modes, scale_id wiring
    ├── time-scale.md          # time_visible, bar_spacing, conflation
    ├── crosshair-and-grid.md
    ├── watermarks.md          # text / multi-line / image
    ├── colors-and-theming.md  # background gradient, color_space, color_column
    ├── localization.md        # locale + named formatters
    ├── interaction.md         # scroll/scale/kinetic/tracking_mode
    ├── ticking-tables.md      # liveness, snap-to-live, downsampling UX
    ├── chart-types-reference.md  # standard vs yield_curve vs options vs custom_numeric
    └── enums-reference.md     # one section per Literal/TypedDict/dataclass
```

That's ~25 pages. Each owns a slice of the surface area. Nothing overlaps; every kwarg has exactly one home page.

---

## 4. Coverage strategy — how the prompt enforces "every option"

This is the key part. Five mechanisms make the prompts produce full coverage rather than a plausible-looking subset.

**Mechanism A — A canonical inventory file is generated first, before any prose.** Wave 1 produces `docs/_coverage/inventory.json` by introspecting the Python source. Every chart/series/marker function gets its full kwarg list (with type, default, allowed Literal values) extracted via `inspect.signature` + AST parsing of `Literal[...]` aliases in `options.py`. Every page's prompt receives **its slice** of this JSON and is told *"each key listed here must appear in at least one runnable example on this page; quote the inventory file in your reasoning when you write the page."* Without a machine-readable target, agents will silently drop options.

**Mechanism B — Each page prompt names the exact kwargs to demonstrate.** Generic prompts like "document `line()`" produce shallow output. The prompt for `line.md` instead lists: *"Examples must collectively exercise: `time`, `value`, `color`, `line_width` (all of 1/2/3/4), `line_style` (all 5 values), `line_type` (all 3), `line_visible`, `point_markers_visible+radius`, all 5 `crosshair_marker_*`, `last_price_animation` (all 3), `last_value_visible`, `title`, `visible`, `price_scale_id`, `price_format` (price/volume/percent), every `price_line_*`, every `base_line_*`, `auto_scale`, `scale_margin_top/bottom`, `scale_mode` (all 4), every `scale_*`, `color_column`, `pane`, `markers`, `price_lines`, `marker_spec`."* This list comes from inventory.json — the prompt builder, not the human, populates it.

**Mechanism C — One example per "axis of variation," not one per kwarg.** Naively writing one snippet per option produces 200 near-identical blocks. The prompt instead requires *grouped* examples: one snippet that varies all 5 `line_style` values side-by-side (using `chart(line_series(...), line_series(...), ...)`), one that toggles every `crosshair_marker_*` together, one that walks every `PriceScaleMode`. The prompt phrases this as *"each enum should appear as a multi-series snippet showing all values; each boolean group should appear as a paired before/after."* This pattern is borrowed from `multiple-axes.md` and `plot-by.md`.

**Mechanism D — Mutually-exclusive and validated combinations get explicit "wrong way" examples.** The Python code raises on background_color + gradient, watermark_text + watermark_lines, marker `at_price_*` without `price`, PriceLine with both `price` and `column`, yield_curve with non-Line/Area series, PriceFormatCustom. The prompt requires each of these to be shown both ways: a working example and a brief "this raises ValueError" callout. Agents tend to omit the negative cases without an explicit instruction.

**Mechanism E — A dedicated auditor agent in Wave 5 that does not write docs.** Its sole job: load `inventory.json`, walk every doc file, regex-grep for each kwarg name in code fences, and produce `docs/_coverage/gaps.md` listing what's missing per page. It also runs each snippet's `order=` list against the snippet body to confirm every variable mentioned actually exists. Page-author agents in Wave 6 only get assigned the gaps.

Mechanisms A and E together turn coverage from "trust the agent" into a closed loop: machine-extracted target → text generation → machine verification → targeted patching.

---

## 5. Wave plan and the actual prompt text

Twelve+ agents in seven waves. Coordinator runs no research itself — the inventory file is the single source of truth.

### Wave 1 — Foundation (1 agent, blocking)

**Agent 1: Inventory Extractor.** No prose, no markdown. Output a single file.

> Produce `plugins/tradingview-lightweight/docs/_coverage/inventory.json` by introspecting the Python source under `src/deephaven/plot/tradingview_lightweight/`. For every public function in `__all__` of `__init__.py`, capture `{name, module, kind: "chart"|"series"|"marker"|"util"|"dataclass"|"typed_dict"|"literal", params: [{name, type_repr, default_repr, literal_values_if_any}], docstring_summary}`. For every `Literal[...]` alias and `TypedDict` in `options.py`, capture name and full value list. For every dataclass (`SeriesSpec`, `Marker`, `PriceLine`, `MarkerSpec`, `WatermarkLine`, `BusinessDay`), capture fields. Use `inspect` for signatures and `ast` for Literal alias parsing — do not rely on docstrings. Schema: top-level keys `chart_constructors`, `series_builders`, `markers`, `enums`, `dataclasses`, `typed_dicts`, `utils`. This file is the contract every later agent is graded against. Do not edit any docs.

### Wave 2 — Scaffolding (3 parallel agents)

**Agent 2: Demo Data Fixture.** Build `tests/app.d/tvl_doc_data.py` exporting deterministic ticking and static tables every page can `import` from: `ohlc_minute` (Sym × OHLCV × Timestamp), `prices_tick` (single-symbol ticking line/area), `multi_sym_prices` (for `by=`), `signals` (for marker tables: time + position + shape + color + text + price columns), `yield_curve_data` (Maturity + Yield), `options_iv` (Strike + IV), `volume_hist`, `dynamic_levels` (last-row driven price line). The Python doc snippets will reference these; the fixture must already work in the dev server. Mirror the API of `dx.data.stocks()` etc. in plotly-express's `example-data.md`.

> The prompt explicitly forbids per-page synthetic data: "every code block in every doc must use one of the tables from this fixture, accessed via `from deephaven.plot.tradingview_lightweight.data import ...`. Do not hand-roll `empty_table().update(...)` inside doc snippets — it makes the docs untestable and inconsistent with plotly-express conventions."

**Agent 3: Top-level Files.** Generate `README.md` (mirroring `plotly-express/docs/README.md`: tagline, key features bulleted, `<CardList>` card grid grouped by chart type and concepts, quickstart, terminology if needed, contributing, license — but rewritten for the TVL feature set: real-time, ticking, downsampling, multi-pane), `index.rst` (`:glob: *`), `sidebar.json` (Salmon-Sync schema, pages grouped: Introduction → Chart Types → Concepts → Reference → Limitations), `installation.md` (pip install, Docker, plugin entry-point, version compat), `limitations.md` (every "intentionally not implemented" / "is not supported" comment in `chart.py` and `options.py` becomes a section).

**Agent 4: Chart-Types Index Stub Pages.** Create empty stubs for the 9 chart-type pages and the 15 concept pages with frontmatter heading and the `dhautofunction` block at the bottom — populated by later waves. Required so later agents can cross-link without 404s.

### Wave 3 — Chart-type pages (9 parallel agents, one per chart type)

Each agent gets the **same prompt template** with placeholders filled from `inventory.json`. The template:

> You are writing `docs/chart-types/{name}.md` for the deephaven-plugins TVL plugin. Match the exact structure of `plugins/plotly-express/docs/candlestick.md` and `plugins/plotly-express/docs/line.md`: opening definition paragraph, "What are X useful for?" bullets, `## Examples` section with multiple `### Subheading` examples each preceded by a one-sentence lead-in and using `python order=...` code blocks, closing `## API Reference` with `dhautofunction`. Every snippet must `import deephaven.plot.tradingview_lightweight as tvl` (alias `tvl` is the established convention — confirmed in `src/README.md`), use a table from the doc data fixture, and end with assignment to a chart variable. **Do not redefine tables inline** — import from the fixture.
>
> **Coverage contract (non-negotiable)** — every kwarg in this slice of `inventory.json` must appear in at least one code block on this page. Slice for `{name}`: `{paste filtered inventory subset}`. Group enum-valued kwargs into one snippet that demonstrates *every* literal value side-by-side via multiple series in a single `chart(...)` call. Group boolean kwargs into paired before/after snippets. Each `_column` parameter (data-driven coloring) gets its own snippet using a column from the fixture. Every kwarg in the slice with a `Literal[...]` type must have all its values exercised, not just one.
>
> **Required example sections, in this order**:
> 1. *Basic usage* — minimal call, defaults only
> 2. *Convenience function vs. `chart(<series>)` form* — both styles, equivalent output
> 3. *Visual styling* — colors, line widths/styles/types
> 4. *Data-driven coloring* — `*_column` params
> 5. *Price scale options* — `scale_*` family + `auto_scale` + margins
> 6. *Series options common* — title, visible, last_value_visible, price_format
> 7. *Price line and base line* — every `price_line_*` + `base_line_*`
> 8. *Markers and price lines* — `markers=`, `price_lines=`, `marker_spec=` (link to concepts/markers.md and concepts/price-lines.md)
> 9. *Multi-pane placement* — `pane=` (link to concepts/panes.md)
> 10. *Ticking data behaviour* — call out `last_price_animation`, downsampling, snap-to-live (link to concepts/ticking-tables.md)
> 11. *Type-specific options* — for candlestick: wick/border up/down; for area: top/bottom colors, gradient, invert_filled_area; for baseline: base_value, top/bottom fill; etc.
>
> Close with `## API Reference` containing two `dhautofunction` blocks: one for the convenience function, one for the `_series` builder.
>
> **What you must NOT do**: invent kwargs not in inventory.json; inline `empty_table()` snippets; produce screenshots or refer to images that don't exist; use `xaxis_sequence`/`yaxis_sequence` (those are plotly-express; TVL uses panes); document `attachPrimitive`, `colorParsers`, custom series, or `createChartEx` (these are explicitly unsupported — see `limitations.md`).
>
> **Output**: only the markdown file. Report at the end: which inventory keys you used in which section, and any kwargs you couldn't naturally demonstrate (these become Wave 5 audit input).

The 9 chart-type agents run in parallel. Each owns *only* its own page — overlapping concerns (markers, panes, etc.) link out to concept pages that Wave 4 produces in parallel.

### Wave 4 — Concept pages (12 parallel agents)

One agent per concept page. Each gets the same kind of slice-and-contract prompt, but the slices are cross-cutting:

- **multi-series.md** owns `chart(*series)` composition, mixing series types, shared vs. separate price scales (`price_scale_id`).
- **plot-by.md** owns `by=` on `line()`/`area()`, partition tables, ticking partition discovery, color cycling.
- **panes.md** owns `pane`, `pane_stretch_factors`, `pane_preserve_empty`, `pane_separator_*`, `pane_enable_resize`, `add_default_pane`.
- **markers.md** owns `Marker`, `marker()`, `up_down_markers()`, `MarkerSpec`, `markers_from_table()`, every `MarkerShape`/`MarkerPosition`, `MarkerSign`, the price-position `price` requirement.
- **price-lines.md** owns `PriceLine`, `price_line()`, both static `price=` and dynamic `column=` forms, `axis_label_*`, `line_visible=False` axis-only label.
- **price-scales.md** owns left/right/overlay scale options, `PriceScaleMode` (all 4), `price_scale_id` wiring across series, `scale_margins`, `entire_text_only`, `align_labels`, `ensure_edge_tick_marks_visible`.
- **time-scale.md** owns every `timeScale` kwarg including conflation (`enable_conflation`, `conflation_threshold_factor`, `precompute_conflation_on_init`, `precompute_conflation_priority` with all 3 priorities), `bar_spacing`/`min_bar_spacing`/`max_bar_spacing`, `right_offset` vs `right_offset_pixels`, `fix_left_edge`/`fix_right_edge`, `lock_visible_time_range_on_resize`, `tick_mark_max_character_length`, `uniform_distribution`, `ignore_whitespace_indices`, `BusinessDay`/`business_day`/`is_business_day`/`is_utc_timestamp`.
- **crosshair-and-grid.md** owns crosshair (all 4 `CrosshairMode`s, vert+horz line subtree, `do_not_snap_to_hidden_series`) and grid (vert+horz lines).
- **watermarks.md** owns *both* the single-line shortcut and the `WatermarkLine` multi-line API plus the image watermark, with worked exclusivity examples and a ValueError demo.
- **colors-and-theming.md** owns background solid + gradient + mutual-exclusion ValueError, `color_space` srgb/display-p3, `text_color`, `font_size`, `attribution_logo`, `*_column` data-driven coloring patterns shared across series types.
- **localization.md** owns `locale`, all `PriceFormatter`/`TickmarksPriceFormatter`/`PercentageFormatter`/`TickmarksPercentageFormatter` named presets, `PriceFormat` TypedDict (price/volume/percent — and the explicit "custom is not supported" callout).
- **interaction.md** owns `handle_scroll` (bool form + 4 sub-flags), `handle_scale` (bool form + 4 sub-flags), `kinetic_scroll`, `tracking_mode_exit_mode`, `auto_size`, `width`/`height`.
- **ticking-tables.md** owns liveness scope behaviour, `partition_by` discovery for `by=`, downsampling UX (scrim, snap-to-live, double-click reset), conflation interplay, disconnect/reconnect handling.
- **chart-types-reference.md** owns the four `ChartType` literal values, when to use each, validation constraints (yield_curve only Line/Area), and links to `yield_curve()`/`options_chart()`/`custom_numeric()` pages.
- **enums-reference.md** is the alphabetised reference for every Literal/TypedDict/dataclass with a one-line description and the full value list — produced last because it's the only page that benefits from existing on the disk.

Each concept-agent prompt repeats the same coverage contract: their inventory slice must be fully exercised; cross-link only to pages in the agreed tree; mirror plotly-express tone for `plot-by.md`/`multiple-axes.md`/`titles-legends.md`.

### Wave 5 — Audit (1 agent, blocking)

**Agent 17: Coverage Auditor.** Read-only.

> Load `docs/_coverage/inventory.json`. For every entry, scan all files under `docs/**/*.md` for the kwarg name appearing inside a fenced ```python ``` block (not just prose). Build `docs/_coverage/gaps.md` with one section per page listing which expected kwargs from that page's slice are missing. Also flag: (1) `order=` lists that mention variables never assigned in the snippet, (2) snippets that import demo tables not exported by `tvl_doc_data.py`, (3) cross-links to non-existent files, (4) any `dhautofunction` referencing a name not in `__all__`, (5) any documented kwarg not in inventory.json (means the doc is hallucinated). Do not edit docs. Report counts per page.

### Wave 6 — Patching (N parallel agents, one per page with gaps)

Each receives only the gap list for its page plus the original page text and is told: "Add the smallest possible new examples to cover these missing kwargs. Do not rewrite existing sections. Re-run the auditor's checks mentally before submitting." Iterate until the auditor reports zero gaps.

### Wave 7 — Tutorial and final polish (2 parallel agents)

**Agent N: Tutorial.** Walk a new user from `pip install` to a four-pane financial dashboard (candlestick + volume histogram + signal markers from a table + a baseline indicator on a separate pane), introducing concepts in the order a learner needs them. Mirror the pacing of `ui/docs/tutorial.md`.

**Agent N+1: Linker/Card-grid Pass.** Read every page; ensure every cross-reference is bidirectional and the README card grid actually links to every page in `chart-types/` and `concepts/`. Produce SVG card icons in `_assets/` (or stubs noting the icon is TODO if image generation is out of scope).

---

## 6. Why this prompt design produces coverage rather than plausible-sounding gaps

Three failure modes specifically defended against:

1. **The "describe what's interesting" bias.** Agents writing docs from a function signature gravitate to the headline parameters (`color`, `width`, `title`) and silently skip the long tail (`scale_ensure_edge_tick_marks_visible`, `precompute_conflation_priority`, `ignore_whitespace_indices`). Mechanism A (machine-extracted inventory) and Mechanism E (post-hoc audit against the same inventory) close that gap mechanically — the agent never decides what's "interesting."

2. **The "plausible API" bias.** When uncertain, agents invent kwargs that *would* exist if the API were symmetric (e.g. `xaxis_title=` does not exist on TVL — it's a plotly-express thing). The auditor's rule (5) — *"any documented kwarg not in inventory.json is hallucinated"* — catches this in one pass.

3. **The "single-example coverage" illusion.** Showing `line_style="dashed"` once is *not* coverage of a 5-value enum. The Wave-3 prompt template explicitly requires every literal value of every Literal-typed kwarg to appear, and the auditor counts distinct values, not distinct kwarg-mentions.

The whole system is roughly: *machine extracts the truth → humans (agents) write prose around it → machine verifies the prose mentions the truth → targeted patches close residual gaps.* That's how you get from "looks comprehensive" to "is comprehensive."

---

## 7. Execution order summary

1. Wave 1 — inventory.json (blocking)
2. Wave 2 — fixture + top-level files + stub pages (parallel, blocking on Wave 1)
3. Wave 3 — 9 chart-type pages (parallel, blocking on Wave 2)
4. Wave 4 — 12 concept pages (parallel, can overlap with Wave 3)
5. Wave 5 — auditor (blocking on Waves 3+4)
6. Wave 6 — gap-patch agents (parallel, one per page with gaps)
7. Wave 7 — tutorial + linker (parallel, after gaps closed)

Wave 1 is small and cheap; running it first lets every later prompt be data-driven rather than guess-driven.
