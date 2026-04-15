# TradingView Lightweight Charts v5.1 — Python API Coverage Report

**Generated:** 2026-04-11
**Scope:** Every feature documented in `notes/api-reference/` compared against `src/deephaven/plot/tradingview_lightweight/`

**Legend:** ✅ = implemented | ⚠️ = partial | ❌ = not implemented | N/A = not applicable to server-side Python

> **Architecture note:** The Python layer is a *static configuration builder*. It serializes options to JSON at chart-creation time and streams table data to the JS frontend. There is no live Python handle on the running chart, so all JS runtime methods (event subscriptions, coordinate queries, DOM access, screenshots) are architecturally unavailable from Python. These are marked N/A where appropriate.

---

## Table of Contents

1. [Chart Creation Functions](#1-chart-creation-functions)
2. [ChartOptionsBase — Top-Level Properties](#2-chartoptionsbase--top-level-properties)
3. [LayoutOptions](#3-layoutoptions)
4. [GridOptions](#4-gridoptions)
5. [CrosshairOptions](#5-crosshairoptions)
6. [Watermark Options](#6-watermark-options)
7. [HandleScroll / HandleScale / KineticScroll](#7-handlescroll--handlescale--kineticscroll)
8. [LocalizationOptionsBase](#8-localizationoptionsbase)
9. [IChartApi Methods (26)](#9-ichartapi-methods-26)
10. [Series Types — Creation Functions](#10-series-types--creation-functions)
11. [Data Interfaces](#11-data-interfaces)
12. [SeriesOptionsCommon](#12-seriesoptionscommon)
13. [Per-Type Style Options](#13-per-type-style-options)
14. [ISeriesApi Properties & Methods](#14-iseriesapi-properties--methods)
15. [TimeScaleOptions (27 properties)](#15-timescaleoptions-27-properties)
16. [ITimeScaleApi (22 methods)](#16-itimescaleapi-22-methods)
17. [Time Type Definitions](#17-time-type-definitions)
18. [PriceScaleOptions](#18-pricescaleoptions)
19. [IPriceScaleApi (6 methods)](#19-ipricescaleapi-6-methods)
20. [PriceLineOptions](#20-pricelineoptions)
21. [IPriceLine Interface](#21-ipriceline-interface)
22. [Markers](#22-markers)
23. [Events](#23-events)
24. [Panes](#24-panes)
25. [Enumerations (11)](#25-enumerations-11)
26. [Utility Types](#26-utility-types)
27. [Top-Level Functions & Variables](#27-top-level-functions--variables)
28. [Grand Summary](#28-grand-summary)

---

## 1. Chart Creation Functions

| JS Function | Status | Python Equivalent |
|---|:---:|---|
| `createChart(container, options?)` | ✅ | `chart(*series, **options)` / `line()` / `candlestick()` etc. |
| `createChartEx(container, horzScaleBehavior, options?)` | ❌ | No custom horizontal scale behavior |
| `createYieldCurveChart(container, options?)` | ✅ | `yield_curve(table, ...)` |

> Python also has `options_chart()` (Deephaven extension, not in TVL spec) for numeric x-axis option chain charts.

---

## 2. ChartOptionsBase — Top-Level Properties

| # | Property | Type | Status | Python Param | Notes |
|---|---|---|:---:|---|---|
| 1 | `width` | `number` | ✅ | `width` | |
| 2 | `height` | `number` | ✅ | `height` | |
| 3 | `autoSize` | `boolean` | ❌ | — | Not exposed; JS plugin may handle it differently |
| 4 | `layout` | `LayoutOptions` | ⚠️ | See §3 | |
| 5 | `leftPriceScale` | `PriceScaleOptions` | ⚠️ | `left_price_scale_*` | Missing `scaleMargins` |
| 6 | `rightPriceScale` | `PriceScaleOptions` | ⚠️ | `right_price_scale_*` | Missing `scaleMargins` |
| 7 | `overlayPriceScales` | `OverlayPriceScaleOptions` | ⚠️ | `overlay_price_scale_*` | Only 4/12 props wired up |
| 8 | `timeScale` | `HorzScaleOptions` | ✅ | `time_scale_*` / `bar_spacing` etc. | |
| 9 | `crosshair` | `CrosshairOptions` | ⚠️ | See §5 | |
| 10 | `grid` | `GridOptions` | ✅ | `vert_lines_*` / `horz_lines_*` | |
| 11 | `handleScroll` | `HandleScrollOptions` | ❌ | — | Entire group absent |
| 12 | `handleScale` | `HandleScaleOptions` | ❌ | — | Entire group absent |
| 13 | `kineticScroll` | `KineticScrollOptions` | ❌ | — | Entire group absent |
| 14 | `trackingMode` | `TrackingModeOptions` | ❌ | — | |
| 15 | `localization` | `LocalizationOptionsBase` | ⚠️ | See §8 | |
| 16 | `addDefaultPane` | `boolean` | ❌ | — | |

---

## 3. LayoutOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `background` | ⚠️ | `background_color` | Solid only; no `VerticalGradientColor` |
| 2 | `textColor` | ✅ | `text_color` | |
| 3 | `fontSize` | ✅ | `font_size` | |
| 4 | `fontFamily` | ❌ | — | |
| 5 | `panes` (LayoutPanesOptions) | ⚠️ | See below | |
| 6 | `attributionLogo` | ❌ | — | Cannot suppress TradingView logo |
| 7 | `colorSpace` | ❌ | — | Canvas color space |
| 8 | `colorParsers` | ❌ | — | Not feasible from Python |

### LayoutPanesOptions

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `enableResize` | ✅ | `pane_enable_resize` |
| 2 | `separatorColor` | ✅ | `pane_separator_color` |
| 3 | `separatorHoverColor` | ✅ | `pane_separator_hover_color` |

---

## 4. GridOptions

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `vertLines.color` | ✅ | `vert_lines_color` |
| 2 | `vertLines.style` | ✅ | `vert_lines_style` |
| 3 | `vertLines.visible` | ✅ | `vert_lines_visible` |
| 4 | `horzLines.color` | ✅ | `horz_lines_color` |
| 5 | `horzLines.style` | ✅ | `horz_lines_style` |
| 6 | `horzLines.visible` | ✅ | `horz_lines_visible` |

---

## 5. CrosshairOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `mode` | ✅ | `crosshair_mode` | `normal` / `magnet` only; `hidden` / `magnet_ohlc` missing |
| 2 | `vertLine.color` | ✅ | `crosshair_vert_line_color` | |
| 3 | `vertLine.width` | ✅ | `crosshair_vert_line_width` | |
| 4 | `vertLine.style` | ✅ | `crosshair_vert_line_style` | |
| 5 | `vertLine.visible` | ❌ | — | |
| 6 | `vertLine.labelVisible` | ❌ | — | |
| 7 | `vertLine.labelBackgroundColor` | ✅ | `crosshair_vert_line_label_background_color` | |
| 8 | `horzLine.color` | ✅ | `crosshair_horz_line_color` | |
| 9 | `horzLine.width` | ✅ | `crosshair_horz_line_width` | |
| 10 | `horzLine.style` | ✅ | `crosshair_horz_line_style` | |
| 11 | `horzLine.visible` | ❌ | — | |
| 12 | `horzLine.labelVisible` | ❌ | — | |
| 13 | `horzLine.labelBackgroundColor` | ✅ | `crosshair_horz_line_label_background_color` | |
| 14 | `doNotSnapToHiddenSeriesIndices` | ❌ | — | |

---

## 6. Watermark Options

### TextWatermarkOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `visible` | ✅ | `watermark_visible` | Auto-set `True` when text provided |
| 2 | `horzAlign` | ✅ | `watermark_horz_align` | |
| 3 | `vertAlign` | ✅ | `watermark_vert_align` | |
| 4 | `lines` (multi-line) | ⚠️ | — | Flattened to single line only |

### TextWatermarkLineOptions (per line)

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `text` | ✅ | `watermark_text` |
| 2 | `color` | ✅ | `watermark_color` |
| 3 | `fontSize` | ✅ | `watermark_font_size` |
| 4 | `lineHeight` | ❌ | — |
| 5 | `fontFamily` | ❌ | — |
| 6 | `fontStyle` | ❌ | — |

### ImageWatermarkOptions

| # | Property | Status | Notes |
|---|---|:---:|---|
| — | All (`maxWidth`, `maxHeight`, `padding`, `alpha`) | ❌ | Image watermarks entirely unsupported |

---

## 7. HandleScroll / HandleScale / KineticScroll

### HandleScrollOptions

| # | Property | Status |
|---|---|:---:|
| 1 | `mouseWheel` | ❌ |
| 2 | `pressedMouseMove` | ❌ |
| 3 | `horzTouchDrag` | ❌ |
| 4 | `vertTouchDrag` | ❌ |

### HandleScaleOptions

| # | Property | Status |
|---|---|:---:|
| 1 | `mouseWheel` | ❌ |
| 2 | `pinch` | ❌ |
| 3 | `axisPressedMouseMove` | ❌ |
| 4 | `axisDoubleClickReset` | ❌ |

### KineticScrollOptions

| # | Property | Status |
|---|---|:---:|
| 1 | `touch` | ❌ |
| 2 | `mouse` | ❌ |

---

## 8. LocalizationOptionsBase

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `locale` | ❌ | — | |
| 2 | `priceFormatter` | ⚠️ | `price_formatter` | Named preset only (e.g. `"currency_usd"`, `"percent"`); no arbitrary callable |
| 3 | `tickmarksPriceFormatter` | ❌ | — | |
| 4 | `percentageFormatter` | ❌ | — | |
| 5 | `tickmarksPercentageFormatter` | ❌ | — | |

---

## 9. IChartApi Methods (26)

All are JS runtime methods. The Python layer has no live chart handle.

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `remove()` | N/A | Lifecycle managed by Deephaven widget system |
| 2 | `resize(w, h, forceRepaint?)` | ⚠️ | Initial `width`/`height` only; no runtime resize |
| 3 | `paneSize(paneIndex?)` | N/A | JS runtime query |
| 4 | `autoSizeActive()` | N/A | JS runtime query |
| 5 | `addSeries(def, opts?, paneIdx?)` | ⚠️ | Series added at construction via `chart(*series)`; `paneIndex` supported |
| 6 | `addCustomSeries(...)` | ❌ | Custom series not supported |
| 7 | `removeSeries(seriesApi)` | ❌ | No dynamic remove |
| 8 | `subscribeClick(handler)` | N/A | Browser-only |
| 9 | `unsubscribeClick(handler)` | N/A | Browser-only |
| 10 | `subscribeDblClick(handler)` | N/A | Browser-only |
| 11 | `unsubscribeDblClick(handler)` | N/A | Browser-only |
| 12 | `subscribeCrosshairMove(handler)` | N/A | Browser-only |
| 13 | `unsubscribeCrosshairMove(handler)` | N/A | Browser-only |
| 14 | `priceScale(id, paneIdx?)` | ⚠️ | Static config via `*_price_scale_*` kwargs |
| 15 | `timeScale()` | ⚠️ | Static config via `time_scale_*` kwargs |
| 16 | `horzBehaviour()` | N/A | |
| 17 | `applyOptions(options)` | ⚠️ | Options set at construction only |
| 18 | `options()` | N/A | No getter |
| 19 | `takeScreenshot(...)` | N/A | Browser-only |
| 20 | `chartElement()` | N/A | Browser-only DOM |
| 21 | `addPane(preserveEmpty?)` | ❌ | Panes implicit via `pane_index` |
| 22 | `panes()` | N/A | |
| 23 | `removePane(index)` | ❌ | |
| 24 | `swapPanes(first, second)` | ❌ | |
| 25 | `setCrosshairPosition(...)` | N/A | |
| 26 | `clearCrosshairPosition()` | N/A | |

---

## 10. Series Types — Creation Functions

| Series Type | Status | Python Functions |
|---|:---:|---|
| Line | ✅ | `line_series()` / `line()` |
| Area | ✅ | `area_series()` / `area()` |
| Baseline | ✅ | `baseline_series()` / `baseline()` |
| Histogram | ✅ | `histogram_series()` / `histogram()` |
| Candlestick | ✅ | `candlestick_series()` / `candlestick()` |
| Bar | ✅ | `bar_series()` / `bar()` |
| Custom | ❌ | Not supported |

---

## 11. Data Interfaces

### Base Fields

| Field | Used By | Status | Notes |
|---|---|:---:|---|
| `time` | All | ✅ | Mapped via `time` param |
| `value` | Line, Area, Baseline, Histogram | ✅ | Mapped via `value` param |
| `open` | Candlestick, Bar | ✅ | |
| `high` | Candlestick, Bar | ✅ | |
| `low` | Candlestick, Bar | ✅ | |
| `close` | Candlestick, Bar | ✅ | |
| `customValues?` | All | ❌ | No mechanism for arbitrary extra columns |

### Per-Point Color Overrides (via column mappings)

| Override | Series Type | Status | Notes |
|---|---|:---:|---|
| `color` | Line | ❌ | No `color_column` on `line_series()` |
| `lineColor` | Area | ❌ | |
| `topColor` | Area | ❌ | |
| `bottomColor` | Area | ❌ | |
| `topFillColor1` | Baseline | ❌ | |
| `topFillColor2` | Baseline | ❌ | |
| `topLineColor` | Baseline | ❌ | |
| `bottomFillColor1` | Baseline | ❌ | |
| `bottomFillColor2` | Baseline | ❌ | |
| `bottomLineColor` | Baseline | ❌ | |
| `color` | Histogram | ✅ | Via `color_column` |
| `color` | Candlestick | ✅ | Via `color_column` |
| `borderColor` | Candlestick | ✅ | Via `border_color_column` |
| `wickColor` | Candlestick | ✅ | Via `wick_color_column` |
| `color` | Bar | ✅ | Via `color_column` |

---

## 12. SeriesOptionsCommon

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `lastValueVisible` | ✅ | `last_value_visible` | |
| 2 | `title` | ✅ | `title` | |
| 3 | `priceScaleId` | ✅ | `price_scale_id` | |
| 4 | `visible` | ✅ | `visible` | |
| 5 | `priceFormat` | ✅ | `price_format` | ⚠️ `min_move` key may not be camelCase-converted |
| 6 | `priceLineVisible` | ❌ | — | |
| 7 | `priceLineSource` | ❌ | — | |
| 8 | `priceLineWidth` | ❌ | — | |
| 9 | `priceLineColor` | ❌ | — | |
| 10 | `priceLineStyle` | ❌ | — | |
| 11 | `baseLineVisible` | ❌ | — | |
| 12 | `baseLineColor` | ❌ | — | |
| 13 | `baseLineWidth` | ❌ | — | |
| 14 | `baseLineStyle` | ❌ | — | |
| 15 | `autoscaleInfoProvider` | N/A | — | JS callback |
| 16 | `conflationThresholdFactor` | ❌ | — | Chart-level only, not per-series |

**Score: 5/16**

---

## 13. Per-Type Style Options

### Line Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `color` | ✅ | `color` |
| 2 | `lineStyle` | ✅ | `line_style` |
| 3 | `lineWidth` | ✅ | `line_width` |
| 4 | `lineType` | ✅ | `line_type` |
| 5 | `lineVisible` | ❌ | — |
| 6 | `pointMarkersVisible` | ❌ | — |
| 7 | `pointMarkersRadius` | ❌ | — |
| 8 | `crosshairMarkerVisible` | ✅ | `crosshair_marker_visible` |
| 9 | `crosshairMarkerRadius` | ✅ | `crosshair_marker_radius` |
| 10 | `crosshairMarkerBorderColor` | ❌ | — |
| 11 | `crosshairMarkerBackgroundColor` | ❌ | — |
| 12 | `crosshairMarkerBorderWidth` | ❌ | — |
| 13 | `lastPriceAnimation` | ❌ | — |

**Score: 6/13**

### Area Series Options

Inherits Line options above, plus:

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 14 | `topColor` | ✅ | `top_color` |
| 15 | `bottomColor` | ✅ | `bottom_color` |
| 16 | `lineColor` | ✅ | `line_color` |
| 17 | `relativeGradient` | ❌ | — |
| 18 | `invertFilledArea` | ❌ | — |

**Score: 7/17** (inherited line + area-specific)

### Baseline Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `baseValue` | ✅ | `base_value` (always type "price") |
| 2 | `topFillColor1` | ✅ | `top_fill_color1` |
| 3 | `topFillColor2` | ✅ | `top_fill_color2` |
| 4 | `topLineColor` | ✅ | `top_line_color` |
| 5 | `bottomFillColor1` | ✅ | `bottom_fill_color1` |
| 6 | `bottomFillColor2` | ✅ | `bottom_fill_color2` |
| 7 | `bottomLineColor` | ✅ | `bottom_line_color` |
| 8 | `lineWidth` | ✅ | `line_width` |
| 9 | `lineStyle` | ✅ | `line_style` |
| 10 | `lineType` | ❌ | — | Present in Line/Area but omitted from Baseline |
| 11 | `lineVisible` | ❌ | — |
| 12 | `relativeGradient` | ❌ | — |
| 13 | `pointMarkersVisible` | ❌ | — |
| 14 | `pointMarkersRadius` | ❌ | — |
| 15 | `crosshairMarkerVisible` | ✅ | `crosshair_marker_visible` |
| 16 | `crosshairMarkerRadius` | ✅ | `crosshair_marker_radius` |
| 17 | `crosshairMarkerBorderColor` | ❌ | — |
| 18 | `crosshairMarkerBackgroundColor` | ❌ | — |
| 19 | `crosshairMarkerBorderWidth` | ❌ | — |
| 20 | `lastPriceAnimation` | ❌ | — |

**Score: 11/20**

### Candlestick Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `upColor` | ✅ | `up_color` |
| 2 | `downColor` | ✅ | `down_color` |
| 3 | `wickVisible` | ✅ | `wick_visible` |
| 4 | `borderVisible` | ✅ | `border_visible` |
| 5 | `borderColor` (generic) | ❌ | — | Only up/down variants exist |
| 6 | `borderUpColor` | ✅ | `border_up_color` |
| 7 | `borderDownColor` | ✅ | `border_down_color` |
| 8 | `wickColor` (generic) | ❌ | — | Only up/down variants exist |
| 9 | `wickUpColor` | ✅ | `wick_up_color` |
| 10 | `wickDownColor` | ✅ | `wick_down_color` |

**Score: 8/10**

### Bar Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `upColor` | ✅ | `up_color` |
| 2 | `downColor` | ✅ | `down_color` |
| 3 | `openVisible` | ✅ | `open_visible` |
| 4 | `thinBars` | ✅ | `thin_bars` |

**Score: 4/4** ✅

### Histogram Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `color` | ✅ | `color` |
| 2 | `base` | ❌ | — | Base level for histogram columns |

**Score: 1/2**

---

## 14. ISeriesApi Properties & Methods

All are JS runtime; no Python live handle exists.

### Properties (5)

| # | Property | Status | Notes |
|---|---|:---:|---|
| 1 | `data()` | N/A | |
| 2 | `options()` | N/A | |
| 3 | `seriesType()` | ⚠️ | `SeriesSpec.series_type` stores the type at construction |
| 4 | `seriesOrder()` | N/A | |
| 5 | `priceFormatter()` | N/A | |

### Data Methods (6)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `setData()` | N/A | Data flows from Deephaven table ticks automatically |
| 2 | `update()` | N/A | Same — handled by JS plugin |
| 3 | `pop()` | N/A | |
| 4 | `dataByIndex()` | N/A | |
| 5 | `subscribeDataChanged()` | N/A | |
| 6 | `unsubscribeDataChanged()` | N/A | |

### Coordinate Conversion (3)

| # | Method | Status |
|---|---|:---:|
| 1 | `priceToCoordinate()` | N/A |
| 2 | `coordinateToPrice()` | N/A |
| 3 | `barsInLogicalRange()` | N/A |

### Price Lines (3)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `createPriceLine()` | ⚠️ | `PriceLine` dataclass + `price_line()` factory exist (declarative, at construction) |
| 2 | `removePriceLine()` | ❌ | No runtime removal |
| 3 | `priceLines()` | N/A | |

### Configuration (3)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `applyOptions()` | ⚠️ | Options set at construction only |
| 2 | `priceScale()` | ⚠️ | Static config via `_build_price_scale_options()` |
| 3 | `lastValueData()` | N/A | |

### Primitives & Panes (5)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `attachPrimitive()` | ❌ | JS-only concept |
| 2 | `detachPrimitive()` | ❌ | |
| 3 | `moveToPane()` | ⚠️ | Initial `pane` param on series functions |
| 4 | `setSeriesOrder()` | ❌ | |
| 5 | `getPane()` | N/A | |

---

## 15. TimeScaleOptions (27 properties)

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `rightOffset` | ✅ | `right_offset` |
| 2 | `rightOffsetPixels` | ✅ | `right_offset_pixels` |
| 3 | `barSpacing` | ✅ | `bar_spacing` |
| 4 | `minBarSpacing` | ✅ | `min_bar_spacing` |
| 5 | `maxBarSpacing` | ✅ | `max_bar_spacing` |
| 6 | `fixLeftEdge` | ✅ | `fix_left_edge` |
| 7 | `fixRightEdge` | ✅ | `fix_right_edge` |
| 8 | `lockVisibleTimeRangeOnResize` | ✅ | `lock_visible_time_range_on_resize` |
| 9 | `rightBarStaysOnScroll` | ✅ | `right_bar_stays_on_scroll` |
| 10 | `borderVisible` | ✅ | `time_scale_border_visible` |
| 11 | `borderColor` | ✅ | `time_scale_border_color` |
| 12 | `visible` | ✅ | `time_scale_visible` |
| 13 | `timeVisible` | ✅ | `time_visible` |
| 14 | `secondsVisible` | ✅ | `seconds_visible` |
| 15 | `ticksVisible` | ✅ | `time_scale_ticks_visible` |
| 16 | `allowBoldLabels` | ✅ | `allow_bold_labels` |
| 17 | `shiftVisibleRangeOnNewBar` | ✅ | `shift_visible_range_on_new_bar` |
| 18 | `allowShiftVisibleRangeOnWhitespaceReplacement` | ✅ | `allow_shift_visible_range_on_whitespace_replacement` |
| 19 | `ignoreWhitespaceIndices` | ✅ | `ignore_whitespace_indices` |
| 20 | `enableConflation` | ✅ | `enable_conflation` |
| 21 | `conflationThresholdFactor` | ✅ | `conflation_threshold_factor` |
| 22 | `precomputeConflationOnInit` | ✅ | `precompute_conflation_on_init` |
| 23 | `precomputeConflationPriority` | ❌ | — | Simple string; just not wired up |
| 24 | `tickMarkMaxCharacterLength` | ✅ | `tick_mark_max_character_length` |
| 25 | `tickMarkFormatter` | ❌ | — | Requires JS callback |
| 26 | `uniformDistribution` | ✅ | `uniform_distribution` |
| 27 | `minimumHeight` | ✅ | `time_scale_minimum_height` |

**Score: 24/27**

---

## 16. ITimeScaleApi (22 methods)

All are JS runtime; no Python live handle.

| # | Method | Status |
|---|---|:---:|
| 1 | `scrollPosition()` | N/A |
| 2 | `scrollToPosition()` | N/A |
| 3 | `scrollToRealTime()` | N/A |
| 4 | `getVisibleRange()` | N/A |
| 5 | `setVisibleRange()` | N/A |
| 6 | `getVisibleLogicalRange()` | N/A |
| 7 | `setVisibleLogicalRange()` | N/A |
| 8 | `resetTimeScale()` | N/A |
| 9 | `fitContent()` | N/A |
| 10 | `width()` | N/A |
| 11 | `height()` | N/A |
| 12 | `logicalToCoordinate()` | N/A |
| 13 | `coordinateToLogical()` | N/A |
| 14 | `timeToIndex()` | N/A |
| 15 | `timeToCoordinate()` | N/A |
| 16 | `coordinateToTime()` | N/A |
| 17 | `subscribeVisibleTimeRangeChange()` | N/A |
| 18 | `unsubscribeVisibleTimeRangeChange()` | N/A |
| 19 | `subscribeVisibleLogicalRangeChange()` | N/A |
| 20 | `unsubscribeVisibleLogicalRangeChange()` | N/A |
| 21 | `subscribeSizeChange()` | N/A |
| 22 | `unsubscribeSizeChange()` | N/A |

---

## 17. Time Type Definitions

| Type | Status | Notes |
|---|:---:|---|
| `UTCTimestamp` (numeric) | ✅ | Column data auto-converted |
| `BusinessDay` (`{year, month, day}`) | ❌ | No Python helper |
| ISO string (`'YYYY-MM-DD'`) | ✅ | Strings pass through |

---

## 18. PriceScaleOptions

### Per-Series (via `scale_*` params)

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `autoScale` | ✅ | `auto_scale` |
| 2 | `mode` | ✅ | `scale_mode` |
| 3 | `invertScale` | ✅ | `scale_invert` |
| 4 | `alignLabels` | ✅ | `scale_align_labels` |
| 5 | `scaleMargins` | ✅ | `scale_margin_top` / `scale_margin_bottom` |
| 6 | `borderVisible` | ✅ | `scale_border_visible` |
| 7 | `borderColor` | ✅ | `scale_border_color` |
| 8 | `textColor` | ✅ | `scale_text_color` |
| 9 | `entireTextOnly` | ✅ | `scale_entire_text_only` |
| 10 | `visible` | ✅ | `scale_visible` |
| 11 | `ticksVisible` | ✅ | `scale_ticks_visible` |
| 12 | `minimumWidth` | ✅ | `scale_minimum_width` |
| 13 | `ensureEdgeTickMarksVisible` | ✅ | `scale_ensure_edge_tick_marks_visible` |

**Score: 13/13** ✅

### Chart-Level Right/Left Price Scale

| # | Property | Status | Notes |
|---|---|:---:|---|
| 1–4 | `autoScale`, `mode`, `invertScale`, `alignLabels` | ✅ | |
| 5 | `scaleMargins` | ❌ | Missing for right/left at chart level |
| 6–13 | remaining 8 props | ✅ | |

**Score: 12/13**

### Chart-Level Overlay Defaults

| # | Property | Status |
|---|---|:---:|
| 1 | `scaleMargins` | ✅ |
| 2 | `borderVisible` | ✅ |
| 3 | `ticksVisible` | ✅ |
| 4 | `minimumWidth` | ✅ |
| 5–12 | remaining 8 props | ❌ |

**Score: 4/12**

---

## 19. IPriceScaleApi (6 methods)

| # | Method | Status |
|---|---|:---:|
| 1 | `applyOptions()` | ⚠️ (static config only) |
| 2 | `options()` | N/A |
| 3 | `width()` | N/A |
| 4 | `setVisibleRange()` | N/A |
| 5 | `getVisibleRange()` | N/A |
| 6 | `setAutoScale()` | N/A |

---

## 20. PriceLineOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `id` | ✅ | `id` | |
| 2 | `price` | ✅ | `price` | Also supports dynamic `column` (Deephaven extension) |
| 3 | `color` | ✅ | `color` | |
| 4 | `lineWidth` | ✅ | `line_width` | |
| 5 | `lineStyle` | ✅ | `line_style` | |
| 6 | `lineVisible` | ✅ | `line_visible` | |
| 7 | `axisLabelVisible` | ✅ | `axis_label_visible` | |
| 8 | `title` | ✅ | `title` | |
| 9 | `axisLabelColor` | ✅ | `axis_label_color` | |
| 10 | `axisLabelTextColor` | ✅ | `axis_label_text_color` | |

**Score: 10/10**

---

## 21. IPriceLine Interface

| # | Method | Status |
|---|---|:---:|
| 1 | `applyOptions()` | N/A |
| 2 | `options()` | N/A |

---

## 22. Markers

### SeriesMarker Properties

| # | Property | Status | Python Field |
|---|---|:---:|---|
| 1 | `time` | ✅ | `Marker.time` |
| 2 | `position` | ✅ | `Marker.position` |
| 3 | `shape` | ✅ | `Marker.shape` |
| 4 | `color` | ✅ | `Marker.color` |
| 5 | `text` | ✅ | `Marker.text` |
| 6 | `size` | ✅ | `Marker.size` |
| 7 | `id` | ❌ | — |
| 8 | `price` | ❌ | — |

### Marker Shapes (4)

| Shape | Status | Python Alias |
|---|:---:|---|
| `circle` | ✅ | `"circle"` |
| `square` | ✅ | `"square"` |
| `arrowUp` | ✅ | `"arrow_up"` |
| `arrowDown` | ✅ | `"arrow_down"` |

### Marker Positions (6)

| Position | Status | Python Alias |
|---|:---:|---|
| `aboveBar` | ✅ | `"above_bar"` |
| `belowBar` | ✅ | `"below_bar"` |
| `inBar` | ✅ | `"in_bar"` |
| `atPriceTop` | ❌ | — |
| `atPriceBottom` | ❌ | — |
| `atPriceMiddle` | ❌ | — |

### ISeriesMarkersPluginApi

| Method | Status | Notes |
|---|:---:|---|
| `setMarkers()` | ⚠️ | Static markers at build time; table-driven via `marker_spec` |
| `markers()` | N/A | |
| `detach()` | N/A | |
| `getSeries()` | N/A | |
| `applyOptions()` | N/A | |

### Marker Factories

| Function | Status | Notes |
|---|:---:|---|
| `createSeriesMarkers()` | ⚠️ | Replaced by `markers=` / `marker_spec=` params |
| `createUpDownMarkers()` | ❌ | Entirely absent |

---

## 23. Events

The entire event system is browser-only. There is no Python callback mechanism.

| Feature | Status |
|---|:---:|
| `MouseEventParams` (8 properties) | N/A |
| `TouchMouseEventData` (12 properties) | N/A |
| `MouseEventHandler` type | N/A |
| `Point` interface | N/A |
| `chart.subscribeClick()` | N/A |
| `chart.subscribeDblClick()` | N/A |
| `chart.subscribeCrosshairMove()` | N/A |
| `IRange<T>` / `LogicalRange` | N/A |

---

## 24. Panes

### IPaneApi (15 methods)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `getHeight()` | N/A | |
| 2 | `setHeight()` | N/A | |
| 3 | `moveTo()` | N/A | |
| 4 | `paneIndex()` | N/A | |
| 5 | `getSeries()` | N/A | |
| 6 | `getHTMLElement()` | N/A | |
| 7 | `priceScale()` | N/A | |
| 8 | `getStretchFactor()` | N/A | |
| 9 | `setStretchFactor()` | ⚠️ | Initial `pane_stretch_factors=[...]` list |
| 10 | `setPreserveEmptyPane()` | N/A | |
| 11 | `preserveEmptyPane()` | N/A | |
| 12 | `addSeries()` | N/A | Series added at build time |
| 13 | `addCustomSeries()` | ❌ | |
| 14 | `attachPrimitive()` | ❌ | |
| 15 | `detachPrimitive()` | ❌ | |

### Pane Assignment

| Feature | Status | Notes |
|---|:---:|---|
| Assign series to pane by index | ✅ | `pane=0`, `pane=1`, ... on each series function |
| `pane_stretch_factors` | ✅ | Initial factors list |

### IChartApi Pane Management

| Method | Status |
|---|:---:|
| `addPane()` | ❌ |
| `panes()` | N/A |
| `removePane()` | ❌ |
| `swapPanes()` | ❌ |

### LayoutPanesOptions

| Property | Status | Python Param |
|---|:---:|---|
| `enableResize` | ✅ | `pane_enable_resize` |
| `separatorColor` | ✅ | `pane_separator_color` |
| `separatorHoverColor` | ✅ | `pane_separator_hover_color` |

---

## 25. Enumerations (11)

| Enum | Members | Implemented | Missing |
|---|---|---|---|
| `ColorType` | Solid, VerticalGradient | ⚠️ Solid only (hardcoded) | `VerticalGradient` |
| `CrosshairMode` | Normal, Magnet, Hidden, MagnetOHLC | ⚠️ 2/4 | `Hidden`, `MagnetOHLC` |
| `LastPriceAnimationMode` | Disabled, Continuous, OnDataUpdate | ❌ 0/3 | All |
| `LineStyle` | Solid, Dotted, Dashed, LargeDashed, SparseDotted | ✅ 5/5 | — |
| `LineType` | Simple, WithSteps, Curved | ✅ 3/3 | — |
| `MarkerSign` | Negative, Neutral, Positive | ❌ 0/3 | All |
| `MismatchDirection` | NearestLeft, None, NearestRight | ❌ 0/3 | All |
| `PriceLineSource` | LastBar, LastVisible | ❌ 0/2 | All |
| `PriceScaleMode` | Normal, Logarithmic, Percentage, IndexedTo100 | ✅ 4/4 | — |
| `TickMarkType` | Year, Month, DayOfMonth, Time, TimeWithSeconds | ❌ 0/5 | All |
| `TrackingModeExitMode` | OnTouchEnd, OnNextTap | ❌ 0/2 | All |

**Score: 14/34 enum members implemented**

---

## 26. Utility Types

| Type | Status | Notes |
|---|:---:|---|
| `DeepPartial<T>` | N/A | TS generic; Python uses `Optional[...]` kwargs |
| `Coordinate` | N/A | JS event system only |
| `Logical` | N/A | JS time scale only |
| `LineWidth` | ⚠️ | `int` accepted; not constrained to `{1,2,3,4}` |
| `PriceFormatBuiltIn` | ✅ | `PriceFormat` TypedDict |
| `PriceFormatCustom` | ❌ | Requires JS callback |
| `SolidColor` | ⚠️ | Hardcoded in `chart()` |
| `VerticalGradientColor` | ❌ | Not supported |
| `PriceScaleMargins` | ✅ | `scale_margin_top` / `scale_margin_bottom` |
| `SeriesOptionsMap` | N/A | Separate Python functions per type |
| `HorzAlign` | ⚠️ | Raw string, no validation |
| `VertAlign` | ⚠️ | Raw string, no validation |

---

## 27. Top-Level Functions & Variables

### Functions

| Function | Status | Notes |
|---|:---:|---|
| `createChart()` | ✅ | Via `chart()` |
| `createChartEx()` | ❌ | Custom horizontal scale |
| `createYieldCurveChart()` | ✅ | Via `yield_curve()` |
| `createTextWatermark()` | ⚠️ | Static via chart kwargs |
| `createImageWatermark()` | ❌ | |
| `createSeriesMarkers()` | ⚠️ | Via `markers=` / `marker_spec=` |
| `createUpDownMarkers()` | ❌ | |
| `isBusinessDay()` | ❌ | |
| `isUTCTimestamp()` | ❌ | |
| `version()` | ❌ | |

### Series Definition Variables

| Variable | Status |
|---|:---:|
| `LineSeries` | ✅ |
| `AreaSeries` | ✅ |
| `BaselineSeries` | ✅ |
| `CandlestickSeries` | ✅ |
| `BarSeries` | ✅ |
| `HistogramSeries` | ✅ |
| `customSeriesDefaultOptions` | ❌ |

---

## 28. Grand Summary

### Coverage by Category (configuration options only — excludes N/A runtime methods)

| Category | Total | ✅ | ⚠️ | ❌ |
|---|:---:|:---:|:---:|:---:|
| Chart creation functions | 3 | 2 | 0 | 1 |
| ChartOptionsBase top-level | 16 | 4 | 5 | 7 |
| LayoutOptions | 8 | 2 | 1 | 5 |
| LayoutPanesOptions | 3 | 3 | 0 | 0 |
| GridOptions | 6 | 6 | 0 | 0 |
| CrosshairOptions | 14 | 8 | 0 | 6 |
| TextWatermarkOptions | 7 | 4 | 1 | 2 |
| ImageWatermarkOptions | 4 | 0 | 0 | 4 |
| HandleScroll/Scale/Kinetic | 10 | 0 | 0 | 10 |
| LocalizationOptions | 5 | 0 | 1 | 4 |
| Series types | 7 | 6 | 0 | 1 |
| Data interface base fields | 7 | 6 | 0 | 1 |
| Per-point overrides | 15 | 5 | 0 | 10 |
| SeriesOptionsCommon | 16 | 5 | 0 | 11 |
| Line style options | 13 | 6 | 0 | 7 |
| Area style options | 17 | 7 | 0 | 10 |
| Baseline style options | 20 | 11 | 0 | 9 |
| Candlestick style options | 10 | 8 | 0 | 2 |
| Bar style options | 4 | 4 | 0 | 0 |
| Histogram style options | 2 | 1 | 0 | 1 |
| TimeScaleOptions | 27 | 24 | 0 | 3 |
| PriceScaleOptions (per-series) | 13 | 13 | 0 | 0 |
| PriceScaleOptions (chart right/left) | 13 | 12 | 0 | 1 |
| PriceScaleOptions (overlay) | 12 | 4 | 0 | 8 |
| PriceLineOptions | 10 | 6 | 0 | 4 |
| Marker properties | 8 | 6 | 0 | 2 |
| Marker shapes | 4 | 4 | 0 | 0 |
| Marker positions | 6 | 3 | 0 | 3 |
| Enumerations | 34 | 14 | 0 | 20 |
| Top-level functions | 10 | 2 | 2 | 6 |
| Series def variables | 7 | 6 | 0 | 1 |
| **TOTALS** | **374** | **186** | **10** | **178** |

### Overall: ~50% of configurable API surface implemented

### Top Priority Gaps (commonly used, easy to add)

1. **`handleScroll` / `handleScale`** — 8 boolean properties to control scroll/zoom behavior
2. **`autoSize`** — common chart layout option
3. **SeriesOptionsCommon price-line group** — `priceLineVisible`, `priceLineColor`, `priceLineWidth`, `priceLineStyle`, `priceLineSource` (5 props across all series)
4. **SeriesOptionsCommon baseline group** — `baseLineVisible`, `baseLineColor`, `baseLineWidth`, `baseLineStyle` (4 props)
5. **Line/Area/Baseline `pointMarkersVisible`/`pointMarkersRadius`** — 2 props × 3 series types
6. **Line/Area/Baseline `lastPriceAnimation`** — 1 prop × 3 series types
7. **Crosshair `visible` / `labelVisible`** — 4 missing booleans
8. **CrosshairMode `Hidden` / `MagnetOHLC`** — 2 missing enum values
9. **Candlestick generic `borderColor` / `wickColor`** — 2 convenience defaults
10. **Histogram `base`** — single missing number prop
11. **PriceLine `id`, `lineVisible`, `axisLabelColor`, `axisLabelTextColor`** — 4 properties
12. **Marker `id`, `price`, price-based positions** — unlocks `atPriceTop`/`atPriceBottom`/`atPriceMiddle`
13. **Per-point color overrides for Line/Area/Baseline** — column mappings for per-point styling
14. **Overlay price scale** — 8 missing properties at chart level
15. **`layout.fontFamily`** — common styling option
16. **`precomputeConflationPriority`** — trivial string kwarg

### Not Feasible in Current Architecture

- All JS runtime methods (`ITimeScaleApi`, `IPriceScaleApi`, `IPaneApi`, `ISeriesApi`) — require live Python↔JS bidirectional messaging
- JS callback options (`tickMarkFormatter`, `autoscaleInfoProvider`, `PriceFormatCustom`) — cannot serialize Python callables to JS
- Event system (`MouseEventParams`, subscriptions) — no Python callback mechanism
- Custom series (`addCustomSeries`, `customSeriesDefaultOptions`) — requires JS plugin extension

### Potential Bug Found

`PriceFormat.min_move` is a Python-side snake_case key in a `TypedDict`, but when passed to JS it needs to be `minMove`. The `_filter_none` helper passes dict values through without camelCase conversion, which would silently ignore the `min_move` field on the JS side.
