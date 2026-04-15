# Implementation Plan: CrosshairOptions — Missing Coverage (§5)

**Target file (Python):** `src/deephaven/plot/tradingview_lightweight/options.py`
**Target file (chart builder):** `src/deephaven/plot/tradingview_lightweight/chart.py`
**Target file (tests):** `test/deephaven/plot/tradingview_lightweight/test_chart.py`

---

## 1. Current State

The coverage report (`notes/api-coverage-report.md`, §5) shows CrosshairOptions at **8/14 (57%)**.

### Already Implemented

| Python param | JS key | Serialized into |
|---|---|---|
| `crosshair_mode` | `crosshair.mode` | `CROSSHAIR_MODE_MAP` int |
| `crosshair_vert_line_width` | `crosshair.vertLine.width` | int |
| `crosshair_vert_line_color` | `crosshair.vertLine.color` | str |
| `crosshair_vert_line_style` | `crosshair.vertLine.style` | `LINE_STYLE_MAP` int |
| `crosshair_vert_line_label_background_color` | `crosshair.vertLine.labelBackgroundColor` | str |
| `crosshair_horz_line_width` | `crosshair.horzLine.width` | int |
| `crosshair_horz_line_color` | `crosshair.horzLine.color` | str |
| `crosshair_horz_line_style` | `crosshair.horzLine.style` | `LINE_STYLE_MAP` int |
| `crosshair_horz_line_label_background_color` | `crosshair.horzLine.labelBackgroundColor` | str |

Note: `crosshair_horz_line_label_background_color` and `crosshair_vert_line_label_background_color` are already wired; the count of 8 in the report includes the `mode` key itself.

### Gaps to Close

| # | JS property | Gap type |
|---|---|---|
| 1 | `vertLine.visible` | Missing parameter entirely |
| 2 | `vertLine.labelVisible` | Missing parameter entirely |
| 3 | `horzLine.visible` | Missing parameter entirely |
| 4 | `horzLine.labelVisible` | Missing parameter entirely |
| 5 | `doNotSnapToHiddenSeriesIndices` | Missing parameter entirely |
| 6 | `CrosshairMode.Hidden` (value 2) | Missing Literal value in type + missing map entry |
| 7 | `CrosshairMode.MagnetOHLC` (value 3) | Missing Literal value in type + missing map entry |

---

## 2. Changes to `options.py`

### 2.1  Expand the `CrosshairMode` Literal

**Location:** `options.py`, line 16.

**Current:**
```text
CrosshairMode = Literal["normal", "magnet"]
```

**Replace with:**
```text
CrosshairMode = Literal["normal", "magnet", "hidden", "magnet_ohlc"]
```

All four strings map 1-to-1 to the TradingView `CrosshairMode` enum:

| Python string | JS enum name | JS integer value |
|---|---|---|
| `"normal"` | `CrosshairMode.Normal` | `0` |
| `"magnet"` | `CrosshairMode.Magnet` | `1` |
| `"hidden"` | `CrosshairMode.Hidden` | `2` |
| `"magnet_ohlc"` | `CrosshairMode.MagnetOHLC` | `3` |

### 2.2  Expand `CROSSHAIR_MODE_MAP`

**Location:** `options.py`, lines 46-49.

**Current:**
```text
CROSSHAIR_MODE_MAP = {
    "normal": 0,
    "magnet": 1,
}
```

**Replace with:**
```text
CROSSHAIR_MODE_MAP = {
    "normal": 0,
    "magnet": 1,
    "hidden": 2,
    "magnet_ohlc": 3,
}
```

No other files reference `CROSSHAIR_MODE_MAP` or `CrosshairMode` beyond `chart.py` and `test_chart.py`, so no other changes in the module are required.

---

## 3. Changes to `chart.py`

### 3.1  Add parameters to the `chart()` function signature

**Location:** `chart.py`, the `chart()` function signature, inside the `# Crosshair` block (currently lines 182-191).

The existing block ends with `crosshair_horz_line_label_background_color`. Insert five new parameters immediately after it, before the `# Right price scale` block:

```text
# Crosshair
crosshair_mode: Optional[CrosshairMode] = (None,)
crosshair_vert_line_width: Optional[int] = (None,)
crosshair_vert_line_color: Optional[str] = (None,)
crosshair_vert_line_style: Optional[LineStyle] = (None,)
crosshair_vert_line_visible: Optional[bool] = (None,)  # NEW
crosshair_vert_line_label_visible: Optional[bool] = (None,)  # NEW
crosshair_vert_line_label_background_color: Optional[str] = (None,)
crosshair_horz_line_width: Optional[int] = (None,)
crosshair_horz_line_color: Optional[str] = (None,)
crosshair_horz_line_style: Optional[LineStyle] = (None,)
crosshair_horz_line_visible: Optional[bool] = (None,)  # NEW
crosshair_horz_line_label_visible: Optional[bool] = (None,)  # NEW
crosshair_horz_line_label_background_color: Optional[str] = (None,)
crosshair_do_not_snap_to_hidden_series: Optional[bool] = (None,)  # NEW
```

Ordering rationale: group `visible` and `labelVisible` logically adjacent to `color`/`width`/`style` for the same line, matching the JS `CrosshairLineOptions` property order (`color`, `width`, `style`, `visible`, `labelVisible`, `labelBackgroundColor`).

### 3.2  Wire the new parameters into the crosshair dict in `_build_options()` / `chart()`

**Location:** `chart.py`, the `# Crosshair` serialization block (currently lines 349-378).

**Current implementation:**
```text
# Crosshair
crosshair: dict = {}
if crosshair_mode is not None:
    crosshair["mode"] = CROSSHAIR_MODE_MAP.get(crosshair_mode, 0)
vert_line = _filter_none(
    {
        "width": crosshair_vert_line_width,
        "color": crosshair_vert_line_color,
        "style": LINE_STYLE_MAP.get(crosshair_vert_line_style)
        if crosshair_vert_line_style
        else None,
        "labelBackgroundColor": crosshair_vert_line_label_background_color,
    }
)
if vert_line:
    crosshair["vertLine"] = vert_line
horz_line = _filter_none(
    {
        "width": crosshair_horz_line_width,
        "color": crosshair_horz_line_color,
        "style": LINE_STYLE_MAP.get(crosshair_horz_line_style)
        if crosshair_horz_line_style
        else None,
        "labelBackgroundColor": crosshair_horz_line_label_background_color,
    }
)
if horz_line:
    crosshair["horzLine"] = horz_line
if crosshair:
    chart_options["crosshair"] = crosshair
```

**Replace with:**
```text
# Crosshair
crosshair: dict = {}
if crosshair_mode is not None:
    crosshair["mode"] = CROSSHAIR_MODE_MAP.get(crosshair_mode, 0)
if crosshair_do_not_snap_to_hidden_series is not None:
    crosshair["doNotSnapToHiddenSeriesIndices"] = crosshair_do_not_snap_to_hidden_series
vert_line = _filter_none(
    {
        "width": crosshair_vert_line_width,
        "color": crosshair_vert_line_color,
        "style": LINE_STYLE_MAP.get(crosshair_vert_line_style)
        if crosshair_vert_line_style
        else None,
        "visible": crosshair_vert_line_visible,
        "labelVisible": crosshair_vert_line_label_visible,
        "labelBackgroundColor": crosshair_vert_line_label_background_color,
    }
)
if vert_line:
    crosshair["vertLine"] = vert_line
horz_line = _filter_none(
    {
        "width": crosshair_horz_line_width,
        "color": crosshair_horz_line_color,
        "style": LINE_STYLE_MAP.get(crosshair_horz_line_style)
        if crosshair_horz_line_style
        else None,
        "visible": crosshair_horz_line_visible,
        "labelVisible": crosshair_horz_line_label_visible,
        "labelBackgroundColor": crosshair_horz_line_label_background_color,
    }
)
if horz_line:
    crosshair["horzLine"] = horz_line
if crosshair:
    chart_options["crosshair"] = crosshair
```

Key serialization decisions:
- `crosshair_vert_line_visible` → `crosshair.vertLine.visible` (bool, no mapping needed)
- `crosshair_vert_line_label_visible` → `crosshair.vertLine.labelVisible` (bool, no mapping needed)
- `crosshair_horz_line_visible` → `crosshair.horzLine.visible` (bool, no mapping needed)
- `crosshair_horz_line_label_visible` → `crosshair.horzLine.labelVisible` (bool, no mapping needed)
- `crosshair_do_not_snap_to_hidden_series` → `crosshair.doNotSnapToHiddenSeriesIndices` (bool, no mapping needed)
- All five use `_filter_none` / direct `None` guard so they are omitted when not provided, preserving the existing contract that unset parameters never appear in the serialized output.
- `doNotSnapToHiddenSeriesIndices` is a top-level crosshair key (not inside `vertLine`/`horzLine`), so it is set directly on the `crosshair` dict before the sub-dicts.

---

## 4. No Changes Required in Other Files

- **`__init__.py` / public API exports:** `CrosshairMode` is already re-exported. The Literal expansion is backward-compatible — existing code using `"normal"` or `"magnet"` continues to work.
- **JS frontend:** The JS plugin passes `chartOptions` straight to `createChart()` via `applyOptions()` without inspecting crosshair keys, so no JS changes are required.
- **Convenience functions (`candlestick()`, `line()`, etc.):** These forward only a small subset of chart options as shortcuts. The new crosshair parameters do not need to be forwarded through them; callers who need fine-grained crosshair control should use `chart()` directly. This matches the existing pattern where `crosshair_vert_line_width` and similar options are not forwarded through `candlestick()` or `line()`.

---

## 5. Test Coverage

All tests go in `test/deephaven/plot/tradingview_lightweight/test_chart.py`, inside the existing `TestChartFunction` class.

### 5.1  New CrosshairMode values

```text
def test_crosshair_mode_hidden(self):
    """CrosshairMode 'hidden' should serialize to integer 2."""
    s = line_series(self.table)
    c = chart(s, crosshair_mode="hidden")
    self.assertEqual(c.chart_options["crosshair"]["mode"], 2)


def test_crosshair_mode_magnet_ohlc(self):
    """CrosshairMode 'magnet_ohlc' should serialize to integer 3."""
    s = line_series(self.table)
    c = chart(s, crosshair_mode="magnet_ohlc")
    self.assertEqual(c.chart_options["crosshair"]["mode"], 3)
```

### 5.2  `crosshair_vert_line_visible`

```text
def test_crosshair_vert_line_visible_true(self):
    s = line_series(self.table)
    c = chart(s, crosshair_vert_line_visible=True)
    self.assertTrue(c.chart_options["crosshair"]["vertLine"]["visible"])


def test_crosshair_vert_line_visible_false(self):
    """visible=False must be serialized (not filtered out by _filter_none)."""
    s = line_series(self.table)
    c = chart(s, crosshair_vert_line_visible=False)
    self.assertFalse(c.chart_options["crosshair"]["vertLine"]["visible"])
```

### 5.3  `crosshair_vert_line_label_visible`

```text
def test_crosshair_vert_line_label_visible_true(self):
    s = line_series(self.table)
    c = chart(s, crosshair_vert_line_label_visible=True)
    self.assertTrue(c.chart_options["crosshair"]["vertLine"]["labelVisible"])


def test_crosshair_vert_line_label_visible_false(self):
    s = line_series(self.table)
    c = chart(s, crosshair_vert_line_label_visible=False)
    self.assertFalse(c.chart_options["crosshair"]["vertLine"]["labelVisible"])
```

### 5.4  `crosshair_horz_line_visible`

```text
def test_crosshair_horz_line_visible_true(self):
    s = line_series(self.table)
    c = chart(s, crosshair_horz_line_visible=True)
    self.assertTrue(c.chart_options["crosshair"]["horzLine"]["visible"])


def test_crosshair_horz_line_visible_false(self):
    s = line_series(self.table)
    c = chart(s, crosshair_horz_line_visible=False)
    self.assertFalse(c.chart_options["crosshair"]["horzLine"]["visible"])
```

### 5.5  `crosshair_horz_line_label_visible`

```text
def test_crosshair_horz_line_label_visible_true(self):
    s = line_series(self.table)
    c = chart(s, crosshair_horz_line_label_visible=True)
    self.assertTrue(c.chart_options["crosshair"]["horzLine"]["labelVisible"])


def test_crosshair_horz_line_label_visible_false(self):
    s = line_series(self.table)
    c = chart(s, crosshair_horz_line_label_visible=False)
    self.assertFalse(c.chart_options["crosshair"]["horzLine"]["labelVisible"])
```

### 5.6  `crosshair_do_not_snap_to_hidden_series`

```text
def test_crosshair_do_not_snap_to_hidden_series_true(self):
    s = line_series(self.table)
    c = chart(s, crosshair_do_not_snap_to_hidden_series=True)
    self.assertTrue(c.chart_options["crosshair"]["doNotSnapToHiddenSeriesIndices"])


def test_crosshair_do_not_snap_to_hidden_series_false(self):
    s = line_series(self.table)
    c = chart(s, crosshair_do_not_snap_to_hidden_series=False)
    self.assertFalse(c.chart_options["crosshair"]["doNotSnapToHiddenSeriesIndices"])
```

### 5.7  Combined new options — integration test

```text
def test_crosshair_all_new_options(self):
    """All five new crosshair params round-trip correctly together."""
    s = line_series(self.table)
    c = chart(
        s,
        crosshair_mode="hidden",
        crosshair_vert_line_visible=False,
        crosshair_vert_line_label_visible=False,
        crosshair_horz_line_visible=True,
        crosshair_horz_line_label_visible=False,
        crosshair_do_not_snap_to_hidden_series=True,
    )
    ch = c.chart_options["crosshair"]
    self.assertEqual(ch["mode"], 2)
    self.assertFalse(ch["vertLine"]["visible"])
    self.assertFalse(ch["vertLine"]["labelVisible"])
    self.assertTrue(ch["horzLine"]["visible"])
    self.assertFalse(ch["horzLine"]["labelVisible"])
    self.assertTrue(ch["doNotSnapToHiddenSeriesIndices"])
```

### 5.8  Absence / None-filtering tests

```text
def test_crosshair_vert_line_visible_not_set_by_default(self):
    """visible key must not appear when param is not provided."""
    s = line_series(self.table)
    c = chart(s, crosshair_vert_line_color="#fff")  # trigger vertLine dict
    self.assertNotIn("visible", c.chart_options["crosshair"]["vertLine"])


def test_crosshair_vert_line_label_visible_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s, crosshair_vert_line_color="#fff")
    self.assertNotIn("labelVisible", c.chart_options["crosshair"]["vertLine"])


def test_crosshair_horz_line_visible_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s, crosshair_horz_line_color="#fff")
    self.assertNotIn("visible", c.chart_options["crosshair"]["horzLine"])


def test_crosshair_horz_line_label_visible_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s, crosshair_horz_line_color="#fff")
    self.assertNotIn("labelVisible", c.chart_options["crosshair"]["horzLine"])


def test_crosshair_do_not_snap_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s, crosshair_mode="normal")
    self.assertNotIn("doNotSnapToHiddenSeriesIndices", c.chart_options["crosshair"])
```

### 5.9  All four CrosshairMode values — parametric test

```text
def test_crosshair_mode_all_values(self):
    """All four CrosshairMode values must map to correct integers."""
    modes = {
        "normal": 0,
        "magnet": 1,
        "hidden": 2,
        "magnet_ohlc": 3,
    }
    s = line_series(self.table)
    for mode_name, expected_int in modes.items():
        c = chart(s, crosshair_mode=mode_name)
        self.assertEqual(
            c.chart_options["crosshair"]["mode"],
            expected_int,
            f"crosshair_mode='{mode_name}' should map to {expected_int}",
        )
```

---

## 6. Implementation Sequence

Perform these steps in order. Each step is a self-contained diff.

**Step 1 — `options.py`:** Expand `CrosshairMode` Literal and `CROSSHAIR_MODE_MAP`.

**Step 2 — `chart.py` signature:** Add five new `Optional` parameters to the `chart()` function signature in the `# Crosshair` block. Insert them in the positions shown in §3.1 above.

**Step 3 — `chart.py` serialization:** Extend the crosshair serialization block as shown in §3.2. Add the `doNotSnapToHiddenSeriesIndices` guard immediately after the `mode` guard. Add `"visible"` and `"labelVisible"` entries to both `vert_line` and `horz_line` dicts.

**Step 4 — `test_chart.py`:** Add all test methods from §5 to the `TestChartFunction` class. Run the full test suite with:
```bash
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pytest test/ -v
```
All existing tests must continue to pass. No test should require changes to existing test cases.

---

## 7. Post-Implementation: Update Coverage Report

After all tests pass, update `notes/api-coverage-report.md`, §5:

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `mode` | ✅ | `crosshair_mode` (`normal`/`magnet`/`hidden`/`magnet_ohlc`) |
| 2 | `vertLine.color` | ✅ | `crosshair_vert_line_color` |
| 3 | `vertLine.width` | ✅ | `crosshair_vert_line_width` |
| 4 | `vertLine.style` | ✅ | `crosshair_vert_line_style` |
| 5 | `vertLine.visible` | ✅ | `crosshair_vert_line_visible` |
| 6 | `vertLine.labelVisible` | ✅ | `crosshair_vert_line_label_visible` |
| 7 | `vertLine.labelBackgroundColor` | ✅ | `crosshair_vert_line_label_background_color` |
| 8 | `horzLine.color` | ✅ | `crosshair_horz_line_color` |
| 9 | `horzLine.width` | ✅ | `crosshair_horz_line_width` |
| 10 | `horzLine.style` | ✅ | `crosshair_horz_line_style` |
| 11 | `horzLine.visible` | ✅ | `crosshair_horz_line_visible` |
| 12 | `horzLine.labelVisible` | ✅ | `crosshair_horz_line_label_visible` |
| 13 | `horzLine.labelBackgroundColor` | ✅ | `crosshair_horz_line_label_background_color` |
| 14 | `doNotSnapToHiddenSeriesIndices` | ✅ | `crosshair_do_not_snap_to_hidden_series` |

Also update the Grand Summary table row:
```
| CrosshairOptions | 14 | 14 | 0 | 0 |
```

And update the `CrosshairMode` enum row in §25 to reflect all four values are now covered (was ⚠️, becomes ✅ once `hidden` and `magnet_ohlc` are added).

---

## 8. Design Notes and Constraints

### Why `_filter_none` handles `False` correctly
`_filter_none` is defined as:
```text
def _filter_none(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}
```
`False` is not `None`, so `crosshair_vert_line_visible=False` correctly produces `{"visible": False}` in the serialized dict. This is already tested for other boolean fields (e.g., `right_price_scale_visible=False` in `test_right_price_scale`). The new `visible`/`labelVisible` fields behave identically.

### Why `doNotSnapToHiddenSeriesIndices` is not inside `_filter_none`
This top-level crosshair key is guarded with a simple `if ... is not None:` check (same pattern as `crosshair_mode`), because it is not a key inside the `vert_line` or `horz_line` sub-dicts passed to `_filter_none`. A `False` value is valid and meaningful (it is the JS default, but explicitly sending it causes no harm and is consistent).

### Naming convention
All existing crosshair parameters follow `crosshair_{vert|horz}_line_{property}`. The new parameters follow the same convention:
- `crosshair_vert_line_visible`
- `crosshair_vert_line_label_visible`
- `crosshair_horz_line_visible`
- `crosshair_horz_line_label_visible`
- `crosshair_do_not_snap_to_hidden_series` — shortens the unwieldy JS name `doNotSnapToHiddenSeriesIndices` while remaining descriptive. The `crosshair_` prefix is kept for discoverability.

### CrosshairMode naming
- `"hidden"` → `CrosshairMode.Hidden` (value 2): hides the crosshair entirely; useful for read-only or screenshot-mode charts.
- `"magnet_ohlc"` → `CrosshairMode.MagnetOHLC` (value 3): snaps to OHLC values on candlestick/bar series, not just close price like `"magnet"`.
