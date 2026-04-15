# Implementation Plan: Per-Type Style Options (Section 13)

**Coverage report baseline:** Line 6/13, Area 7/17, Baseline 11/20, Candlestick 8/10, Histogram 1/2, Bar 4/4 (complete).

**Goal:** Bring all series types to full property coverage by adding every missing style option in `series.py`, `options.py`, and `test_series.py`.

---

## Table of Contents

1. [Overview and Change Map](#1-overview-and-change-map)
2. [New Enum: `LastPriceAnimationMode`](#2-new-enum-lastpriceanimationmode)
3. [Line Series — 7 Missing Properties](#3-line-series--7-missing-properties)
4. [Area Series — 10 Missing Properties](#4-area-series--10-missing-properties)
5. [Baseline Series — 9 Missing Properties](#5-baseline-series--9-missing-properties)
6. [Candlestick Series — 2 Missing Properties](#6-candlestick-series--2-missing-properties)
7. [Histogram Series — 1 Missing Property](#7-histogram-series--1-missing-property)
8. [File-by-File Edit Instructions](#8-file-by-file-edit-instructions)
9. [Test Coverage Specification](#9-test-coverage-specification)
10. [Validation Checklist](#10-validation-checklist)

---

## 1. Overview and Change Map

### Files to Modify

| File | Nature of Change |
|------|-----------------|
| `src/deephaven/plot/tradingview_lightweight/options.py` | Add `LastPriceAnimationMode` type alias and `LAST_PRICE_ANIMATION_MAP` dict |
| `src/deephaven/plot/tradingview_lightweight/series.py` | Add missing params to `line_series`, `area_series`, `baseline_series`, `candlestick_series`, `histogram_series`; add `_resolve_last_price_animation()` helper |
| `test/deephaven/plot/tradingview_lightweight/test_series.py` | Add new test methods/classes for every new parameter |

### No new files are needed. No JS changes are needed — the options dict is forwarded transparently to the TradingView Lightweight Charts JS API.

### Property-to-function mapping summary

| JS Property | Python Param | Series Functions |
|---|---|---|
| `lineVisible` | `line_visible` | `line_series`, `area_series`, `baseline_series` |
| `pointMarkersVisible` | `point_markers_visible` | `line_series`, `area_series`, `baseline_series` |
| `pointMarkersRadius` | `point_markers_radius` | `line_series`, `area_series`, `baseline_series` |
| `crosshairMarkerBorderColor` | `crosshair_marker_border_color` | `line_series`, `area_series`, `baseline_series` |
| `crosshairMarkerBackgroundColor` | `crosshair_marker_background_color` | `line_series`, `area_series`, `baseline_series` |
| `crosshairMarkerBorderWidth` | `crosshair_marker_border_width` | `line_series`, `area_series`, `baseline_series` |
| `lastPriceAnimation` | `last_price_animation` | `line_series`, `area_series`, `baseline_series` |
| `relativeGradient` | `relative_gradient` | `area_series`, `baseline_series` |
| `invertFilledArea` | `invert_filled_area` | `area_series` only |
| `lineType` | `line_type` | `baseline_series` (already in line/area) |
| `borderColor` | `border_color` | `candlestick_series` |
| `wickColor` | `wick_color` | `candlestick_series` |
| `base` | `base` | `histogram_series` |

---

## 2. New Enum: `LastPriceAnimationMode`

### Coordination Note

The enumerations implementation plan (if it exists as a separate task) should define `LastPriceAnimationMode`. If that plan has not been implemented yet, add the type and map directly to `options.py` as part of this task. The approach below is self-contained: it follows the exact same pattern as `LineStyle`, `LineType`, and `PriceScaleMode` already in `options.py`.

### What to Add in `options.py`

**New type alias** — add after the existing `PriceScaleMode` alias on line 17:

```text
LastPriceAnimationMode = Literal["disabled", "continuous", "on_data_update"]
```

**New constant map** — add after the existing `PRICE_SCALE_MODE_MAP` block:

```text
LAST_PRICE_ANIMATION_MAP = {
    "disabled": 0,
    "continuous": 1,
    "on_data_update": 2,
}
```

The three values correspond directly to the JS `LastPriceAnimationMode` enum:
- `Disabled` = 0
- `Continuous` = 1
- `OnDataUpdate` = 2

### New Helper in `series.py`

Add this function after `_resolve_line_type()` (around line 74), following the exact same pattern:

```text
def _resolve_last_price_animation(
    mode: Optional[LastPriceAnimationMode],
) -> Optional[int]:
    if mode is None:
        return None
    return LAST_PRICE_ANIMATION_MAP.get(mode, 0)
```

### Import Update in `series.py`

Extend the existing import from `.options` to include the new names:

```text
from .options import (
    LineStyle,
    LineType,
    LastPriceAnimationMode,          # NEW
    PriceFormat,
    PriceScaleMode,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
    LAST_PRICE_ANIMATION_MAP,        # NEW
    PRICE_SCALE_MODE_MAP,
)
```

---

## 3. Line Series — 7 Missing Properties

### Current signature (lines 304–337 in `series.py`)

The function currently has these type-specific params:
`color`, `line_width`, `line_style`, `line_type`, `crosshair_marker_visible`, `crosshair_marker_radius`

### Properties to Add

#### 3.1 `lineVisible` → `line_visible: Optional[bool] = None`

- **JS property:** `lineVisible` (boolean, default `true`)
- **Description:** When `False`, the connecting line between data points is hidden. Point markers and crosshair marker are still drawn.
- **Position in signature:** After `line_type`, before `crosshair_marker_visible` — group all "line appearance" params together.
- **Serialization:** Direct boolean pass-through. Key: `"lineVisible"`.

```text
# In options dict:
"lineVisible": line_visible,
```

#### 3.2 `pointMarkersVisible` → `point_markers_visible: Optional[bool] = None`

- **JS property:** `pointMarkersVisible` (boolean, default `false`)
- **Description:** When `True`, a small circle is drawn at each data point on the series.
- **Position in signature:** After `line_visible`.
- **Serialization:** Direct boolean pass-through. Key: `"pointMarkersVisible"`.

```text
"pointMarkersVisible": point_markers_visible,
```

#### 3.3 `pointMarkersRadius` → `point_markers_radius: Optional[float] = None`

- **JS property:** `pointMarkersRadius` (optional number, no default — TVL uses a calculated default when unset)
- **Description:** Radius in pixels for the point marker circles. Only meaningful when `point_markers_visible=True`. Must be a positive number.
- **Position in signature:** After `point_markers_visible`.
- **Serialization:** Direct numeric pass-through. Key: `"pointMarkersRadius"`.

```text
"pointMarkersRadius": point_markers_radius,
```

#### 3.4 `crosshairMarkerBorderColor` → `crosshair_marker_border_color: Optional[str] = None`

- **JS property:** `crosshairMarkerBorderColor` (string, default `''` — empty string means "use series color")
- **Description:** Border color of the crosshair marker dot. An empty string falls back to the series color at that point.
- **Position in signature:** After `crosshair_marker_radius`, before `crosshair_marker_background_color` — group all crosshair marker params.
- **Serialization:** Direct string pass-through. Key: `"crosshairMarkerBorderColor"`.

```text
"crosshairMarkerBorderColor": crosshair_marker_border_color,
```

#### 3.5 `crosshairMarkerBackgroundColor` → `crosshair_marker_background_color: Optional[str] = None`

- **JS property:** `crosshairMarkerBackgroundColor` (string, default `''` — empty string means "use series color")
- **Description:** Fill color of the crosshair marker dot. An empty string falls back to the series color.
- **Position in signature:** After `crosshair_marker_border_color`.
- **Serialization:** Direct string pass-through. Key: `"crosshairMarkerBackgroundColor"`.

```text
"crosshairMarkerBackgroundColor": crosshair_marker_background_color,
```

#### 3.6 `crosshairMarkerBorderWidth` → `crosshair_marker_border_width: Optional[float] = None`

- **JS property:** `crosshairMarkerBorderWidth` (number, default `2`)
- **Description:** Width in pixels of the crosshair marker dot border ring.
- **Position in signature:** After `crosshair_marker_background_color`.
- **Serialization:** Direct numeric pass-through. Key: `"crosshairMarkerBorderWidth"`.

```text
"crosshairMarkerBorderWidth": crosshair_marker_border_width,
```

#### 3.7 `lastPriceAnimation` → `last_price_animation: Optional[LastPriceAnimationMode] = None`

- **JS property:** `lastPriceAnimation` (LastPriceAnimationMode enum, default `Disabled` = 0)
- **Description:** Controls animation of the last price dot on the right axis. Use `"disabled"` (default), `"continuous"` (always animated), or `"on_data_update"` (animated only after receiving new data).
- **Position in signature:** After `crosshair_marker_border_width`.
- **Serialization:** Resolved through `_resolve_last_price_animation()` to an integer (0/1/2). Key: `"lastPriceAnimation"`.

```text
"lastPriceAnimation": _resolve_last_price_animation(last_price_animation),
```

### Updated `line_series` Signature (full, showing new params in context)

```text
def line_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,                              # NEW
    point_markers_visible: Optional[bool] = None,                     # NEW
    point_markers_radius: Optional[float] = None,                     # NEW
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    crosshair_marker_border_color: Optional[str] = None,              # NEW
    crosshair_marker_background_color: Optional[str] = None,          # NEW
    crosshair_marker_border_width: Optional[float] = None,            # NEW
    last_price_animation: Optional[LastPriceAnimationMode] = None,    # NEW
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    auto_scale: Optional[bool] = None,
    # ... all scale_* params unchanged ...
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
```

### Updated options dict for `line_series`

```text
options = _filter_none(
    {
        "color": color,
        "lineWidth": line_width,
        "lineStyle": _resolve_line_style(line_style),
        "lineType": _resolve_line_type(line_type),
        "lineVisible": line_visible,                                   # NEW
        "pointMarkersVisible": point_markers_visible,                  # NEW
        "pointMarkersRadius": point_markers_radius,                    # NEW
        "crosshairMarkerVisible": crosshair_marker_visible,
        "crosshairMarkerRadius": crosshair_marker_radius,
        "crosshairMarkerBorderColor": crosshair_marker_border_color,   # NEW
        "crosshairMarkerBackgroundColor": crosshair_marker_background_color,  # NEW
        "crosshairMarkerBorderWidth": crosshair_marker_border_width,   # NEW
        "lastPriceAnimation": _resolve_last_price_animation(last_price_animation),  # NEW
        "lastValueVisible": last_value_visible,
        "title": title,
        "visible": visible,
        "priceScaleId": price_scale_id,
        "priceFormat": price_format,
    }
)
```

---

## 4. Area Series — 10 Missing Properties

Area inherits all Line properties plus adds area-specific ones. Therefore, all 7 line properties from Section 3 apply to `area_series` as well, plus 2 additional area-specific properties.

### Area-Specific Properties to Add

#### 4.1 `relativeGradient` → `relative_gradient: Optional[bool] = None`

- **JS property:** `relativeGradient` (boolean, default `false`)
- **Description:** When `True`, the fill gradient is computed relative to the `baseValue` of the series rather than the chart viewport edges. This creates a gradient that tracks the data's relationship to its base level.
- **Position in signature:** After `bottom_color`, before `line_width` — group with other fill appearance params.
- **Serialization:** Direct boolean pass-through. Key: `"relativeGradient"`.

```text
"relativeGradient": relative_gradient,
```

#### 4.2 `invertFilledArea` → `invert_filled_area: Optional[bool] = None`

- **JS property:** `invertFilledArea` (boolean, default `false`)
- **Description:** When `True`, the fill is rendered above the line instead of below it.
- **Position in signature:** After `relative_gradient`.
- **Serialization:** Direct boolean pass-through. Key: `"invertFilledArea"`.

```text
"invertFilledArea": invert_filled_area,
```

### Updated `area_series` Signature (full, showing new params in context)

```text
def area_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    line_color: Optional[str] = None,
    top_color: Optional[str] = None,
    bottom_color: Optional[str] = None,
    relative_gradient: Optional[bool] = None,                         # NEW
    invert_filled_area: Optional[bool] = None,                        # NEW
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,                              # NEW
    point_markers_visible: Optional[bool] = None,                     # NEW
    point_markers_radius: Optional[float] = None,                     # NEW
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    crosshair_marker_border_color: Optional[str] = None,              # NEW
    crosshair_marker_background_color: Optional[str] = None,          # NEW
    crosshair_marker_border_width: Optional[float] = None,            # NEW
    last_price_animation: Optional[LastPriceAnimationMode] = None,    # NEW
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    auto_scale: Optional[bool] = None,
    # ... all scale_* params unchanged ...
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
```

### Updated options dict for `area_series`

```text
options = _filter_none(
    {
        "lineColor": line_color,
        "topColor": top_color,
        "bottomColor": bottom_color,
        "relativeGradient": relative_gradient,                         # NEW
        "invertFilledArea": invert_filled_area,                        # NEW
        "lineWidth": line_width,
        "lineStyle": _resolve_line_style(line_style),
        "lineType": _resolve_line_type(line_type),
        "lineVisible": line_visible,                                   # NEW
        "pointMarkersVisible": point_markers_visible,                  # NEW
        "pointMarkersRadius": point_markers_radius,                    # NEW
        "crosshairMarkerVisible": crosshair_marker_visible,
        "crosshairMarkerRadius": crosshair_marker_radius,
        "crosshairMarkerBorderColor": crosshair_marker_border_color,   # NEW
        "crosshairMarkerBackgroundColor": crosshair_marker_background_color,  # NEW
        "crosshairMarkerBorderWidth": crosshair_marker_border_width,   # NEW
        "lastPriceAnimation": _resolve_last_price_animation(last_price_animation),  # NEW
        "lastValueVisible": last_value_visible,
        "title": title,
        "visible": visible,
        "priceScaleId": price_scale_id,
        "priceFormat": price_format,
    }
)
```

---

## 5. Baseline Series — 9 Missing Properties

Baseline has its own independent style interface (it does not inherit from Line at the Python level, even though the TVL JS API docs say it does). The baseline function is missing `lineType` (present in Line/Area but accidentally omitted from the original Baseline implementation) plus all 7 crosshair/animation properties that Line is also missing, plus `relativeGradient`.

### Properties to Add

#### 5.1 `lineType` → `line_type: Optional[LineType] = None`

- **JS property:** `lineType` (LineType enum, default `Simple` = 0)
- **Description:** The line rendering algorithm — `"simple"` (straight segments), `"with_steps"` (staircase), `"curved"` (spline). This was present in `line_series` and `area_series` from the start but was accidentally omitted from `baseline_series`.
- **Position in signature:** After `line_style` (keeping `lineStyle` / `lineType` adjacent, as they are in the other series).
- **Serialization:** Resolved through `_resolve_line_type()` to an integer (0/1/2). Key: `"lineType"`.

```text
"lineType": _resolve_line_type(line_type),
```

#### 5.2 `lineVisible` → `line_visible: Optional[bool] = None`

Same semantics as Section 3.1. Position: after `line_type`.

#### 5.3 `relativeGradient` → `relative_gradient: Optional[bool] = None`

Same semantics as Section 4.1. Position: after `line_visible` — the baseline has both top and bottom fill areas, and this controls the gradient behavior for both.

#### 5.4 `pointMarkersVisible` → `point_markers_visible: Optional[bool] = None`

Same semantics as Section 3.2. Position: after `relative_gradient`.

#### 5.5 `pointMarkersRadius` → `point_markers_radius: Optional[float] = None`

Same semantics as Section 3.3. Position: after `point_markers_visible`.

#### 5.6 `crosshairMarkerBorderColor` → `crosshair_marker_border_color: Optional[str] = None`

Same semantics as Section 3.4. Position: after `crosshair_marker_radius`.

#### 5.7 `crosshairMarkerBackgroundColor` → `crosshair_marker_background_color: Optional[str] = None`

Same semantics as Section 3.5. Position: after `crosshair_marker_border_color`.

#### 5.8 `crosshairMarkerBorderWidth` → `crosshair_marker_border_width: Optional[float] = None`

Same semantics as Section 3.6. Position: after `crosshair_marker_background_color`.

#### 5.9 `lastPriceAnimation` → `last_price_animation: Optional[LastPriceAnimationMode] = None`

Same semantics as Section 3.7. Position: after `crosshair_marker_border_width`.

### Updated `baseline_series` Signature (full, showing new params in context)

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
    line_type: Optional[LineType] = None,                             # NEW
    line_visible: Optional[bool] = None,                              # NEW
    relative_gradient: Optional[bool] = None,                         # NEW
    point_markers_visible: Optional[bool] = None,                     # NEW
    point_markers_radius: Optional[float] = None,                     # NEW
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    crosshair_marker_border_color: Optional[str] = None,              # NEW
    crosshair_marker_background_color: Optional[str] = None,          # NEW
    crosshair_marker_border_width: Optional[float] = None,            # NEW
    last_price_animation: Optional[LastPriceAnimationMode] = None,    # NEW
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    auto_scale: Optional[bool] = None,
    # ... all scale_* params unchanged ...
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
```

### Updated options dict for `baseline_series`

```text
options = _filter_none(
    {
        "baseValue": {"type": "price", "price": base_value},
        "topLineColor": top_line_color,
        "topFillColor1": top_fill_color1,
        "topFillColor2": top_fill_color2,
        "bottomLineColor": bottom_line_color,
        "bottomFillColor1": bottom_fill_color1,
        "bottomFillColor2": bottom_fill_color2,
        "lineWidth": line_width,
        "lineStyle": _resolve_line_style(line_style),
        "lineType": _resolve_line_type(line_type),                     # NEW
        "lineVisible": line_visible,                                   # NEW
        "relativeGradient": relative_gradient,                         # NEW
        "pointMarkersVisible": point_markers_visible,                  # NEW
        "pointMarkersRadius": point_markers_radius,                    # NEW
        "crosshairMarkerVisible": crosshair_marker_visible,
        "crosshairMarkerRadius": crosshair_marker_radius,
        "crosshairMarkerBorderColor": crosshair_marker_border_color,   # NEW
        "crosshairMarkerBackgroundColor": crosshair_marker_background_color,  # NEW
        "crosshairMarkerBorderWidth": crosshair_marker_border_width,   # NEW
        "lastPriceAnimation": _resolve_last_price_animation(last_price_animation),  # NEW
        "lastValueVisible": last_value_visible,
        "title": title,
        "visible": visible,
        "priceScaleId": price_scale_id,
        "priceFormat": price_format,
    }
)
```

---

## 6. Candlestick Series — 2 Missing Properties

The candlestick series already implements the directional color variants (`borderUpColor`, `borderDownColor`, `wickUpColor`, `wickDownColor`) but is missing the "convenience default" colors that apply to both up and down candles when no directional override is set.

### Properties to Add

#### 6.1 `borderColor` → `border_color: Optional[str] = None`

- **JS property:** `borderColor` (string, default `'#378658'`)
- **Description:** Default border color for ALL candles (both up and down). This acts as a fallback when neither `borderUpColor` nor `borderDownColor` are set for a given direction. In practice, `borderUpColor` and `borderDownColor` take precedence over `borderColor` when all three are specified, but `borderColor` is useful when you want a uniform border regardless of candle direction.
- **Position in signature:** Add after `border_visible` and before `border_up_color`, placing it logically with the other border params.
- **Serialization:** Direct string pass-through. Key: `"borderColor"`.

```text
"borderColor": border_color,
```

#### 6.2 `wickColor` → `wick_color: Optional[str] = None`

- **JS property:** `wickColor` (string, default `'#737375'`)
- **Description:** Default wick color for ALL candles. Acts as a fallback when neither `wickUpColor` nor `wickDownColor` are set. Useful for a uniform wick appearance regardless of candle direction.
- **Position in signature:** After `wick_visible`, before `wick_up_color`, placing it logically with the other wick params.
- **Serialization:** Direct string pass-through. Key: `"wickColor"`.

```text
"wickColor": wick_color,
```

### Updated `candlestick_series` Signature (showing new params in context only)

The full parameter group for colors in `candlestick_series` should be reordered for logical grouping:

```text
def candlestick_series(
    table: Any,
    time: str = "Timestamp",
    open: str = "Open",
    high: str = "High",
    low: str = "Low",
    close: str = "Close",
    up_color: Optional[str] = None,
    down_color: Optional[str] = None,
    border_visible: Optional[bool] = None,
    border_color: Optional[str] = None,           # NEW — add here
    border_up_color: Optional[str] = None,
    border_down_color: Optional[str] = None,
    wick_visible: Optional[bool] = None,
    wick_color: Optional[str] = None,             # NEW — add here
    wick_up_color: Optional[str] = None,
    wick_down_color: Optional[str] = None,
    # ... rest unchanged ...
) -> SeriesSpec:
```

### Updated options dict for `candlestick_series`

```text
options = _filter_none(
    {
        "upColor": up_color,
        "downColor": down_color,
        "borderVisible": border_visible,
        "borderColor": border_color,              # NEW
        "borderUpColor": border_up_color,
        "borderDownColor": border_down_color,
        "wickVisible": wick_visible,
        "wickColor": wick_color,                  # NEW
        "wickUpColor": wick_up_color,
        "wickDownColor": wick_down_color,
        "title": title,
        "visible": visible,
        "lastValueVisible": last_value_visible,
        "priceScaleId": price_scale_id,
        "priceFormat": price_format,
    }
)
```

---

## 7. Histogram Series — 1 Missing Property

### Property to Add

#### 7.1 `base` → `base: Optional[float] = None`

- **JS property:** `base` (number, default `0`)
- **Description:** The baseline level from which histogram columns are drawn. Columns with a `value` above `base` extend upward; columns below `base` extend downward. This is distinct from `base_value` used in the Baseline series — for Histogram it is simply a numeric threshold. Default is 0 (columns grow from zero). Common use case: center a volume oscillator around a non-zero mean.
- **Position in signature:** After `color`, before `color_column`. Keeping style params before column mapping params.
- **Type note:** The JS API accepts any number. Use `Optional[float]` to be inclusive (int literals like `0` are valid floats in Python).
- **Serialization:** Direct numeric pass-through. Key: `"base"`.

```text
"base": base,
```

### Updated `histogram_series` Signature (showing new param in context)

```text
def histogram_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    base: Optional[float] = None,                 # NEW
    color_column: Optional[str] = None,
    # ... rest unchanged ...
) -> SeriesSpec:
```

### Updated options dict for `histogram_series`

```text
options = _filter_none(
    {
        "color": color,
        "base": base,                             # NEW
        "lastValueVisible": last_value_visible,
        "title": title,
        "visible": visible,
        "priceScaleId": price_scale_id,
        "priceFormat": price_format,
    }
)
```

---

## 8. File-by-File Edit Instructions

### 8.1 `options.py` — Exact Edit

**Location:** After line 17 (`PriceScaleMode = Literal[...]`)

Insert:
```text
LastPriceAnimationMode = Literal["disabled", "continuous", "on_data_update"]
```

**Location:** After the `PRICE_SCALE_MODE_MAP` block (after line 56)

Insert:
```text
LAST_PRICE_ANIMATION_MAP = {
    "disabled": 0,
    "continuous": 1,
    "on_data_update": 2,
}
```

### 8.2 `series.py` — Exact Edits

**Step 1: Update import block** (lines 8–16)

Replace:
```text
from .options import (
    LineStyle,
    LineType,
    PriceFormat,
    PriceScaleMode,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
    PRICE_SCALE_MODE_MAP,
)
```

With:
```text
from .options import (
    LastPriceAnimationMode,
    LineStyle,
    LineType,
    PriceFormat,
    PriceScaleMode,
    LAST_PRICE_ANIMATION_MAP,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
    PRICE_SCALE_MODE_MAP,
)
```

**Step 2: Add `_resolve_last_price_animation` helper** after `_resolve_line_type` (after line 74)

Insert:
```text
def _resolve_last_price_animation(
    mode: Optional[LastPriceAnimationMode],
) -> Optional[int]:
    if mode is None:
        return None
    return LAST_PRICE_ANIMATION_MAP.get(mode, 0)
```

**Step 3: Update `line_series`** — add 7 new parameters and 7 new options dict entries as specified in Section 3. The new parameters go between the existing params as described. Use the exact parameter ordering and key names from Section 3.

**Step 4: Update `area_series`** — add 9 new parameters (7 shared with line + 2 area-specific) and their options dict entries as specified in Section 4.

**Step 5: Update `baseline_series`** — add 9 new parameters and their options dict entries as specified in Section 5. Note that `line_type` goes between `line_style` and `line_visible` (making it adjacent to `line_style` in the signature).

**Step 6: Update `candlestick_series`** — add `border_color` and `wick_color` as specified in Section 6. Also update the existing parameter ordering in the signature to match the logical grouping described there (wick_visible, wick_color, wick_up_color, wick_down_color instead of the current layout that puts wick_up/down before wick_visible).

**Step 7: Update `histogram_series`** — add `base` parameter as specified in Section 7.

---

## 9. Test Coverage Specification

All new tests go into `test/deephaven/plot/tradingview_lightweight/test_series.py`. Add new test methods within the existing test classes where the series type already has a class, and add new standalone test classes for cross-cutting properties.

### 9.1 `TestLastPriceAnimation` — new class

```text
class TestLastPriceAnimation(unittest.TestCase):
    """lastPriceAnimation should serialize correctly on line/area/baseline series."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_disabled(self):
        spec = line_series(self.table, last_price_animation="disabled")
        self.assertEqual(spec.options["lastPriceAnimation"], 0)

    def test_line_continuous(self):
        spec = line_series(self.table, last_price_animation="continuous")
        self.assertEqual(spec.options["lastPriceAnimation"], 1)

    def test_line_on_data_update(self):
        spec = line_series(self.table, last_price_animation="on_data_update")
        self.assertEqual(spec.options["lastPriceAnimation"], 2)

    def test_line_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("lastPriceAnimation", spec.options)

    def test_area_last_price_animation(self):
        spec = area_series(self.table, last_price_animation="continuous")
        self.assertEqual(spec.options["lastPriceAnimation"], 1)

    def test_baseline_last_price_animation(self):
        spec = baseline_series(self.table, last_price_animation="on_data_update")
        self.assertEqual(spec.options["lastPriceAnimation"], 2)
```

### 9.2 `TestLineVisible` — new class

```text
class TestLineVisible(unittest.TestCase):
    """lineVisible should work on line, area, and baseline series."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_series_visible_false(self):
        spec = line_series(self.table, line_visible=False)
        self.assertFalse(spec.options["lineVisible"])

    def test_line_series_visible_true(self):
        spec = line_series(self.table, line_visible=True)
        self.assertTrue(spec.options["lineVisible"])

    def test_line_series_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("lineVisible", spec.options)

    def test_area_series(self):
        spec = area_series(self.table, line_visible=False)
        self.assertFalse(spec.options["lineVisible"])

    def test_baseline_series(self):
        spec = baseline_series(self.table, line_visible=False)
        self.assertFalse(spec.options["lineVisible"])
```

### 9.3 `TestPointMarkers` — new class

```text
class TestPointMarkers(unittest.TestCase):
    """pointMarkersVisible and pointMarkersRadius on line/area/baseline."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_point_markers_visible(self):
        spec = line_series(self.table, point_markers_visible=True)
        self.assertTrue(spec.options["pointMarkersVisible"])

    def test_line_point_markers_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("pointMarkersVisible", spec.options)
        self.assertNotIn("pointMarkersRadius", spec.options)

    def test_line_point_markers_radius(self):
        spec = line_series(self.table, point_markers_radius=3.5)
        self.assertEqual(spec.options["pointMarkersRadius"], 3.5)

    def test_area_point_markers(self):
        spec = area_series(self.table, point_markers_visible=True, point_markers_radius=4.0)
        self.assertTrue(spec.options["pointMarkersVisible"])
        self.assertEqual(spec.options["pointMarkersRadius"], 4.0)

    def test_baseline_point_markers(self):
        spec = baseline_series(self.table, point_markers_visible=True, point_markers_radius=2.0)
        self.assertTrue(spec.options["pointMarkersVisible"])
        self.assertEqual(spec.options["pointMarkersRadius"], 2.0)
```

### 9.4 `TestCrosshairMarkerExtended` — new class

```text
class TestCrosshairMarkerExtended(unittest.TestCase):
    """crosshairMarkerBorderColor/BackgroundColor/BorderWidth on line/area/baseline."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_border_color(self):
        spec = line_series(self.table, crosshair_marker_border_color="#ff0000")
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "#ff0000")

    def test_line_background_color(self):
        spec = line_series(self.table, crosshair_marker_background_color="#00ff00")
        self.assertEqual(spec.options["crosshairMarkerBackgroundColor"], "#00ff00")

    def test_line_border_width(self):
        spec = line_series(self.table, crosshair_marker_border_width=3.0)
        self.assertEqual(spec.options["crosshairMarkerBorderWidth"], 3.0)

    def test_line_empty_string_border_color(self):
        """Empty string is a valid value (means 'use series color') and must not be filtered."""
        spec = line_series(self.table, crosshair_marker_border_color="")
        # _filter_none removes None but not ""; however "" is falsy — check behavior
        # NOTE: _filter_none filters None via `if v is not None`, so "" passes through.
        self.assertIn("crosshairMarkerBorderColor", spec.options)
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "")

    def test_line_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("crosshairMarkerBorderColor", spec.options)
        self.assertNotIn("crosshairMarkerBackgroundColor", spec.options)
        self.assertNotIn("crosshairMarkerBorderWidth", spec.options)

    def test_area_all_three(self):
        spec = area_series(
            self.table,
            crosshair_marker_border_color="#111",
            crosshair_marker_background_color="#222",
            crosshair_marker_border_width=1.5,
        )
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "#111")
        self.assertEqual(spec.options["crosshairMarkerBackgroundColor"], "#222")
        self.assertEqual(spec.options["crosshairMarkerBorderWidth"], 1.5)

    def test_baseline_all_three(self):
        spec = baseline_series(
            self.table,
            crosshair_marker_border_color="#aaa",
            crosshair_marker_background_color="#bbb",
            crosshair_marker_border_width=4.0,
        )
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "#aaa")
        self.assertEqual(spec.options["crosshairMarkerBackgroundColor"], "#bbb")
        self.assertEqual(spec.options["crosshairMarkerBorderWidth"], 4.0)
```

### 9.5 `TestAreaSpecificOptions` — add methods to existing `TestAreaSeries`

Add these methods inside the existing `TestAreaSeries` class:

```text
def test_relative_gradient(self):
    spec = area_series(self.table, relative_gradient=True)
    self.assertTrue(spec.options["relativeGradient"])

def test_relative_gradient_false(self):
    spec = area_series(self.table, relative_gradient=False)
    self.assertFalse(spec.options["relativeGradient"])

def test_invert_filled_area(self):
    spec = area_series(self.table, invert_filled_area=True)
    self.assertTrue(spec.options["invertFilledArea"])

def test_relative_gradient_not_present_when_none(self):
    spec = area_series(self.table)
    self.assertNotIn("relativeGradient", spec.options)
    self.assertNotIn("invertFilledArea", spec.options)
```

### 9.6 `TestBaselineLineType` — add methods to existing `TestBaselineSeries`

Add these methods inside the existing `TestBaselineSeries` class:

```text
def test_line_type_simple(self):
    spec = baseline_series(self.table, line_type="simple")
    self.assertEqual(spec.options["lineType"], 0)

def test_line_type_with_steps(self):
    spec = baseline_series(self.table, line_type="with_steps")
    self.assertEqual(spec.options["lineType"], 1)

def test_line_type_curved(self):
    spec = baseline_series(self.table, line_type="curved")
    self.assertEqual(spec.options["lineType"], 2)

def test_line_type_not_present_when_none(self):
    spec = baseline_series(self.table)
    self.assertNotIn("lineType", spec.options)

def test_relative_gradient(self):
    spec = baseline_series(self.table, relative_gradient=True)
    self.assertTrue(spec.options["relativeGradient"])

def test_relative_gradient_not_present_when_none(self):
    spec = baseline_series(self.table)
    self.assertNotIn("relativeGradient", spec.options)
```

### 9.7 `TestCandlestickGenericColors` — add methods to existing `TestCandlestickSeries`

Add these methods inside the existing `TestCandlestickSeries` class:

```text
def test_border_color(self):
    spec = candlestick_series(self.table, border_color="#378658")
    self.assertEqual(spec.options["borderColor"], "#378658")

def test_wick_color(self):
    spec = candlestick_series(self.table, wick_color="#737375")
    self.assertEqual(spec.options["wickColor"], "#737375")

def test_border_color_not_present_when_none(self):
    spec = candlestick_series(self.table)
    self.assertNotIn("borderColor", spec.options)

def test_wick_color_not_present_when_none(self):
    spec = candlestick_series(self.table)
    self.assertNotIn("wickColor", spec.options)

def test_generic_and_directional_colors_together(self):
    """Generic and directional colors can coexist — JS resolves precedence."""
    spec = candlestick_series(
        self.table,
        border_color="#111",
        border_up_color="#00ff00",
        border_down_color="#ff0000",
        wick_color="#555",
        wick_up_color="#008800",
        wick_down_color="#880000",
    )
    self.assertEqual(spec.options["borderColor"], "#111")
    self.assertEqual(spec.options["borderUpColor"], "#00ff00")
    self.assertEqual(spec.options["borderDownColor"], "#ff0000")
    self.assertEqual(spec.options["wickColor"], "#555")
    self.assertEqual(spec.options["wickUpColor"], "#008800")
    self.assertEqual(spec.options["wickDownColor"], "#880000")
```

### 9.8 `TestHistogramBase` — add methods to existing `TestHistogramSeries`

Add these methods inside the existing `TestHistogramSeries` class:

```text
def test_base_zero(self):
    spec = histogram_series(self.table, base=0.0)
    self.assertEqual(spec.options["base"], 0.0)

def test_base_positive(self):
    spec = histogram_series(self.table, base=100.0)
    self.assertEqual(spec.options["base"], 100.0)

def test_base_negative(self):
    spec = histogram_series(self.table, base=-50.5)
    self.assertEqual(spec.options["base"], -50.5)

def test_base_not_present_when_none(self):
    spec = histogram_series(self.table)
    self.assertNotIn("base", spec.options)
```

### 9.9 Important note on empty-string filtering

The `_filter_none` helper uses `if v is not None` — it keeps empty strings and the integer `0`. This is correct behavior because:
- Empty strings for crosshair colors are semantically valid (they signal "use series color" to the JS library).
- A `base` of `0.0` for histograms should be passed through.
- A `base_value` of `0` for baseline is already correctly handled.

If any future property must strip empty strings, a dedicated helper should be used. Do not change `_filter_none`.

---

## 10. Validation Checklist

After implementation, the following checks confirm correctness.

### Unit test pass

```bash
PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
$PY -m pytest test/ -v -k "TestLastPriceAnimation or TestLineVisible or TestPointMarkers or TestCrosshairMarkerExtended or TestCandlestick or TestBaseline or TestArea or TestHistogram"
```

All tests should pass with no failures or errors.

### Full test suite regression

```bash
$PY -m pytest test/ -v
```

No previously-passing tests should be broken.

### TypeScript type check

```bash
cd /home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/src/js
npx tsc --noEmit
```

No TS errors expected — the JS side already accepts any valid options dict; no JS changes are made.

### Coverage verification

After implementation, re-verify the following counts match:

| Series | Before | After |
|--------|--------|-------|
| Line | 6/13 | 13/13 |
| Area | 7/17 | 17/17 |
| Baseline | 11/20 | 20/20 |
| Candlestick | 8/10 | 10/10 |
| Histogram | 1/2 | 2/2 |
| Bar | 4/4 | 4/4 (no change) |

### Manual smoke test (optional, requires running server)

```text
# In DH console — verify options round-trip correctly
from deephaven.plot import tradingview_lightweight as tvl
from unittest.mock import MagicMock
t = MagicMock()

s = tvl.line(t, last_price_animation="continuous", line_visible=False,
             point_markers_visible=True, point_markers_radius=3.0,
             crosshair_marker_border_color="#ff0000",
             crosshair_marker_background_color="#0000ff",
             crosshair_marker_border_width=2.5)
assert s.options["lastPriceAnimation"] == 1
assert s.options["lineVisible"] == False
assert s.options["pointMarkersVisible"] == True
assert s.options["pointMarkersRadius"] == 3.0
assert s.options["crosshairMarkerBorderColor"] == "#ff0000"
assert s.options["crosshairMarkerBackgroundColor"] == "#0000ff"
assert s.options["crosshairMarkerBorderWidth"] == 2.5
print("All assertions passed")
```

---

## Appendix: Property Reference Table

Complete cross-reference of all changes:

| Python Param | JS Key | Type | Default (JS) | Line | Area | Baseline | Candlestick | Histogram |
|---|---|---|---|:---:|:---:|:---:|:---:|:---:|
| `line_visible` | `lineVisible` | `bool` | `true` | NEW | NEW | NEW | — | — |
| `point_markers_visible` | `pointMarkersVisible` | `bool` | `false` | NEW | NEW | NEW | — | — |
| `point_markers_radius` | `pointMarkersRadius` | `float?` | auto | NEW | NEW | NEW | — | — |
| `crosshair_marker_border_color` | `crosshairMarkerBorderColor` | `str` | `''` | NEW | NEW | NEW | — | — |
| `crosshair_marker_background_color` | `crosshairMarkerBackgroundColor` | `str` | `''` | NEW | NEW | NEW | — | — |
| `crosshair_marker_border_width` | `crosshairMarkerBorderWidth` | `float` | `2` | NEW | NEW | NEW | — | — |
| `last_price_animation` | `lastPriceAnimation` | `LastPriceAnimationMode` | `0` (disabled) | NEW | NEW | NEW | — | — |
| `relative_gradient` | `relativeGradient` | `bool` | `false` | — | NEW | NEW | — | — |
| `invert_filled_area` | `invertFilledArea` | `bool` | `false` | — | NEW | — | — | — |
| `line_type` | `lineType` | `LineType` | `0` (simple) | exists | exists | NEW | — | — |
| `border_color` | `borderColor` | `str` | `'#378658'` | — | — | — | NEW | — |
| `wick_color` | `wickColor` | `str` | `'#737375'` | — | — | — | NEW | — |
| `base` | `base` | `float` | `0` | — | — | — | — | NEW |

Total new parameters: **13** across **5** series functions.
Total new test methods: approximately **35** across **9** test classes.
