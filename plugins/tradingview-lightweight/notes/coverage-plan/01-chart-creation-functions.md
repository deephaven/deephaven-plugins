# Coverage Plan 01 — Chart Creation Functions

**Status:** Draft
**Target gap:** `createChartEx` Python equivalent
**Scope:** Python API (`chart.py`, `options.py`, `__init__.py`) + JS renderer (`TradingViewChartRenderer.ts`, `TradingViewTypes.ts`) + unit tests (`test_chart.py`)

---

## 1. Current State

The coverage report (Section 1) identifies three JS chart-creation functions and maps each to its Python equivalent:

| JS Function | Status | Python Equivalent |
|---|:---:|---|
| `createChart(container, options?)` | ✅ | `chart(*series, **options)` and all single-series shorthands |
| `createChartEx(container, horzScaleBehavior, options?)` | ❌ | Not implemented |
| `createYieldCurveChart(container, options?)` | ✅ | `yield_curve(table, ...)` |

The Python layer also provides `options_chart()` as a Deephaven-specific extension (numeric strike-price x-axis). It wraps `chart_type="options"` which the JS renderer maps to `createOptionsChart(...)` (a TVL v5 extension).

### What exists today

**`options.py`** defines the `ChartType` literal and `CHART_TYPE_MAP`:

```text
ChartType = Literal["standard", "yield_curve", "options"]

CHART_TYPE_MAP = {
    "standard": "standard",
    "yield_curve": "yieldCurve",
    "options": "options",
}
```

**`chart.py`** — `TvlChart.__init__` stores `chart_type: str = "standard"` and exposes it via `self._chart_type`. `to_dict()` always emits `"chartType": self._chart_type` as a top-level JSON field.

**`chart.py`** — `chart()` resolves `chart_type` via `CHART_TYPE_MAP`, validates yield-curve series constraints, builds chart_options (layout, grid, crosshair, price scales, time scale, watermark, localization, sizing), and returns `TvlChart(series_list, chart_options, pane_stretch_factors, chart_type=resolved_type)`.

**Convenience wrappers** (`candlestick`, `line`, `area`, `bar`, `baseline`, `histogram`) all call `chart()` under the hood with a subset of options. `yield_curve()` and `options_chart()` set `chart_type` explicitly.

**`TradingViewTypes.ts`** defines:

```typescript
export type TvlChartType = 'standard' | 'yieldCurve' | 'options';
```

**`TradingViewChartRenderer.ts`** constructor switch-cases on `chartType`:

```typescript
switch (chartType) {
  case 'yieldCurve': this.chart = createYieldCurveChart(...); break;
  case 'options':    this.chart = createOptionsChart(...);    break;
  default:           this.chart = createChart(...);           break;
}
```

**`TradingViewChart.tsx`** reads `message.figure?.chartType ?? 'standard'` from the JSON payload and passes it into `TradingViewChartRenderer`.

---

## 2. What Is Missing

### 2.1 `createChartEx` — Custom Horizontal Scale Behavior

`createChartEx<HorzScaleItem>(container, horzScaleBehavior, options?)` allows a user-supplied `THorzScaleBehavior` object that overrides how lightweight-charts interprets the x-axis. The `horzScaleBehavior` argument is a plain JS/TS object implementing the `IHorzScaleBehavior` interface; it controls tick formatting, range computation, and data sorting.

In TVL v5 the built-in use of `createChartEx` is `createYieldCurveChart`, which provides a pre-built `HorzScaleBehaviorTime`-style implementation for monthly-duration yield curves. The library also ships `createOptionsChart` as another built-in.

**Why Python cannot directly expose `createChartEx`:**

The `horzScaleBehavior` argument is a JavaScript object with methods (`updateFormatter`, `getRangeType`, `formatHorzItem`, `preprocessData`, `updateVisiblePaneViews`, etc.). These methods run in the browser at render time. There is no way to serialize an arbitrary Python callable into a browser-executable JS function through the JSON message channel.

**Partial Python coverage that is feasible:**

The Python layer can do two things:

1. **Named built-in scale behaviors:** Support a fixed vocabulary of string identifiers that map to pre-built JS scale behaviors. Currently `"yieldCurve"` and `"options"` already do this implicitly. The gap is that users cannot _name_ a custom behavior — but the built-ins are already covered.

2. **Custom numeric x-axis (Deephaven extension):** `options_chart()` already implements the numeric-strike use case. No new Python code is required for that.

**What genuinely cannot be supported:**

A user-written `IHorzScaleBehavior` implementation in Python. This is architecturally N/A: the Python side only serializes static configuration; it has no means to transmit a function body across the wire. The coverage report already marks `createChartEx` as ❌ with the note "No custom horizontal scale behavior."

### 2.2 Proposed Scope of This Plan

Given the architectural constraint, the actionable work is:

1. **Add a `"custom_numeric"` chart type alias** that maps to `chartType: "options"` in the JSON payload (since the options renderer already gives a numeric x-axis via `createOptionsChart`). This removes the need to remember that `options_chart()` is the numeric-axis entry point and makes the taxonomy explicit. _(Optional enhancement — discuss with team before implementing.)_

2. **Document the N/A boundary** in code (docstrings + `options.py` comment) so future contributors do not attempt to re-open the `createChartEx` gap.

3. **Add a `chart_ex_behavior` parameter guard** to `chart()` that raises a clear `NotImplementedError` if a user somehow passes an unknown chart type, rather than silently falling through to `"standard"`.

4. **Extend the test suite** to cover the chart-type dispatch logic end-to-end.

The rest of this plan is written assuming all four items above will be implemented.

---

## 3. Detailed Implementation Steps

### Step 1 — Update `options.py`

**File:** `src/deephaven/plot/tradingview_lightweight/options.py`

#### 3.1a Extend `ChartType` literal

```text
# Before
ChartType = Literal["standard", "yield_curve", "options"]

# After
ChartType = Literal["standard", "yield_curve", "options", "custom_numeric"]
```

`"custom_numeric"` is a user-friendly alias meaning "numeric x-axis with the options renderer." It maps to the same JS value as `"options"`.

#### 3.1b Extend `CHART_TYPE_MAP`

```text
CHART_TYPE_MAP = {
    "standard": "standard",
    "yield_curve": "yieldCurve",
    "options": "options",
    "custom_numeric": "options",   # alias — same JS renderer
}
```

#### 3.1c Add a comment documenting the `createChartEx` N/A boundary

Immediately below `CHART_TYPE_MAP`, add:

```text
# NOTE: The TVL JS function createChartEx(container, horzScaleBehavior, options?)
# cannot be mapped to Python.  The horzScaleBehavior argument is a JS object whose
# methods (formatHorzItem, preprocessData, etc.) run in the browser at render time.
# There is no mechanism to serialize arbitrary Python callables to browser-side JS
# through the JSON message channel.  The built-in behaviors (yieldCurve, options)
# are exposed as named chart types above.  Any user needing a custom behavior must
# write a JS plugin extension.
```

---

### Step 2 — Update `chart.py`

**File:** `src/deephaven/plot/tradingview_lightweight/chart.py`

#### 3.2a Tighten the `chart_type` resolution and add an unknown-type guard

Current code:

```text
resolved_type = (
    CHART_TYPE_MAP.get(chart_type, "standard") if chart_type else "standard"
)
```

The silent fallback to `"standard"` for unrecognised values hides typos. Replace with:

```text
if chart_type is None:
    resolved_type = "standard"
elif chart_type in CHART_TYPE_MAP:
    resolved_type = CHART_TYPE_MAP[chart_type]
else:
    valid = ", ".join(f'"{k}"' for k in CHART_TYPE_MAP)
    raise ValueError(
        f"Unknown chart_type {chart_type!r}. "
        f"Valid values are: {valid}. "
        f"Note: createChartEx with a custom horzScaleBehavior is not supported "
        f"from Python — use a JS plugin extension for fully custom horizontal scales."
    )
```

This makes typos (`"yieldcurve"`, `"yield-curve"`, etc.) immediately visible rather than silently rendering a standard chart.

#### 3.2b Add yield-curve series validation for `"custom_numeric"` — deliberately not needed

`"custom_numeric"` maps to the options renderer, which accepts any series type (same as `"options"`). Do not copy the yield-curve validation block; only `"yieldCurve"` is restricted.

#### 3.2c Update the `chart()` docstring

Add a section after the existing Args block:

```text
    """Create a TradingView Lightweight chart with one or more series.

    Args:
        *series: One or more SeriesSpec objects created by series functions.
        chart_type: Selects the horizontal scale backend. Allowed values:

            - ``"standard"`` (default) — time-based x-axis via ``createChart``.
            - ``"yield_curve"`` — monthly-duration numeric x-axis via
              ``createYieldCurveChart``; only Line and Area series are valid.
            - ``"options"`` — numeric x-axis via ``createOptionsChart``; any
              series type is valid.  Best used through ``options_chart()``.
            - ``"custom_numeric"`` — alias for ``"options"``; prefer this name
              when the x-axis represents arbitrary numeric values (e.g.
              strike prices, frequencies) rather than option strikes specifically.

        Note: ``createChartEx`` with a custom ``horzScaleBehavior`` is not
        supported from Python. The three named chart types above cover all
        built-in horizontal scale behaviors shipped with TVL v5.
        ...
    """
```

#### 3.2d Add a `custom_numeric()` convenience function

Mirrors the structure of `options_chart()`. Place it immediately after `options_chart()` in the file.

```text
def custom_numeric(
    table: Any,
    x: str = "X",
    value: str = "Value",
    series_type: str = "line",
    # Series styling
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    title: Optional[str] = None,
    # Area-specific
    line_color: Optional[str] = None,
    top_color: Optional[str] = None,
    bottom_color: Optional[str] = None,
    # Common chart options
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a chart with a generic numeric x-axis.

    Use this when the x-axis represents arbitrary numeric values (e.g. frequency,
    distance, price levels) rather than timestamps.  Internally this uses the same
    ``createOptionsChart`` renderer as :func:`options_chart`, which provides a
    linearly-spaced numeric horizontal scale.

    Args:
        table: Deephaven table with the data.
        x: Column name for the x-axis (numeric values).
        value: Column name for the y-axis.
        series_type: ``"line"`` (default), ``"area"``, or ``"histogram"``.

    Note:
        ``createChartEx`` with a fully custom ``horzScaleBehavior`` is not
        supported from Python.  Write a JS plugin extension for that use case.
    """
    st = series_type.lower()
    if st == "area":
        s = series_module.area_series(
            table,
            time=x,
            value=value,
            line_color=line_color or color,
            top_color=top_color,
            bottom_color=bottom_color,
            line_width=line_width,
            title=title,
        )
    elif st == "histogram":
        s = series_module.histogram_series(
            table,
            time=x,
            value=value,
            color=color,
            title=title,
        )
    else:
        s = series_module.line_series(
            table,
            time=x,
            value=value,
            color=color,
            line_width=line_width,
            title=title,
        )
    return chart(
        s,
        chart_type="custom_numeric",
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )
```

Key differences from `options_chart()`:

- Parameter `strike` renamed to `x` (generic intent).
- `chart_type="custom_numeric"` instead of `"options"`.
- Docstring explains the generic use case.

---

### Step 3 — Update `__init__.py`

**File:** `src/deephaven/plot/tradingview_lightweight/__init__.py`

#### 3.3a Add `custom_numeric` to imports

```text
from .chart import (
    TvlChart,
    chart,
    candlestick,
    line,
    area,
    bar,
    baseline,
    histogram,
    yield_curve,
    options_chart,
    custom_numeric,           # NEW
)
```

#### 3.3b Add to `__all__`

```text
__all__ = [
    ...
    "yield_curve",
    "options_chart",
    "custom_numeric",         # NEW
    ...
]
```

---

### Step 4 — JS side changes

**No JS changes are required for the core plan** because `"custom_numeric"` maps to `"options"` in `CHART_TYPE_MAP`, so the JSON payload emits `"chartType": "options"`, which the existing renderer switch-case handles.

If a future team member wants to add a fourth named chart type that corresponds to a new `createChartEx` built-in behavior (e.g. if TVL ships a built-in `createLogarithmicTimeChart`), the following pattern applies:

#### 4a — Add to `TradingViewTypes.ts`

```typescript
// Before
export type TvlChartType = 'standard' | 'yieldCurve' | 'options';

// After
export type TvlChartType = 'standard' | 'yieldCurve' | 'options' | 'logarithmicTime';
```

#### 4b — Add to renderer switch

```typescript
// In TradingViewChartRenderer constructor
switch (chartType) {
  case 'yieldCurve':
    this.chart = createYieldCurveChart(container, commonOpts as ...);
    break;
  case 'options':
    this.chart = createOptionsChart(container, commonOpts as ...);
    break;
  case 'logarithmicTime':
    // createChartEx with the built-in LogarithmicTimeBehavior
    this.chart = createChartEx(
      container,
      new LogarithmicTimeBehavior(),
      commonOpts as ...
    ) as unknown as IChartApi;
    break;
  default:
    this.chart = createChart(container, commonOpts as ...);
    break;
}
```

#### 4c — Add TypeScript type check

Run `npx tsc --noEmit` in `src/js/` after any change to `TvlChartType` or the renderer to catch exhaustiveness errors.

---

### Step 5 — Integration with `TvlChart.to_dict()` and JSON architecture

No changes to `to_dict()` are needed. The `"chartType"` key is already a top-level field in the payload:

```text
result = {
    "chartType": self._chart_type,   # e.g. "options" (from "custom_numeric" alias)
    "chartOptions": self._chart_options,
    "series": series_dicts,
}
```

The JS side reads:

```typescript
const ct = message.figure?.chartType ?? 'standard';
```

Because `"custom_numeric"` maps to `"options"` before `_chart_type` is set, the JS renderer always sees `"options"` — never `"custom_numeric"`. This is intentional: the alias is a Python-API concern only; the wire format stays minimal.

If it is ever desirable to preserve the alias name in the payload (e.g. for debugging), store a second field `"chartTypeAlias"` alongside `"chartType"`. The renderer ignores unknown keys.

---

## 4. Test Coverage

All tests follow the pattern in `test/deephaven/plot/tradingview_lightweight/test_chart.py`: use `unittest.TestCase`, mock tables with `MagicMock`, and avoid any Deephaven server dependency.

### 4.1 Tests for the `chart_type` guard (add to `TestChartType`)

```text
class TestChartType(unittest.TestCase):
    # ... existing tests ...

    def test_unknown_chart_type_raises(self):
        """Unrecognised chart_type should raise ValueError, not silently use 'standard'."""
        s = line_series(self.table)
        with self.assertRaises(ValueError) as ctx:
            chart(s, chart_type="unknown_type")
        self.assertIn("unknown_type", str(ctx.exception))
        self.assertIn("createChartEx", str(ctx.exception))

    def test_typo_chart_type_raises(self):
        """Typos like 'yield-curve' or 'yieldcurve' should raise, not silently fall through."""
        s = line_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, chart_type="yieldcurve")      # missing underscore
        with self.assertRaises(ValueError):
            chart(s, chart_type="yield-curve")     # hyphen instead of underscore

    def test_custom_numeric_chart_type(self):
        """'custom_numeric' should be accepted and map to 'options' in the wire format."""
        s = line_series(self.table, time="X", value="Y")
        c = chart(s, chart_type="custom_numeric")
        # The Python-side chart_type stores the resolved JS value
        self.assertEqual(c.chart_type, "options")

    def test_custom_numeric_in_to_dict(self):
        """JSON payload should emit 'options' for custom_numeric."""
        s = line_series(self.table)
        c = chart(s, chart_type="custom_numeric")
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "options")

    def test_none_chart_type_defaults_to_standard(self):
        """chart_type=None should default to 'standard' without raising."""
        s = line_series(self.table)
        c = chart(s, chart_type=None)
        self.assertEqual(c.chart_type, "standard")
```

### 4.2 Tests for `custom_numeric()` convenience function (new `TestCustomNumericConvenience` class)

```text
class TestCustomNumericConvenience(unittest.TestCase):
    """Tests for the custom_numeric() convenience function."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        """Default call: line series, x='X', value='Value', chartType='options'."""
        c = custom_numeric(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].series_type, "Line")
        self.assertEqual(c.series_list[0].column_mapping["time"], "X")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Value")
        self.assertEqual(c.chart_type, "options")   # wire value

    def test_custom_columns(self):
        c = custom_numeric(self.table, x="Frequency", value="Amplitude")
        self.assertEqual(c.series_list[0].column_mapping["time"], "Frequency")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Amplitude")

    def test_area_series_type(self):
        c = custom_numeric(self.table, series_type="area")
        self.assertEqual(c.series_list[0].series_type, "Area")

    def test_histogram_series_type(self):
        c = custom_numeric(self.table, series_type="histogram")
        self.assertEqual(c.series_list[0].series_type, "Histogram")

    def test_line_styling(self):
        c = custom_numeric(self.table, color="#2962FF", line_width=2, title="IV Smile")
        opts = c.series_list[0].options
        self.assertEqual(opts["color"], "#2962FF")
        self.assertEqual(opts["lineWidth"], 2)
        self.assertEqual(opts["title"], "IV Smile")

    def test_area_styling_passthrough(self):
        c = custom_numeric(
            self.table,
            series_type="area",
            line_color="#00f",
            top_color="rgba(0,0,255,0.3)",
            bottom_color="rgba(0,0,255,0.0)",
        )
        opts = c.series_list[0].options
        self.assertEqual(opts["lineColor"], "#00f")
        self.assertEqual(opts["topColor"], "rgba(0,0,255,0.3)")

    def test_color_falls_back_to_line_color_for_area(self):
        """When color is set but line_color is not, color should feed lineColor."""
        c = custom_numeric(self.table, series_type="area", color="#ff0000")
        opts = c.series_list[0].options
        self.assertEqual(opts["lineColor"], "#ff0000")

    def test_chart_options_pass_through(self):
        c = custom_numeric(
            self.table,
            background_color="#000",
            text_color="#fff",
            crosshair_mode="normal",
            watermark_text="VOL",
            width=800,
            height=400,
        )
        self.assertEqual(c.chart_options["layout"]["background"]["color"], "#000")
        self.assertEqual(c.chart_options["layout"]["textColor"], "#fff")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 0)
        self.assertEqual(c.chart_options["watermark"]["text"], "VOL")
        self.assertEqual(c.chart_options["width"], 800)
        self.assertEqual(c.chart_options["height"], 400)

    def test_to_dict_structure(self):
        c = custom_numeric(self.table, x="Strike", value="Delta")
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "options")
        self.assertEqual(len(result["series"]), 1)
        self.assertEqual(result["series"][0]["dataMapping"]["columns"]["time"], "Strike")
        self.assertEqual(result["series"][0]["dataMapping"]["columns"]["value"], "Delta")

    def test_invalid_series_type_falls_back_to_line(self):
        """Unknown series_type strings should silently produce a Line series
        (matching options_chart behaviour)."""
        c = custom_numeric(self.table, series_type="invalid")
        self.assertEqual(c.series_list[0].series_type, "Line")
```

### 4.3 Tests for the updated `TestChartType` — `"custom_numeric"` alias via `chart()` directly

These are already listed in §4.1 above. They should be placed in the existing `TestChartType` class (not a new class) because they test the `chart()` function's dispatch logic.

### 4.4 Regression tests — existing chart types must be unaffected

All currently-passing tests in `TestChartType`, `TestYieldCurveConvenience`, and `TestOptionsChartConvenience` constitute the regression suite. Run the full test suite after every change:

```bash
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pytest test/ -v
```

Expected: all existing tests continue to pass; new tests pass; no existing tests are modified.

---

## 5. How the `chartType` Field Flows Through the System

```
Python chart()                      chart_type="custom_numeric"
       │
       ▼
CHART_TYPE_MAP lookup               "custom_numeric" → "options"
       │
       ▼
TvlChart.__init__                   self._chart_type = "options"
       │
       ▼
TvlChart.to_dict()                  {"chartType": "options", "chartOptions": {...}, "series": [...]}
       │  (JSON over message channel)
       ▼
TradingViewChart.tsx init()         const ct = message.figure?.chartType ?? 'standard'
                                    → ct = "options"
       │
       ▼
TradingViewChartRenderer ctor       switch('options') → createOptionsChart(container, opts)
       │
       ▼
lightweight-charts JS runtime       Numeric x-axis rendered in browser
```

The alias is entirely consumed in the Python layer. The wire format is stable and backward-compatible.

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|:---:|:---:|---|
| Typo in `CHART_TYPE_MAP` alias (`"custom_numeric"` → wrong JS value) | Low | Medium | Unit test `test_custom_numeric_in_to_dict` asserts `"options"` in wire payload |
| Silent `"standard"` fallback preserved by accident (forgot to change guard) | Low | Low | `test_unknown_chart_type_raises` catches this |
| `options_chart()` and `custom_numeric()` diverge semantically over time | Medium | Low | Both call `chart(chart_type=...)` internally; document that `options_chart` is the domain-specific alias |
| JS renderer sees unexpected `"custom_numeric"` string (if alias leaks to wire) | Low | High | `test_custom_numeric_in_to_dict` asserts wire value; TypeScript `TvlChartType` would not include `"custom_numeric"`, so TS check acts as a second guard |
| True `createChartEx` gap re-opened by future contributor without reading this plan | Medium | Low | `options.py` comment + `chart()` docstring + error message all reference `createChartEx` explicitly |

---

## 7. Dependencies

| Dependency | Required for | Notes |
|---|---|---|
| No new Python packages | — | All changes use stdlib/existing imports |
| No JS package additions | — | `createOptionsChart` already imported in renderer |
| TypeScript build (`npx tsc --noEmit`) | JS side | Only needed if `TvlChartType` or renderer switch is changed |
| `pytest` | Test run | Already available in dev env |

---

## 8. Migration / Backwards-Compatibility Considerations

### 8.1 Existing users — no breaking changes

All existing `ChartType` values (`"standard"`, `"yield_curve"`, `"options"`) remain valid. The only change to `chart()` behavior is the new `ValueError` for **unrecognised** values. Previously, typos like `chart(s, chart_type="yield-curve")` silently produced a standard chart; after this change they raise. This is a deliberate improvement but technically a breaking change for code that relied on the silent fallback.

**Assessment:** Acceptable. The silent fallback was a bug, not a feature. Any production code would have been passing one of the three documented values.

### 8.2 `options_chart()` — not deprecated

`options_chart()` continues to exist unchanged. `custom_numeric()` is additive. Users who visualise option chains should continue to use `options_chart()` because its parameter names (`strike`, `value`) are domain-appropriate. `custom_numeric()` is for non-financial numeric x-axis use cases.

Both functions produce `chartType: "options"` in the wire format; the rendered chart is identical. Differentiation is at the Python API level only.

### 8.3 Wire format stability

The `"chartType"` field set `{"standard", "yieldCurve", "options"}` is not expanded. Adding `"custom_numeric"` at the Python API level does not require any frontend deployment. Existing deployed JS plugins continue to work unchanged.

If a future team decides to add a genuinely new JS chart type (i.e., a new `case` in the renderer switch), then both the Python `CHART_TYPE_MAP` and the JS `TvlChartType` union must be updated, and a fresh JS build + deployment is required. See §4 for the pattern.

### 8.4 `__init__.py` `__all__` addition

Adding `custom_numeric` to `__all__` is additive. It does not break existing wildcard imports (`from deephaven.plot.tradingview_lightweight import *`) because no name is removed; the new name is only added.

---

## 9. Implementation Order

The steps are ordered to keep the codebase in a passing state at every point:

1. **`options.py`** — Add `"custom_numeric"` to `ChartType` and `CHART_TYPE_MAP`. Add N/A comment. (No test changes needed yet; existing tests still pass.)
2. **`chart.py`** — Replace the silent fallback with the explicit `ValueError` guard. Update `chart()` docstring. Add `custom_numeric()` function.
3. **`__init__.py`** — Add import and `__all__` entry for `custom_numeric`.
4. **`test_chart.py`** — Add `TestCustomNumericConvenience` class and guard tests to `TestChartType`. Run full test suite; all tests should pass.
5. **JS (only if needed)** — No changes required for the alias; only required if a new actual JS chart type is being added.

Each step is independently reviewable as a separate commit.

---

## 10. Out of Scope for This Plan

The following are related but deliberately excluded from this plan:

- **`createTextWatermark` / `createImageWatermark` factories** — covered by Section 6 of the coverage report.
- **`createSeriesMarkers` / `createUpDownMarkers`** — covered by Section 22.
- **`isBusinessDay()` / `isUTCTimestamp()` / `version()` utility functions** — server-side Python has no use for these JS type-guard utilities; they are marked N/A in the coverage report.
- **`customSeriesDefaultOptions` and custom series types** — a significant undertaking; separate plan required.
- **Any `IChartApi` runtime methods** (zoom, scroll, screenshot, event subscriptions) — architecturally N/A; the Python layer is a static config builder with no live handle on the running chart.
