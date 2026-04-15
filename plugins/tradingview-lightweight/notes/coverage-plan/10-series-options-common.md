# Implementation Plan: SeriesOptionsCommon — Missing Coverage

**Section:** API Coverage Report §12
**Current score:** 5/16
**Target score:** 14/16 (2 properties are N/A)
**Files changed:** `series.py`, `options.py`, `test_series.py`

---

## 1. Current State

Five `SeriesOptionsCommon` properties are already implemented and must not be
changed:

| JS name | Python param | Notes |
|---|---|---|
| `lastValueVisible` | `last_value_visible` | `Optional[bool]` |
| `title` | `title` | `Optional[str]` |
| `priceScaleId` | `price_scale_id` | `Optional[str]` |
| `visible` | `visible` | `Optional[bool]` |
| `priceFormat` | `price_format` | `Optional[PriceFormat]` — has a serialization bug (§4) |

All six series-creation functions (`candlestick_series`, `bar_series`,
`line_series`, `area_series`, `baseline_series`, `histogram_series`) accept
these five parameters today. The existing pattern must be preserved and
extended.

---

## 2. Properties That Will Not Be Implemented

### `autoscaleInfoProvider` (N/A)

This property accepts a JavaScript callback function
(`(baseImplementation, range) => AutoscaleInfo | null`). It is not possible to
pass a callable from Python to the JS runtime in this server-side-serialization
architecture. Mark as N/A in the coverage report; no action needed.

### `conflationThresholdFactor` (skip for now)

The coverage report notes this as "Chart-level only, not per-series." The TVL
v5.1 API does define it on `SeriesOptionsCommon`, but the existing codebase
already exposes a chart-level `conflation_threshold_factor` (check
`chart.py`). Implementing it here would duplicate that exposure with unclear
semantics when both are set. Leave it `❌` in the coverage report with a note
that it can be added as a per-series override when a concrete need arises.

---

## 3. New Properties — Overview

### 3.1 Price-Line Group (5 properties)

Controls the horizontal dashed line drawn at the last price on the chart.

| JS name | Python param | Type | Default |
|---|---|---|---|
| `priceLineVisible` | `price_line_visible` | `Optional[bool]` | `true` |
| `priceLineSource` | `price_line_source` | `Optional[PriceLineSource]` | `"last_bar"` |
| `priceLineWidth` | `price_line_width` | `Optional[int]` | `1` |
| `priceLineColor` | `price_line_color` | `Optional[str]` | `""` |
| `priceLineStyle` | `price_line_style` | `Optional[LineStyle]` | `"dashed"` |

`PriceLineSource` is a new enum type that maps to the TVL `PriceLineSource`
enum (integer values). See §5.2.

`price_line_width` is typed as `Optional[int]` with a note in the docstring
that only values 1–4 are valid (matching the JS `LineWidth` type alias
`1 | 2 | 3 | 4`). Runtime validation is not required; the JS layer ignores
out-of-range values gracefully.

`price_line_style` reuses the existing `LineStyle` type alias from
`options.py` and the existing `_resolve_line_style()` helper.

### 3.2 Baseline Group (4 properties)

Controls the zero-level (or scale-base) baseline line drawn across the chart.
This is separate from the `BaselineSeries`-specific base value line; it appears
in percentage/indexed-to-100 price scale modes on any series type.

| JS name | Python param | Type | Default |
|---|---|---|---|
| `baseLineVisible` | `base_line_visible` | `Optional[bool]` | `true` |
| `baseLineColor` | `base_line_color` | `Optional[str]` | `"#B2B5BE"` |
| `baseLineWidth` | `base_line_width` | `Optional[int]` | `1` |
| `baseLineStyle` | `base_line_style` | `Optional[LineStyle]` | `"solid"` |

Same width and style rules as the price-line group.

---

## 4. Bug Fix — `PriceFormat.min_move` Serialization

### Root Cause

`PriceFormat` is a `TypedDict` defined in `options.py` with the key `min_move`
(snake_case):

```text
class PriceFormat(TypedDict, total=False):
    type: Literal["price", "volume", "percent", "custom"]
    precision: int
    min_move: float
```

When a user constructs `{"type": "price", "precision": 4, "min_move": 0.0001}`
and it is serialized to JSON and passed to the JS renderer as
`options.priceFormat`, the JS library receives a key named `"min_move"`.
However, `PriceFormatBuiltIn` in TVL expects `minMove` (camelCase). The JS
library silently ignores the unrecognized key and applies its own default
(`0.01`).

The existing test `test_price_format` in `TestCandlestickSeries` only asserts
that `spec.options["priceFormat"]` equals the raw dict passed in — it does not
verify that the JS-side key is `minMove`. This masks the bug.

### Fix Location

`options.py` — rename the `TypedDict` key from `min_move` to `minMove` so it
serializes directly without transformation:

```text
class PriceFormat(TypedDict, total=False):
    type: Literal["price", "volume", "percent", "custom"]
    precision: int
    minMove: float  # was: min_move
```

The `TypedDict` key must match the JSON/JS key exactly because `series.py`
passes the `PriceFormat` dict verbatim into the options dict with no
transformation step (see `"priceFormat": price_format` in every series
function).

### Migration Note

This is a **breaking change** for any caller already using
`price_format={"min_move": ...}`. However, since the key was silently ignored
by the JS layer before, no existing chart was actually using it correctly.
The fix is strictly an improvement. Update the docstring to document `minMove`
as the correct key. A deprecation shim is not needed given this is the initial
development phase.

### Test Fix

The existing test in `TestCandlestickSeries.test_price_format` must be updated
to use the new key name:

```text
def test_price_format(self):
    pf = {"type": "price", "precision": 4, "minMove": 0.0001}
    spec = candlestick_series(self.table, price_format=pf)
    self.assertEqual(spec.options["priceFormat"]["minMove"], 0.0001)
    self.assertEqual(spec.options["priceFormat"]["precision"], 4)
```

---

## 5. Changes to `options.py`

### 5.1 Fix `PriceFormat`

See §4. Change `min_move` → `minMove` in the `TypedDict`.

Full updated class:

```text
class PriceFormat(TypedDict, total=False):
    """Price format configuration.

    Keys match the TVL JS API exactly:
      - type:      "price" | "volume" | "percent" | "custom"
      - precision: number of decimal places
      - minMove:   minimum price movement (e.g. 0.01 for cents)
    """

    type: Literal["price", "volume", "percent", "custom"]
    precision: int
    minMove: float
```

### 5.2 Add `PriceLineSource` Type and Map

Add after the existing `PRICE_SCALE_MODE_MAP`:

```text
PriceLineSource = Literal["last_bar", "last_visible"]

PRICE_LINE_SOURCE_MAP = {
    "last_bar": 0,
    "last_visible": 1,
}
```

These values match the TVL `PriceLineSource` enum:
- `LastBar = 0` — price line tracks the last bar in the data set
- `LastVisible = 1` — price line tracks the last visible bar in the viewport

### 5.3 Export Updates

`series.py` already imports specific names from `options.py`. Add
`PriceLineSource` and `PRICE_LINE_SOURCE_MAP` to the import block.

---

## 6. Strategy for Avoiding Duplication Across All 6 Series Functions

The 9 new common parameters (`price_line_visible`, `price_line_source`,
`price_line_width`, `price_line_color`, `price_line_style`, `base_line_visible`,
`base_line_color`, `base_line_width`, `base_line_style`) would each need to be
added to all six series-function signatures. The existing common params
(`title`, `visible`, `last_value_visible`, `price_scale_id`, `price_format`)
already suffer this duplication — they are repeated identically in all six
functions with no helper.

The correct solution at this scale is a **private helper function**
`_build_common_options()` that owns the signature, default values, resolution
logic, and output dict for all `SeriesOptionsCommon` parameters. Each series
function then calls it and merges the result.

### 6.1 Define `_build_common_options()`

Add this function in `series.py` before the first series function, near
`_build_price_scale_options()`:

```text
def _build_common_options(
    last_value_visible: Optional[bool],
    title: Optional[str],
    visible: Optional[bool],
    price_scale_id: Optional[str],
    price_format: Optional[PriceFormat],
    price_line_visible: Optional[bool],
    price_line_source: Optional[PriceLineSource],
    price_line_width: Optional[int],
    price_line_color: Optional[str],
    price_line_style: Optional[LineStyle],
    base_line_visible: Optional[bool],
    base_line_color: Optional[str],
    base_line_width: Optional[int],
    base_line_style: Optional[LineStyle],
) -> dict:
    """Build the SeriesOptionsCommon portion of the series options dict.

    Returns a dict with only non-None entries, ready to be merged into the
    per-type options dict via ``{**_build_common_options(...), ...}``.
    """
    return _filter_none(
        {
            "lastValueVisible": last_value_visible,
            "title": title,
            "visible": visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
            "priceLineVisible": price_line_visible,
            "priceLineSource": (
                PRICE_LINE_SOURCE_MAP.get(price_line_source)
                if price_line_source is not None
                else None
            ),
            "priceLineWidth": price_line_width,
            "priceLineColor": price_line_color,
            "priceLineStyle": _resolve_line_style(price_line_style),
            "baseLineVisible": base_line_visible,
            "baseLineColor": base_line_color,
            "baseLineWidth": base_line_width,
            "baseLineStyle": _resolve_line_style(base_line_style),
        }
    )
```

### 6.2 Refactor Each Series Function's Signature

Each of the six series functions gets these new parameters appended to their
common-option block (after `price_format`, before `auto_scale`):

```text
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[int] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[int] = None,
    base_line_style: Optional[LineStyle] = None,
```

### 6.3 Replace Inline `_filter_none` Calls with `_build_common_options`

Inside each series function body, replace the repeated pattern:

```text
# OLD pattern (example from line_series):
options = _filter_none(
    {
        "color": color,
        "lineWidth": line_width,
        ...
        "lastValueVisible": last_value_visible,
        "title": title,
        "visible": visible,
        "priceScaleId": price_scale_id,
        "priceFormat": price_format,
    }
)
```

with:

```text
# NEW pattern:
options = {
    **_build_common_options(
        last_value_visible=last_value_visible,
        title=title,
        visible=visible,
        price_scale_id=price_scale_id,
        price_format=price_format,
        price_line_visible=price_line_visible,
        price_line_source=price_line_source,
        price_line_width=price_line_width,
        price_line_color=price_line_color,
        price_line_style=price_line_style,
        base_line_visible=base_line_visible,
        base_line_color=base_line_color,
        base_line_width=base_line_width,
        base_line_style=base_line_style,
    ),
    **_filter_none(
        {
            # per-type options only, e.g.:
            "color": color,
            "lineWidth": line_width,
            ...
        }
    ),
}
```

The `**` merge ensures per-type options can override any key if needed (they
won't in practice, but it's safer than a manual update). The common options
come first so per-type options take precedence.

---

## 7. Full Per-Series Signature Changes

The changes to each function's parameters are identical for the nine new
parameters. Only the position within the parameter list differs slightly based
on existing style (they slot in after `price_format` and before `auto_scale`).

### 7.1 `candlestick_series`

**Add to import from `options.py`:** `PriceLineSource`, `PRICE_LINE_SOURCE_MAP`

**Parameters to add** (after `price_format: Optional[PriceFormat] = None`):

```text
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[int] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[int] = None,
    base_line_style: Optional[LineStyle] = None,
```

**Body change:** Replace the inline `_filter_none` with the `_build_common_options`
merge pattern described in §6.3. The per-type portion keeps:
`upColor`, `downColor`, `borderUpColor`, `borderDownColor`, `wickUpColor`,
`wickDownColor`, `borderVisible`, `wickVisible`.

### 7.2 `bar_series`

Same nine parameters added in the same position.

Per-type options: `upColor`, `downColor`, `openVisible`, `thinBars`.

### 7.3 `line_series`

Same nine parameters added in the same position.

Per-type options: `color`, `lineWidth`, `lineStyle`, `lineType`,
`crosshairMarkerVisible`, `crosshairMarkerRadius`.

### 7.4 `area_series`

Same nine parameters added in the same position.

Per-type options: `lineColor`, `topColor`, `bottomColor`, `lineWidth`,
`lineStyle`, `lineType`, `crosshairMarkerVisible`, `crosshairMarkerRadius`.

### 7.5 `baseline_series`

Same nine parameters added in the same position.

Per-type options: `baseValue` (always set), `topLineColor`, `topFillColor1`,
`topFillColor2`, `bottomLineColor`, `bottomFillColor1`, `bottomFillColor2`,
`lineWidth`, `lineStyle`, `crosshairMarkerVisible`, `crosshairMarkerRadius`.

Note: `baseValue` is always included in the options dict (even when `base_value`
is the default `0.0`) because `_filter_none` does not remove `False`-but-set
values and the dict entry is a nested dict, not `None`. This behavior is correct
and must be preserved.

### 7.6 `histogram_series`

Same nine parameters added in the same position.

Per-type options: `color`.

---

## 8. Serialization Details

### 8.1 `price_line_source` → integer

TVL's `PriceLineSource` is a numeric enum:
- `LastBar = 0`
- `LastVisible = 1`

The `_build_common_options` helper converts using `PRICE_LINE_SOURCE_MAP`:

```text
"priceLineSource": (
    PRICE_LINE_SOURCE_MAP.get(price_line_source)
    if price_line_source is not None
    else None
),
```

This follows the same pattern as `_resolve_line_style()` and
`_resolve_line_type()` for consistency.

### 8.2 `price_line_style` and `base_line_style` → integer

Both reuse the existing `_resolve_line_style()` helper, which maps the
`LineStyle` Literal to integers 0–4. No new resolver needed.

### 8.3 `price_line_width` and `base_line_width` → passed through as-is

The JS `LineWidth` type is `1 | 2 | 3 | 4`. Python passes the integer directly;
no conversion needed. Add a docstring note that only values 1–4 are meaningful.

### 8.4 `price_line_color` and `base_line_color` → passed through as-is

CSS color strings. Pass directly.

### 8.5 `price_line_visible` and `base_line_visible` → passed through as-is

Booleans. Pass directly.

### 8.6 End-to-end flow

1. Python caller: `line_series(t, price_line_visible=False, price_line_color="#ff0000")`
2. `_build_common_options(...)` returns `{"priceLineVisible": False, "priceLineColor": "#ff0000"}`
3. Merged into `options` dict
4. `SeriesSpec.options` stores the dict
5. `SeriesSpec.to_dict()` serializes to JSON under `options`
6. JS renderer: `this.chart.addSeries(definition, options, ...)` — TVL reads
   `options.priceLineVisible` and `options.priceLineColor` directly

No additional JS-side changes are needed. The renderer passes the options
object verbatim to `addSeries()`.

---

## 9. Required Imports in `series.py`

Update the import from `options.py`:

```text
from .options import (
    LineStyle,
    LineType,
    PriceFormat,
    PriceLineSource,          # NEW
    PriceScaleMode,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
    PRICE_LINE_SOURCE_MAP,    # NEW
    PRICE_SCALE_MODE_MAP,
)
```

---

## 10. Test Coverage

All new tests go in
`test/deephaven/plot/tradingview_lightweight/test_series.py`.

### 10.1 Fix Existing Test

In `TestCandlestickSeries`:

```text
def test_price_format(self):
    # minMove (camelCase) is the correct key — matches TVL JS API
    pf = {"type": "price", "precision": 4, "minMove": 0.0001}
    spec = candlestick_series(self.table, price_format=pf)
    self.assertEqual(spec.options["priceFormat"]["minMove"], 0.0001)
    self.assertEqual(spec.options["priceFormat"]["precision"], 4)
    # min_move (old snake_case key) must NOT appear
    self.assertNotIn("min_move", spec.options["priceFormat"])
```

### 10.2 New Test Class: `TestPriceLineOptions`

```text
class TestPriceLineOptions(unittest.TestCase):
    """price_line_* common options on all series types."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_price_line_visible_false(self):
        spec = line_series(self.table, price_line_visible=False)
        self.assertFalse(spec.options["priceLineVisible"])

    def test_price_line_visible_true(self):
        spec = line_series(self.table, price_line_visible=True)
        self.assertTrue(spec.options["priceLineVisible"])

    def test_price_line_source_last_bar(self):
        spec = line_series(self.table, price_line_source="last_bar")
        self.assertEqual(spec.options["priceLineSource"], 0)

    def test_price_line_source_last_visible(self):
        spec = line_series(self.table, price_line_source="last_visible")
        self.assertEqual(spec.options["priceLineSource"], 1)

    def test_price_line_width(self):
        spec = line_series(self.table, price_line_width=2)
        self.assertEqual(spec.options["priceLineWidth"], 2)

    def test_price_line_color(self):
        spec = line_series(self.table, price_line_color="#ff0000")
        self.assertEqual(spec.options["priceLineColor"], "#ff0000")

    def test_price_line_style_dashed(self):
        spec = line_series(self.table, price_line_style="dashed")
        self.assertEqual(spec.options["priceLineStyle"], 2)

    def test_price_line_style_solid(self):
        spec = line_series(self.table, price_line_style="solid")
        self.assertEqual(spec.options["priceLineStyle"], 0)

    def test_price_line_options_absent_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("priceLineVisible", spec.options)
        self.assertNotIn("priceLineSource", spec.options)
        self.assertNotIn("priceLineWidth", spec.options)
        self.assertNotIn("priceLineColor", spec.options)
        self.assertNotIn("priceLineStyle", spec.options)

    def test_all_series_types_accept_price_line_options(self):
        """price_line_* must be accepted by all 6 series functions."""
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(
                self.table,
                price_line_visible=False,
                price_line_source="last_visible",
                price_line_width=3,
                price_line_color="#aabbcc",
                price_line_style="dotted",
            )
            self.assertFalse(spec.options["priceLineVisible"])
            self.assertEqual(spec.options["priceLineSource"], 1)
            self.assertEqual(spec.options["priceLineWidth"], 3)
            self.assertEqual(spec.options["priceLineColor"], "#aabbcc")
            self.assertEqual(spec.options["priceLineStyle"], 1)  # dotted

    def test_to_dict_includes_price_line_options(self):
        spec = line_series(
            self.table,
            price_line_visible=True,
            price_line_color="#123456",
        )
        result = spec.to_dict("s0", 0)
        self.assertTrue(result["options"]["priceLineVisible"])
        self.assertEqual(result["options"]["priceLineColor"], "#123456")
```

### 10.3 New Test Class: `TestBaseLineOptions`

```text
class TestBaseLineOptions(unittest.TestCase):
    """base_line_* common options on all series types."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_base_line_visible_false(self):
        spec = line_series(self.table, base_line_visible=False)
        self.assertFalse(spec.options["baseLineVisible"])

    def test_base_line_color(self):
        spec = line_series(self.table, base_line_color="#B2B5BE")
        self.assertEqual(spec.options["baseLineColor"], "#B2B5BE")

    def test_base_line_width(self):
        spec = line_series(self.table, base_line_width=2)
        self.assertEqual(spec.options["baseLineWidth"], 2)

    def test_base_line_style_solid(self):
        spec = line_series(self.table, base_line_style="solid")
        self.assertEqual(spec.options["baseLineStyle"], 0)

    def test_base_line_style_large_dashed(self):
        spec = line_series(self.table, base_line_style="large_dashed")
        self.assertEqual(spec.options["baseLineStyle"], 3)

    def test_base_line_options_absent_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("baseLineVisible", spec.options)
        self.assertNotIn("baseLineColor", spec.options)
        self.assertNotIn("baseLineWidth", spec.options)
        self.assertNotIn("baseLineStyle", spec.options)

    def test_all_series_types_accept_base_line_options(self):
        """base_line_* must be accepted by all 6 series functions."""
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(
                self.table,
                base_line_visible=False,
                base_line_color="#ffffff",
                base_line_width=1,
                base_line_style="dotted",
            )
            self.assertFalse(spec.options["baseLineVisible"])
            self.assertEqual(spec.options["baseLineColor"], "#ffffff")
            self.assertEqual(spec.options["baseLineWidth"], 1)
            self.assertEqual(spec.options["baseLineStyle"], 1)  # dotted

    def test_to_dict_includes_base_line_options(self):
        spec = area_series(
            self.table,
            base_line_visible=True,
            base_line_color="#aaaaaa",
        )
        result = spec.to_dict("s0", 0)
        self.assertTrue(result["options"]["baseLineVisible"])
        self.assertEqual(result["options"]["baseLineColor"], "#aaaaaa")
```

### 10.4 New Test Class: `TestPriceLineSourceEnum`

```text
class TestPriceLineSourceEnum(unittest.TestCase):
    """PriceLineSource string literals resolve to correct integer values."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_last_bar_is_zero(self):
        spec = candlestick_series(self.table, price_line_source="last_bar")
        self.assertEqual(spec.options["priceLineSource"], 0)

    def test_last_visible_is_one(self):
        spec = candlestick_series(self.table, price_line_source="last_visible")
        self.assertEqual(spec.options["priceLineSource"], 1)

    def test_source_absent_when_not_set(self):
        spec = candlestick_series(self.table)
        self.assertNotIn("priceLineSource", spec.options)
```

### 10.5 New Test Class: `TestCommonOptionsCoexistence`

These tests verify that per-type options are not clobbered by common options
when both are specified, and that the merge order is correct:

```text
class TestCommonOptionsCoexistence(unittest.TestCase):
    """Common and per-type options coexist without conflict."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_common_and_per_type_together(self):
        spec = line_series(
            self.table,
            color="blue",
            line_width=2,
            price_line_visible=False,
            base_line_color="#ff0000",
            last_value_visible=False,
            title="My Line",
        )
        self.assertEqual(spec.options["color"], "blue")
        self.assertEqual(spec.options["lineWidth"], 2)
        self.assertFalse(spec.options["priceLineVisible"])
        self.assertEqual(spec.options["baseLineColor"], "#ff0000")
        self.assertFalse(spec.options["lastValueVisible"])
        self.assertEqual(spec.options["title"], "My Line")

    def test_candlestick_common_and_per_type_together(self):
        spec = candlestick_series(
            self.table,
            up_color="#00ff00",
            price_line_visible=True,
            price_line_width=2,
            base_line_visible=False,
        )
        self.assertEqual(spec.options["upColor"], "#00ff00")
        self.assertTrue(spec.options["priceLineVisible"])
        self.assertEqual(spec.options["priceLineWidth"], 2)
        self.assertFalse(spec.options["baseLineVisible"])
```

---

## 11. Step-by-Step Implementation Order

Follow this order to keep the diff reviewable and tests passing at each step:

### Step 1 — Fix `PriceFormat` in `options.py`

1. Rename `min_move` to `minMove` in the `PriceFormat` `TypedDict`.
2. Update the docstring.
3. Run `python -m pytest test/ -v` — one existing test (`test_price_format`)
   will fail; fix it next.

### Step 2 — Fix the Existing Test

1. In `TestCandlestickSeries.test_price_format`, change `"min_move"` to
   `"minMove"` in the dict literal.
2. Run tests — all should pass.

### Step 3 — Add `PriceLineSource` to `options.py`

1. Add the `PriceLineSource` type alias and `PRICE_LINE_SOURCE_MAP` dict.
2. No test changes needed yet (this is just a type/constant addition).

### Step 4 — Add `_build_common_options()` to `series.py`

1. Add the new import line for `PriceLineSource` and `PRICE_LINE_SOURCE_MAP`.
2. Add the `_build_common_options()` function after `_build_price_scale_options()`.
3. Do **not** call it yet from any series function.
4. Run tests — all should still pass.

### Step 5 — Refactor `line_series` First (Pilot)

1. Add the nine new parameters to `line_series`'s signature.
2. Replace the inline `_filter_none` call with the `_build_common_options` merge.
3. Run tests for `TestLineSeries` — they should all pass.
4. Run `TestLastValueVisible.test_line` — should pass (existing coverage for the
   now-refactored common options).

### Step 6 — Refactor Remaining 5 Series Functions

Apply the same change to `area_series`, `baseline_series`, `histogram_series`,
`bar_series`, `candlestick_series` in any order. Run tests after each.

### Step 7 — Add New Tests

Add the new test classes from §10.2–10.5. Run the full suite to confirm.

### Step 8 — Final Verification

```bash
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pytest test/ -v
```

All tests should pass. Count passing tests before and after to confirm no
regressions.

---

## 12. Docstring Updates

Each series function's docstring should gain a `price_line_*` and
`base_line_*` section. Use the pattern already established by the existing
`_build_price_scale_options` docstring:

For `line_series` (and by extension all others), add to the docstring:

```
    Price Line (last-price horizontal rule):
        price_line_visible: Show the price line. Default True.
        price_line_source:  "last_bar" or "last_visible". Default "last_bar".
        price_line_width:   Line width 1–4 px. Default 1.
        price_line_color:   CSS color string. Empty string uses series color.
        price_line_style:   LineStyle value. Default "dashed".

    Baseline (zero/index line in percentage/indexed-to-100 modes):
        base_line_visible: Show the baseline. Default True.
        base_line_color:   CSS color string. Default "#B2B5BE".
        base_line_width:   Line width 1–4 px. Default 1.
        base_line_style:   LineStyle value. Default "solid".
```

---

## 13. Coverage Report Update

After implementation, update §12 of
`notes/api-coverage-report.md` as follows:

```markdown
| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `lastValueVisible` | ✅ | `last_value_visible` | |
| 2 | `title` | ✅ | `title` | |
| 3 | `priceScaleId` | ✅ | `price_scale_id` | |
| 4 | `visible` | ✅ | `visible` | |
| 5 | `priceFormat` | ✅ | `price_format` | Bug fixed: `min_move` → `minMove` |
| 6 | `priceLineVisible` | ✅ | `price_line_visible` | |
| 7 | `priceLineSource` | ✅ | `price_line_source` | |
| 8 | `priceLineWidth` | ✅ | `price_line_width` | |
| 9 | `priceLineColor` | ✅ | `price_line_color` | |
| 10 | `priceLineStyle` | ✅ | `price_line_style` | |
| 11 | `baseLineVisible` | ✅ | `base_line_visible` | |
| 12 | `baseLineColor` | ✅ | `base_line_color` | |
| 13 | `baseLineWidth` | ✅ | `base_line_width` | |
| 14 | `baseLineStyle` | ✅ | `base_line_style` | |
| 15 | `autoscaleInfoProvider` | N/A | — | JS callback |
| 16 | `conflationThresholdFactor` | ❌ | — | Defer; chart-level preferred |

**Score: 14/16**
```

---

## 14. Summary of All Changes

| File | Change |
|---|---|
| `options.py` | Rename `PriceFormat.min_move` → `minMove`; add `PriceLineSource` literal + `PRICE_LINE_SOURCE_MAP` |
| `series.py` | Import `PriceLineSource`, `PRICE_LINE_SOURCE_MAP`; add `_build_common_options()`; add 9 new params to all 6 series functions; refactor options-building to use helper |
| `test_series.py` | Fix `test_price_format`; add `TestPriceLineOptions`, `TestBaseLineOptions`, `TestPriceLineSourceEnum`, `TestCommonOptionsCoexistence` |
| `notes/api-coverage-report.md` | Update §12 score from 5/16 to 14/16 |
