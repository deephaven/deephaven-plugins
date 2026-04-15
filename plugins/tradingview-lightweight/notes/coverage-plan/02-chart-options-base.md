# Implementation Plan: ChartOptionsBase Missing Top-Level Properties

**Target file (Python):** `src/deephaven/plot/tradingview_lightweight/chart.py`
**Target file (types):** `src/deephaven/plot/tradingview_lightweight/options.py`
**Test file:** `test/deephaven/plot/tradingview_lightweight/test_chart.py`
**JS renderer:** `src/js/src/TradingViewChartRenderer.ts`

**Status as of 2026-04-11:**
- Properties addressed by this plan: `autoSize` (❌), `trackingMode` (❌), `addDefaultPane` (❌)
- Properties with their own separate plan: `handleScroll` / `handleScale` / `kineticScroll` (❌ — §7 of coverage report)
- Properties already implemented: `width`, `height`, `layout`, `timeScale`, `grid`, `crosshair`, `rightPriceScale`, `leftPriceScale`, `overlayPriceScales`, `localization` (partial), `watermark` (via plugin)

---

## 1. Current State

### What is already wired up

The `chart()` function in `chart.py` (lines 163–507) accepts these
top-level `ChartOptionsBase` properties and serializes them directly
into the `chart_options` dict that is JSON-transported to the JS plugin:

| Python param(s) | Serialized JS key | Section in `chart()` |
|---|---|---|
| `width`, `height` | `width`, `height` | "Sizing" block, lines 496–500 |
| `background_color`, `text_color`, `font_size`, `pane_*` | `layout.*` | "Layout" block, lines 305–324 |
| `vert_lines_*`, `horz_lines_*` | `grid.{vertLines,horzLines}` | "Grid" block, lines 326–347 |
| `crosshair_*` | `crosshair.*` | "Crosshair" block, lines 349–378 |
| `right_price_scale_*` | `rightPriceScale.*` | lines 380–400 |
| `left_price_scale_*` | `leftPriceScale.*` | lines 402–422 |
| `overlay_price_scale_*` | `overlayPriceScales.*` | lines 424–441 |
| `time_visible` … `precompute_conflation_on_init` | `timeScale.*` | "Time scale" block, lines 443–474 |
| `watermark_*` | `watermark` (flat, pre-processed by JS) | lines 476–490 |
| `price_formatter` | `localization.priceFormatterName` | lines 492–494 |

### How the JS renderer consumes `chart_options`

`TradingViewChartRenderer.ts` (constructor, lines 285–353) receives the
`chartOptions` dict directly from the figure JSON. It:

1. Strips the `watermark` key (handled separately via plugin).
2. Calls `resolveLocalization()` to swap `priceFormatterName` for a real
   function reference.
3. Hard-codes `autoSize: true` in `commonOpts` (line 326), overriding
   anything Python sends on that key today.
4. Merges a set of hardcoded defaults (`timeScale.timeVisible`, tick
   formatters, `layout.attributionLogo: false`, `layout.background`).
5. Passes the merged object to `createChart()` / `createYieldCurveChart()`
   / `createOptionsChart()`.

**Critical implication for `autoSize`:** The renderer currently forces
`autoSize: true` unconditionally (line 326). Exposing `autoSize` from
Python requires a coordinated change on both the Python serialization side
and the JS renderer side.

---

## 2. Missing Properties: Detailed Analysis

### 2.1 `autoSize` — `boolean`, default `false` in TVL; currently forced `true` by JS

**JS type:** `boolean`
**TVL default:** `false` (chart uses explicit `width`/`height`)
**Current JS behavior:** The renderer hard-codes `autoSize: true`, which
makes the chart fill its container. This is correct for the Deephaven
panel environment. However, a user may legitimately want to pass explicit
pixel dimensions and have the chart honor them (e.g., for embedded
screenshots or fixed-size dashboards).

**Design decision:** Expose the option, but preserve the current behavior
as the default (`autoSize` defaults to `None`, meaning the JS side keeps
its current forced-`true` behavior unless the Python caller explicitly
passes `autoSize=False`).

**Python param name:** `auto_size: Optional[bool] = None`

**Serialization key:** `"autoSize"` (top-level in `chart_options`)

**JS renderer change required:** The current line

```typescript
// TradingViewChartRenderer.ts, line ~326
autoSize: true,
```

must be changed to respect the incoming value:

```typescript
autoSize: (chartOpts.autoSize as boolean | undefined) ?? true,
```

This means: if Python serialized `autoSize: false`, use that; otherwise
fall back to `true`.

---

### 2.2 `trackingMode` — `TrackingModeOptions`, default unspecified

**JS type:** `{ exitMode: TrackingModeExitMode }` where
`TrackingModeExitMode` is an enum:
- `0` = `OnNextTap` — crosshair exits tracking on the next tap
- `1` = `OnTouchEnd` — crosshair exits on touch end

**Purpose:** Controls how the crosshair behaves when a user touches the
chart on a mobile/touch device — specifically, when tracking mode is
exited.

**Python param name:** `tracking_mode_exit_mode: Optional[TrackingModeExitMode] = None`

**New type literal in `options.py`:**
```text
TrackingModeExitMode = Literal["on_next_tap", "on_touch_end"]
```

**New map in `options.py`:**
```text
TRACKING_MODE_EXIT_MODE_MAP = {
    "on_next_tap": 0,
    "on_touch_end": 1,
}
```

**Serialization:** Wraps into the `trackingMode` object:
```text
if tracking_mode_exit_mode is not None:
    chart_options["trackingMode"] = {
        "exitMode": TRACKING_MODE_EXIT_MODE_MAP[tracking_mode_exit_mode]
    }
```

**JS renderer change required:** None. The renderer passes `chartOpts`
through to `createChart()` without filtering unknown top-level keys, so
`trackingMode` will be forwarded as-is. TVL's `createChart()` will apply
the `trackingMode.exitMode` enum value natively.

---

### 2.3 `addDefaultPane` — `boolean`, default `true`

**JS type:** `boolean`
**TVL default:** `true` — `createChart()` creates an initial default pane
automatically. If `false`, the chart starts with zero panes and the caller
is responsible for adding panes manually via `chart.addPane()`.

**Relevance to Python API:** The Python plugin supports multi-pane charts
via `pane_index` on individual series specs and `pane_stretch_factors` on
the chart. If a user constructs a chart with `addDefaultPane=False` they
would need to add panes via some future API. For now, the Python layer has
no `addPane()` equivalent, so this option is mainly useful to advanced
users who understand the implication: do not add any series without first
configuring panes on the JS side.

**Python param name:** `add_default_pane: Optional[bool] = None`

**Serialization key:** `"addDefaultPane"` (top-level in `chart_options`)

**JS renderer change required:** None. The key passes through untouched
to `createChart()`.

---

## 3. Handling `handleScroll` / `handleScale` Top-Level Boolean Shorthand

`handleScroll` and `handleScale` each accept either:
- A **boolean** — `true` enables all sub-options, `false` disables all.
- An **object** (`HandleScrollOptions` / `HandleScaleOptions`) for
  granular control.

These properties get a **dedicated plan (§7)** that will cover the full
sub-option sets. However, this plan documents the top-level boolean
shorthand that must be supported even in the initial implementation of §7:

```text
# In chart() signature (belongs to §7 plan but noted here for context):
handle_scroll: Optional[bool] = None,   # boolean shorthand
handle_scale: Optional[bool] = None,    # boolean shorthand
# Sub-options (also §7):
handle_scroll_mouse_wheel: Optional[bool] = None,
handle_scroll_pressed_mouse_move: Optional[bool] = None,
# ... etc.
```

Serialization rule for the boolean shorthand (to be implemented in §7):
```text
# If only the boolean shorthand is given, emit the boolean directly:
if handle_scroll is not None and all sub-options are None:
    chart_options["handleScroll"] = handle_scroll
# If any sub-options are set, emit an object (boolean ignored):
elif any sub-option is not None:
    chart_options["handleScroll"] = {sub-option dict}
```

This plan does **not** implement `handleScroll`/`handleScale` but
documents the duality so that the §7 implementer has the full picture.

---

## 4. Concrete Code Changes

### 4.1 `options.py` additions

Add after the existing `CHART_TYPE_MAP` block (after line 75):

```text
# --- TrackingMode ---

TrackingModeExitMode = Literal["on_next_tap", "on_touch_end"]

TRACKING_MODE_EXIT_MODE_MAP = {
    "on_next_tap": 0,
    "on_touch_end": 1,
}
```

Update the imports in `chart.py` to pull in the new names:

```text
# Before (line 17-28 of chart.py):
from .options import (
    ChartType,
    CrosshairMode,
    LineStyle,
    LineType,
    PriceScaleMode,
    PriceFormatter,
    CHART_TYPE_MAP,
    CROSSHAIR_MODE_MAP,
    LINE_STYLE_MAP,
    PRICE_SCALE_MODE_MAP,
)

# After:
from .options import (
    ChartType,
    CrosshairMode,
    LineStyle,
    LineType,
    PriceScaleMode,
    PriceFormatter,
    TrackingModeExitMode,
    CHART_TYPE_MAP,
    CROSSHAIR_MODE_MAP,
    LINE_STYLE_MAP,
    PRICE_SCALE_MODE_MAP,
    TRACKING_MODE_EXIT_MODE_MAP,
)
```

### 4.2 `chart()` signature additions

Insert the three new parameters into the `chart()` function signature.
They belong in a new `# Interaction` section placed after the existing
`# Sizing` block (currently the last block before the closing `)`), or
more logically, just before `# Sizing` since they are behavioral options.

The recommended insertion point is between the `# Localization` block and
the `# Panes` block (between lines 257 and 259 of the current file):

```text
    # ...existing params above...

    # Localization
    price_formatter: Optional[PriceFormatter] = None,
    # Panes
    pane_separator_color: Optional[str] = None,
    pane_separator_hover_color: Optional[str] = None,
    pane_enable_resize: Optional[bool] = None,
    pane_stretch_factors: Optional[list[float]] = None,
    # Sizing
    width: Optional[int] = None,
    height: Optional[int] = None,
    # NEW: Interaction / behavior
    auto_size: Optional[bool] = None,
    tracking_mode_exit_mode: Optional[TrackingModeExitMode] = None,
    add_default_pane: Optional[bool] = None,
) -> TvlChart:
```

Placement rationale: `auto_size`, `tracking_mode_exit_mode`, and
`add_default_pane` are behavioral/structural options that logically follow
the sizing/pane blocks. Keeping them at the end also minimizes diff noise
on the existing large signature.

### 4.3 `_build_options()` / body of `chart()` additions

In the body of `chart()`, add a new block after the "Sizing" block
(after line 500, before the `return TvlChart(...)` call):

```text
    # --- EXISTING sizing block (already present) ---
    # Sizing
    if width is not None:
        chart_options["width"] = width
    if height is not None:
        chart_options["height"] = height

    # --- NEW: Behavior / interaction ---
    if auto_size is not None:
        chart_options["autoSize"] = auto_size
    if tracking_mode_exit_mode is not None:
        chart_options["trackingMode"] = {
            "exitMode": TRACKING_MODE_EXIT_MODE_MAP[tracking_mode_exit_mode]
        }
    if add_default_pane is not None:
        chart_options["addDefaultPane"] = add_default_pane

    return TvlChart(
        series_list=list(series),
        chart_options=chart_options,
        pane_stretch_factors=pane_stretch_factors,
        chart_type=resolved_type,
    )
```

### 4.4 JS renderer change for `autoSize`

In `TradingViewChartRenderer.ts`, change the hard-coded `autoSize: true`
(line ~326) inside the `commonOpts` block:

```typescript
// BEFORE:
const commonOpts = {
  ...chartOpts,
  layout: { ... },
  timeScale: { ... },
  localization: { ... },
  autoSize: true,                       // <-- current hard-coded value
};

// AFTER:
const commonOpts = {
  ...chartOpts,
  layout: { ... },
  timeScale: { ... },
  localization: { ... },
  autoSize: (chartOpts.autoSize as boolean | undefined) ?? true,  // <-- respects Python
};
```

**Behavior table after this change:**

| Python caller does... | `chartOpts.autoSize` | JS `autoSize` value |
|---|---|---|
| Nothing (default) | `undefined` | `true` (unchanged behavior) |
| `auto_size=True` | `true` | `true` |
| `auto_size=False` | `false` | `false` (honors explicit `width`/`height`) |

Note: when `auto_size=False`, the user is expected to also pass `width`
and `height`. If neither is provided, TVL will use the container size
anyway (TVL's own fallback when both width and height are 0).

---

## 5. Test Coverage

All new tests go into `TestChartFunction` in `test_chart.py`, following
the existing pattern: create a `line_series(self.table)`, call `chart()`
with the new kwarg, then assert on `c.chart_options`.

### 5.1 Tests for `auto_size`

```text
def test_auto_size_true(self):
    """auto_size=True should set autoSize in chart_options."""
    s = line_series(self.table)
    c = chart(s, auto_size=True)
    self.assertTrue(c.chart_options["autoSize"])

def test_auto_size_false(self):
    """auto_size=False should set autoSize to False in chart_options."""
    s = line_series(self.table)
    c = chart(s, auto_size=False)
    self.assertFalse(c.chart_options["autoSize"])

def test_auto_size_not_set_by_default(self):
    """auto_size omitted should not include autoSize in chart_options.
    The JS renderer provides its own default (true) in that case.
    """
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("autoSize", c.chart_options)

def test_auto_size_false_with_explicit_dimensions(self):
    """auto_size=False combined with width/height is the intended use."""
    s = line_series(self.table)
    c = chart(s, auto_size=False, width=1200, height=600)
    self.assertFalse(c.chart_options["autoSize"])
    self.assertEqual(c.chart_options["width"], 1200)
    self.assertEqual(c.chart_options["height"], 600)
```

### 5.2 Tests for `tracking_mode_exit_mode`

```text
def test_tracking_mode_on_next_tap(self):
    """tracking_mode_exit_mode='on_next_tap' should emit exitMode=0."""
    s = line_series(self.table)
    c = chart(s, tracking_mode_exit_mode="on_next_tap")
    tm = c.chart_options["trackingMode"]
    self.assertEqual(tm["exitMode"], 0)

def test_tracking_mode_on_touch_end(self):
    """tracking_mode_exit_mode='on_touch_end' should emit exitMode=1."""
    s = line_series(self.table)
    c = chart(s, tracking_mode_exit_mode="on_touch_end")
    tm = c.chart_options["trackingMode"]
    self.assertEqual(tm["exitMode"], 1)

def test_tracking_mode_not_set_by_default(self):
    """trackingMode should not appear in chart_options when not specified."""
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("trackingMode", c.chart_options)

def test_tracking_mode_all_values(self):
    """Enumerate all TrackingModeExitMode values to verify correct mapping."""
    s = line_series(self.table)
    expected = {"on_next_tap": 0, "on_touch_end": 1}
    for mode_name, mode_value in expected.items():
        c = chart(s, tracking_mode_exit_mode=mode_name)
        self.assertEqual(
            c.chart_options["trackingMode"]["exitMode"],
            mode_value,
            f"tracking_mode_exit_mode={mode_name!r} should map to {mode_value}",
        )
```

### 5.3 Tests for `add_default_pane`

```text
def test_add_default_pane_true(self):
    """add_default_pane=True should set addDefaultPane to True."""
    s = line_series(self.table)
    c = chart(s, add_default_pane=True)
    self.assertTrue(c.chart_options["addDefaultPane"])

def test_add_default_pane_false(self):
    """add_default_pane=False suppresses the automatic initial pane."""
    s = line_series(self.table)
    c = chart(s, add_default_pane=False)
    self.assertFalse(c.chart_options["addDefaultPane"])

def test_add_default_pane_not_set_by_default(self):
    """addDefaultPane should not appear in chart_options when not specified."""
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("addDefaultPane", c.chart_options)
```

### 5.4 Update `test_none_options_not_in_output`

The existing test at line 377 asserts that all-default `chart()` produces
an empty dict. Add assertions for the new keys:

```text
def test_none_options_not_in_output(self):
    """Sections with all-None values should not appear in chart_options."""
    s = line_series(self.table)
    c = chart(s)  # all defaults are None
    self.assertNotIn("layout", c.chart_options)
    self.assertNotIn("grid", c.chart_options)
    self.assertNotIn("crosshair", c.chart_options)
    self.assertNotIn("rightPriceScale", c.chart_options)
    self.assertNotIn("leftPriceScale", c.chart_options)
    self.assertNotIn("timeScale", c.chart_options)
    self.assertNotIn("watermark", c.chart_options)
    # NEW assertions:
    self.assertNotIn("autoSize", c.chart_options)
    self.assertNotIn("trackingMode", c.chart_options)
    self.assertNotIn("addDefaultPane", c.chart_options)
```

---

## 6. Integration Considerations with the JS Plugin Layer

### 6.1 `autoSize` — requires JS change

The JS renderer in `TradingViewChartRenderer.ts` currently forces
`autoSize: true` unconditionally. This must be changed (see §4.4) so that
an explicit Python-provided `false` is honored. Without this JS change,
setting `auto_size=False` in Python would have no visible effect.

The change is backward-compatible: if Python sends no `autoSize` key
(the default `None`), `chartOpts.autoSize` is `undefined` and the nullish
coalesce (`?? true`) preserves the existing behavior.

No changes to `TradingViewTypes.ts` are needed — `chartOptions` is typed
as `Record<string, unknown>`, so any key passes through.

### 6.2 `trackingMode` — no JS change needed

`trackingMode` is a plain object with a numeric `exitMode` field. It is
forwarded verbatim via the `...chartOpts` spread in `commonOpts` and then
handed to `createChart()`. TradingView Lightweight Charts natively
understands `trackingMode.exitMode` as the `TrackingModeExitMode` enum
value.

### 6.3 `addDefaultPane` — no JS change needed

`addDefaultPane` is a top-level boolean. It is forwarded verbatim via the
`...chartOpts` spread and accepted natively by `createChart()`. The
renderer has no code that adds a default pane itself — that is TVL's
responsibility — so no renderer logic needs updating.

### 6.4 `deepMerge` in `TradingViewChart.tsx`

The `deepMerge()` function in `TradingViewChart.tsx` is used to combine
theme-derived options with user options when theme changes. The three new
properties are all either booleans or shallow objects (`trackingMode`),
so `deepMerge` handles them correctly:

- `autoSize` (boolean) — replaced, not merged. Correct.
- `trackingMode` (`{ exitMode: number }`) — both base and override are
  objects, so `deepMerge` will recursively merge, which is fine (there
  is currently only one sub-key, `exitMode`).
- `addDefaultPane` (boolean) — replaced. Correct.

No changes needed to `deepMerge`.

---

## 7. Pythonic API Design Decisions

### Naming conventions

All Python parameters follow the project's established `snake_case`
convention mirroring the JS `camelCase` keys:

| JS key | Python param |
|---|---|
| `autoSize` | `auto_size` |
| `trackingMode.exitMode` | `tracking_mode_exit_mode` |
| `addDefaultPane` | `add_default_pane` |

The `trackingMode` object is "flattened" into a single `tracking_mode_exit_mode`
parameter rather than exposing a nested `tracking_mode` dict. This is
consistent with how the rest of the API is designed: e.g., `crosshair_mode`
(not `crosshair={"mode": ...}`), `vert_lines_color` (not
`grid={"vertLines": {"color": ...}}`).

If TVL adds more sub-fields to `TrackingModeOptions` in the future, they
can be added as additional flat parameters following the same pattern
(`tracking_mode_*`).

### Type annotations

```text
auto_size: Optional[bool] = None
tracking_mode_exit_mode: Optional[TrackingModeExitMode] = None
add_default_pane: Optional[bool] = None
```

Where `TrackingModeExitMode = Literal["on_next_tap", "on_touch_end"]` is
defined in `options.py`.

Using `Optional[bool]` (not `bool`) for all three preserves the
"omit-if-not-specified" semantics that the entire `chart()` API relies on.
A missing key in `chart_options` means "let the JS renderer or TVL decide
the default" — this is the critical invariant.

### Defaults

None of the three new parameters have an explicit Python-side default
value (they all default to `None`). This is intentional:

- **`auto_size`:** The JS renderer already defaults to `True`. Defaulting
  to `None` in Python preserves that existing JS behavior without any
  change in current behavior for existing callers.
- **`tracking_mode_exit_mode`:** TVL has an internal default for this
  option. Omitting the key lets TVL apply it.
- **`add_default_pane`:** TVL defaults to `True`. Omitting the key
  preserves that behavior. Most users will never need to touch this.

### Export from `__init__.py`

`TrackingModeExitMode` should be added to the package's public exports
if and when `options.py` types are exported. Currently `LineStyle`,
`LineType`, `CrosshairMode`, `PriceScaleMode`, and `PriceFormatter` are
exported (check `__init__.py`). `TrackingModeExitMode` should follow the
same pattern.

---

## 8. Implementation Checklist

In order, the implementing agent should:

1. **Edit `options.py`:**
   - Add `TrackingModeExitMode = Literal["on_next_tap", "on_touch_end"]`
   - Add `TRACKING_MODE_EXIT_MODE_MAP = {"on_next_tap": 0, "on_touch_end": 1}`

2. **Edit `chart.py` — imports:**
   - Add `TrackingModeExitMode` and `TRACKING_MODE_EXIT_MODE_MAP` to the
     import from `.options`.

3. **Edit `chart.py` — `chart()` signature:**
   - Append three new parameters after the `height` parameter (or in a
     dedicated comment block) per the exact diff shown in §4.2.

4. **Edit `chart.py` — `chart()` body:**
   - Add the three-line serialization block after the sizing block, per §4.3.

5. **Edit `TradingViewChartRenderer.ts`:**
   - Change `autoSize: true` to
     `autoSize: (chartOpts.autoSize as boolean | undefined) ?? true`
     as shown in §4.4.

6. **Edit `test_chart.py`:**
   - Add all tests from §5.1, §5.2, §5.3 inside `TestChartFunction`.
   - Update `test_none_options_not_in_output` per §5.4.

7. **Run tests:**
   ```bash
   PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
   $PY -m pytest test/ -v -k "auto_size or tracking_mode or add_default_pane or none_options"
   ```

8. **Run JS type check:**
   ```bash
   cd /home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/src/js
   npx tsc --noEmit
   ```

9. **Update `api-coverage-report.md` §2** — change status of properties
   `autoSize` (row 3), `trackingMode` (row 14), and `addDefaultPane`
   (row 16) from ❌ to ✅.

---

## 9. Out of Scope for This Plan

The following are deliberately excluded and handled by separate plans:

- `handleScroll` / `handleScale` / `kineticScroll` — §7 of the coverage
  report. The boolean shorthand behavior is documented in §3 of this plan
  for reference, but implementation is deferred to the §7 plan.
- `layout.fontFamily`, `layout.attributionLogo`, `layout.colorSpace`,
  `layout.colorParsers` — §3 of the coverage report.
- `leftPriceScale.scaleMargins`, `rightPriceScale.scaleMargins` — §3/§18
  of the coverage report.
- `overlayPriceScales` missing sub-properties (8 of 12 missing) — §3 of
  the coverage report.
