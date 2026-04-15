# Implementation Plan: LayoutOptions Coverage

**Target file:** `src/deephaven/plot/tradingview_lightweight/chart.py`
**Supporting file:** `src/deephaven/plot/tradingview_lightweight/options.py`
**Test file:** `test/deephaven/plot/tradingview_lightweight/test_chart.py`
**Coverage report section:** §3 LayoutOptions
**Status before this plan:** `background` (solid only) ⚠️, `textColor` ✅, `fontSize` ✅, `fontFamily` ❌, `panes` ⚠️ (all three sub-props already done), `attributionLogo` ❌, `colorSpace` ❌, `colorParsers` ❌

---

## 1. Current State

The `chart()` function in `chart.py` (lines 163–507) already builds a `layout` dict and emits it under `chart_options["layout"]`. The relevant block (lines 305–324) is:

```text
layout = _filter_none(
    {
        "textColor": text_color,
        "fontSize": font_size,
    }
)
if background_color is not None:
    layout["background"] = {"type": "solid", "color": background_color}
panes_opts = _filter_none(
    {
        "separatorColor": pane_separator_color,
        "separatorHoverColor": pane_separator_hover_color,
        "enableResize": pane_enable_resize,
    }
)
if panes_opts:
    layout["panes"] = panes_opts
if layout:
    chart_options["layout"] = layout
```

Parameters already in the `chart()` signature (lines 172–174, 260–262):
```text
background_color: Optional[str] = (None,)
text_color: Optional[str] = (None,)
font_size: Optional[int] = (None,)
...
pane_separator_color: Optional[str] = (None,)
pane_separator_hover_color: Optional[str] = (None,)
pane_enable_resize: Optional[bool] = (None,)
```

Existing tests (lines 139–160 of `test_chart.py`) cover:
- `test_layout_options` — solid background, text_color, font_size
- `test_background_color_only` — solid background in isolation
- Pane options are tested under grid/crosshair sections

---

## 2. Feasibility Assessment

| Property | Feasibility | Decision |
|---|---|---|
| `background` gradient (`VerticalGradientColor`) | ✅ Fully feasible | Implement with two new params |
| `fontFamily` | ✅ Fully feasible | Add `font_family: Optional[str]` |
| `attributionLogo` | ✅ Fully feasible | Add `attribution_logo: Optional[bool]` |
| `colorSpace` | ✅ Technically feasible | Add `color_space: Optional[str]` with a `Literal` type |
| `colorParsers` | ❌ Not feasible | Requires JS callable objects; skip with documented reason |

---

## 3. Not Feasible: `colorParsers`

**Why not feasible:** `colorParsers` accepts an array of `CustomColorParser` functions — JavaScript callables that transform raw color values at render time. The Python plugin is a *static configuration builder*: it serializes options to JSON at chart-creation time and has no mechanism to ship Python callables as JS functions. There is no serializable representation for arbitrary JS function logic.

**Action:** Do not implement. Add a comment in `chart.py` near the layout block explaining this decision so future contributors know it was considered. No user-facing parameter is added.

---

## 4. Gradient Background Design

### 4.1 The Problem

The TradingView JS API `background` field accepts a union type:

```typescript
// Solid background
{ type: 'solid', color: string }

// Vertical gradient background
{ type: 'gradient', topColor: string, bottomColor: string }
```

The current Python API uses a single `background_color: Optional[str]` that always produces `type: 'solid'`. We need to add gradient support without breaking this parameter.

### 4.2 Chosen Python API Design: Two Additional Parameters

Add two new parameters alongside the existing `background_color`:

```text
background_top_color: Optional[str] = (None,)
background_bottom_color: Optional[str] = (None,)
```

**Design rationale:**

- `background_color` continues to work exactly as today for the solid case. No migration required.
- If `background_top_color` or `background_bottom_color` is provided, a gradient background is used instead.
- The gradient mode is detected by the presence of either gradient parameter, giving a clear user signal.
- Providing `background_color` *and* gradient parameters is a user error. Raise `ValueError` with a clear message.
- If only one of the two gradient params is set (e.g., only `background_top_color`), raise `ValueError` requiring both to be set.

**Why not a single `background` dict/union parameter?**

A dict parameter would be less Pythonic and make tab-completion less useful. The flat keyword approach is consistent with how every other compound option in this plugin is expressed (e.g., `crosshair_vert_line_color`, `crosshair_vert_line_width`, etc.).

**Why not an enum/class?**

Unnecessary complexity. The two-parameter approach is immediately understandable and self-documenting.

### 4.3 Validation Rules

```
background_color set, neither gradient param set   → solid: { type: 'solid', color: background_color }
background_top_color AND background_bottom_color set, background_color NOT set
                                                   → gradient: { type: 'gradient', topColor: ..., bottomColor: ... }
background_top_color XOR background_bottom_color   → ValueError: "Both background_top_color and background_bottom_color must be provided for a gradient background"
background_color set AND any gradient param set    → ValueError: "Cannot set both background_color and gradient background parameters. Use background_color for a solid background, or background_top_color and background_bottom_color for a gradient"
all three None                                     → background key not emitted (existing behavior)
```

---

## 5. Detailed Code Changes

### 5.1 `options.py` — No Changes Required

`colorSpace` values are `'srgb'` and `'display-p3'`. These are simple strings passed through to JS verbatim, so no mapping dict or `Literal` type alias is strictly necessary. However, add a `Literal` type alias for documentation purposes:

**In `options.py`, after the existing `Literal` definitions (after line 29), add:**

```text
ColorSpace = Literal["srgb", "display-p3"]
```

Also update the `__all__`-equivalent import in `chart.py` to import `ColorSpace` from `options.py`. (Since there is no explicit `__all__`, the import in `chart.py` is updated directly.)

### 5.2 `chart.py` — Parameter Additions

**Step 1: Update the imports at the top of `chart.py`**

The existing import from `.options` (lines 17–28) must add `ColorSpace`:

```text
from .options import (
    ChartType,
    ColorSpace,  # <-- add this
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
```

**Step 2: Update `chart()` function signature**

In the `# Layout` section of the `chart()` signature (currently lines 171–174), expand to:

```text
# Layout
background_color: Optional[str] = (None,)
background_top_color: Optional[str] = (None,)
background_bottom_color: Optional[str] = (None,)
text_color: Optional[str] = (None,)
font_size: Optional[int] = (None,)
font_family: Optional[str] = (None,)
attribution_logo: Optional[bool] = (None,)
color_space: Optional[ColorSpace] = (None,)
```

The ordering keeps existing parameters first (`background_color`, `text_color`, `font_size`) so callsites using positional-ish ordering are unaffected. New parameters are appended after `font_size`.

**Step 3: Replace the layout-building block**

Replace the current layout-building block (lines 305–324) with:

```text
# Layout
# --- Background validation ---
_has_gradient = background_top_color is not None or background_bottom_color is not None
if background_color is not None and _has_gradient:
    raise ValueError(
        "Cannot set both background_color and gradient background parameters. "
        "Use background_color for a solid background, or use "
        "background_top_color and background_bottom_color together for a gradient."
    )
if (background_top_color is None) != (background_bottom_color is None):
    raise ValueError(
        "Both background_top_color and background_bottom_color must be provided "
        "together for a gradient background; only one was given."
    )

layout = _filter_none(
    {
        "textColor": text_color,
        "fontSize": font_size,
        "fontFamily": font_family,
        "attributionLogo": attribution_logo,
        "colorSpace": color_space,
    }
)
if background_color is not None:
    layout["background"] = {"type": "solid", "color": background_color}
elif background_top_color is not None:
    # Both are set (validated above)
    layout["background"] = {
        "type": "gradient",
        "topColor": background_top_color,
        "bottomColor": background_bottom_color,
    }
panes_opts = _filter_none(
    {
        "separatorColor": pane_separator_color,
        "separatorHoverColor": pane_separator_hover_color,
        "enableResize": pane_enable_resize,
    }
)
if panes_opts:
    layout["panes"] = panes_opts
if layout:
    chart_options["layout"] = layout
```

**Note on `attribution_logo`:** When `attribution_logo=False`, `_filter_none` will include it because `False` is not `None`. The check `if v is not None` in `_filter_none` is correct for booleans. Verify that `_filter_none` does indeed use `is not None` (it does — line 35: `{k: v for k, v in d.items() if v is not None}`). No change needed to `_filter_none`.

**Step 4: Update the `chart()` docstring**

Extend the `Args:` section with entries for the four new parameters. Place them in the `# Layout` group:

```
background_color: Solid background color as a CSS color string (e.g., ``'#1a1a2e'``).
    Mutually exclusive with ``background_top_color`` / ``background_bottom_color``.
background_top_color: Top color for a vertical gradient background. Must be
    provided together with ``background_bottom_color``. Mutually exclusive with
    ``background_color``.
background_bottom_color: Bottom color for a vertical gradient background. Must
    be provided together with ``background_top_color``. Mutually exclusive with
    ``background_color``.
font_family: CSS font-family string for scale labels (e.g.,
    ``"'Courier New', monospace"``). Defaults to the TradingView system font stack.
attribution_logo: Whether to display the TradingView attribution logo.
    Defaults to ``True`` (library default). Set ``False`` to hide it.
color_space: Canvas color space — ``'srgb'`` (default) or ``'display-p3'`` for
    wide-gamut displays. Must be set at chart creation; cannot be changed later.
```

### 5.3 Convenience Functions (`line`, `candlestick`, etc.)

All convenience functions (`line`, `candlestick`, `area`, `bar`, `baseline`, `histogram`, `yield_curve`, `options_chart`) accept `**kwargs` and forward them to `chart()`. No changes are needed to any convenience function signatures. The new parameters are immediately available via `**kwargs` forwarding.

---

## 6. Test Coverage

All new tests are added to `test/deephaven/plot/tradingview_lightweight/test_chart.py` in the existing `TestChartFunction` class.

### 6.1 Gradient Background Tests

```text
def test_gradient_background(self):
    """Both gradient params should produce a gradient background object."""
    s = line_series(self.table)
    c = chart(s, background_top_color="#ff0000", background_bottom_color="#0000ff")
    layout = c.chart_options["layout"]
    self.assertEqual(
        layout["background"],
        {"type": "gradient", "topColor": "#ff0000", "bottomColor": "#0000ff"},
    )


def test_gradient_background_does_not_include_solid_key(self):
    """Gradient background must not contain 'color' key."""
    s = line_series(self.table)
    c = chart(s, background_top_color="#aaa", background_bottom_color="#bbb")
    bg = c.chart_options["layout"]["background"]
    self.assertNotIn("color", bg)
    self.assertEqual(bg["type"], "gradient")


def test_solid_background_still_works(self):
    """Existing background_color usage must remain unchanged."""
    s = line_series(self.table)
    c = chart(s, background_color="#1a1a2e")
    self.assertEqual(
        c.chart_options["layout"]["background"],
        {"type": "solid", "color": "#1a1a2e"},
    )


def test_gradient_and_solid_conflict_raises(self):
    """Providing both background_color and gradient params must raise ValueError."""
    s = line_series(self.table)
    with self.assertRaises(ValueError) as ctx:
        chart(
            s,
            background_color="#000",
            background_top_color="#111",
            background_bottom_color="#222",
        )
    self.assertIn("background_color", str(ctx.exception))


def test_gradient_missing_bottom_raises(self):
    """Providing only background_top_color without background_bottom_color raises."""
    s = line_series(self.table)
    with self.assertRaises(ValueError) as ctx:
        chart(s, background_top_color="#ff0000")
    self.assertIn("background_bottom_color", str(ctx.exception))


def test_gradient_missing_top_raises(self):
    """Providing only background_bottom_color without background_top_color raises."""
    s = line_series(self.table)
    with self.assertRaises(ValueError) as ctx:
        chart(s, background_bottom_color="#0000ff")
    self.assertIn("background_top_color", str(ctx.exception))


def test_gradient_with_other_layout_options(self):
    """Gradient background can coexist with font_size and text_color."""
    s = line_series(self.table)
    c = chart(
        s,
        background_top_color="#000",
        background_bottom_color="#333",
        text_color="#fff",
        font_size=13,
    )
    layout = c.chart_options["layout"]
    self.assertEqual(layout["background"]["type"], "gradient")
    self.assertEqual(layout["textColor"], "#fff")
    self.assertEqual(layout["fontSize"], 13)


def test_no_background_params_omits_background_key(self):
    """When no background param is set, layout must not contain 'background' key."""
    s = line_series(self.table)
    c = chart(s, text_color="#eee")
    layout = c.chart_options["layout"]
    self.assertNotIn("background", layout)
```

### 6.2 `font_family` Tests

```text
def test_font_family(self):
    """font_family should appear as 'fontFamily' in layout."""
    s = line_series(self.table)
    c = chart(s, font_family="'Courier New', monospace")
    layout = c.chart_options["layout"]
    self.assertEqual(layout["fontFamily"], "'Courier New', monospace")


def test_font_family_not_set_by_default(self):
    """fontFamily must not appear in layout when font_family is not given."""
    s = line_series(self.table)
    c = chart(s)
    # No layout key at all when nothing is set
    self.assertNotIn("layout", c.chart_options)


def test_font_family_with_other_layout_options(self):
    """font_family coexists with font_size and text_color."""
    s = line_series(self.table)
    c = chart(s, font_size=14, font_family="monospace", text_color="#ccc")
    layout = c.chart_options["layout"]
    self.assertEqual(layout["fontFamily"], "monospace")
    self.assertEqual(layout["fontSize"], 14)
    self.assertEqual(layout["textColor"], "#ccc")
```

### 6.3 `attribution_logo` Tests

```text
def test_attribution_logo_false(self):
    """attribution_logo=False should set attributionLogo: false in layout."""
    s = line_series(self.table)
    c = chart(s, attribution_logo=False)
    layout = c.chart_options["layout"]
    self.assertFalse(layout["attributionLogo"])


def test_attribution_logo_true(self):
    """attribution_logo=True should set attributionLogo: true in layout."""
    s = line_series(self.table)
    c = chart(s, attribution_logo=True)
    layout = c.chart_options["layout"]
    self.assertTrue(layout["attributionLogo"])


def test_attribution_logo_not_set_by_default(self):
    """attributionLogo must not appear in layout unless explicitly set."""
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("layout", c.chart_options)


def test_attribution_logo_false_creates_layout_section(self):
    """attribution_logo alone should produce a layout section."""
    s = line_series(self.table)
    c = chart(s, attribution_logo=False)
    self.assertIn("layout", c.chart_options)
    self.assertFalse(c.chart_options["layout"]["attributionLogo"])
```

### 6.4 `color_space` Tests

```text
def test_color_space_srgb(self):
    """color_space='srgb' should appear as 'colorSpace' in layout."""
    s = line_series(self.table)
    c = chart(s, color_space="srgb")
    self.assertEqual(c.chart_options["layout"]["colorSpace"], "srgb")


def test_color_space_display_p3(self):
    """color_space='display-p3' should appear verbatim in layout."""
    s = line_series(self.table)
    c = chart(s, color_space="display-p3")
    self.assertEqual(c.chart_options["layout"]["colorSpace"], "display-p3")


def test_color_space_not_set_by_default(self):
    """colorSpace must not appear in layout unless explicitly set."""
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("layout", c.chart_options)
```

### 6.5 Backwards Compatibility Guards

These ensure no existing call sites break:

```text
def test_backwards_compat_background_color_solid(self):
    """Original background_color usage must produce identical output to before."""
    s = line_series(self.table)
    c = chart(s, background_color="#1a1a2e", text_color="#e0e0e0", font_size=14)
    layout = c.chart_options["layout"]
    self.assertEqual(layout["background"], {"type": "solid", "color": "#1a1a2e"})
    self.assertEqual(layout["textColor"], "#e0e0e0")
    self.assertEqual(layout["fontSize"], 14)
    # No gradient keys should appear
    self.assertNotIn("topColor", layout["background"])
    self.assertNotIn("bottomColor", layout["background"])


def test_all_new_layout_params_omitted_does_not_break_existing(self):
    """chart() with no new layout params must behave identically to before."""
    s = line_series(self.table)
    c = chart(s)
    self.assertEqual(c.chart_options, {})


def test_convenience_candlestick_passes_new_layout_params(self):
    """Convenience function should forward new layout params to chart()."""
    c = candlestick(
        self.table,
        background_top_color="#111",
        background_bottom_color="#333",
    )
    layout = c.chart_options["layout"]
    self.assertEqual(layout["background"]["type"], "gradient")


def test_convenience_line_passes_font_family(self):
    """line() convenience function should forward font_family."""
    c = line(self.table, font_family="monospace")
    self.assertEqual(c.chart_options["layout"]["fontFamily"], "monospace")
```

---

## 7. Serialization Contract

The `layout` dict is placed under `chart_options["layout"]` and forwarded verbatim to the JS frontend via JSON. The JS plugin reads `chartOptions.layout` and passes it to `createChart()`. No JS changes are required because all four new properties (`background` gradient, `fontFamily`, `attributionLogo`, `colorSpace`) are native TradingView Lightweight Charts v5.1 options that the library already understands.

| Python param | JSON key path | JS type |
|---|---|---|
| `background_color` | `layout.background.type = 'solid'`, `layout.background.color` | `SolidColor` |
| `background_top_color` + `background_bottom_color` | `layout.background.type = 'gradient'`, `.topColor`, `.bottomColor` | `VerticalGradientColor` |
| `font_family` | `layout.fontFamily` | `string` |
| `attribution_logo` | `layout.attributionLogo` | `boolean` |
| `color_space` | `layout.colorSpace` | `'srgb' \| 'display-p3'` |

---

## 8. Implementation Order

1. **`options.py`** — Add `ColorSpace = Literal["srgb", "display-p3"]`. This is a one-line change with no risk.

2. **`chart.py` imports** — Add `ColorSpace` to the import from `.options`.

3. **`chart.py` signature** — Add four new keyword parameters in the `# Layout` section, keeping `background_color`, `text_color`, `font_size` in their current positions (no positional shift).

4. **`chart.py` layout block** — Replace the existing 20-line block with the new validation + serialization block from §5.2. Run existing tests immediately after to confirm no regression.

5. **`test_chart.py`** — Add all new test methods to `TestChartFunction`. Run full test suite to verify all pass.

6. **Verify existing tests still pass** — Specifically `test_layout_options`, `test_background_color_only`, and `test_none_options_not_in_output` must pass without modification.

---

## 9. Edge Cases and Clarifications

**`attribution_logo=False` and `_filter_none`:** `_filter_none` filters out `None` values but preserves `False`. So `attribution_logo=False` will correctly emit `"attributionLogo": false` in JSON. No special handling needed.

**`color_space` — immutability:** The TradingView API docs state `colorSpace` is set at creation time only and cannot be changed via `applyOptions()`. Since the Python plugin only sends options at chart creation, this constraint is naturally satisfied. Add a note in the docstring.

**Gradient with `topColor == bottomColor`:** Perfectly valid from the API perspective (results in a flat color). No validation needed.

**Empty string for `font_family`:** An empty string `""` passes `_filter_none` (it is not `None`). It would be serialized as `"fontFamily": ""`. This is technically a user error but mimics the behavior of `text_color=""`. Do not add special validation for this edge case; keep the behavior consistent with existing params.

**`color_space` type safety:** The `ColorSpace = Literal["srgb", "display-p3"]` annotation gives static analysis tools (mypy, pyright) full type checking. The runtime does not enforce it. This is consistent with how `LineStyle`, `CrosshairMode`, etc. are handled in this codebase.

**Convenience function `yield_curve`:** Already forwards `**kwargs` to `chart()`. The `chart_type` check validates series types but does not restrict layout options. New layout params will work transparently with `yield_curve`.

---

## 10. Files To Modify (Summary)

| File | Change type | Lines affected |
|---|---|---|
| `src/deephaven/plot/tradingview_lightweight/options.py` | Add 1 line | After line 29 |
| `src/deephaven/plot/tradingview_lightweight/chart.py` | Modify imports, signature, layout block | ~30 lines changed |
| `test/deephaven/plot/tradingview_lightweight/test_chart.py` | Add new test methods | ~120 new lines |

No JS changes. No new files.
