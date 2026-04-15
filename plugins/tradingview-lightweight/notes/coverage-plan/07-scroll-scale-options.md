# Implementation Plan: HandleScroll, HandleScale, and KineticScroll Options

**Coverage Report Reference:** Section 7 — HandleScroll / HandleScale / KineticScroll
**Status Before This Plan:** All 10 properties across 3 option groups are ❌ (not implemented)
**Target Status After Implementation:** All 10 properties ✅

---

## 1. Overview

The TradingView Lightweight Charts JS library exposes three option groups that control how users interact with the chart via mouse and touch:

| JS Option Key   | JS Type                              | Controls                              |
|-----------------|--------------------------------------|---------------------------------------|
| `handleScroll`  | `boolean \| HandleScrollOptions`     | Whether and how scrolling is handled  |
| `handleScale`   | `boolean \| HandleScaleOptions`      | Whether and how scaling/zoom works    |
| `kineticScroll` | `KineticScrollOptions`               | Momentum/kinetic scrolling behavior   |

The JS API has a **dual-form** for `handleScroll` and `handleScale`:
- **Boolean shorthand:** `handleScroll: false` disables all scrolling at once.
- **Object form:** `handleScroll: { mouseWheel: true, pressedMouseMove: false, ... }` for granular control.

`kineticScroll` is always an object form (no boolean shorthand in the JS API).

---

## 2. Properties to Implement

### 2.1 HandleScrollOptions

JS defaults: all four sub-properties default to `true`.

| JS Property         | JS Type   | JS Default | Python Parameter             | Python Type         |
|---------------------|-----------|------------|------------------------------|---------------------|
| `mouseWheel`        | `boolean` | `true`     | `handle_scroll_mouse_wheel`  | `Optional[bool]`    |
| `pressedMouseMove`  | `boolean` | `true`     | `handle_scroll_pressed_mouse_move` | `Optional[bool]` |
| `horzTouchDrag`     | `boolean` | `true`     | `handle_scroll_horz_touch_drag` | `Optional[bool]` |
| `vertTouchDrag`     | `boolean` | `true`     | `handle_scroll_vert_touch_drag` | `Optional[bool]` |

Plus a boolean-shorthand parameter:

| Python Parameter | Python Type      | Behavior                                                        |
|------------------|------------------|-----------------------------------------------------------------|
| `handle_scroll`  | `Optional[bool]` | If `False`, emits `handleScroll: false`. If `True`, emits `handleScroll: true`. If `None`, no top-level shorthand is emitted (granular params take effect if any are set). |

### 2.2 HandleScaleOptions

JS defaults: `mouseWheel` and `pinch` default to `true`; `axisPressedMouseMove` and `axisDoubleClickReset` default to an object that enables both price and time axes (effectively `true`).

| JS Property             | JS Type   | JS Default | Python Parameter                       | Python Type      |
|-------------------------|-----------|------------|----------------------------------------|------------------|
| `mouseWheel`            | `boolean` | `true`     | `handle_scale_mouse_wheel`             | `Optional[bool]` |
| `pinch`                 | `boolean` | `true`     | `handle_scale_pinch`                   | `Optional[bool]` |
| `axisPressedMouseMove`  | `boolean` | `true`     | `handle_scale_axis_pressed_mouse_move` | `Optional[bool]` |
| `axisDoubleClickReset`  | `boolean` | `true`     | `handle_scale_axis_double_click_reset` | `Optional[bool]` |

> **Scope note for `axisPressedMouseMove` and `axisDoubleClickReset`:** The JS API also accepts an object with `{ time: bool, price: bool }` sub-fields for granular per-axis control (`AxisPressedMouseMoveOptions` / `AxisDoubleClickOptions`). This plan scopes only the boolean form. Per-axis granularity can be added in a future plan if needed.

Plus a boolean-shorthand parameter:

| Python Parameter | Python Type      | Behavior                                                        |
|------------------|------------------|-----------------------------------------------------------------|
| `handle_scale`   | `Optional[bool]` | If `False`, emits `handleScale: false`. If `True`, emits `handleScale: true`. If `None`, no top-level shorthand is emitted. |

### 2.3 KineticScrollOptions

JS defaults: `touch` is `true`, `mouse` is `false`.

| JS Property | JS Type   | JS Default | Python Parameter          | Python Type      |
|-------------|-----------|------------|---------------------------|------------------|
| `touch`     | `boolean` | `true`     | `kinetic_scroll_touch`    | `Optional[bool]` |
| `mouse`     | `boolean` | `false`    | `kinetic_scroll_mouse`    | `Optional[bool]` |

There is no boolean shorthand for `kineticScroll` in the JS API.

---

## 3. API Design: Handling the Boolean Shorthand

The Python API must handle two scenarios cleanly:

### Scenario A — Shorthand disable/enable all

```text
# Disable all scrolling entirely
c = chart(series, handle_scroll=False)
# Emits: { "handleScroll": false }

# Enable all scrolling (rarely needed, it's the default)
c = chart(series, handle_scroll=True)
# Emits: { "handleScroll": true }

# Same for scale
c = chart(series, handle_scale=False)
# Emits: { "handleScale": false }
```

### Scenario B — Granular control (individual sub-properties)

```text
# Disable only mouse-wheel scrolling
c = chart(series, handle_scroll_mouse_wheel=False)
# Emits: { "handleScroll": { "mouseWheel": false } }

# Mix: disable wheel scroll, keep everything else default
c = chart(series, handle_scroll_mouse_wheel=False, handle_scroll_horz_touch_drag=True)
# Emits: { "handleScroll": { "mouseWheel": false, "horzTouchDrag": true } }
```

### Scenario C — Shorthand overrides granular (shorthand takes precedence)

When `handle_scroll` (the shorthand bool) is provided alongside granular sub-options, the shorthand wins and is emitted as the boolean form. The granular sub-options are silently ignored in this case. This matches the simplest implementation without ambiguity.

```text
# handle_scroll=False wins; the wheel option is ignored
c = chart(series, handle_scroll=False, handle_scroll_mouse_wheel=True)
# Emits: { "handleScroll": false }
```

### Serialization Logic (pseudocode)

```text
# For handle_scroll:
if handle_scroll is not None:
    chart_options["handleScroll"] = handle_scroll
else:
    hs = _filter_none({
        "mouseWheel": handle_scroll_mouse_wheel,
        "pressedMouseMove": handle_scroll_pressed_mouse_move,
        "horzTouchDrag": handle_scroll_horz_touch_drag,
        "vertTouchDrag": handle_scroll_vert_touch_drag,
    })
    if hs:
        chart_options["handleScroll"] = hs

# For handle_scale:
if handle_scale is not None:
    chart_options["handleScale"] = handle_scale
else:
    hsc = _filter_none({
        "mouseWheel": handle_scale_mouse_wheel,
        "pinch": handle_scale_pinch,
        "axisPressedMouseMove": handle_scale_axis_pressed_mouse_move,
        "axisDoubleClickReset": handle_scale_axis_double_click_reset,
    })
    if hsc:
        chart_options["handleScale"] = hsc

# For kinetic_scroll (always object, no shorthand):
ks = _filter_none({
    "touch": kinetic_scroll_touch,
    "mouse": kinetic_scroll_mouse,
})
if ks:
    chart_options["kineticScroll"] = ks
```

---

## 4. Changes to `chart.py`

### 4.1 New Parameters in the `chart()` Function Signature

Add the following parameters to the `chart()` function in `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/chart.py`.

Insert them after the `# Watermark` block parameters and before the `# Localization` block parameters. The exact insertion point is after line 256 (`watermark_vert_align: Optional[str] = None,`) and before line 258 (`# Localization`).

Group them with a comment block:

```text
    # Scroll / Scale / Kinetic scroll
    handle_scroll: Optional[bool] = None,
    handle_scroll_mouse_wheel: Optional[bool] = None,
    handle_scroll_pressed_mouse_move: Optional[bool] = None,
    handle_scroll_horz_touch_drag: Optional[bool] = None,
    handle_scroll_vert_touch_drag: Optional[bool] = None,
    handle_scale: Optional[bool] = None,
    handle_scale_mouse_wheel: Optional[bool] = None,
    handle_scale_pinch: Optional[bool] = None,
    handle_scale_axis_pressed_mouse_move: Optional[bool] = None,
    handle_scale_axis_double_click_reset: Optional[bool] = None,
    kinetic_scroll_touch: Optional[bool] = None,
    kinetic_scroll_mouse: Optional[bool] = None,
```

### 4.2 New Serialization Block in `_build_options()` (inside `chart()`)

Add the following block after the watermark serialization block (after the `if wm: chart_options["watermark"] = wm` line, before the `# Localization` comment):

```text
    # HandleScroll
    if handle_scroll is not None:
        chart_options["handleScroll"] = handle_scroll
    else:
        hs = _filter_none(
            {
                "mouseWheel": handle_scroll_mouse_wheel,
                "pressedMouseMove": handle_scroll_pressed_mouse_move,
                "horzTouchDrag": handle_scroll_horz_touch_drag,
                "vertTouchDrag": handle_scroll_vert_touch_drag,
            }
        )
        if hs:
            chart_options["handleScroll"] = hs

    # HandleScale
    if handle_scale is not None:
        chart_options["handleScale"] = handle_scale
    else:
        hsc = _filter_none(
            {
                "mouseWheel": handle_scale_mouse_wheel,
                "pinch": handle_scale_pinch,
                "axisPressedMouseMove": handle_scale_axis_pressed_mouse_move,
                "axisDoubleClickReset": handle_scale_axis_double_click_reset,
            }
        )
        if hsc:
            chart_options["handleScale"] = hsc

    # KineticScroll
    ks = _filter_none(
        {
            "touch": kinetic_scroll_touch,
            "mouse": kinetic_scroll_mouse,
        }
    )
    if ks:
        chart_options["kineticScroll"] = ks
```

### 4.3 Full Updated `chart()` Signature

For reference, the complete new parameter list for the scroll/scale/kinetic section. All other parameters remain unchanged. The type annotation for the new parameters follows the existing `Optional[bool]` pattern already used throughout the signature (e.g., `vert_lines_visible: Optional[bool] = None`).

No changes are needed to `options.py` — no new enum types, Literals, or maps are required. All new parameters are plain `Optional[bool]`.

No changes are needed to `TvlChart.__init__`, `TvlChart.to_dict`, or any other method — `chart_options` is a plain dict that flows through unchanged.

---

## 5. No Changes Required to `options.py`

The new parameters are all `Optional[bool]`, so no new types, Literals, or constant maps need to be added to `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/options.py`.

---

## 6. Test Coverage

Add a new test class `TestScrollScaleOptions` to `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/test/deephaven/plot/tradingview_lightweight/test_chart.py`.

Append it after the existing `TestConvenienceFunctions` class (or after `TestChartFunction`, whichever is last in the file). Do not modify any existing test.

### 6.1 Full Test Class to Add

```text
class TestScrollScaleOptions(unittest.TestCase):
    """Tests for handleScroll, handleScale, and kineticScroll options."""

    def setUp(self):
        self.table = MagicMock(name="table")

    # -----------------------------------------------------------------------
    # HandleScroll — not set by default
    # -----------------------------------------------------------------------

    def test_handle_scroll_not_set_by_default(self):
        """No scroll/scale keys should appear when no params are given."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("handleScroll", c.chart_options)
        self.assertNotIn("handleScale", c.chart_options)
        self.assertNotIn("kineticScroll", c.chart_options)

    # -----------------------------------------------------------------------
    # HandleScroll — boolean shorthand
    # -----------------------------------------------------------------------

    def test_handle_scroll_false_shorthand(self):
        """handle_scroll=False should emit handleScroll: false (boolean)."""
        s = line_series(self.table)
        c = chart(s, handle_scroll=False)
        self.assertIn("handleScroll", c.chart_options)
        self.assertIs(c.chart_options["handleScroll"], False)

    def test_handle_scroll_true_shorthand(self):
        """handle_scroll=True should emit handleScroll: true (boolean)."""
        s = line_series(self.table)
        c = chart(s, handle_scroll=True)
        self.assertIs(c.chart_options["handleScroll"], True)

    def test_handle_scroll_shorthand_overrides_granular(self):
        """When handle_scroll bool is set, granular sub-options are ignored."""
        s = line_series(self.table)
        c = chart(s, handle_scroll=False, handle_scroll_mouse_wheel=True)
        # Must be boolean False, not an object
        self.assertIs(c.chart_options["handleScroll"], False)

    # -----------------------------------------------------------------------
    # HandleScroll — granular sub-options
    # -----------------------------------------------------------------------

    def test_handle_scroll_mouse_wheel_false(self):
        """handle_scroll_mouse_wheel=False emits object form."""
        s = line_series(self.table)
        c = chart(s, handle_scroll_mouse_wheel=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["mouseWheel"])

    def test_handle_scroll_pressed_mouse_move_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scroll_pressed_mouse_move=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["pressedMouseMove"])

    def test_handle_scroll_horz_touch_drag_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scroll_horz_touch_drag=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["horzTouchDrag"])

    def test_handle_scroll_vert_touch_drag_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scroll_vert_touch_drag=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["vertTouchDrag"])

    def test_handle_scroll_all_granular_options(self):
        """All four granular scroll options should appear in the object."""
        s = line_series(self.table)
        c = chart(
            s,
            handle_scroll_mouse_wheel=True,
            handle_scroll_pressed_mouse_move=False,
            handle_scroll_horz_touch_drag=True,
            handle_scroll_vert_touch_drag=False,
        )
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertTrue(hs["mouseWheel"])
        self.assertFalse(hs["pressedMouseMove"])
        self.assertTrue(hs["horzTouchDrag"])
        self.assertFalse(hs["vertTouchDrag"])

    def test_handle_scroll_partial_granular_only_set_keys_emitted(self):
        """Only explicitly set granular keys should appear in the output dict."""
        s = line_series(self.table)
        c = chart(s, handle_scroll_mouse_wheel=False)
        hs = c.chart_options["handleScroll"]
        # Only "mouseWheel" should be present — not the others
        self.assertIn("mouseWheel", hs)
        self.assertNotIn("pressedMouseMove", hs)
        self.assertNotIn("horzTouchDrag", hs)
        self.assertNotIn("vertTouchDrag", hs)

    # -----------------------------------------------------------------------
    # HandleScale — boolean shorthand
    # -----------------------------------------------------------------------

    def test_handle_scale_false_shorthand(self):
        """handle_scale=False should emit handleScale: false (boolean)."""
        s = line_series(self.table)
        c = chart(s, handle_scale=False)
        self.assertIs(c.chart_options["handleScale"], False)

    def test_handle_scale_true_shorthand(self):
        s = line_series(self.table)
        c = chart(s, handle_scale=True)
        self.assertIs(c.chart_options["handleScale"], True)

    def test_handle_scale_shorthand_overrides_granular(self):
        """When handle_scale bool is set, granular sub-options are ignored."""
        s = line_series(self.table)
        c = chart(s, handle_scale=False, handle_scale_pinch=True)
        self.assertIs(c.chart_options["handleScale"], False)

    # -----------------------------------------------------------------------
    # HandleScale — granular sub-options
    # -----------------------------------------------------------------------

    def test_handle_scale_mouse_wheel_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_mouse_wheel=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["mouseWheel"])

    def test_handle_scale_pinch_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_pinch=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["pinch"])

    def test_handle_scale_axis_pressed_mouse_move_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_axis_pressed_mouse_move=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["axisPressedMouseMove"])

    def test_handle_scale_axis_double_click_reset_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_axis_double_click_reset=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["axisDoubleClickReset"])

    def test_handle_scale_all_granular_options(self):
        """All four granular scale options should appear in the object."""
        s = line_series(self.table)
        c = chart(
            s,
            handle_scale_mouse_wheel=True,
            handle_scale_pinch=False,
            handle_scale_axis_pressed_mouse_move=True,
            handle_scale_axis_double_click_reset=False,
        )
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertTrue(hsc["mouseWheel"])
        self.assertFalse(hsc["pinch"])
        self.assertTrue(hsc["axisPressedMouseMove"])
        self.assertFalse(hsc["axisDoubleClickReset"])

    def test_handle_scale_partial_granular_only_set_keys_emitted(self):
        """Only explicitly set granular keys should appear in the output dict."""
        s = line_series(self.table)
        c = chart(s, handle_scale_pinch=False)
        hsc = c.chart_options["handleScale"]
        self.assertIn("pinch", hsc)
        self.assertNotIn("mouseWheel", hsc)
        self.assertNotIn("axisPressedMouseMove", hsc)
        self.assertNotIn("axisDoubleClickReset", hsc)

    # -----------------------------------------------------------------------
    # KineticScroll
    # -----------------------------------------------------------------------

    def test_kinetic_scroll_touch_false(self):
        """kinetic_scroll_touch=False should emit kineticScroll.touch: false."""
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_touch=False)
        ks = c.chart_options["kineticScroll"]
        self.assertIsInstance(ks, dict)
        self.assertFalse(ks["touch"])

    def test_kinetic_scroll_mouse_true(self):
        """kinetic_scroll_mouse=True should emit kineticScroll.mouse: true."""
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_mouse=True)
        ks = c.chart_options["kineticScroll"]
        self.assertIsInstance(ks, dict)
        self.assertTrue(ks["mouse"])

    def test_kinetic_scroll_both_options(self):
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_touch=True, kinetic_scroll_mouse=True)
        ks = c.chart_options["kineticScroll"]
        self.assertTrue(ks["touch"])
        self.assertTrue(ks["mouse"])

    def test_kinetic_scroll_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("kineticScroll", c.chart_options)

    def test_kinetic_scroll_partial_only_set_keys_emitted(self):
        """Setting only mouse should not emit touch key."""
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_mouse=False)
        ks = c.chart_options["kineticScroll"]
        self.assertIn("mouse", ks)
        self.assertNotIn("touch", ks)

    # -----------------------------------------------------------------------
    # Combined: all three groups together
    # -----------------------------------------------------------------------

    def test_all_three_groups_combined(self):
        """All three option groups can coexist in chart_options."""
        s = line_series(self.table)
        c = chart(
            s,
            handle_scroll=False,
            handle_scale_pinch=False,
            kinetic_scroll_mouse=True,
        )
        self.assertIs(c.chart_options["handleScroll"], False)
        self.assertFalse(c.chart_options["handleScale"]["pinch"])
        self.assertTrue(c.chart_options["kineticScroll"]["mouse"])

    def test_scroll_scale_options_do_not_interfere_with_other_options(self):
        """Adding scroll/scale options should not disturb layout or grid."""
        s = line_series(self.table)
        c = chart(
            s,
            background_color="#000",
            vert_lines_visible=False,
            handle_scroll=False,
            handle_scale=False,
            kinetic_scroll_touch=False,
        )
        self.assertIn("layout", c.chart_options)
        self.assertIn("grid", c.chart_options)
        self.assertIs(c.chart_options["handleScroll"], False)
        self.assertIs(c.chart_options["handleScale"], False)
        self.assertFalse(c.chart_options["kineticScroll"]["touch"])
```

---

## 7. Implementation Steps (Ordered)

Follow these steps exactly. Each step is self-contained and verifiable.

### Step 1 — Add parameters to `chart()` signature

File: `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/chart.py`

Find the line:
```text
    # Localization
    price_formatter: Optional[PriceFormatter] = None,
```

Insert the following block immediately before it:
```text
    # Scroll / Scale / Kinetic scroll
    handle_scroll: Optional[bool] = None,
    handle_scroll_mouse_wheel: Optional[bool] = None,
    handle_scroll_pressed_mouse_move: Optional[bool] = None,
    handle_scroll_horz_touch_drag: Optional[bool] = None,
    handle_scroll_vert_touch_drag: Optional[bool] = None,
    handle_scale: Optional[bool] = None,
    handle_scale_mouse_wheel: Optional[bool] = None,
    handle_scale_pinch: Optional[bool] = None,
    handle_scale_axis_pressed_mouse_move: Optional[bool] = None,
    handle_scale_axis_double_click_reset: Optional[bool] = None,
    kinetic_scroll_touch: Optional[bool] = None,
    kinetic_scroll_mouse: Optional[bool] = None,
```

### Step 2 — Add serialization block in `chart()` body

File: same as above.

Find the line:
```text
    # Localization
    if price_formatter is not None:
```

Insert the following block immediately before it:
```text
    # HandleScroll
    if handle_scroll is not None:
        chart_options["handleScroll"] = handle_scroll
    else:
        hs = _filter_none(
            {
                "mouseWheel": handle_scroll_mouse_wheel,
                "pressedMouseMove": handle_scroll_pressed_mouse_move,
                "horzTouchDrag": handle_scroll_horz_touch_drag,
                "vertTouchDrag": handle_scroll_vert_touch_drag,
            }
        )
        if hs:
            chart_options["handleScroll"] = hs

    # HandleScale
    if handle_scale is not None:
        chart_options["handleScale"] = handle_scale
    else:
        hsc = _filter_none(
            {
                "mouseWheel": handle_scale_mouse_wheel,
                "pinch": handle_scale_pinch,
                "axisPressedMouseMove": handle_scale_axis_pressed_mouse_move,
                "axisDoubleClickReset": handle_scale_axis_double_click_reset,
            }
        )
        if hsc:
            chart_options["handleScale"] = hsc

    # KineticScroll
    ks = _filter_none(
        {
            "touch": kinetic_scroll_touch,
            "mouse": kinetic_scroll_mouse,
        }
    )
    if ks:
        chart_options["kineticScroll"] = ks

```

### Step 3 — Add the test class

File: `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/test/deephaven/plot/tradingview_lightweight/test_chart.py`

Append the full `TestScrollScaleOptions` class from section 6.1 above at the end of the file (after the last existing test class, before the `if __name__ == "__main__":` guard if present, or simply at the very end).

### Step 4 — Verify tests pass

Run:
```bash
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pytest test/deephaven/plot/tradingview_lightweight/test_chart.py -v
```

All existing tests must still pass. The new `TestScrollScaleOptions` class should produce 27 passing tests (count may vary if tests are merged or split).

---

## 8. Code Examples for Documentation

The following usage examples demonstrate the new API. These can be used as docstring snippets or in a cookbook.

### Example 1: Read-only chart (disable all interaction)

```text
import deephaven.plot.tradingview_lightweight as tvl

c = tvl.chart(
    tvl.line_series(table),
    handle_scroll=False,
    handle_scale=False,
)
```

### Example 2: Disable only mouse-wheel actions, keep touch

```text
c = tvl.chart(
    tvl.line_series(table),
    handle_scroll_mouse_wheel=False,
    handle_scale_mouse_wheel=False,
)
```

### Example 3: Disable pinch-to-zoom only

```text
c = tvl.chart(
    tvl.line_series(table),
    handle_scale_pinch=False,
)
```

### Example 4: Enable kinetic (momentum) scroll on mouse (off by default)

```text
c = tvl.chart(
    tvl.line_series(table),
    kinetic_scroll_mouse=True,
)
```

### Example 5: Disable touch momentum scrolling

```text
c = tvl.chart(
    tvl.line_series(table),
    kinetic_scroll_touch=False,
)
```

### Example 6: Disable axis drag-to-scale and double-click reset

```text
c = tvl.chart(
    tvl.line_series(table),
    handle_scale_axis_pressed_mouse_move=False,
    handle_scale_axis_double_click_reset=False,
)
```

### Example 7: Full configuration — restrict to touch-only scrolling

```text
c = tvl.chart(
    tvl.candlestick_series(table),
    # Disable mouse wheel and drag scroll, keep touch
    handle_scroll_mouse_wheel=False,
    handle_scroll_pressed_mouse_move=False,
    handle_scroll_horz_touch_drag=True,
    handle_scroll_vert_touch_drag=True,
    # Disable mouse wheel zoom, keep pinch
    handle_scale_mouse_wheel=False,
    handle_scale_pinch=True,
    # Enable kinetic scroll on touch
    kinetic_scroll_touch=True,
    kinetic_scroll_mouse=False,
)
```

---

## 9. Edge Cases and Invariants

| Case | Expected Behavior |
|------|-------------------|
| All new params are `None` (default) | `handleScroll`, `handleScale`, `kineticScroll` keys absent from `chart_options` |
| `handle_scroll=False` only | `chart_options["handleScroll"] == False` (not `{}`) |
| `handle_scroll=True` only | `chart_options["handleScroll"] == True` |
| `handle_scroll=False` + any granular param set | Boolean wins; value is `False` (boolean not dict) |
| `handle_scroll=None` + one granular param set | Object form emitted with only that key |
| `handle_scroll=None` + no granular params | Key absent entirely |
| Same rules apply symmetrically to `handle_scale` | — |
| `kinetic_scroll_touch=None`, `kinetic_scroll_mouse=None` | `kineticScroll` key absent |
| `kinetic_scroll_mouse=False` only | `chart_options["kineticScroll"] == {"mouse": False}` (no `touch` key) |
| New params coexist with existing params | All other option groups (layout, grid, crosshair, etc.) unaffected |

---

## 10. Scope Exclusions (Out of This Plan)

The following related features are intentionally excluded and should be addressed in separate plans:

1. **`AxisPressedMouseMoveOptions` object form** — `handleScale.axisPressedMouseMove` also accepts `{ time: bool, price: bool }`. This plan only supports the boolean form. Add `handle_scale_axis_pressed_mouse_move_time` and `handle_scale_axis_pressed_mouse_move_price` params in a future plan.

2. **`AxisDoubleClickOptions` object form** — Same situation. `handleScale.axisDoubleClickReset` also accepts `{ time: bool, price: bool }`.

3. **`trackingMode`** — The `TrackingModeOptions` group (`exitMode`) is section 14 in the coverage report and is separate.

4. **Runtime `applyOptions()`** — Since the Python layer is a static config builder, there is no live `applyOptions()` mechanism. All options are set at chart creation time only.

---

## 11. Affected Files Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/deephaven/plot/tradingview_lightweight/chart.py` | Modify | Add 12 new parameters to `chart()` signature; add 3 serialization blocks in the function body |
| `test/deephaven/plot/tradingview_lightweight/test_chart.py` | Modify | Append `TestScrollScaleOptions` class with ~27 test methods |
| `src/deephaven/plot/tradingview_lightweight/options.py` | No change | No new types needed |
| JS frontend | No change | JS already handles all three option keys natively |
