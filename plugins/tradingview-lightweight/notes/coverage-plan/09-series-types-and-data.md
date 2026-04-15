# Implementation Plan: Series Types and Data Interface Coverage

**Plan ID:** 09
**Scope:** API coverage report sections 10–11 (Series Types, Data Interfaces)
**Status:** Ready to implement

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Per-Point Color Overrides — How the System Works](#2-per-point-color-overrides--how-the-system-works)
3. [Feature 1: Line Series `color_column`](#3-feature-1-line-series-color_column)
4. [Feature 2: Area Series Color Columns](#4-feature-2-area-series-color-columns)
5. [Feature 3: Baseline Series Color Columns](#5-feature-3-baseline-series-color-columns)
6. [Feature 4: `customValues` — Feasibility Analysis](#6-feature-4-customvalues--feasibility-analysis)
7. [Feature 5: Custom Series — Architectural Assessment](#7-feature-5-custom-series--architectural-assessment)
8. [Test Coverage Plan](#8-test-coverage-plan)
9. [Files to Modify](#9-files-to-modify)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Current State

### Series Types

Six of the seven TradingView Lightweight Charts v5.1 series types are supported:

| Series Type | Python Function | Status |
|---|---|:---:|
| Line | `line_series()` / `line()` | Supported |
| Area | `area_series()` / `area()` | Supported |
| Baseline | `baseline_series()` / `baseline()` | Supported |
| Histogram | `histogram_series()` / `histogram()` | Supported |
| Candlestick | `candlestick_series()` / `candlestick()` | Supported |
| Bar | `bar_series()` / `bar()` | Supported |
| Custom | — | Not supported (architectural blocker — see §7) |

### Per-Point Color Override Coverage

OHLC types (Candlestick, Bar) and Histogram already expose per-point color overrides via `*_column` parameters. The three single-value series types (Line, Area, Baseline) do not yet expose theirs.

| JS Data Field | Series Type | Python Param | Status |
|---|---|---|:---:|
| `color` | Line | `color_column` | Missing |
| `lineColor` | Area | `line_color_column` | Missing |
| `topColor` | Area | `top_color_column` | Missing |
| `bottomColor` | Area | `bottom_color_column` | Missing |
| `topFillColor1` | Baseline | `top_fill_color1_column` | Missing |
| `topFillColor2` | Baseline | `top_fill_color2_column` | Missing |
| `topLineColor` | Baseline | `top_line_color_column` | Missing |
| `bottomFillColor1` | Baseline | `bottom_fill_color1_column` | Missing |
| `bottomFillColor2` | Baseline | `bottom_fill_color2_column` | Missing |
| `bottomLineColor` | Baseline | `bottom_line_color_column` | Missing |
| `color` | Histogram | `color_column` | **Already implemented** |
| `color` | Candlestick | `color_column` | **Already implemented** |
| `borderColor` | Candlestick | `border_color_column` | **Already implemented** |
| `wickColor` | Candlestick | `wick_color_column` | **Already implemented** |
| `color` | Bar | `color_column` | **Already implemented** |

### `customValues` Field

The `customValues?: Record<string, unknown>` field exists on every JS data interface (`SingleValueData`, `OhlcData`, and all their extensions). It is used by custom series plugins and primitive renderers to attach extra per-point metadata. The Python layer has no mapping for it. This is assessed as infeasible under the current architecture (see §6).

---

## 2. Per-Point Color Overrides — How the System Works

Understanding the full data path is essential before implementing.

### Python side (SeriesSpec → column_mapping → JSON)

Every series function builds a `column_mapping` dict that maps **JS data field names** to **Deephaven table column names**. For example:

```text
# candlestick_series with per-point color overrides
column_mapping = {
    "time": "Timestamp",
    "open": "Open",
    "high": "High",
    "low": "Low",
    "close": "Close",
    "color": "BodyColor",          # per-point body color
    "borderColor": "BorderColor",  # per-point border color
    "wickColor": "WickColor",      # per-point wick color
}
```

`SeriesSpec.to_dict()` serializes this as:

```json
{
  "id": "series_0",
  "type": "Candlestick",
  "options": { ... },
  "dataMapping": {
    "tableId": 0,
    "columns": {
      "time": "Timestamp",
      "open": "Open",
      "high": "High",
      "low": "Low",
      "close": "Close",
      "color": "BodyColor",
      "borderColor": "BorderColor",
      "wickColor": "WickColor"
    }
  }
}
```

No Python-side code beyond adding the key to `column_mapping` is needed — the JS consumes it automatically.

### JS side (TradingViewUtils.ts → transformTableData)

`transformTableData()` in `TradingViewUtils.ts` iterates over **every** entry in `columns` (other than `time`) and copies the value at each row index directly into the data point object under the same field name:

```typescript
// From TradingViewUtils.ts lines 63-73
Object.entries(columns).forEach(([field, colName]) => {
  if (field === 'time') return;
  const data = columnData.get(colName);
  if (data != null) {
    point[field] =
      typeof data[i] === 'object' && data[i] !== null
        ? Number(data[i])
        : data[i];
  }
});
```

This means if `columns` contains `{ "color": "LineColor" }`, and the table has a `LineColor` string column, the resulting data points will each have a `color` field that TradingView uses as a per-point color override. **No JS changes are required for the three missing series types.** The mapping mechanism is already fully generic.

### Column subscription

`getAllColumnsForTable()` in `TradingViewUtils.ts` collects all column names from all `dataMapping.columns` values for a given table, including any optional color override columns. Deephaven's subscription will automatically include those columns when they are present in the mapping.

### TvlSeriesConfig TypeScript type

The TypeScript type `TvlSeriesConfig` in `TradingViewTypes.ts` declares `columns` as `Record<string, string>`, which is already open-ended — any string key is valid. No TypeScript type changes are needed.

---

## 3. Feature 1: Line Series `color_column`

### What it adds

A `color_column: Optional[str] = None` parameter to `line_series()`. When provided, it maps the JS `color` data field to the named Deephaven table column, enabling per-point line segment color overrides.

### JS behavior

When a `LineData` point has a `color` property, TradingView renders that specific line segment in that color instead of the default series color. The effect is visible at the data-point level: each row in the table can specify a different CSS color string.

### Python change — `series.py`

Locate `line_series()` (line 304). Add the new parameter after `marker_spec` (the last parameter before `-> SeriesSpec`) to keep `*_column` params grouped together:

```text
def line_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    auto_scale: Optional[bool] = None,
    scale_margin_top: Optional[float] = None,
    scale_margin_bottom: Optional[float] = None,
    scale_mode: Optional[PriceScaleMode] = None,
    scale_invert: Optional[bool] = None,
    scale_align_labels: Optional[bool] = None,
    scale_border_visible: Optional[bool] = None,
    scale_border_color: Optional[str] = None,
    scale_text_color: Optional[str] = None,
    scale_entire_text_only: Optional[bool] = None,
    scale_visible: Optional[bool] = None,
    scale_ticks_visible: Optional[bool] = None,
    scale_minimum_width: Optional[int] = None,
    scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
    color_column: Optional[str] = None,   # <-- NEW
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
```

In the function body, update the `column_mapping` construction:

```text
    column_mapping = {"time": time, "value": value}
    if color_column is not None:
        column_mapping["color"] = color_column
    return SeriesSpec(
        series_type="Line",
        table=table,
        column_mapping=column_mapping,
        ...
    )
```

The current implementation hardcodes `column_mapping={"time": time, "value": value}` inline in the `SeriesSpec(...)` call. That needs to be split into a two-step assignment so the optional color key can be appended conditionally.

### Serialization output example

```text
spec = line_series(
    t,
    time="Timestamp",
    value="Price",
    color_column="LineColor",
)
spec.to_dict("series_0", 0)
# {
#   "id": "series_0",
#   "type": "Line",
#   "options": {},
#   "dataMapping": {
#     "tableId": 0,
#     "columns": {
#       "time": "Timestamp",
#       "value": "Price",
#       "color": "LineColor"
#     }
#   }
# }
```

---

## 4. Feature 2: Area Series Color Columns

### What it adds

Three `*_column` parameters to `area_series()`:

| Parameter | JS Field | Effect |
|---|---|---|
| `line_color_column` | `lineColor` | Per-point line color |
| `top_color_column` | `topColor` | Per-point top fill color |
| `bottom_color_column` | `bottomColor` | Per-point bottom fill color |

### JS behavior

`AreaData` extends `SingleValueData` with optional `lineColor?`, `topColor?`, and `bottomColor?` per-point overrides. When set on individual data points, they override the series-level `lineColor`, `topColor`, and `bottomColor` options respectively. All three can be combined independently.

### Python change — `series.py`

Add three parameters to `area_series()` after the existing price scale parameters, grouped with the other column-mapping params:

```text
def area_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    line_color: Optional[str] = None,
    top_color: Optional[str] = None,
    bottom_color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    auto_scale: Optional[bool] = None,
    scale_margin_top: Optional[float] = None,
    scale_margin_bottom: Optional[float] = None,
    scale_mode: Optional[PriceScaleMode] = None,
    scale_invert: Optional[bool] = None,
    scale_align_labels: Optional[bool] = None,
    scale_border_visible: Optional[bool] = None,
    scale_border_color: Optional[str] = None,
    scale_text_color: Optional[str] = None,
    scale_entire_text_only: Optional[bool] = None,
    scale_visible: Optional[bool] = None,
    scale_ticks_visible: Optional[bool] = None,
    scale_minimum_width: Optional[int] = None,
    scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
    line_color_column: Optional[str] = None,     # <-- NEW
    top_color_column: Optional[str] = None,      # <-- NEW
    bottom_color_column: Optional[str] = None,   # <-- NEW
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
```

In the body, replace the inline `column_mapping={"time": time, "value": value}` with:

```text
    column_mapping = {"time": time, "value": value}
    if line_color_column is not None:
        column_mapping["lineColor"] = line_color_column
    if top_color_column is not None:
        column_mapping["topColor"] = top_color_column
    if bottom_color_column is not None:
        column_mapping["bottomColor"] = bottom_color_column
```

### Naming rationale

The existing style parameters are `line_color`, `top_color`, `bottom_color` (series-level options). The column parameters follow the `*_column` suffix convention established by histogram/candlestick/bar, yielding `line_color_column`, `top_color_column`, `bottom_color_column`. These do not conflict with the option params.

Note that the JS field name for the style option is `lineColor`, `topColor`, `bottomColor` — and the JS data field for per-point overrides is also `lineColor`, `topColor`, `bottomColor`. The `column_mapping` dict uses JS data field names as keys, so the mapping is direct.

### Serialization output example

```text
spec = area_series(
    t,
    time="Timestamp",
    value="Price",
    top_color_column="AreaTopColor",
    bottom_color_column="AreaBottomColor",
)
spec.to_dict("series_0", 0)
# {
#   "id": "series_0",
#   "type": "Area",
#   "options": {},
#   "dataMapping": {
#     "tableId": 0,
#     "columns": {
#       "time": "Timestamp",
#       "value": "Price",
#       "topColor": "AreaTopColor",
#       "bottomColor": "AreaBottomColor"
#     }
#   }
# }
```

---

## 5. Feature 3: Baseline Series Color Columns

### What it adds

Six `*_column` parameters to `baseline_series()`:

| Parameter | JS Field | Region |
|---|---|---|
| `top_fill_color1_column` | `topFillColor1` | Above-baseline, top fill |
| `top_fill_color2_column` | `topFillColor2` | Above-baseline, bottom fill |
| `top_line_color_column` | `topLineColor` | Above-baseline, line |
| `bottom_fill_color1_column` | `bottomFillColor1` | Below-baseline, top fill |
| `bottom_fill_color2_column` | `bottomFillColor2` | Below-baseline, bottom fill |
| `bottom_line_color_column` | `bottomLineColor` | Below-baseline, line |

### JS behavior

`BaselineData` extends `SingleValueData` with six optional per-point color overrides. These mirror the six `BaselineStyleOptions` color properties, but are applied per data point rather than to the whole series. Each property is independently optional — it is valid to provide only `topLineColor` overrides without providing the fill colors.

### Python change — `series.py`

Add six parameters to `baseline_series()` after the price scale parameters:

```text
def baseline_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    base_value: float = 0.0,
    top_line_color: Optional[str] = None,
    top_fill_color1: Optional[str] = None,
    top_fill_color2: Optional[str] = None,
    bottom_line_color: Optional[str] = None,
    bottom_fill_color1: Optional[str] = None,
    bottom_fill_color2: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    auto_scale: Optional[bool] = None,
    scale_margin_top: Optional[float] = None,
    scale_margin_bottom: Optional[float] = None,
    scale_mode: Optional[PriceScaleMode] = None,
    scale_invert: Optional[bool] = None,
    scale_align_labels: Optional[bool] = None,
    scale_border_visible: Optional[bool] = None,
    scale_border_color: Optional[str] = None,
    scale_text_color: Optional[str] = None,
    scale_entire_text_only: Optional[bool] = None,
    scale_visible: Optional[bool] = None,
    scale_ticks_visible: Optional[bool] = None,
    scale_minimum_width: Optional[int] = None,
    scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
    top_fill_color1_column: Optional[str] = None,    # <-- NEW
    top_fill_color2_column: Optional[str] = None,    # <-- NEW
    top_line_color_column: Optional[str] = None,     # <-- NEW
    bottom_fill_color1_column: Optional[str] = None, # <-- NEW
    bottom_fill_color2_column: Optional[str] = None, # <-- NEW
    bottom_line_color_column: Optional[str] = None,  # <-- NEW
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
```

In the body, replace the inline `column_mapping={"time": time, "value": value}` with:

```text
    column_mapping = {"time": time, "value": value}
    if top_fill_color1_column is not None:
        column_mapping["topFillColor1"] = top_fill_color1_column
    if top_fill_color2_column is not None:
        column_mapping["topFillColor2"] = top_fill_color2_column
    if top_line_color_column is not None:
        column_mapping["topLineColor"] = top_line_color_column
    if bottom_fill_color1_column is not None:
        column_mapping["bottomFillColor1"] = bottom_fill_color1_column
    if bottom_fill_color2_column is not None:
        column_mapping["bottomFillColor2"] = bottom_fill_color2_column
    if bottom_line_color_column is not None:
        column_mapping["bottomLineColor"] = bottom_line_color_column
```

### Naming rationale

The existing option params are `top_fill_color1`, `top_fill_color2`, `top_line_color`, etc. Appending `_column` gives `top_fill_color1_column`, `top_fill_color2_column`, `top_line_color_column`. These are long but unambiguous and consistent with the pattern. Note that `top_line_color_column` and `top_line_color` are distinct — one sets a fixed style option, the other names a table column that provides per-point overrides.

### Serialization output example

```text
spec = baseline_series(
    t,
    base_value=100.0,
    top_line_color_column="AboveLineColor",
    bottom_line_color_column="BelowLineColor",
)
spec.to_dict("series_0", 0)
# {
#   "id": "series_0",
#   "type": "Baseline",
#   "options": {
#     "baseValue": {"type": "price", "price": 100.0}
#   },
#   "dataMapping": {
#     "tableId": 0,
#     "columns": {
#       "time": "Timestamp",
#       "value": "Value",
#       "topLineColor": "AboveLineColor",
#       "bottomLineColor": "BelowLineColor"
#     }
#   }
# }
```

---

## 6. Feature 4: `customValues` — Feasibility Analysis

### What it is

The TradingView JS data interfaces define `customValues?: Record<string, unknown>` on `SingleValueData` and `OhlcData`. This field is not used by the core chart renderer — it is intended as a pass-through bag for custom series plugins and primitive decorators to access per-point metadata.

### Why it cannot be straightforwardly mapped

The `column_mapping` mechanism maps **JS data field names** to **Deephaven column names**, one key per field. The `customValues` object is itself a nested dictionary, so the mapping would need to be structured as `{ "customValues.myKey": "MyTableColumn" }` or equivalent — but `transformTableData()` builds the data point by iterating `Object.entries(columns)` and assigning `point[field] = data[i]`. A nested key like `"customValues.myKey"` would assign the field literally as `customValues.myKey` rather than building a nested object.

Supporting `customValues` would require:

1. A special-cased namespace prefix in `transformTableData()` (e.g., anything starting with `customValues.` gets assigned as `point.customValues[suffix]`).
2. New Python API to declare custom value columns — something like `custom_values: Optional[dict[str, str]] = None` where the dict maps `{ "myKey": "MyTableColumn" }`.
3. A new serialization format for the column mapping to distinguish regular fields from `customValues` sub-keys.

### Feasibility verdict

**Not feasible as a general feature in this release.** The primary use cases for `customValues` are custom series plugins (see §7) and primitives, neither of which this Python layer supports. There is no built-in series type in TradingView that reads `customValues`. Implementing the infrastructure for zero concrete consumers is not worthwhile.

**If later needed**, the implementation path would be:

1. Represent custom value columns in `SeriesSpec.column_mapping` under a reserved namespace prefix, e.g., `"$customValues.sentiment"` → `"SentimentScore"`.
2. Update `transformTableData()` in `TradingViewUtils.ts` to detect the prefix and accumulate into `point.customValues = { sentiment: data[i] }`.
3. Add `custom_values: Optional[dict[str, str]] = None` to all six series functions, serializing each key as `f"$customValues.{key}"` in the mapping.

This should be deferred until there is a concrete plugin-extension use case.

---

## 7. Feature 5: Custom Series — Architectural Assessment

### What TradingView custom series requires

TradingView's `addCustomSeries()` API requires a **JavaScript class** implementing `ICustomSeriesView<TData>`. This class provides:
- `renderer(priceToCoordinate, timeToCoordinate, visibleData)` — custom drawing logic on a canvas context
- `priceValueBuilder(data)` — how to extract the price from custom data
- `isWhitespace(data)` — whether a point is "empty"
- `defaultOptions()` — default series style options

There is no way to express canvas drawing logic in Python and ship it to the browser. The custom series type is inherently a JavaScript extension point.

### What the Python plugin's architecture allows

The Python layer is a **static configuration builder**. It serializes options to JSON at chart-creation time and streams Deephaven table data to the JS plugin. There is no mechanism to inject arbitrary JavaScript code from Python into the browser context.

### What would be required

Supporting custom series would require the following architectural additions:

**Option A: Pre-bundled custom series registry**

The JS plugin could maintain a named registry of pre-built custom series implementations. Python would reference them by name:

```text
custom_series(
    table,
    custom_series_type="rounded_candle",  # pre-registered in the JS bundle
    time="Timestamp",
    value="Close",
    ...
)
```

The `TvlSeriesConfig.type` union in `TradingViewTypes.ts` would need to include `"Custom"` and the renderer would look up the implementation in its registry. This is feasible but requires coordinated JS and Python changes, and the registry would need to be maintained as a curated library of common custom series.

**Option B: Dynamic JS injection (not feasible)**

Allowing users to provide a JavaScript class as a string or file path from Python would require a trusted code execution channel that does not exist in the Deephaven plugin architecture.

### Recommendation

Custom series support should be deferred. It is an N/A for the Python-centric API. If Option A (pre-bundled registry) is pursued in the future, it should be planned as its own work item covering:
- Which custom series implementations to bundle (e.g., rounded candles, heikin-ashi, volume profile)
- How to define the per-type column mapping for custom data shapes
- TypeScript typing for each pre-registered custom series

**This plan does not include any implementation work for custom series.**

---

## 8. Test Coverage Plan

All new parameters follow the exact same pattern established by `TestPerDatapointColor` in `test_series.py`. Each test class should be appended to that file or added to a new `TestPerDatapointColorSingleValue` class.

### Tests for `line_series` `color_column`

Add to `TestPerDatapointColor` or create `TestLineSeries` extension:

```text
def test_line_color_column(self):
    """color_column should add 'color' key to column_mapping."""
    spec = line_series(self.table, color_column="LineColor")
    self.assertIn("color", spec.column_mapping)
    self.assertEqual(spec.column_mapping["color"], "LineColor")

def test_line_no_color_column_by_default(self):
    """Without color_column, 'color' should not appear in column_mapping."""
    spec = line_series(self.table)
    self.assertNotIn("color", spec.column_mapping)

def test_line_color_column_in_to_dict(self):
    """color_column should appear under dataMapping.columns in serialized dict."""
    spec = line_series(self.table, color_column="LineColor")
    result = spec.to_dict("s0", 0)
    self.assertEqual(result["dataMapping"]["columns"]["color"], "LineColor")

def test_line_color_option_and_color_column_are_independent(self):
    """Series-level color option and per-point color_column can coexist."""
    spec = line_series(self.table, color="#ff0000", color_column="LineColor")
    self.assertEqual(spec.options["color"], "#ff0000")
    self.assertEqual(spec.column_mapping["color"], "LineColor")
```

### Tests for `area_series` color columns

```text
class TestAreaSeriesColorColumns(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_color_column(self):
        spec = area_series(self.table, line_color_column="AreaLine")
        self.assertEqual(spec.column_mapping["lineColor"], "AreaLine")

    def test_top_color_column(self):
        spec = area_series(self.table, top_color_column="AreaTop")
        self.assertEqual(spec.column_mapping["topColor"], "AreaTop")

    def test_bottom_color_column(self):
        spec = area_series(self.table, bottom_color_column="AreaBottom")
        self.assertEqual(spec.column_mapping["bottomColor"], "AreaBottom")

    def test_no_color_columns_by_default(self):
        spec = area_series(self.table)
        self.assertNotIn("lineColor", spec.column_mapping)
        self.assertNotIn("topColor", spec.column_mapping)
        self.assertNotIn("bottomColor", spec.column_mapping)

    def test_all_three_together(self):
        spec = area_series(
            self.table,
            line_color_column="LC",
            top_color_column="TC",
            bottom_color_column="BC",
        )
        self.assertEqual(spec.column_mapping["lineColor"], "LC")
        self.assertEqual(spec.column_mapping["topColor"], "TC")
        self.assertEqual(spec.column_mapping["bottomColor"], "BC")

    def test_partial_columns_only_present_keys_added(self):
        """Only specified column params appear in the mapping."""
        spec = area_series(self.table, top_color_column="TC")
        self.assertIn("topColor", spec.column_mapping)
        self.assertNotIn("lineColor", spec.column_mapping)
        self.assertNotIn("bottomColor", spec.column_mapping)

    def test_style_option_and_column_are_independent(self):
        """Series-level top_color option and top_color_column can coexist."""
        spec = area_series(
            self.table,
            top_color="rgba(0,0,255,0.4)",
            top_color_column="TC",
        )
        self.assertEqual(spec.options["topColor"], "rgba(0,0,255,0.4)")
        self.assertEqual(spec.column_mapping["topColor"], "TC")

    def test_to_dict_includes_color_columns(self):
        spec = area_series(
            self.table,
            line_color_column="LC",
            top_color_column="TC",
        )
        result = spec.to_dict("s0", 5)
        cols = result["dataMapping"]["columns"]
        self.assertEqual(cols["lineColor"], "LC")
        self.assertEqual(cols["topColor"], "TC")
        self.assertNotIn("bottomColor", cols)
```

### Tests for `baseline_series` color columns

```text
class TestBaselineSeriesColorColumns(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_top_fill_color1_column(self):
        spec = baseline_series(self.table, top_fill_color1_column="TFC1")
        self.assertEqual(spec.column_mapping["topFillColor1"], "TFC1")

    def test_top_fill_color2_column(self):
        spec = baseline_series(self.table, top_fill_color2_column="TFC2")
        self.assertEqual(spec.column_mapping["topFillColor2"], "TFC2")

    def test_top_line_color_column(self):
        spec = baseline_series(self.table, top_line_color_column="TLC")
        self.assertEqual(spec.column_mapping["topLineColor"], "TLC")

    def test_bottom_fill_color1_column(self):
        spec = baseline_series(self.table, bottom_fill_color1_column="BFC1")
        self.assertEqual(spec.column_mapping["bottomFillColor1"], "BFC1")

    def test_bottom_fill_color2_column(self):
        spec = baseline_series(self.table, bottom_fill_color2_column="BFC2")
        self.assertEqual(spec.column_mapping["bottomFillColor2"], "BFC2")

    def test_bottom_line_color_column(self):
        spec = baseline_series(self.table, bottom_line_color_column="BLC")
        self.assertEqual(spec.column_mapping["bottomLineColor"], "BLC")

    def test_no_color_columns_by_default(self):
        spec = baseline_series(self.table)
        for field in [
            "topFillColor1", "topFillColor2", "topLineColor",
            "bottomFillColor1", "bottomFillColor2", "bottomLineColor",
        ]:
            self.assertNotIn(field, spec.column_mapping)

    def test_all_six_together(self):
        spec = baseline_series(
            self.table,
            top_fill_color1_column="A",
            top_fill_color2_column="B",
            top_line_color_column="C",
            bottom_fill_color1_column="D",
            bottom_fill_color2_column="E",
            bottom_line_color_column="F",
        )
        self.assertEqual(spec.column_mapping["topFillColor1"], "A")
        self.assertEqual(spec.column_mapping["topFillColor2"], "B")
        self.assertEqual(spec.column_mapping["topLineColor"], "C")
        self.assertEqual(spec.column_mapping["bottomFillColor1"], "D")
        self.assertEqual(spec.column_mapping["bottomFillColor2"], "E")
        self.assertEqual(spec.column_mapping["bottomLineColor"], "F")

    def test_partial_specification(self):
        """Only specified column params appear in the mapping."""
        spec = baseline_series(
            self.table,
            top_line_color_column="TLC",
            bottom_line_color_column="BLC",
        )
        self.assertIn("topLineColor", spec.column_mapping)
        self.assertIn("bottomLineColor", spec.column_mapping)
        self.assertNotIn("topFillColor1", spec.column_mapping)
        self.assertNotIn("bottomFillColor1", spec.column_mapping)

    def test_style_option_and_column_are_independent(self):
        """Fixed style option and per-point column can coexist."""
        spec = baseline_series(
            self.table,
            top_line_color="green",
            top_line_color_column="TLC",
        )
        self.assertEqual(spec.options["topLineColor"], "green")
        self.assertEqual(spec.column_mapping["topLineColor"], "TLC")

    def test_to_dict_includes_color_columns(self):
        spec = baseline_series(
            self.table,
            top_line_color_column="TLC",
            bottom_line_color_column="BLC",
        )
        result = spec.to_dict("bl_0", 2)
        cols = result["dataMapping"]["columns"]
        self.assertEqual(cols["topLineColor"], "TLC")
        self.assertEqual(cols["bottomLineColor"], "BLC")
        # base columns always present
        self.assertEqual(cols["time"], "Timestamp")
        self.assertEqual(cols["value"], "Value")

    def test_base_value_and_color_columns_coexist(self):
        """base_value option and color columns do not interfere."""
        spec = baseline_series(
            self.table,
            base_value=50.0,
            top_line_color_column="TLC",
        )
        self.assertEqual(spec.options["baseValue"]["price"], 50.0)
        self.assertEqual(spec.column_mapping["topLineColor"], "TLC")
```

---

## 9. Files to Modify

Only one Python source file requires changes. No JavaScript files need modification.

### `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/series.py`

Three functions need changes:

**`line_series()` (currently starts at line 304)**
- Add `color_column: Optional[str] = None` parameter after the price scale params and before `pane`.
- Split the inline `column_mapping={"time": time, "value": value}` into a two-step assignment.
- Add `if color_column is not None: column_mapping["color"] = color_column`.
- Pass `column_mapping=column_mapping` to `SeriesSpec(...)`.

**`area_series()` (currently starts at line 382)**
- Add `line_color_column: Optional[str] = None`, `top_color_column: Optional[str] = None`, `bottom_color_column: Optional[str] = None` after the price scale params and before `pane`.
- Split the inline `column_mapping={"time": time, "value": value}` into a two-step assignment.
- Add conditional assignments for each of the three new keys.
- Pass `column_mapping=column_mapping` to `SeriesSpec(...)`.

**`baseline_series()` (currently starts at line 464)**
- Add six `*_column` params after the price scale params and before `pane`.
- Split the inline `column_mapping={"time": time, "value": value}` into a two-step assignment.
- Add conditional assignments for each of the six new keys.
- Pass `column_mapping=column_mapping` to `SeriesSpec(...)`.

### `/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/test/deephaven/plot/tradingview_lightweight/test_series.py`

Append new test classes as described in §8. The existing test infrastructure (imports, `MagicMock`, module path setup) requires no changes.

### No JS files require changes

The JS data pipeline (`TradingViewUtils.ts`, `TradingViewChartModel.ts`, `TradingViewChartRenderer.ts`) already handles arbitrary string keys in `dataMapping.columns` generically. The `TvlSeriesConfig` TypeScript type uses `Record<string, string>` for columns. No TypeScript type changes are needed.

---

## 10. Implementation Checklist

Use this checklist to drive the implementation. Each item maps directly to the sections above.

### Python source changes (series.py)

- [ ] **Line series**: Add `color_column: Optional[str] = None` parameter to `line_series()` signature, after the `scale_ensure_edge_tick_marks_visible` param and before `pane`.
- [ ] **Line series**: Refactor `column_mapping` construction from inline dict to two-step assignment in `line_series()`.
- [ ] **Line series**: Add `if color_column is not None: column_mapping["color"] = color_column`.
- [ ] **Area series**: Add `line_color_column`, `top_color_column`, `bottom_color_column` parameters to `area_series()` signature.
- [ ] **Area series**: Refactor `column_mapping` construction from inline dict to two-step assignment in `area_series()`.
- [ ] **Area series**: Add three conditional `column_mapping` key assignments for `"lineColor"`, `"topColor"`, `"bottomColor"`.
- [ ] **Baseline series**: Add `top_fill_color1_column`, `top_fill_color2_column`, `top_line_color_column`, `bottom_fill_color1_column`, `bottom_fill_color2_column`, `bottom_line_color_column` parameters to `baseline_series()` signature.
- [ ] **Baseline series**: Refactor `column_mapping` construction from inline dict to two-step assignment in `baseline_series()`.
- [ ] **Baseline series**: Add six conditional `column_mapping` key assignments.

### Test changes (test_series.py)

- [ ] Add four tests for `line_series` `color_column` (see §8).
- [ ] Add `TestAreaSeriesColorColumns` class with eight tests (see §8).
- [ ] Add `TestBaselineSeriesColorColumns` class with twelve tests (see §8).

### Verification

- [ ] Run `$PY -m pytest test/ -v` — all existing tests pass, all new tests pass.
- [ ] Confirm `line_series(t, color_column="X").to_dict("s0", 0)["dataMapping"]["columns"]["color"] == "X"`.
- [ ] Confirm `area_series(t, top_color_column="X").to_dict("s0", 0)["dataMapping"]["columns"]["topColor"] == "X"`.
- [ ] Confirm `baseline_series(t, top_line_color_column="X").to_dict("s0", 0)["dataMapping"]["columns"]["topLineColor"] == "X"`.
- [ ] Confirm that default (no column params) calls produce `column_mapping` without any color keys beyond `time` and `value`.

### Not in scope

- [ ] `customValues` — assessed as infeasible; deferred (§6).
- [ ] Custom series (`addCustomSeries`) — deferred pending JS plugin extension architecture (§7).
- [ ] Changes to `chart.py` — no chart-level changes needed.
- [ ] Changes to any JS/TypeScript files — no changes needed.
- [ ] Changes to `_types.py` — no changes needed.
