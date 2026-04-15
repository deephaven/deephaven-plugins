# Implementation Plan: Enumerations — Missing Coverage (§25)

**Coverage report section:** §25 Enumerations (11)
**Primary target file:** `src/deephaven/plot/tradingview_lightweight/options.py`
**Secondary target files:** `src/deephaven/plot/tradingview_lightweight/chart.py`, `src/deephaven/plot/tradingview_lightweight/series.py`, `src/deephaven/plot/tradingview_lightweight/__init__.py`
**Test file:** `test/deephaven/plot/tradingview_lightweight/test_chart.py` (chart-level enums), `test/deephaven/plot/tradingview_lightweight/test_series.py` (series-level enums)

---

## 1. Current State

**Coverage before this plan: 14/34 enum members implemented (41%)**

| Enum | JS Members | Status | Missing |
|---|---|:---:|---|
| `ColorType` | Solid, VerticalGradient | ⚠️ Solid only (hardcoded, no type) | `VerticalGradient` |
| `CrosshairMode` | Normal, Magnet, Hidden, MagnetOHLC | ⚠️ 2/4 | `hidden`, `magnet_ohlc` |
| `LastPriceAnimationMode` | Disabled, Continuous, OnDataUpdate | ❌ 0/3 | All |
| `LineStyle` | Solid, Dotted, Dashed, LargeDashed, SparseDotted | ✅ 5/5 | — |
| `LineType` | Simple, WithSteps, Curved | ✅ 3/3 | — |
| `MarkerSign` | Negative, Neutral, Positive | ❌ 0/3 | All |
| `MismatchDirection` | NearestLeft, None, NearestRight | ❌ 0/3 | All |
| `PriceLineSource` | LastBar, LastVisible | ❌ 0/2 | All |
| `PriceScaleMode` | Normal, Logarithmic, Percentage, IndexedTo100 | ✅ 4/4 | — |
| `TickMarkType` | Year, Month, DayOfMonth, Time, TimeWithSeconds | ❌ 0/5 | All |
| `TrackingModeExitMode` | OnTouchEnd, OnNextTap | ❌ 0/2 | All |

**Target after this plan: 34/34 enum members implemented (100%)**

---

## 2. Enum-by-Enum Analysis

### 2.1 Already Fully Implemented — No Changes Required

**`LineStyle`** (5/5): `Literal["solid", "dotted", "dashed", "large_dashed", "sparse_dotted"]` and `LINE_STYLE_MAP` in `options.py`, lines 14 and 32–38. No action.

**`LineType`** (3/3): `Literal["simple", "with_steps", "curved"]` and `LINE_TYPE_MAP` in `options.py`, lines 15 and 40–44. No action.

**`PriceScaleMode`** (4/4): `Literal["normal", "logarithmic", "percentage", "indexed_to_100"]` and `PRICE_SCALE_MODE_MAP` in `options.py`, lines 17 and 51–56. No action.

---

### 2.2 Partially Implemented — Additions Required

#### 2.2.1 `CrosshairMode` — add `hidden` (2) and `magnet_ohlc` (3)

**Current state in `options.py`:**
```text
CrosshairMode = Literal["normal", "magnet"]

CROSSHAIR_MODE_MAP = {
    "normal": 0,
    "magnet": 1,
}
```

**Required change — expand the Literal (line 16):**
```text
CrosshairMode = Literal["normal", "magnet", "hidden", "magnet_ohlc"]
```

**Required change — expand the map (lines 46–49):**
```text
CROSSHAIR_MODE_MAP = {
    "normal": 0,
    "magnet": 1,
    "hidden": 2,
    "magnet_ohlc": 3,
}
```

**JS mapping:**

| Python string | JS enum member | JS integer value |
|---|---|---|
| `"normal"` | `CrosshairMode.Normal` | `0` |
| `"magnet"` | `CrosshairMode.Magnet` | `1` |
| `"hidden"` | `CrosshairMode.Hidden` | `2` |
| `"magnet_ohlc"` | `CrosshairMode.MagnetOHLC` | `3` |

**Where used:** `chart.py` reads `CROSSHAIR_MODE_MAP` and the `CrosshairMode` Literal for the `crosshair_mode` parameter of `chart()`. No changes needed in `chart.py` — the map lookup `CROSSHAIR_MODE_MAP.get(crosshair_mode, 0)` already handles new values correctly.

**Note:** The crosshair-options plan (`05-crosshair-options.md`) also covers this exact same change. If that plan is implemented first, skip this step. If this plan is implemented first, the crosshair-options plan must not re-apply the change.

**Dependent plans:** `05-crosshair-options.md` references these two additions. This enum plan can be done independently as a pure `options.py` change; the serialization wiring is already in place in `chart.py`.

#### 2.2.2 `ColorType` — add proper `VerticalGradient` support

**Current state:** `ColorType` has no Python `Literal` type alias. The `chart()` function hardcodes `{"type": "solid", "color": background_color}` when building `layout.background`. The `VerticalGradient` case (`{"type": "gradient", "topColor": ..., "bottomColor": ...}`) is entirely absent.

**Required changes:**

Add a `ColorType` Literal to `options.py` after line 29 (after the existing `ChartType` definition):
```text
ColorType = Literal["solid", "gradient"]
```

The implementation of gradient background is handled by the layout-options plan (`03-layout-options.md`), which adds `background_top_color` and `background_bottom_color` parameters to `chart()`. The `ColorType` Literal is a supporting type alias for documentation and type-checking purposes; it does not need to appear as a parameter type directly (the gradient is triggered by the presence of the color params, not an explicit type selector).

**Where to add the definition:** In `options.py`, after line 29 (the `ChartType` definition):
```text
# ColorType enum (matches TradingView ColorType)
ColorType = Literal["solid", "gradient"]
```

**Export:** Add `ColorType` to `__init__.py`'s imports from `.options` and to `__all__`.

**Dependent plans:** `03-layout-options.md` (gradient background) must be implemented for `ColorType.VerticalGradient` to be actually usable at runtime.

---

### 2.3 Not Implemented — New Types and Maps Required

Each of the six enums below requires:
1. A `Literal` type alias added to `options.py`
2. A `*_MAP` dict added to `options.py`
3. Export from `__init__.py`
4. At least one consumer in the existing codebase that uses it (identified per-enum below)

#### 2.3.1 `LastPriceAnimationMode`

**JS definition:**
```
Disabled = 0   — Animation always off
Continuous = 1 — Animation always on
OnDataUpdate = 2 — Animation runs briefly after each new data point arrives
```

**Python Literal:**
```text
LastPriceAnimationMode = Literal["disabled", "continuous", "on_data_update"]
```

**Map dict:**
```text
LAST_PRICE_ANIMATION_MODE_MAP = {
    "disabled": 0,
    "continuous": 1,
    "on_data_update": 2,
}
```

**Where used in the JS API:** `SeriesOptionsCommon.lastPriceAnimation` — applies to Line, Area, and Baseline series. The coverage report (§12 SeriesOptionsCommon) marks `lastPriceAnimation` as ❌ at row 13 for Line and row 20 for Area. Adding this enum is the prerequisite for implementing `lastPriceAnimation` support in `series.py`.

**Dependency note:** This enum is only useful once `lastPriceAnimation` is wired into `line_series()`, `area_series()`, and `baseline_series()` in `series.py`. The enum definition can be added to `options.py` independently; the series wiring belongs to the series-options coverage plan.

**Consumer plan reference:** A future series-options plan covering `lastPriceAnimation` will import `LastPriceAnimationMode` and `LAST_PRICE_ANIMATION_MODE_MAP` from `options.py` and add a `last_price_animation: Optional[LastPriceAnimationMode]` parameter to `line_series()`, `area_series()`, and `baseline_series()`, resolving it with `LAST_PRICE_ANIMATION_MODE_MAP.get(last_price_animation)` before placing it in the options dict as `"lastPriceAnimation"`.

#### 2.3.2 `MarkerSign`

**JS definition:**
```
Negative = -1
Neutral = 0
Positive = 1
```

**Python Literal:**
```text
MarkerSign = Literal["negative", "neutral", "positive"]
```

**Map dict:**
```text
MARKER_SIGN_MAP = {
    "negative": -1,
    "neutral": 0,
    "positive": 1,
}
```

**Where used in the JS API:** The TradingView `MarkerSign` enum is used with the `SeriesMarker.sign` property (optional integer: -1, 0, or 1). It is an annotation enum for data coloring on certain series types and for the options chart plugin. It does not currently appear in any implemented path in this plugin.

**Dependency note:** `MarkerSign` is only relevant if the `sign` property on markers is ever surfaced. The `Marker` dataclass in `markers.py` does not currently have a `sign` field. Adding the enum now is low-risk and makes it available for a future `markers_from_table()` or `marker()` enhancement that adds optional `sign` support.

**When the feature is wired:** A future plan could add `sign: Optional[MarkerSign] = None` to `marker()` and `markers_from_table()`, resolving via `MARKER_SIGN_MAP`. Since the JS value is an integer (including -1), the map is necessary — cannot pass the string directly.

#### 2.3.3 `MismatchDirection`

**JS definition:**
```
NearestLeft = -1   — Search left for nearest existing data point
None = 0           — Do not search; return undefined if no exact match
NearestRight = 1   — Search right for nearest existing data point
```

**Python Literal:**
```text
MismatchDirection = Literal["nearest_left", "none", "nearest_right"]
```

**Map dict:**
```text
MISMATCH_DIRECTION_MAP = {
    "nearest_left": -1,
    "none": 0,
    "nearest_right": 1,
}
```

**Where used in the JS API:** `ISeriesApi.dataByIndex(logicalIndex, mismatchDirection?)` and `ISeriesApi.barsInLogicalRange(range, mismatchDirection?)`. Both are runtime query methods on live chart objects.

**Architectural note — this enum is N/A for the Python plugin.** Both `dataByIndex()` and `barsInLogicalRange()` are live JS-side API calls that query the chart's current rendering state. There is no Python pathway to call these methods: the Python layer is a static configuration builder that serializes options to JSON at chart-creation time and has no bidirectional runtime handle on the running chart. These methods are marked N/A in the coverage report (§14 ISeriesApi).

**Decision:** Still define `MismatchDirection` and `MISMATCH_DIRECTION_MAP` in `options.py` for completeness. The type will be exported but will have no consumer in the current codebase. A comment explaining the N/A status is placed next to the definition. If future work adds bidirectional messaging (e.g., a `query_data_at_index()` helper), the enum is ready.

#### 2.3.4 `PriceLineSource`

**JS definition:**
```
LastBar = 0      — Price line tracks last bar value (default)
LastVisible = 1  — Price line tracks last visible bar in the current viewport
```

**Python Literal:**
```text
PriceLineSource = Literal["last_bar", "last_visible"]
```

**Map dict:**
```text
PRICE_LINE_SOURCE_MAP = {
    "last_bar": 0,
    "last_visible": 1,
}
```

**Where used in the JS API:** `SeriesOptionsCommon.priceLineSource` — controls which bar's price the auto-drawn last-price line tracks. The coverage report (§12 SeriesOptionsCommon) marks `priceLineSource` as ❌ (row 7).

**Dependency note:** This enum is useful once `price_line_source` is wired as a parameter to each series creation function. A future series-options plan will add:
```text
price_line_source: Optional[PriceLineSource] = (None,)
```
to each series function and map it with `PRICE_LINE_SOURCE_MAP.get(price_line_source)` → `"priceLineSource"` in the options dict.

#### 2.3.5 `TickMarkType`

**JS definition:**
```
Year = 0            — First tick mark in a year
Month = 1           — First tick mark in a month
DayOfMonth = 2      — A day of the month
Time = 3            — Time (no seconds)
TimeWithSeconds = 4 — Time with seconds
```

**Python Literal:**
```text
TickMarkType = Literal["year", "month", "day_of_month", "time", "time_with_seconds"]
```

**Map dict:**
```text
TICK_MARK_TYPE_MAP = {
    "year": 0,
    "month": 1,
    "day_of_month": 2,
    "time": 3,
    "time_with_seconds": 4,
}
```

**Where used in the JS API:** `TimeScaleOptions.tickMarkFormatter` — a JS callback function that receives a `time` value and a `TickMarkType` integer and returns a formatted label string. The callback signature is:
```ts
tickMarkFormatter?: (time: Time, tickMarkType: TickMarkType, locale: string) => string
```

**Architectural note — this enum is N/A for the Python plugin in its current form.** `tickMarkFormatter` requires a JS callable. Python callables cannot be serialized to JSON and shipped to the JS frontend. The coverage report (§15 TimeScaleOptions, row 25) marks `tickMarkFormatter` as ❌ with the note "Requires JS callback". This is the same limitation as `autoscaleInfoProvider` and `PriceFormatCustom`.

**Decision:** Still define `TickMarkType` and `TICK_MARK_TYPE_MAP` in `options.py` for completeness. A comment notes that the only JS consumer is `tickMarkFormatter` (a callback that cannot be implemented in the static Python layer). No consumer is wired. If the plugin ever gains a mechanism to define predefined formatter templates (e.g., a set of named built-in formatters), `TickMarkType` will be ready.

#### 2.3.6 `TrackingModeExitMode`

**JS definition:**
```
OnTouchEnd = 0  — Deactivate tracking mode when user lifts finger
OnNextTap = 1   — Deactivate tracking mode on next tap
```

**Python Literal:**
```text
TrackingModeExitMode = Literal["on_touch_end", "on_next_tap"]
```

**Map dict:**
```text
TRACKING_MODE_EXIT_MODE_MAP = {
    "on_touch_end": 0,
    "on_next_tap": 1,
}
```

**Where used in the JS API:** `ChartOptionsBase.trackingMode.exitMode`. The `trackingMode` option group is an object with a single property:
```ts
interface TrackingModeOptions {
  exitMode: TrackingModeExitMode;
}
```

The coverage report (§2 ChartOptionsBase, row 14) marks `trackingMode` as ❌.

**Dependency note:** `TrackingModeExitMode` is useful once `trackingMode` is wired as a chart option. A future chart-options plan will add:
```text
tracking_mode_exit_mode: Optional[TrackingModeExitMode] = (None,)
```
to `chart()` and serialize it as:
```text
if tracking_mode_exit_mode is not None:
    chart_options["trackingMode"] = {
        "exitMode": TRACKING_MODE_EXIT_MODE_MAP[tracking_mode_exit_mode]
    }
```

---

## 3. Changes to `options.py`

All changes are additions only. No existing lines are modified except the two `CrosshairMode` lines.

### 3.1 Expand `CrosshairMode` Literal

**Current (line 16):**
```text
CrosshairMode = Literal["normal", "magnet"]
```

**Replace with:**
```text
CrosshairMode = Literal["normal", "magnet", "hidden", "magnet_ohlc"]
```

### 3.2 Expand `CROSSHAIR_MODE_MAP`

**Current (lines 46–49):**
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

### 3.3 Add `ColorType` Literal

Insert immediately after line 29 (the `ChartType` definition), before any blank line:

```text
# ColorType enum (matches TradingView ColorType)
# Used for layout.background: "solid" = SolidColor, "gradient" = VerticalGradientColor.
# The gradient case is activated by providing background_top_color and
# background_bottom_color to chart() — see 03-layout-options.md plan.
ColorType = Literal["solid", "gradient"]
```

### 3.4 Add Six New Enum Definitions

Insert the following block after the `ColorType` definition (i.e., immediately after §3.3). Keep all new enum definitions together in a clearly labeled section, separated by blank lines.

```text
# LastPriceAnimationMode enum (matches TradingView LastPriceAnimationMode)
# Consumer: lastPriceAnimation option on Line, Area, Baseline series.
LastPriceAnimationMode = Literal["disabled", "continuous", "on_data_update"]

# MarkerSign enum (matches TradingView MarkerSign)
# Consumer: SeriesMarker.sign property (optional per-marker annotation).
MarkerSign = Literal["negative", "neutral", "positive"]

# MismatchDirection enum (matches TradingView MismatchDirection)
# Consumer: ISeriesApi.dataByIndex() / barsInLogicalRange() — JS runtime methods.
# These methods are N/A for the static Python configuration layer; the enum is
# provided for completeness and for any future bidirectional messaging work.
MismatchDirection = Literal["nearest_left", "none", "nearest_right"]

# PriceLineSource enum (matches TradingView PriceLineSource)
# Consumer: SeriesOptionsCommon.priceLineSource (which bar the auto price line tracks).
PriceLineSource = Literal["last_bar", "last_visible"]

# TickMarkType enum (matches TradingView TickMarkType)
# Consumer: TimeScaleOptions.tickMarkFormatter callback.
# tickMarkFormatter requires a JS callable and is N/A for the static Python layer.
# This enum is defined for completeness; it has no current consumer.
TickMarkType = Literal["year", "month", "day_of_month", "time", "time_with_seconds"]

# TrackingModeExitMode enum (matches TradingView TrackingModeExitMode)
# Consumer: ChartOptionsBase.trackingMode.exitMode.
TrackingModeExitMode = Literal["on_touch_end", "on_next_tap"]
```

### 3.5 Add Six New Map Dicts

Insert the following block after the `CHART_TYPE_MAP` dict (currently lines 71–75 of `options.py`). This keeps all maps co-located with existing maps.

```text
LAST_PRICE_ANIMATION_MODE_MAP = {
    "disabled": 0,
    "continuous": 1,
    "on_data_update": 2,
}

MARKER_SIGN_MAP = {
    "negative": -1,
    "neutral": 0,
    "positive": 1,
}

MISMATCH_DIRECTION_MAP = {
    "nearest_left": -1,
    "none": 0,
    "nearest_right": 1,
}

PRICE_LINE_SOURCE_MAP = {
    "last_bar": 0,
    "last_visible": 1,
}

TICK_MARK_TYPE_MAP = {
    "year": 0,
    "month": 1,
    "day_of_month": 2,
    "time": 3,
    "time_with_seconds": 4,
}

TRACKING_MODE_EXIT_MODE_MAP = {
    "on_touch_end": 0,
    "on_next_tap": 1,
}
```

---

## 4. Changes to `__init__.py`

The following new names must be added to the import from `.options` (currently lines 39–48) and to `__all__` (currently lines 76–115).

**Imports — add to the `from .options import (...)` block:**
```text
from .options import (
    ChartType,
    ColorType,  # NEW
    PriceFormat,
    PriceFormatter,
    LineStyle,
    LineType,
    CrosshairMode,
    PriceScaleMode,
    MarkerShape,
    MarkerPosition,
    LastPriceAnimationMode,  # NEW
    MarkerSign,  # NEW
    MismatchDirection,  # NEW
    PriceLineSource,  # NEW
    TickMarkType,  # NEW
    TrackingModeExitMode,  # NEW
)
```

**`__all__` — add entries in the `# Types` section:**
```text
"ColorType",
"LastPriceAnimationMode",
"MarkerSign",
"MismatchDirection",
"PriceLineSource",
"TickMarkType",
"TrackingModeExitMode",
```

---

## 5. No Changes Required in `chart.py` or `series.py` (for this plan)

The two `CrosshairMode` additions (`"hidden"` and `"magnet_ohlc"`) are handled entirely in `options.py`. The existing serialization line in `chart.py`:
```text
crosshair["mode"] = CROSSHAIR_MODE_MAP.get(crosshair_mode, 0)
```
already performs a dict lookup. The new map entries are picked up automatically; no `chart.py` edit is needed for this plan.

The other five new enums (`LastPriceAnimationMode`, `PriceLineSource`, `TrackingModeExitMode`, `MarkerSign`, `MismatchDirection`, `TickMarkType`) have no current consumer code. Their wiring is deferred to the plans listed under §7 (Dependent Plans). Adding the Literal and map definitions is safe — unused definitions cause no harm and no type errors.

---

## 6. Test Coverage

Tests are added to `test/deephaven/plot/tradingview_lightweight/test_chart.py` (for `CrosshairMode` which has a live consumer) and a new test class in the same file or in `test_series.py` (for the map-round-trip tests of the no-consumer enums).

### 6.1 `CrosshairMode` — new values

Add to the existing `TestChartFunction` class in `test_chart.py`:

```text
def test_crosshair_mode_hidden(self):
    """CrosshairMode 'hidden' serializes to integer 2."""
    s = line_series(self.table)
    c = chart(s, crosshair_mode="hidden")
    self.assertEqual(c.chart_options["crosshair"]["mode"], 2)


def test_crosshair_mode_magnet_ohlc(self):
    """CrosshairMode 'magnet_ohlc' serializes to integer 3."""
    s = line_series(self.table)
    c = chart(s, crosshair_mode="magnet_ohlc")
    self.assertEqual(c.chart_options["crosshair"]["mode"], 3)


def test_crosshair_mode_all_four_values(self):
    """All four CrosshairMode members map to the correct integers."""
    expected = {"normal": 0, "magnet": 1, "hidden": 2, "magnet_ohlc": 3}
    s = line_series(self.table)
    for mode_name, mode_int in expected.items():
        c = chart(s, crosshair_mode=mode_name)
        self.assertEqual(
            c.chart_options["crosshair"]["mode"],
            mode_int,
            f"crosshair_mode='{mode_name}' should map to {mode_int}",
        )
```

Note: If `05-crosshair-options.md` is implemented before this plan, these tests may already exist. Do not duplicate them.

### 6.2 Map round-trip tests for no-consumer enums

Add a `TestEnumMaps` class to `test_chart.py` (or to a new `test_options.py` if preferred). These tests validate that each `*_MAP` dict has the correct integer values without needing to go through the full serialization pipeline.

```text
import sys
import os
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

from deephaven.plot.tradingview_lightweight.options import (
    LAST_PRICE_ANIMATION_MODE_MAP,
    MARKER_SIGN_MAP,
    MISMATCH_DIRECTION_MAP,
    PRICE_LINE_SOURCE_MAP,
    TICK_MARK_TYPE_MAP,
    TRACKING_MODE_EXIT_MODE_MAP,
    CROSSHAIR_MODE_MAP,
)


class TestEnumMaps(unittest.TestCase):
    """Verify all enum maps contain correct JS integer values."""

    def test_crosshair_mode_map_complete(self):
        self.assertEqual(CROSSHAIR_MODE_MAP["normal"], 0)
        self.assertEqual(CROSSHAIR_MODE_MAP["magnet"], 1)
        self.assertEqual(CROSSHAIR_MODE_MAP["hidden"], 2)
        self.assertEqual(CROSSHAIR_MODE_MAP["magnet_ohlc"], 3)
        self.assertEqual(len(CROSSHAIR_MODE_MAP), 4)

    def test_last_price_animation_mode_map(self):
        self.assertEqual(LAST_PRICE_ANIMATION_MODE_MAP["disabled"], 0)
        self.assertEqual(LAST_PRICE_ANIMATION_MODE_MAP["continuous"], 1)
        self.assertEqual(LAST_PRICE_ANIMATION_MODE_MAP["on_data_update"], 2)
        self.assertEqual(len(LAST_PRICE_ANIMATION_MODE_MAP), 3)

    def test_marker_sign_map(self):
        self.assertEqual(MARKER_SIGN_MAP["negative"], -1)
        self.assertEqual(MARKER_SIGN_MAP["neutral"], 0)
        self.assertEqual(MARKER_SIGN_MAP["positive"], 1)
        self.assertEqual(len(MARKER_SIGN_MAP), 3)

    def test_mismatch_direction_map(self):
        self.assertEqual(MISMATCH_DIRECTION_MAP["nearest_left"], -1)
        self.assertEqual(MISMATCH_DIRECTION_MAP["none"], 0)
        self.assertEqual(MISMATCH_DIRECTION_MAP["nearest_right"], 1)
        self.assertEqual(len(MISMATCH_DIRECTION_MAP), 3)

    def test_price_line_source_map(self):
        self.assertEqual(PRICE_LINE_SOURCE_MAP["last_bar"], 0)
        self.assertEqual(PRICE_LINE_SOURCE_MAP["last_visible"], 1)
        self.assertEqual(len(PRICE_LINE_SOURCE_MAP), 2)

    def test_tick_mark_type_map(self):
        self.assertEqual(TICK_MARK_TYPE_MAP["year"], 0)
        self.assertEqual(TICK_MARK_TYPE_MAP["month"], 1)
        self.assertEqual(TICK_MARK_TYPE_MAP["day_of_month"], 2)
        self.assertEqual(TICK_MARK_TYPE_MAP["time"], 3)
        self.assertEqual(TICK_MARK_TYPE_MAP["time_with_seconds"], 4)
        self.assertEqual(len(TICK_MARK_TYPE_MAP), 5)

    def test_tracking_mode_exit_mode_map(self):
        self.assertEqual(TRACKING_MODE_EXIT_MODE_MAP["on_touch_end"], 0)
        self.assertEqual(TRACKING_MODE_EXIT_MODE_MAP["on_next_tap"], 1)
        self.assertEqual(len(TRACKING_MODE_EXIT_MODE_MAP), 2)

    def test_marker_sign_negative_is_negative_one(self):
        """Specifically confirm -1, since negative integers are a pitfall in map tests."""
        self.assertLess(MARKER_SIGN_MAP["negative"], 0)
        self.assertEqual(MARKER_SIGN_MAP["negative"], -1)

    def test_mismatch_direction_none_is_zero_not_python_none(self):
        """The 'none' key maps to integer 0, not Python None."""
        result = MISMATCH_DIRECTION_MAP["none"]
        self.assertIsNotNone(result)
        self.assertEqual(result, 0)
        self.assertIsInstance(result, int)
```

### 6.3 `ColorType` — no runtime test required

`ColorType = Literal["solid", "gradient"]` is a pure type alias with no runtime behavior. Its correct usage is validated by the layout-options plan (`03-layout-options.md`) tests for gradient backgrounds.

### 6.4 Export smoke test

Add to `TestEnumMaps` (or a separate `TestExports` class):

```text
def test_all_new_enums_exported_from_package(self):
    """All new enum Literals and maps should be importable from the package root."""
    # These imports will fail if __init__.py is not updated
    from deephaven.plot.tradingview_lightweight.options import (
        ColorType,
        LastPriceAnimationMode,
        MarkerSign,
        MismatchDirection,
        PriceLineSource,
        TickMarkType,
        TrackingModeExitMode,
    )

    # Spot-check that they are string Literals (not None or other types)
    # Runtime check: the Literal aliases are typing constructs, but they exist
    self.assertIsNotNone(ColorType)
    self.assertIsNotNone(LastPriceAnimationMode)
    self.assertIsNotNone(MarkerSign)
    self.assertIsNotNone(MismatchDirection)
    self.assertIsNotNone(PriceLineSource)
    self.assertIsNotNone(TickMarkType)
    self.assertIsNotNone(TrackingModeExitMode)
```

---

## 7. Dependent Plans

The following other coverage plans depend on enum definitions from this plan. This plan must be completed (or the enum definitions at minimum must be merged into `options.py`) before those plans can be fully implemented.

| Enum | Dependent plan | What it unblocks |
|---|---|---|
| `CrosshairMode` (`hidden`, `magnet_ohlc`) | `05-crosshair-options.md` | `crosshair_mode="hidden"` and `"magnet_ohlc"` in `chart()` |
| `ColorType` (`gradient`) | `03-layout-options.md` | `background_top_color` / `background_bottom_color` in `chart()` |
| `LastPriceAnimationMode` | Future series-options plan | `last_price_animation` param on `line_series()`, `area_series()`, `baseline_series()` |
| `PriceLineSource` | Future series-options plan | `price_line_source` param on all six series functions |
| `TrackingModeExitMode` | Future chart-options plan | `tracking_mode_exit_mode` param on `chart()` |
| `MarkerSign` | Future markers plan | `sign` field on `marker()` / `markers_from_table()` |
| `MismatchDirection` | Architecturally N/A | N/A — JS runtime query methods only |
| `TickMarkType` | Architecturally N/A | N/A — only consumer is `tickMarkFormatter` (JS callback) |

---

## 8. Usage Examples

These examples demonstrate correct Python usage after this plan is implemented.

### CrosshairMode — disable crosshair
```text
import deephaven.plot.tradingview_lightweight as tvl

c = tvl.chart(
    tvl.line_series(my_table, time="Timestamp", value="Price"),
    crosshair_mode="hidden",  # CrosshairMode.Hidden = 2
)
```

### CrosshairMode — OHLC magnet on candlestick chart
```text
c = tvl.candlestick(
    my_ohlc_table,
    crosshair_mode="magnet_ohlc",  # CrosshairMode.MagnetOHLC = 3
)
```

### LastPriceAnimationMode — after series-options plan is implemented
```text
s = tvl.line_series(
    my_table,
    time="Timestamp",
    value="Price",
    last_price_animation="on_data_update",  # flashes dot on each new tick
)
```

### PriceLineSource — after series-options plan is implemented
```text
s = tvl.line_series(
    my_table,
    time="Timestamp",
    value="Price",
    price_line_source="last_visible",  # tracks rightmost visible bar, not last bar
)
```

### TrackingModeExitMode — after chart-options plan is implemented
```text
c = tvl.chart(
    tvl.candlestick_series(my_table),
    tracking_mode_exit_mode="on_next_tap",  # mobile: tap again to exit tracking
)
```

---

## 9. Implementation Sequence

Perform these steps in order. Each step is independently testable.

**Step 1 — `options.py`: Expand `CrosshairMode` Literal and `CROSSHAIR_MODE_MAP`**

Change line 16 and lines 46–49 as described in §3.1 and §3.2. Run:
```bash
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pytest test/ -v -k "crosshair_mode"
```
Existing crosshair mode tests (`normal` → 0, `magnet` → 1) must still pass.

**Step 2 — `options.py`: Add `ColorType` Literal**

Insert the `ColorType` definition after line 29 as described in §3.3.

**Step 3 — `options.py`: Add six new Literal type aliases**

Insert the block from §3.4 immediately after the `ColorType` definition.

**Step 4 — `options.py`: Add six new `*_MAP` dicts**

Insert the block from §3.5 after `CHART_TYPE_MAP`. Run:
```bash
$PY -c "from deephaven.plot.tradingview_lightweight.options import LAST_PRICE_ANIMATION_MODE_MAP, MARKER_SIGN_MAP, MISMATCH_DIRECTION_MAP, PRICE_LINE_SOURCE_MAP, TICK_MARK_TYPE_MAP, TRACKING_MODE_EXIT_MODE_MAP; print('imports OK')"
```

**Step 5 — `__init__.py`: Export new names**

Add all new names to the import block and `__all__` list as described in §4.

**Step 6 — Tests: Add `TestEnumMaps` class**

Add the test class from §6.2 and the crosshair mode tests from §6.1. Run the full suite:
```bash
$PY -m pytest test/ -v
```
All existing tests must continue to pass. All new tests must pass.

---

## 10. Post-Implementation: Update Coverage Report

After all tests pass, update `notes/api-coverage-report.md`, §25 (Enumerations):

| Enum | Members | Before | After |
|---|---|:---:|:---:|
| `ColorType` | Solid, VerticalGradient | ⚠️ | ✅ |
| `CrosshairMode` | Normal, Magnet, Hidden, MagnetOHLC | ⚠️ 2/4 | ✅ 4/4 |
| `LastPriceAnimationMode` | Disabled, Continuous, OnDataUpdate | ❌ 0/3 | ✅ 3/3 |
| `LineStyle` | 5 members | ✅ | ✅ |
| `LineType` | 3 members | ✅ | ✅ |
| `MarkerSign` | Negative, Neutral, Positive | ❌ 0/3 | ✅ 3/3 |
| `MismatchDirection` | NearestLeft, None, NearestRight | ❌ 0/3 | ✅ 3/3 (N/A consumer) |
| `PriceLineSource` | LastBar, LastVisible | ❌ 0/2 | ✅ 2/2 |
| `PriceScaleMode` | 4 members | ✅ | ✅ |
| `TickMarkType` | Year, Month, DayOfMonth, Time, TimeWithSeconds | ❌ 0/5 | ✅ 5/5 (N/A consumer) |
| `TrackingModeExitMode` | OnTouchEnd, OnNextTap | ❌ 0/2 | ✅ 2/2 |

Update the score line from `14/34` to `34/34`.

Also update the enum row for `CrosshairMode` in the §5 CrosshairOptions table from ⚠️ to ✅.

---

## 11. Design Notes and Constraints

### Naming convention for Python strings

All Python string values in Literal types and map keys follow snake_case. The mapping rules are:
- Single-word JS names: `lowercase` (e.g., `Normal` → `"normal"`, `Magnet` → `"magnet"`)
- Multi-word JS names: `lower_snake_case` (e.g., `MagnetOHLC` → `"magnet_ohlc"`, `NearestLeft` → `"nearest_left"`, `OnDataUpdate` → `"on_data_update"`, `OnTouchEnd` → `"on_touch_end"`, `OnNextTap` → `"on_next_tap"`, `DayOfMonth` → `"day_of_month"`, `TimeWithSeconds` → `"time_with_seconds"`)
- Special case: JS `None` member → Python `"none"` (avoids collision with Python keyword `None`)
- Special case: JS `LastBar` → `"last_bar"`, `LastVisible` → `"last_visible"` (consistent with other snake_case rules)

This is consistent with the existing precedents: `LargeDashed` → `"large_dashed"`, `WithSteps` → `"with_steps"`, `IndexedTo100` → `"indexed_to_100"`.

### Integer values including negative numbers

`MarkerSign` and `MismatchDirection` use negative integers (-1). Python dicts and JSON both handle negative integers correctly. The `_filter_none` utility used in serialization is defined as `{k: v for k, v in d.items() if v is not None}` — a value of `-1` or `0` passes this filter correctly.

### `MismatchDirection.None` → `"none"` (not Python `None`)

The JS enum member is named `None` (value `0`). The Python Literal string is `"none"` (a string, not the Python built-in `None`). The map entry is `"none": 0`. Callers write `mismatch_direction="none"` to select no-search behavior. This is unambiguous.

### `TickMarkType` and `MismatchDirection` with no current consumer

Defining type aliases and map dicts for enums that have no current consumer is low-cost and follows the pattern established by `MarkerShape` and `MarkerPosition`, which are defined in `options.py` and used only in `markers.py`. If future bidirectional messaging or a `tickMarkFormatter` template system is added, these definitions will already be in the right place.

### Backward compatibility

`CrosshairMode` is expanded (new values added); existing callers using `"normal"` or `"magnet"` are unaffected. The Literal expansion is backward-compatible — Python type checkers will now accept two additional string values, which is a widening (non-breaking) change. All other new definitions are purely additive.

### No JS changes required

The JS frontend receives `chartOptions` and `series[].options` verbatim as JSON and passes them to `createChart()` / `applyOptions()`. None of the enum maps introduce new JSON structures; they map Python strings to the integer values the JS library already expects. No JS file changes are needed.

### Files to modify — summary

| File | Change type | Scope |
|---|---|---|
| `src/deephaven/plot/tradingview_lightweight/options.py` | Modify 2 lines, add ~45 lines | Literal expansions + new Literals + new map dicts |
| `src/deephaven/plot/tradingview_lightweight/__init__.py` | Add 7 import names + 7 `__all__` entries | ~14 lines |
| `test/deephaven/plot/tradingview_lightweight/test_chart.py` | Add `TestEnumMaps` class + 3 crosshair mode tests | ~80 lines |

No changes to `chart.py`, `series.py`, `markers.py`, or any JS file.
