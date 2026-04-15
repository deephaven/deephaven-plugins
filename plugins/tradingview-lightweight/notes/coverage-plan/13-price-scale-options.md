# Implementation Plan: PriceScaleOptions Coverage Gaps

**Target file:** `src/deephaven/plot/tradingview_lightweight/chart.py`
**Related file:** `src/deephaven/plot/tradingview_lightweight/series.py` (read-only reference — no changes needed there)
**Test file:** `test/deephaven/plot/tradingview_lightweight/test_chart.py`

---

## Current State Summary

| Scope | Score | Gap |
|---|---|---|
| Per-series (`scale_*` params in every `*_series()` function) | **13/13** | None — complete |
| Chart-level right price scale (`right_price_scale_*`) | **12/13** | Missing `scaleMargins` |
| Chart-level left price scale (`left_price_scale_*`) | **12/13** | Missing `scaleMargins` |
| Chart-level overlay defaults (`overlay_price_scale_*`) | **4/12** | Missing 8 properties |

---

## Part 1 — Chart-Level `scaleMargins` for Right and Left Price Scales

### 1.1 What Is Missing

The JS `PriceScaleOptions.scaleMargins` is a nested object `{ top: number, bottom: number }` where each value is a float in `[0, 1]` representing a fraction of the pane height. It is already supported for:

- Per-series: `scale_margin_top` / `scale_margin_bottom` → serialized via `_build_price_scale_options()` in `series.py`
- Overlay defaults: `overlay_price_scale_margin_top` / `overlay_price_scale_margin_bottom` → serialized directly in `chart()` body

It is **not** wired up for the chart-level `rightPriceScale` or `leftPriceScale` dicts in `chart()`.

### 1.2 New Parameters to Add

Add four new `Optional[float]` parameters to the `chart()` function signature in `chart.py`:

```text
# Right price scale  (insert immediately after right_price_scale_ensure_edge_tick_marks_visible)
right_price_scale_margin_top: Optional[float] = None,
right_price_scale_margin_bottom: Optional[float] = None,

# Left price scale  (insert immediately after left_price_scale_ensure_edge_tick_marks_visible)
left_price_scale_margin_top: Optional[float] = None,
left_price_scale_margin_bottom: Optional[float] = None,
```

**Types:** `Optional[float]` — values should be validated (or documented) to be in `[0, 1]`. No active validation is done elsewhere in this codebase; follow that pattern (document the constraint in the docstring only).

### 1.3 Serialization — Right Price Scale Block

Locate the existing `rps` dict construction in `chart()` (currently lines ~381–400 of `chart.py`):

```text
rps = _filter_none(
    {
        "visible": right_price_scale_visible,
        ...
        "ensureEdgeTickMarksVisible": right_price_scale_ensure_edge_tick_marks_visible,
    }
)
if rps:
    chart_options["rightPriceScale"] = rps
```

After the `_filter_none(...)` call that builds `rps`, and **before** the `if rps:` guard, add the margins sub-object. The pattern is identical to what already exists for the overlay scale:

```text
rps = _filter_none(
    {
        "visible": right_price_scale_visible,
        "borderVisible": right_price_scale_border_visible,
        "borderColor": right_price_scale_border_color,
        "autoScale": right_price_scale_auto_scale,
        "mode": PRICE_SCALE_MODE_MAP.get(right_price_scale_mode)
        if right_price_scale_mode
        else None,
        "invertScale": right_price_scale_invert_scale,
        "alignLabels": right_price_scale_align_labels,
        "textColor": right_price_scale_text_color,
        "entireTextOnly": right_price_scale_entire_text_only,
        "ticksVisible": right_price_scale_ticks_visible,
        "minimumWidth": right_price_scale_minimum_width,
        "ensureEdgeTickMarksVisible": right_price_scale_ensure_edge_tick_marks_visible,
    }
)
rps_margins = _filter_none(
    {
        "top": right_price_scale_margin_top,
        "bottom": right_price_scale_margin_bottom,
    }
)
if rps_margins:
    rps["scaleMargins"] = rps_margins
if rps:
    chart_options["rightPriceScale"] = rps
```

### 1.4 Serialization — Left Price Scale Block

Apply the identical pattern to the `lps` block (currently lines ~402–422 of `chart.py`):

```text
lps = _filter_none(
    {
        "visible": left_price_scale_visible,
        "borderVisible": left_price_scale_border_visible,
        "borderColor": left_price_scale_border_color,
        "autoScale": left_price_scale_auto_scale,
        "mode": PRICE_SCALE_MODE_MAP.get(left_price_scale_mode)
        if left_price_scale_mode
        else None,
        "invertScale": left_price_scale_invert_scale,
        "alignLabels": left_price_scale_align_labels,
        "textColor": left_price_scale_text_color,
        "entireTextOnly": left_price_scale_entire_text_only,
        "ticksVisible": left_price_scale_ticks_visible,
        "minimumWidth": left_price_scale_minimum_width,
        "ensureEdgeTickMarksVisible": left_price_scale_ensure_edge_tick_marks_visible,
    }
)
lps_margins = _filter_none(
    {
        "top": left_price_scale_margin_top,
        "bottom": left_price_scale_margin_bottom,
    }
)
if lps_margins:
    lps["scaleMargins"] = lps_margins
if lps:
    chart_options["leftPriceScale"] = lps
```

### 1.5 JSON Key Placement

The `scaleMargins` key must be a sibling of the other top-level keys in the `rightPriceScale` / `leftPriceScale` objects — it is **not** nested further. The resulting JSON for a call like `right_price_scale_margin_top=0.1, right_price_scale_margin_bottom=0.05` must be:

```json
{
  "rightPriceScale": {
    "scaleMargins": { "top": 0.1, "bottom": 0.05 }
  }
}
```

---

## Part 2 — Chart-Level Overlay Defaults: 8 Missing Properties

### 2.1 What Is Missing

The `overlayPriceScales` section of the TradingView chart options controls defaults that apply to every overlay (non-right, non-left) price scale. The Python layer currently supports only 4 of the 12 `PriceScaleOptions` properties for this scope.

Note: `OverlayPriceScaleOptions` in the JS API omits `visible` and `autoScale` compared to the full `PriceScaleOptions`. The 4 currently implemented overlay props are `borderVisible`, `ticksVisible`, `minimumWidth`, and `scaleMargins` (via `overlay_price_scale_margin_top`/`_bottom`). The 8 missing ones are:

| JS Property | Python Param to Add | Type |
|---|---|---|
| `autoScale` | `overlay_price_scale_auto_scale` | `Optional[bool]` |
| `mode` | `overlay_price_scale_mode` | `Optional[PriceScaleMode]` |
| `invertScale` | `overlay_price_scale_invert_scale` | `Optional[bool]` |
| `alignLabels` | `overlay_price_scale_align_labels` | `Optional[bool]` |
| `borderColor` | `overlay_price_scale_border_color` | `Optional[str]` |
| `textColor` | `overlay_price_scale_text_color` | `Optional[str]` |
| `entireTextOnly` | `overlay_price_scale_entire_text_only` | `Optional[bool]` |
| `ensureEdgeTickMarksVisible` | `overlay_price_scale_ensure_edge_tick_marks_visible` | `Optional[bool]` |

**Important note on `autoScale`:** The JS `OverlayPriceScaleOptions` type technically excludes `autoScale` (it is stripped from the overlay type in the TS definitions), but `applyOptions()` on an overlay scale still accepts it at runtime. Given that all other per-series and chart-level right/left scale params include `autoScale`, include it here for symmetry. Document in the docstring that its effect for overlays is implementation-dependent.

### 2.2 New Parameters to Add to `chart()` Signature

Insert these parameters in the `# Overlay price scale defaults` block (after the existing 5 overlay params, before `# Time scale`):

```text
# Overlay price scale defaults
overlay_price_scale_border_visible: Optional[bool] = None,       # already exists
overlay_price_scale_ticks_visible: Optional[bool] = None,        # already exists
overlay_price_scale_minimum_width: Optional[int] = None,         # already exists
overlay_price_scale_margin_top: Optional[float] = None,          # already exists
overlay_price_scale_margin_bottom: Optional[float] = None,       # already exists
# --- NEW ---
overlay_price_scale_auto_scale: Optional[bool] = None,
overlay_price_scale_mode: Optional[PriceScaleMode] = None,
overlay_price_scale_invert_scale: Optional[bool] = None,
overlay_price_scale_align_labels: Optional[bool] = None,
overlay_price_scale_border_color: Optional[str] = None,
overlay_price_scale_text_color: Optional[str] = None,
overlay_price_scale_entire_text_only: Optional[bool] = None,
overlay_price_scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
```

**Type import note:** `PriceScaleMode` is already imported in `chart.py` at the top (from `.options`). No new imports are required.

### 2.3 Serialization — Overlay Price Scale Block

Locate the existing `ops` block in `chart()` (currently lines ~424–441):

```text
# Overlay price scale defaults
ops: dict = _filter_none(
    {
        "borderVisible": overlay_price_scale_border_visible,
        "ticksVisible": overlay_price_scale_ticks_visible,
        "minimumWidth": overlay_price_scale_minimum_width,
    }
)
ops_margins = _filter_none(
    {
        "top": overlay_price_scale_margin_top,
        "bottom": overlay_price_scale_margin_bottom,
    }
)
if ops_margins:
    ops["scaleMargins"] = ops_margins
if ops:
    chart_options["overlayPriceScales"] = ops
```

Replace this entire block with the expanded version:

```text
# Overlay price scale defaults
ops: dict = _filter_none(
    {
        "autoScale": overlay_price_scale_auto_scale,
        "mode": PRICE_SCALE_MODE_MAP.get(overlay_price_scale_mode)
        if overlay_price_scale_mode
        else None,
        "invertScale": overlay_price_scale_invert_scale,
        "alignLabels": overlay_price_scale_align_labels,
        "borderVisible": overlay_price_scale_border_visible,
        "borderColor": overlay_price_scale_border_color,
        "textColor": overlay_price_scale_text_color,
        "entireTextOnly": overlay_price_scale_entire_text_only,
        "ticksVisible": overlay_price_scale_ticks_visible,
        "minimumWidth": overlay_price_scale_minimum_width,
        "ensureEdgeTickMarksVisible": overlay_price_scale_ensure_edge_tick_marks_visible,
    }
)
ops_margins = _filter_none(
    {
        "top": overlay_price_scale_margin_top,
        "bottom": overlay_price_scale_margin_bottom,
    }
)
if ops_margins:
    ops["scaleMargins"] = ops_margins
if ops:
    chart_options["overlayPriceScales"] = ops
```

**Ordering note:** The key ordering within `ops` matches the canonical order in the JS `PriceScaleOptions` interface (autoScale → mode → invertScale → alignLabels → scaleMargins → borderVisible → borderColor → textColor → entireTextOnly → visible → ticksVisible → minimumWidth → ensureEdgeTickMarksVisible). This matches the order already used in `_build_price_scale_options()` in `series.py`.

### 2.4 JSON Output Examples

For a call with all 8 new overlay params set:

```text
chart(
    s,
    overlay_price_scale_auto_scale=True,
    overlay_price_scale_mode="logarithmic",
    overlay_price_scale_invert_scale=False,
    overlay_price_scale_align_labels=True,
    overlay_price_scale_border_color="#ff0000",
    overlay_price_scale_text_color="#ffffff",
    overlay_price_scale_entire_text_only=True,
    overlay_price_scale_ensure_edge_tick_marks_visible=True,
)
```

Must produce:

```json
{
  "overlayPriceScales": {
    "autoScale": true,
    "mode": 1,
    "invertScale": false,
    "alignLabels": true,
    "borderColor": "#ff0000",
    "textColor": "#ffffff",
    "entireTextOnly": true,
    "ensureEdgeTickMarksVisible": true
  }
}
```

Note that `mode` is serialized as an integer using `PRICE_SCALE_MODE_MAP` (`"logarithmic"` → `1`), exactly the same as for the right/left scale and per-series scales.

---

## Part 3 — Test Coverage

All new tests belong in the existing `TestChartFunction` class in `test/deephaven/plot/tradingview_lightweight/test_chart.py`.

### 3.1 Tests for Right Price Scale `scaleMargins`

```text
def test_right_price_scale_margins(self):
    """scaleMargins nested dict is built for right price scale."""
    s = line_series(self.table)
    c = chart(
        s,
        right_price_scale_margin_top=0.2,
        right_price_scale_margin_bottom=0.1,
    )
    rps = c.chart_options["rightPriceScale"]
    self.assertIn("scaleMargins", rps)
    self.assertEqual(rps["scaleMargins"]["top"], 0.2)
    self.assertEqual(rps["scaleMargins"]["bottom"], 0.1)

def test_right_price_scale_margin_top_only(self):
    """Providing only top margin still creates scaleMargins with only top key."""
    s = line_series(self.table)
    c = chart(s, right_price_scale_margin_top=0.3)
    rps = c.chart_options["rightPriceScale"]
    self.assertEqual(rps["scaleMargins"]["top"], 0.3)
    self.assertNotIn("bottom", rps["scaleMargins"])

def test_right_price_scale_margin_with_other_props(self):
    """scaleMargins coexists correctly with other right price scale properties."""
    s = line_series(self.table)
    c = chart(
        s,
        right_price_scale_visible=True,
        right_price_scale_margin_top=0.15,
        right_price_scale_margin_bottom=0.05,
    )
    rps = c.chart_options["rightPriceScale"]
    self.assertTrue(rps["visible"])
    self.assertEqual(rps["scaleMargins"], {"top": 0.15, "bottom": 0.05})
```

### 3.2 Tests for Left Price Scale `scaleMargins`

```text
def test_left_price_scale_margins(self):
    """scaleMargins nested dict is built for left price scale."""
    s = line_series(self.table)
    c = chart(
        s,
        left_price_scale_margin_top=0.1,
        left_price_scale_margin_bottom=0.2,
    )
    lps = c.chart_options["leftPriceScale"]
    self.assertIn("scaleMargins", lps)
    self.assertEqual(lps["scaleMargins"]["top"], 0.1)
    self.assertEqual(lps["scaleMargins"]["bottom"], 0.2)

def test_left_price_scale_margin_bottom_only(self):
    """Providing only bottom margin produces scaleMargins with only bottom key."""
    s = line_series(self.table)
    c = chart(s, left_price_scale_margin_bottom=0.05)
    lps = c.chart_options["leftPriceScale"]
    self.assertNotIn("top", lps["scaleMargins"])
    self.assertEqual(lps["scaleMargins"]["bottom"], 0.05)
```

### 3.3 Tests for the 8 New Overlay Properties

```text
def test_overlay_price_scale_auto_scale(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_auto_scale=True)
    self.assertTrue(c.chart_options["overlayPriceScales"]["autoScale"])

def test_overlay_price_scale_mode(self):
    """overlay_price_scale_mode is serialized via PRICE_SCALE_MODE_MAP."""
    s = line_series(self.table)
    modes = {
        "normal": 0,
        "logarithmic": 1,
        "percentage": 2,
        "indexed_to_100": 3,
    }
    for mode_name, expected in modes.items():
        c = chart(s, overlay_price_scale_mode=mode_name)
        self.assertEqual(
            c.chart_options["overlayPriceScales"]["mode"],
            expected,
            f"Mode '{mode_name}' should map to {expected}",
        )

def test_overlay_price_scale_invert_scale(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_invert_scale=True)
    self.assertTrue(c.chart_options["overlayPriceScales"]["invertScale"])

def test_overlay_price_scale_align_labels(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_align_labels=False)
    self.assertFalse(c.chart_options["overlayPriceScales"]["alignLabels"])

def test_overlay_price_scale_border_color(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_border_color="#aabbcc")
    self.assertEqual(c.chart_options["overlayPriceScales"]["borderColor"], "#aabbcc")

def test_overlay_price_scale_text_color(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_text_color="#ffffff")
    self.assertEqual(c.chart_options["overlayPriceScales"]["textColor"], "#ffffff")

def test_overlay_price_scale_entire_text_only(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_entire_text_only=True)
    self.assertTrue(c.chart_options["overlayPriceScales"]["entireTextOnly"])

def test_overlay_price_scale_ensure_edge_tick_marks_visible(self):
    s = line_series(self.table)
    c = chart(s, overlay_price_scale_ensure_edge_tick_marks_visible=True)
    self.assertTrue(
        c.chart_options["overlayPriceScales"]["ensureEdgeTickMarksVisible"]
    )
```

### 3.4 Combined Test for All New Overlay Properties Together

```text
def test_overlay_price_scale_all_new_props(self):
    """All 8 new overlay props serialize correctly and coexist with the 4 existing ones."""
    s = line_series(self.table)
    c = chart(
        s,
        # existing props
        overlay_price_scale_border_visible=True,
        overlay_price_scale_ticks_visible=False,
        overlay_price_scale_minimum_width=50,
        overlay_price_scale_margin_top=0.1,
        overlay_price_scale_margin_bottom=0.05,
        # new props
        overlay_price_scale_auto_scale=False,
        overlay_price_scale_mode="percentage",
        overlay_price_scale_invert_scale=True,
        overlay_price_scale_align_labels=False,
        overlay_price_scale_border_color="#111111",
        overlay_price_scale_text_color="#eeeeee",
        overlay_price_scale_entire_text_only=True,
        overlay_price_scale_ensure_edge_tick_marks_visible=True,
    )
    ops = c.chart_options["overlayPriceScales"]
    # existing
    self.assertTrue(ops["borderVisible"])
    self.assertFalse(ops["ticksVisible"])
    self.assertEqual(ops["minimumWidth"], 50)
    self.assertEqual(ops["scaleMargins"], {"top": 0.1, "bottom": 0.05})
    # new
    self.assertFalse(ops["autoScale"])
    self.assertEqual(ops["mode"], 2)          # "percentage" → 2
    self.assertTrue(ops["invertScale"])
    self.assertFalse(ops["alignLabels"])
    self.assertEqual(ops["borderColor"], "#111111")
    self.assertEqual(ops["textColor"], "#eeeeee")
    self.assertTrue(ops["entireTextOnly"])
    self.assertTrue(ops["ensureEdgeTickMarksVisible"])
```

### 3.5 Regression: None Params Must Not Appear in Output

Add the new overlay keys to the existing `test_none_options_not_in_output` test, or add a separate targeted check:

```text
def test_overlay_price_scale_not_set_by_default(self):
    """overlayPriceScales key absent when no overlay params provided."""
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("overlayPriceScales", c.chart_options)

def test_right_price_scale_margins_not_set_by_default(self):
    """No scaleMargins key in rightPriceScale when margin params are None."""
    s = line_series(self.table)
    c = chart(s, right_price_scale_visible=True)
    rps = c.chart_options["rightPriceScale"]
    self.assertNotIn("scaleMargins", rps)
```

---

## Part 4 — Implementation Checklist

Implement changes in this exact order to keep diffs reviewable:

1. **`chart.py` — function signature, right price scale block:**
   - Add `right_price_scale_margin_top: Optional[float] = None` immediately after `right_price_scale_ensure_edge_tick_marks_visible` in the param list.
   - Add `right_price_scale_margin_bottom: Optional[float] = None` on the next line.
   - In the `rps` build block: after `rps = _filter_none({...})`, add the 3-line margins pattern and inject into `rps` before the `if rps:` guard.

2. **`chart.py` — function signature, left price scale block:**
   - Add `left_price_scale_margin_top: Optional[float] = None` immediately after `left_price_scale_ensure_edge_tick_marks_visible`.
   - Add `left_price_scale_margin_bottom: Optional[float] = None` on the next line.
   - In the `lps` build block: same 3-line margins pattern.

3. **`chart.py` — function signature, overlay block:**
   - Add the 8 new `overlay_price_scale_*` params after the 5 existing ones (before `# Time scale`).

4. **`chart.py` — overlay serialization block:**
   - Expand `ops = _filter_none({...})` to include the 8 new JS keys, following the canonical order described in Section 2.3.
   - Leave the `ops_margins` block and `if ops:` guard unchanged.

5. **`test_chart.py` — add all tests** from Section 3 above.

6. **Run the test suite** to verify:
   ```
   PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
   $PY -m pytest test/ -v
   ```

---

## Part 5 — No Changes Required Elsewhere

- **`series.py`** — `_build_price_scale_options()` already supports all 13 per-series props. No changes.
- **`options.py`** — `PRICE_SCALE_MODE_MAP` already contains all four modes; `PriceScaleMode` type is already defined. No changes.
- **JS frontend** — the frontend already passes `priceScaleOptions` from `SeriesSpec` through to the chart and passes `chartOptions.rightPriceScale` / `leftPriceScale` / `overlayPriceScales` directly to `chart.applyOptions()`. No JS changes needed; the new keys will be forwarded automatically.
- **`__init__.py`** — no new public symbols are introduced (these are params on the existing `chart()` function).

---

## Part 6 — Final Coverage Score After Implementation

| Scope | Before | After |
|---|---|---|
| Per-series | 13/13 | 13/13 (unchanged) |
| Chart-level right price scale | 12/13 | **13/13** |
| Chart-level left price scale | 12/13 | **13/13** |
| Chart-level overlay defaults | 4/12 | **12/12** |

The API coverage report (`notes/api-coverage-report.md`, Section 18) should be updated to reflect these scores once the implementation is complete.
