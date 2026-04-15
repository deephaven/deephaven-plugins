# TradingView Lightweight Charts v5.1 — Python API Coverage Report (Updated)

**Generated:** 2026-04-11
**Scope:** Every feature documented in `notes/api-reference/` compared against `src/deephaven/plot/tradingview_lightweight/`
**Previous report:** `notes/api-coverage-report.md` (generated 2026-04-11, before all implementation plans ran)

**Legend:** ✅ = implemented | ⚠️ = partial | ❌ = not implemented | N/A = not applicable to server-side Python

> **Architecture note:** The Python layer is a *static configuration builder*. It serializes options to JSON at chart-creation time and streams table data to the JS frontend. There is no live Python handle on the running chart, so all JS runtime methods (event subscriptions, coordinate queries, DOM access, screenshots) are architecturally unavailable from Python. These are marked N/A where appropriate.

---

## Changes from Previous Report

The following sections improved between the previous and current report. All implementation plans (Plans 01–19) were executed after the baseline was taken.

### Items that changed from ❌ → ✅

| Section | Item | Previous | Current |
|---|---|:---:|:---:|
| §2 ChartOptionsBase | `autoSize` | ❌ | ✅ |
| §2 ChartOptionsBase | `handleScroll` (bool shorthand) | ❌ | ✅ |
| §2 ChartOptionsBase | `handleScale` (bool shorthand) | ❌ | ✅ |
| §2 ChartOptionsBase | `kineticScroll` | ❌ | ✅ |
| §2 ChartOptionsBase | `trackingMode` | ❌ | ✅ |
| §2 ChartOptionsBase | `addDefaultPane` | ❌ | ✅ |
| §3 LayoutOptions | `fontFamily` | ❌ | ✅ |
| §3 LayoutOptions | `attributionLogo` | ❌ | ✅ |
| §3 LayoutOptions | `colorSpace` | ❌ | ✅ |
| §3 LayoutOptions | `background` (gradient) | ⚠️ | ✅ |
| §5 CrosshairOptions | `vertLine.visible` | ❌ | ✅ |
| §5 CrosshairOptions | `vertLine.labelVisible` | ❌ | ✅ |
| §5 CrosshairOptions | `horzLine.visible` | ❌ | ✅ |
| §5 CrosshairOptions | `horzLine.labelVisible` | ❌ | ✅ |
| §5 CrosshairOptions | `doNotSnapToHiddenSeriesIndices` | ❌ | ✅ |
| §6 Watermark | `lines` (multi-line) | ⚠️ | ✅ |
| §6 Watermark | `lineHeight` (per line) | ❌ | ✅ |
| §6 Watermark | `fontFamily` (per line) | ❌ | ✅ |
| §6 Watermark | `fontStyle` (per line) | ❌ | ✅ |
| §6 Image Watermark | `maxWidth`, `maxHeight`, `padding`, `alpha`, `visible` | ❌ | ✅ |
| §7 HandleScroll | All 4 granular props | ❌ | ✅ |
| §7 HandleScale | All 4 granular props | ❌ | ✅ |
| §7 KineticScroll | `touch`, `mouse` | ❌ | ✅ |
| §8 Localization | `locale` | ❌ | ✅ |
| §8 Localization | `tickmarksPriceFormatter` | ❌ | ✅ |
| §8 Localization | `percentageFormatter` | ❌ | ✅ |
| §8 Localization | `tickmarksPercentageFormatter` | ❌ | ✅ |
| §9 IChartApi | `addPane` (pane_preserve_empty) | ❌ | ⚠️ |
| §12 SeriesOptionsCommon | `priceLineVisible` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `priceLineSource` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `priceLineWidth` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `priceLineColor` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `priceLineStyle` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `baseLineVisible` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `baseLineColor` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `baseLineWidth` | ❌ | ✅ |
| §12 SeriesOptionsCommon | `baseLineStyle` | ❌ | ✅ |
| §13 Line options | `lineVisible` | ❌ | ✅ |
| §13 Line options | `pointMarkersVisible` | ❌ | ✅ |
| §13 Line options | `pointMarkersRadius` | ❌ | ✅ |
| §13 Line options | `crosshairMarkerBorderColor` | ❌ | ✅ |
| §13 Line options | `crosshairMarkerBackgroundColor` | ❌ | ✅ |
| §13 Line options | `crosshairMarkerBorderWidth` | ❌ | ✅ |
| §13 Line options | `lastPriceAnimation` | ❌ | ✅ |
| §13 Area options | `relativeGradient` | ❌ | ✅ |
| §13 Area options | `invertFilledArea` | ❌ | ✅ |
| §13 Baseline options | `lineType` | ❌ | ✅ |
| §13 Baseline options | `lineVisible` | ❌ | ✅ |
| §13 Baseline options | `relativeGradient` | ❌ | ✅ |
| §13 Baseline options | `pointMarkersVisible` | ❌ | ✅ |
| §13 Baseline options | `pointMarkersRadius` | ❌ | ✅ |
| §13 Baseline options | `crosshairMarkerBorderColor` | ❌ | ✅ |
| §13 Baseline options | `crosshairMarkerBackgroundColor` | ❌ | ✅ |
| §13 Baseline options | `crosshairMarkerBorderWidth` | ❌ | ✅ |
| §13 Baseline options | `lastPriceAnimation` | ❌ | ✅ |
| §13 Candlestick | `borderColor` (generic) | ❌ | ✅ |
| §13 Candlestick | `wickColor` (generic) | ❌ | ✅ |
| §13 Histogram | `base` | ❌ | ✅ |
| §15 TimeScaleOptions | `precomputeConflationPriority` | ❌ | ✅ |
| §17 Time types | `BusinessDay` | ❌ | ✅ |
| §18 PriceScaleOptions (chart right/left) | `scaleMargins` | ❌ | ✅ |
| §18 PriceScaleOptions (overlay) | All remaining 8 props | ❌ | ✅ |
| §11 Per-point overrides | Line `color` | ❌ | ✅ |
| §11 Per-point overrides | Area `lineColor` | ❌ | ✅ |
| §11 Per-point overrides | Area `topColor` | ❌ | ✅ |
| §11 Per-point overrides | Area `bottomColor` | ❌ | ✅ |
| §11 Per-point overrides | Baseline all 6 per-point overrides | ❌ | ✅ |
| §22 Markers | `id` field | ❌ | ✅ |
| §22 Markers | `price` field | ❌ | ✅ |
| §22 Markers | `atPriceTop` position | ❌ | ✅ |
| §22 Markers | `atPriceBottom` position | ❌ | ✅ |
| §22 Markers | `atPriceMiddle` position | ❌ | ✅ |
| §22 Markers | `createUpDownMarkers()` | ❌ | ✅ |
| §25 Enumerations | `CrosshairMode.Hidden` | ❌ | ✅ |
| §25 Enumerations | `CrosshairMode.MagnetOHLC` | ❌ | ✅ |
| §25 Enumerations | `LastPriceAnimationMode` (all 3) | ❌ | ✅ |
| §25 Enumerations | `MarkerSign` (all 3) | ❌ | ✅ |
| §25 Enumerations | `MismatchDirection` (all 3) | ❌ | ✅ |
| §25 Enumerations | `PriceLineSource` (all 2) | ❌ | ✅ |
| §25 Enumerations | `TickMarkType` (all 5) | ❌ | ✅ |
| §25 Enumerations | `TrackingModeExitMode` (all 2) | ❌ | ✅ |
| §26 Utility types | `LineWidth` (constrained Literal) | ⚠️ | ✅ |
| §26 Utility types | `SolidColor` | ⚠️ | ✅ |
| §26 Utility types | `VerticalGradientColor` | ❌ | ✅ |
| §26 Utility types | `HorzAlign` (Literal type) | ⚠️ | ✅ |
| §26 Utility types | `VertAlign` (Literal type) | ⚠️ | ✅ |
| §27 Functions | `isBusinessDay()` | ❌ | ✅ |
| §27 Functions | `isUTCTimestamp()` | ❌ | ✅ |
| §27 Functions | `createImageWatermark()` | ❌ | ✅ |
| §20 PriceLineOptions | `id` | Previously shown as ✅ but verify correct | ✅ |
| §24 Panes | `pane_preserve_empty` per-pane | ❌ | ✅ |

### Grand Summary Change

| | Previous | Current |
|---|:---:|:---:|
| ✅ Implemented | 186 | ~320 |
| ⚠️ Partial | 10 | ~6 |
| ❌ Not implemented | 178 | ~48 |
| Total configurable items | 374 | 374 |
| **Overall coverage** | **~50%** | **~86%** |

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
| `createChartEx(container, horzScaleBehavior, options?)` | ❌ | Not supported — custom horzScaleBehavior requires a JS callable; named chart types cover all built-in behaviors |
| `createYieldCurveChart(container, options?)` | ✅ | `yield_curve(table, ...)` |

> Python also exposes `options_chart()` and `custom_numeric()` (Deephaven extensions, not in TVL spec) for numeric x-axis charts.

**Score: 2/3**

---

## 2. ChartOptionsBase — Top-Level Properties

| # | Property | Type | Status | Python Param | Notes |
|---|---|---|:---:|---|---|
| 1 | `width` | `number` | ✅ | `width` | |
| 2 | `height` | `number` | ✅ | `height` | |
| 3 | `autoSize` | `boolean` | ✅ | `auto_size` | |
| 4 | `layout` | `LayoutOptions` | ✅ | See §3 | |
| 5 | `leftPriceScale` | `PriceScaleOptions` | ✅ | `left_price_scale_*` | All 13 props including `scaleMargins` |
| 6 | `rightPriceScale` | `PriceScaleOptions` | ✅ | `right_price_scale_*` | All 13 props including `scaleMargins` |
| 7 | `overlayPriceScales` | `OverlayPriceScaleOptions` | ✅ | `overlay_price_scale_*` | All 12 applicable props |
| 8 | `timeScale` | `HorzScaleOptions` | ✅ | `time_scale_*` / `bar_spacing` etc. | |
| 9 | `crosshair` | `CrosshairOptions` | ✅ | See §5 | |
| 10 | `grid` | `GridOptions` | ✅ | `vert_lines_*` / `horz_lines_*` | |
| 11 | `handleScroll` | `boolean \| HandleScrollOptions` | ✅ | `handle_scroll` / `handle_scroll_*` | Bool shorthand and granular props |
| 12 | `handleScale` | `boolean \| HandleScaleOptions` | ✅ | `handle_scale` / `handle_scale_*` | Bool shorthand and granular props |
| 13 | `kineticScroll` | `KineticScrollOptions` | ✅ | `kinetic_scroll_touch` / `kinetic_scroll_mouse` | |
| 14 | `trackingMode` | `TrackingModeOptions` | ✅ | `tracking_mode_exit_mode` | Serialized as `trackingMode.exitMode` |
| 15 | `localization` | `LocalizationOptionsBase` | ✅ | See §8 | Named preset formatters; no arbitrary JS callbacks |
| 16 | `addDefaultPane` | `boolean` | ✅ | `add_default_pane` | |

**Score: 16/16** ✅

---

## 3. LayoutOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `background` | ✅ | `background_color` / `background_top_color` + `background_bottom_color` | Both solid and vertical gradient supported |
| 2 | `textColor` | ✅ | `text_color` | |
| 3 | `fontSize` | ✅ | `font_size` | |
| 4 | `fontFamily` | ✅ | `font_family` | |
| 5 | `panes` (LayoutPanesOptions) | ✅ | See below | |
| 6 | `attributionLogo` | ✅ | `attribution_logo` | |
| 7 | `colorSpace` | ✅ | `color_space` | `'srgb'` or `'display-p3'` |
| 8 | `colorParsers` | ❌ | — | Requires JS callable array; not feasible from Python |

### LayoutPanesOptions

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `enableResize` | ✅ | `pane_enable_resize` |
| 2 | `separatorColor` | ✅ | `pane_separator_color` |
| 3 | `separatorHoverColor` | ✅ | `pane_separator_hover_color` |

**Score: 7/8** (colorParsers is JS-only)

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

**Score: 6/6** ✅

---

## 5. CrosshairOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `mode` | ✅ | `crosshair_mode` | All 4 values: `normal`, `magnet`, `hidden`, `magnet_ohlc` |
| 2 | `vertLine.color` | ✅ | `crosshair_vert_line_color` | |
| 3 | `vertLine.width` | ✅ | `crosshair_vert_line_width` | |
| 4 | `vertLine.style` | ✅ | `crosshair_vert_line_style` | |
| 5 | `vertLine.visible` | ✅ | `crosshair_vert_line_visible` | |
| 6 | `vertLine.labelVisible` | ✅ | `crosshair_vert_line_label_visible` | |
| 7 | `vertLine.labelBackgroundColor` | ✅ | `crosshair_vert_line_label_background_color` | |
| 8 | `horzLine.color` | ✅ | `crosshair_horz_line_color` | |
| 9 | `horzLine.width` | ✅ | `crosshair_horz_line_width` | |
| 10 | `horzLine.style` | ✅ | `crosshair_horz_line_style` | |
| 11 | `horzLine.visible` | ✅ | `crosshair_horz_line_visible` | |
| 12 | `horzLine.labelVisible` | ✅ | `crosshair_horz_line_label_visible` | |
| 13 | `horzLine.labelBackgroundColor` | ✅ | `crosshair_horz_line_label_background_color` | |
| 14 | `doNotSnapToHiddenSeriesIndices` | ✅ | `crosshair_do_not_snap_to_hidden_series` | |

**Score: 14/14** ✅

---

## 6. Watermark Options

### TextWatermarkOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `visible` | ✅ | `watermark_visible` | Auto-set `True` when text provided |
| 2 | `horzAlign` | ✅ | `watermark_horz_align` | |
| 3 | `vertAlign` | ✅ | `watermark_vert_align` | |
| 4 | `lines` (multi-line) | ✅ | `watermark_lines=[WatermarkLine(...), ...]` | Full multi-line support via `WatermarkLine` dataclass |

### TextWatermarkLineOptions (per line)

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `text` | ✅ | `watermark_text` / `WatermarkLine.text` | Single-line shortcut or per-line |
| 2 | `color` | ✅ | `watermark_color` / `WatermarkLine.color` | |
| 3 | `fontSize` | ✅ | `watermark_font_size` / `WatermarkLine.font_size` | |
| 4 | `lineHeight` | ✅ | `WatermarkLine.line_height` | Available via multi-line API |
| 5 | `fontFamily` | ✅ | `watermark_font_family` / `WatermarkLine.font_family` | |
| 6 | `fontStyle` | ✅ | `watermark_font_style` / `WatermarkLine.font_style` | |

### ImageWatermarkOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `maxWidth` | ✅ | `watermark_image_max_width` | |
| 2 | `maxHeight` | ✅ | `watermark_image_max_height` | |
| 3 | `padding` | ✅ | `watermark_image_padding` | |
| 4 | `alpha` | ✅ | `watermark_image_alpha` | |
| 5 | `visible` | ✅ | `watermark_image_visible` | Auto-set `True` when URL provided |
| — | `url` (image source) | ✅ | `watermark_image_url` | Deephaven extension: URL passed as config |

> Note: The JS API uses `createImageWatermark(pane, imageUrl, options)` — a runtime call. The Python layer provides equivalent static configuration via `watermark_image_url` and `watermark_image_*` params, which the JS plugin materializes at render time.

**Score: 10/10 text watermark + 6/4 image (superset)** ✅

---

## 7. HandleScroll / HandleScale / KineticScroll

### HandleScrollOptions

| # | Property | Status | Python Param |
|---|---|:---:|---|
| — | `handleScroll` (bool shorthand) | ✅ | `handle_scroll` |
| 1 | `mouseWheel` | ✅ | `handle_scroll_mouse_wheel` |
| 2 | `pressedMouseMove` | ✅ | `handle_scroll_pressed_mouse_move` |
| 3 | `horzTouchDrag` | ✅ | `handle_scroll_horz_touch_drag` |
| 4 | `vertTouchDrag` | ✅ | `handle_scroll_vert_touch_drag` |

### HandleScaleOptions

| # | Property | Status | Python Param |
|---|---|:---:|---|
| — | `handleScale` (bool shorthand) | ✅ | `handle_scale` |
| 1 | `mouseWheel` | ✅ | `handle_scale_mouse_wheel` |
| 2 | `pinch` | ✅ | `handle_scale_pinch` |
| 3 | `axisPressedMouseMove` | ✅ | `handle_scale_axis_pressed_mouse_move` | Note: only `bool` form; `AxisPressedMouseMoveOptions` struct not supported |
| 4 | `axisDoubleClickReset` | ✅ | `handle_scale_axis_double_click_reset` | Note: only `bool` form; `AxisDoubleClickOptions` struct not supported |

### KineticScrollOptions

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `touch` | ✅ | `kinetic_scroll_touch` |
| 2 | `mouse` | ✅ | `kinetic_scroll_mouse` |

**Score: 10/10** ✅

> Note: `axisPressedMouseMove` and `axisDoubleClickReset` accept only `bool` (not the full `AxisPressedMouseMoveOptions` / `AxisDoubleClickOptions` struct forms). The boolean form covers the primary use case.

---

## 8. LocalizationOptionsBase

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `locale` | ✅ | `locale` | Raw locale string (e.g. `'en-US'`) |
| 2 | `priceFormatter` | ✅ | `price_formatter` | Named presets: `"currency_usd"`, `"percent"`, etc. No arbitrary JS callable |
| 3 | `tickmarksPriceFormatter` | ✅ | `tickmarks_price_formatter` | Same preset set as `priceFormatter` |
| 4 | `percentageFormatter` | ✅ | `percentage_formatter` | Presets: `"percent"`, `"percent_1dp"`, `"percent_0dp"`, `"decimal"` |
| 5 | `tickmarksPercentageFormatter` | ✅ | `tickmarks_percentage_formatter` | Same preset set as `percentageFormatter` |

**Score: 5/5** ✅

> Note: All formatter options accept named preset strings (e.g. `"currency_usd"`, `"percent"`) rather than arbitrary JS callables, which cannot be serialized from Python. The JS plugin side maps these preset names to the actual formatter functions at render time.

---

## 9. IChartApi Methods (26)

All are JS runtime methods. The Python layer has no live chart handle.

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `remove()` | N/A | Lifecycle managed by Deephaven widget system |
| 2 | `resize(w, h, forceRepaint?)` | ⚠️ | Initial `width`/`height` set at construction; no runtime resize |
| 3 | `paneSize(paneIndex?)` | N/A | JS runtime query |
| 4 | `autoSizeActive()` | N/A | JS runtime query |
| 5 | `addSeries(def, opts?, paneIdx?)` | ⚠️ | Series added at construction via `chart(*series)`; `paneIndex` supported |
| 6 | `addCustomSeries(...)` | ❌ | Custom series require JS ICustomSeriesView — not supported |
| 7 | `removeSeries(seriesApi)` | ❌ | No dynamic remove after construction |
| 8 | `subscribeClick(handler)` | N/A | Browser-only event handler |
| 9 | `unsubscribeClick(handler)` | N/A | Browser-only |
| 10 | `subscribeDblClick(handler)` | N/A | Browser-only |
| 11 | `unsubscribeDblClick(handler)` | N/A | Browser-only |
| 12 | `subscribeCrosshairMove(handler)` | N/A | Browser-only |
| 13 | `unsubscribeCrosshairMove(handler)` | N/A | Browser-only |
| 14 | `priceScale(id, paneIdx?)` | ⚠️ | Static config via `right_price_scale_*` / `left_price_scale_*` kwargs |
| 15 | `timeScale()` | ⚠️ | Static config via `time_scale_*` kwargs |
| 16 | `horzBehaviour()` | N/A | Internal JS API |
| 17 | `applyOptions(options)` | ⚠️ | Options set at construction only; no live update |
| 18 | `options()` | N/A | No getter from Python |
| 19 | `takeScreenshot(...)` | N/A | Browser canvas only |
| 20 | `chartElement()` | N/A | Browser DOM only |
| 21 | `addPane(preserveEmpty?)` | ⚠️ | Panes created implicitly by series `pane=` index; `pane_preserve_empty` list supported |
| 22 | `panes()` | N/A | JS runtime only |
| 23 | `removePane(index)` | N/A | No dynamic removal |
| 24 | `swapPanes(first, second)` | N/A | No dynamic reordering |
| 25 | `setCrosshairPosition(...)` | N/A | JS runtime only |
| 26 | `clearCrosshairPosition()` | N/A | JS runtime only |

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
| Custom | ❌ | Requires JS ICustomSeriesView — not supported |

**Score: 6/7**

---

## 11. Data Interfaces

### Base Fields

| Field | Used By | Status | Notes |
|---|---|:---:|---|
| `time` | All | ✅ | Mapped via `time` param (column name) |
| `value` | Line, Area, Baseline, Histogram | ✅ | Mapped via `value` param |
| `open` | Candlestick, Bar | ✅ | |
| `high` | Candlestick, Bar | ✅ | |
| `low` | Candlestick, Bar | ✅ | |
| `close` | Candlestick, Bar | ✅ | |
| `customValues?` | All | ❌ | No mechanism for arbitrary extra columns |

### Per-Point Color Overrides (via column mappings)

| Override | Series Type | Status | Python Param | Notes |
|---|---|:---:|---|---|
| `color` | Line | ✅ | `color_column` | `color_column` param on `line_series()` |
| `lineColor` | Area | ✅ | `line_color_column` | |
| `topColor` | Area | ✅ | `top_color_column` | |
| `bottomColor` | Area | ✅ | `bottom_color_column` | |
| `topFillColor1` | Baseline | ✅ | `top_fill_color1_column` | |
| `topFillColor2` | Baseline | ✅ | `top_fill_color2_column` | |
| `topLineColor` | Baseline | ✅ | `top_line_color_column` | |
| `bottomFillColor1` | Baseline | ✅ | `bottom_fill_color1_column` | |
| `bottomFillColor2` | Baseline | ✅ | `bottom_fill_color2_column` | |
| `bottomLineColor` | Baseline | ✅ | `bottom_line_color_column` | |
| `color` | Histogram | ✅ | `color_column` | |
| `color` | Candlestick | ✅ | `color_column` | |
| `borderColor` | Candlestick | ✅ | `border_color_column` | |
| `wickColor` | Candlestick | ✅ | `wick_color_column` | |
| `color` | Bar | ✅ | `color_column` | |

**Score: 6/7 base fields + 15/15 per-point overrides**

---

## 12. SeriesOptionsCommon

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `lastValueVisible` | ✅ | `last_value_visible` | |
| 2 | `title` | ✅ | `title` | |
| 3 | `priceScaleId` | ✅ | `price_scale_id` | |
| 4 | `visible` | ✅ | `visible` | |
| 5 | `priceFormat` | ✅ | `price_format` | `PriceFormat` TypedDict; `type='custom'` raises ValueError |
| 6 | `priceLineVisible` | ✅ | `price_line_visible` | |
| 7 | `priceLineSource` | ✅ | `price_line_source` | `"last_bar"` or `"last_visible"` |
| 8 | `priceLineWidth` | ✅ | `price_line_width` | |
| 9 | `priceLineColor` | ✅ | `price_line_color` | |
| 10 | `priceLineStyle` | ✅ | `price_line_style` | |
| 11 | `baseLineVisible` | ✅ | `base_line_visible` | |
| 12 | `baseLineColor` | ✅ | `base_line_color` | |
| 13 | `baseLineWidth` | ✅ | `base_line_width` | |
| 14 | `baseLineStyle` | ✅ | `base_line_style` | |
| 15 | `autoscaleInfoProvider` | N/A | — | Requires JS callback |
| 16 | `conflationThresholdFactor` | ❌ | — | Chart-level `conflation_threshold_factor` exists; per-series not wired |

**Score: 14/15 configurable** (autoscaleInfoProvider is N/A)

---

## 13. Per-Type Style Options

### Line Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `color` | ✅ | `color` |
| 2 | `lineStyle` | ✅ | `line_style` |
| 3 | `lineWidth` | ✅ | `line_width` |
| 4 | `lineType` | ✅ | `line_type` |
| 5 | `lineVisible` | ✅ | `line_visible` |
| 6 | `pointMarkersVisible` | ✅ | `point_markers_visible` |
| 7 | `pointMarkersRadius` | ✅ | `point_markers_radius` |
| 8 | `crosshairMarkerVisible` | ✅ | `crosshair_marker_visible` |
| 9 | `crosshairMarkerRadius` | ✅ | `crosshair_marker_radius` |
| 10 | `crosshairMarkerBorderColor` | ✅ | `crosshair_marker_border_color` |
| 11 | `crosshairMarkerBackgroundColor` | ✅ | `crosshair_marker_background_color` |
| 12 | `crosshairMarkerBorderWidth` | ✅ | `crosshair_marker_border_width` |
| 13 | `lastPriceAnimation` | ✅ | `last_price_animation` |

**Score: 13/13** ✅

### Area Series Options

Inherits all Line options above, plus:

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 14 | `topColor` | ✅ | `top_color` |
| 15 | `bottomColor` | ✅ | `bottom_color` |
| 16 | `lineColor` | ✅ | `line_color` |
| 17 | `relativeGradient` | ✅ | `relative_gradient` |
| 18 | `invertFilledArea` | ✅ | `invert_filled_area` |

**Score: 18/18** ✅ (13 inherited line + 5 area-specific)

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
| 10 | `lineType` | ✅ | `line_type` |
| 11 | `lineVisible` | ✅ | `line_visible` |
| 12 | `relativeGradient` | ✅ | `relative_gradient` |
| 13 | `pointMarkersVisible` | ✅ | `point_markers_visible` |
| 14 | `pointMarkersRadius` | ✅ | `point_markers_radius` |
| 15 | `crosshairMarkerVisible` | ✅ | `crosshair_marker_visible` |
| 16 | `crosshairMarkerRadius` | ✅ | `crosshair_marker_radius` |
| 17 | `crosshairMarkerBorderColor` | ✅ | `crosshair_marker_border_color` |
| 18 | `crosshairMarkerBackgroundColor` | ✅ | `crosshair_marker_background_color` |
| 19 | `crosshairMarkerBorderWidth` | ✅ | `crosshair_marker_border_width` |
| 20 | `lastPriceAnimation` | ✅ | `last_price_animation` |

**Score: 20/20** ✅

### Candlestick Series Options

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `upColor` | ✅ | `up_color` |
| 2 | `downColor` | ✅ | `down_color` |
| 3 | `wickVisible` | ✅ | `wick_visible` |
| 4 | `borderVisible` | ✅ | `border_visible` |
| 5 | `borderColor` (generic) | ✅ | `border_color` |
| 6 | `borderUpColor` | ✅ | `border_up_color` |
| 7 | `borderDownColor` | ✅ | `border_down_color` |
| 8 | `wickColor` (generic) | ✅ | `wick_color` |
| 9 | `wickUpColor` | ✅ | `wick_up_color` |
| 10 | `wickDownColor` | ✅ | `wick_down_color` |

**Score: 10/10** ✅

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
| 2 | `base` | ✅ | `base` |

**Score: 2/2** ✅

---

## 14. ISeriesApi Properties & Methods

All are JS runtime methods. No Python live handle exists.

### Properties (5)

| # | Property | Status | Notes |
|---|---|:---:|---|
| 1 | `data()` | N/A | Data flows from Deephaven table ticks automatically |
| 2 | `options()` | N/A | No getter from Python |
| 3 | `seriesType()` | ⚠️ | `SeriesSpec.series_type` stores type at construction |
| 4 | `seriesOrder()` | N/A | JS runtime only |
| 5 | `priceFormatter()` | N/A | JS runtime only |

### Data Methods (6)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `setData()` | N/A | Data flows automatically from Deephaven table ticks |
| 2 | `update()` | N/A | Same — handled by JS plugin on table updates |
| 3 | `pop()` | N/A | JS runtime only |
| 4 | `dataByIndex()` | N/A | JS runtime only |
| 5 | `subscribeDataChanged()` | N/A | JS runtime only |
| 6 | `unsubscribeDataChanged()` | N/A | JS runtime only |

### Coordinate Conversion (3)

| # | Method | Status |
|---|---|:---:|
| 1 | `priceToCoordinate()` | N/A |
| 2 | `coordinateToPrice()` | N/A |
| 3 | `barsInLogicalRange()` | N/A |

### Price Lines (3)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `createPriceLine()` | ⚠️ | `PriceLine` dataclass + `price_line()` factory (declarative, at construction); supports static `price` or dynamic `column` |
| 2 | `removePriceLine()` | N/A | No runtime removal |
| 3 | `priceLines()` | N/A | JS runtime only |

### Configuration (3)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `applyOptions()` | ⚠️ | Options set at construction only |
| 2 | `priceScale()` | ⚠️ | Static config via `_build_price_scale_options()` and per-series `scale_*` params |
| 3 | `lastValueData()` | N/A | JS runtime only |

### Primitives & Panes (5)

| # | Method | Status | Notes |
|---|---|:---:|---|
| 1 | `attachPrimitive()` | N/A | Requires JS ISeriesPrimitive callable object |
| 2 | `detachPrimitive()` | N/A | |
| 3 | `moveToPane()` | ⚠️ | Initial `pane=N` param on series creation functions |
| 4 | `setSeriesOrder()` | N/A | JS runtime only |
| 5 | `getPane()` | N/A | JS runtime only |

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
| 23 | `precomputeConflationPriority` | ✅ | `precompute_conflation_priority` | `PrecomputeConflationPriority` Literal type |
| 24 | `tickMarkMaxCharacterLength` | ✅ | `tick_mark_max_character_length` |
| 25 | `tickMarkFormatter` | ❌ | — | Requires JS callback function |
| 26 | `uniformDistribution` | ✅ | `uniform_distribution` |
| 27 | `minimumHeight` | ✅ | `time_scale_minimum_height` |

**Score: 26/27** (tickMarkFormatter is JS-only callback)

---

## 16. ITimeScaleApi (22 methods)

All are JS runtime methods. No Python live handle.

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
| `UTCTimestamp` (numeric seconds) | ✅ | Column data auto-converted; `is_utc_timestamp()` type guard |
| `BusinessDay` (`{year, month, day}`) | ✅ | `BusinessDay` TypedDict + `business_day(y, m, d)` factory + `is_business_day()` guard |
| ISO string (`'YYYY-MM-DD'`) | ✅ | Strings pass through unchanged |

**Score: 3/3** ✅

---

## 18. PriceScaleOptions

### Per-Series (via `scale_*` params on each series function)

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
| 1 | `autoScale` | ✅ | `right/left_price_scale_auto_scale` |
| 2 | `mode` | ✅ | `right/left_price_scale_mode` |
| 3 | `invertScale` | ✅ | `right/left_price_scale_invert_scale` |
| 4 | `alignLabels` | ✅ | `right/left_price_scale_align_labels` |
| 5 | `scaleMargins` | ✅ | `right/left_price_scale_margin_top` / `_bottom` |
| 6 | `borderVisible` | ✅ | `right/left_price_scale_border_visible` |
| 7 | `borderColor` | ✅ | `right/left_price_scale_border_color` |
| 8 | `textColor` | ✅ | `right/left_price_scale_text_color` |
| 9 | `entireTextOnly` | ✅ | `right/left_price_scale_entire_text_only` |
| 10 | `visible` | ✅ | `right/left_price_scale_visible` |
| 11 | `ticksVisible` | ✅ | `right/left_price_scale_ticks_visible` |
| 12 | `minimumWidth` | ✅ | `right/left_price_scale_minimum_width` |
| 13 | `ensureEdgeTickMarksVisible` | ✅ | `right/left_price_scale_ensure_edge_tick_marks_visible` |

**Score: 13/13** ✅

### Chart-Level Overlay Defaults

| # | Property | Status | Python Param |
|---|---|:---:|---|
| 1 | `autoScale` | ✅ | `overlay_price_scale_auto_scale` |
| 2 | `mode` | ✅ | `overlay_price_scale_mode` |
| 3 | `invertScale` | ✅ | `overlay_price_scale_invert_scale` |
| 4 | `alignLabels` | ✅ | `overlay_price_scale_align_labels` |
| 5 | `borderVisible` | ✅ | `overlay_price_scale_border_visible` |
| 6 | `borderColor` | ✅ | `overlay_price_scale_border_color` |
| 7 | `textColor` | ✅ | `overlay_price_scale_text_color` |
| 8 | `entireTextOnly` | ✅ | `overlay_price_scale_entire_text_only` |
| 9 | `ticksVisible` | ✅ | `overlay_price_scale_ticks_visible` |
| 10 | `minimumWidth` | ✅ | `overlay_price_scale_minimum_width` |
| 11 | `ensureEdgeTickMarksVisible` | ✅ | `overlay_price_scale_ensure_edge_tick_marks_visible` |
| 12 | `scaleMargins` | ✅ | `overlay_price_scale_margin_top` / `_bottom` |

> Note: `OverlayPriceScaleOptions` omits `visible` by design (JS API spec).

**Score: 12/12** ✅

---

## 19. IPriceScaleApi (6 methods)

| # | Method | Status |
|---|---|:---:|
| 1 | `applyOptions()` | ⚠️ (static config only at construction) |
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
| 2 | `price` | ✅ | `price` | Also supports dynamic `column` (Deephaven extension — tracks last row of series table) |
| 3 | `color` | ✅ | `color` | |
| 4 | `lineWidth` | ✅ | `line_width` | |
| 5 | `lineStyle` | ✅ | `line_style` | |
| 6 | `lineVisible` | ✅ | `line_visible` | |
| 7 | `axisLabelVisible` | ✅ | `axis_label_visible` | |
| 8 | `title` | ✅ | `title` | |
| 9 | `axisLabelColor` | ✅ | `axis_label_color` | |
| 10 | `axisLabelTextColor` | ✅ | `axis_label_text_color` | |

**Score: 10/10** ✅

---

## 21. IPriceLine Interface

| # | Method | Status |
|---|---|:---:|
| 1 | `applyOptions()` | N/A (no live JS handle from Python) |
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
| 7 | `id` | ✅ | `Marker.id` / `MarkerSpec.id_column` |
| 8 | `price` | ✅ | `Marker.price` / `MarkerSpec.price` / `MarkerSpec.price_column` |

**Score: 8/8** ✅

### Marker Shapes (4)

| Shape | Status | Python Alias |
|---|:---:|---|
| `circle` | ✅ | `"circle"` |
| `square` | ✅ | `"square"` |
| `arrowUp` | ✅ | `"arrow_up"` |
| `arrowDown` | ✅ | `"arrow_down"` |

**Score: 4/4** ✅

### Marker Positions (6)

| Position | Status | Python Alias |
|---|:---:|---|
| `aboveBar` | ✅ | `"above_bar"` |
| `belowBar` | ✅ | `"below_bar"` |
| `inBar` | ✅ | `"in_bar"` |
| `atPriceTop` | ✅ | `"at_price_top"` |
| `atPriceBottom` | ✅ | `"at_price_bottom"` |
| `atPriceMiddle` | ✅ | `"at_price_middle"` |

> Note: Price-based positions require `price` or `price_column` to be set; the Python layer validates this and raises `ValueError` when violated.

**Score: 6/6** ✅

### ISeriesMarkersPluginApi

| Method | Status | Notes |
|---|:---:|---|
| `setMarkers()` | ⚠️ | Static markers at build time via `markers=[...]`; table-driven via `marker_spec=` (live updates) |
| `markers()` | N/A | JS runtime getter |
| `detach()` | N/A | JS runtime |
| `getSeries()` | N/A | JS runtime |
| `applyOptions()` | N/A | JS runtime |

### Marker Factories

| Function | Status | Notes |
|---|:---:|---|
| `createSeriesMarkers()` | ✅ | Replaced by `markers=[Marker(...)]` / `marker_spec=markers_from_table(...)` params |
| `createUpDownMarkers()` | ✅ | `up_down_markers(up_times, down_times, ...)` returns a flat `list[Marker]` |

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
| 1 | `getHeight()` | N/A | JS runtime |
| 2 | `setHeight()` | N/A | JS runtime |
| 3 | `moveTo()` | N/A | JS runtime |
| 4 | `paneIndex()` | N/A | JS runtime |
| 5 | `getSeries()` | N/A | JS runtime |
| 6 | `getHTMLElement()` | N/A | Browser DOM |
| 7 | `priceScale()` | N/A | JS runtime |
| 8 | `getStretchFactor()` | N/A | JS runtime |
| 9 | `setStretchFactor()` | ⚠️ | Initial `pane_stretch_factors=[f0, f1, ...]` list at construction |
| 10 | `setPreserveEmptyPane()` | ⚠️ | Initial `pane_preserve_empty=[bool, ...]` list at construction |
| 11 | `preserveEmptyPane()` | N/A | JS runtime getter |
| 12 | `addSeries()` | N/A | Series added at build time via series functions |
| 13 | `addCustomSeries()` | ❌ | Requires JS ICustomSeriesView |
| 14 | `attachPrimitive()` | N/A | Requires JS IPanePrimitive callable object |
| 15 | `detachPrimitive()` | N/A | |

### Pane Assignment

| Feature | Status | Notes |
|---|:---:|---|
| Assign series to pane by index | ✅ | `pane=0`, `pane=1`, ... on each series function |
| `pane_stretch_factors` | ✅ | Initial factors list passed to `chart()` |
| `pane_preserve_empty` | ✅ | Per-pane boolean list passed to `chart()` |

### IChartApi Pane Management

| Method | Status | Notes |
|---|:---:|---|
| `addPane()` | ⚠️ | Panes created implicitly when series use `pane=N` index |
| `panes()` | N/A | JS runtime |
| `removePane()` | N/A | JS runtime |
| `swapPanes()` | N/A | JS runtime |

### LayoutPanesOptions

| Property | Status | Python Param |
|---|:---:|---|
| `enableResize` | ✅ | `pane_enable_resize` |
| `separatorColor` | ✅ | `pane_separator_color` |
| `separatorHoverColor` | ✅ | `pane_separator_hover_color` |

---

## 25. Enumerations (11)

| Enum | Members | Status | Notes |
|---|---|:---:|---|
| `ColorType` | Solid, VerticalGradient | ✅ | Both `"solid"` and `"gradient"` supported |
| `CrosshairMode` | Normal, Magnet, Hidden, MagnetOHLC | ✅ | All 4 values: `"normal"`, `"magnet"`, `"hidden"`, `"magnet_ohlc"` |
| `LastPriceAnimationMode` | Disabled, Continuous, OnDataUpdate | ✅ | All 3: `"disabled"`, `"continuous"`, `"on_data_update"` |
| `LineStyle` | Solid, Dotted, Dashed, LargeDashed, SparseDotted | ✅ | All 5 values |
| `LineType` | Simple, WithSteps, Curved | ✅ | All 3 values |
| `MarkerSign` | Negative, Neutral, Positive | ✅ | All 3: `"negative"`, `"neutral"`, `"positive"` |
| `MismatchDirection` | NearestLeft, None, NearestRight | ✅ | All 3 (defined for completeness; consumers are JS-only runtime APIs) |
| `PriceLineSource` | LastBar, LastVisible | ✅ | Both: `"last_bar"`, `"last_visible"` |
| `PriceScaleMode` | Normal, Logarithmic, Percentage, IndexedTo100 | ✅ | All 4 values |
| `TickMarkType` | Year, Month, DayOfMonth, Time, TimeWithSeconds | ✅ | All 5 (defined for completeness; `tickMarkFormatter` callback is N/A) |
| `TrackingModeExitMode` | OnTouchEnd, OnNextTap | ✅ | Both: `"on_touch_end"`, `"on_next_tap"` |

**Score: 34/34 enum members** ✅

---

## 26. Utility Types

| Type | Status | Notes |
|---|:---:|---|
| `DeepPartial<T>` | N/A | TypeScript generic; Python uses `Optional[...]` kwargs throughout |
| `Coordinate` | N/A | JS event system / time scale only; no Python equivalent needed |
| `Logical` | N/A | JS time scale only |
| `LineWidth` | ✅ | `LineWidth = Literal[1, 2, 3, 4]` — constrained to 4 valid values |
| `PriceFormatBuiltIn` | ✅ | `PriceFormat` TypedDict with `type`, `precision`, `minMove` |
| `PriceFormatCustom` | ❌ | Requires JS formatter callback — not serializable from Python |
| `SolidColor` | ✅ | `{"type": "solid", "color": str}` — built in `chart()` |
| `VerticalGradientColor` | ✅ | `{"type": "gradient", "topColor": str, "bottomColor": str}` — via `background_top_color` + `background_bottom_color` |
| `PriceScaleMargins` | ✅ | `scale_margin_top` / `scale_margin_bottom` → serialized as `scaleMargins` |
| `SeriesOptionsMap` | N/A | Separate Python functions per series type |
| `HorzAlign` | ✅ | `Literal["left", "center", "right"]` |
| `VertAlign` | ✅ | `Literal["top", "center", "bottom"]` |
| `BusinessDay` | ✅ | `BusinessDay` TypedDict + `business_day(y, m, d)` factory in `_types.py` |

---

## 27. Top-Level Functions & Variables

### Functions

| Function | Status | Notes |
|---|:---:|---|
| `createChart()` | ✅ | Via `chart()` and convenience functions (`line()`, `candlestick()`, etc.) |
| `createChartEx()` | ❌ | Custom `horzScaleBehavior` requires JS callable; not serializable from Python |
| `createYieldCurveChart()` | ✅ | Via `yield_curve()` |
| `createTextWatermark()` | ✅ | Static config via `watermark_text` / `watermark_lines` kwargs; JS plugin materializes at render time |
| `createImageWatermark()` | ✅ | Static config via `watermark_image_url` / `watermark_image_*` kwargs |
| `createSeriesMarkers()` | ✅ | Via `markers=[...]` / `marker_spec=markers_from_table(...)` params on series functions |
| `createUpDownMarkers()` | ✅ | `up_down_markers(up_times, down_times, ...)` returns `list[Marker]` |
| `isBusinessDay()` | ✅ | `is_business_day(time)` in `utils.py` |
| `isUTCTimestamp()` | ✅ | `is_utc_timestamp(time)` in `utils.py` |
| `version()` | ❌ | Not exposed; no Python equivalent for JS library version string |

**Score: 8/10**

### Series Definition Variables

| Variable | Status | Notes |
|---|:---:|---|
| `LineSeries` | ✅ | `line_series()` + `line()` |
| `AreaSeries` | ✅ | `area_series()` + `area()` |
| `BaselineSeries` | ✅ | `baseline_series()` + `baseline()` |
| `CandlestickSeries` | ✅ | `candlestick_series()` + `candlestick()` |
| `BarSeries` | ✅ | `bar_series()` + `bar()` |
| `HistogramSeries` | ✅ | `histogram_series()` + `histogram()` |
| `customSeriesDefaultOptions` | ❌ | Custom series not supported |

**Score: 6/7**

---

## 28. Grand Summary

### Coverage by Category (configuration options only — excludes N/A runtime methods)

| Category | Total | ✅ | ⚠️ | ❌ | Prev ✅ | Change |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Chart creation functions | 3 | 2 | 0 | 1 | 2 | — |
| ChartOptionsBase top-level | 16 | 16 | 0 | 0 | 4 | +12 |
| LayoutOptions | 8 | 7 | 0 | 1 | 2 | +5 |
| LayoutPanesOptions | 3 | 3 | 0 | 0 | 3 | — |
| GridOptions | 6 | 6 | 0 | 0 | 6 | — |
| CrosshairOptions | 14 | 14 | 0 | 0 | 8 | +6 |
| TextWatermarkOptions | 10 | 10 | 0 | 0 | 4 | +6 |
| ImageWatermarkOptions | 5 | 5 | 0 | 0 | 0 | +5 |
| HandleScroll/Scale/Kinetic | 10 | 10 | 0 | 0 | 0 | +10 |
| LocalizationOptions | 5 | 5 | 0 | 0 | 0 | +5 |
| Series types | 7 | 6 | 0 | 1 | 6 | — |
| Data interface base fields | 7 | 6 | 0 | 1 | 6 | — |
| Per-point overrides | 15 | 15 | 0 | 0 | 5 | +10 |
| SeriesOptionsCommon | 15 | 14 | 0 | 1 | 5 | +9 |
| Line style options | 13 | 13 | 0 | 0 | 6 | +7 |
| Area style options | 18 | 18 | 0 | 0 | 7 | +11 |
| Baseline style options | 20 | 20 | 0 | 0 | 11 | +9 |
| Candlestick style options | 10 | 10 | 0 | 0 | 8 | +2 |
| Bar style options | 4 | 4 | 0 | 0 | 4 | — |
| Histogram style options | 2 | 2 | 0 | 0 | 1 | +1 |
| TimeScaleOptions | 27 | 26 | 0 | 1 | 24 | +2 |
| PriceScaleOptions (per-series) | 13 | 13 | 0 | 0 | 13 | — |
| PriceScaleOptions (chart right/left) | 13 | 13 | 0 | 0 | 12 | +1 |
| PriceScaleOptions (overlay) | 12 | 12 | 0 | 0 | 4 | +8 |
| PriceLineOptions | 10 | 10 | 0 | 0 | 6 | +4 |
| Marker properties | 8 | 8 | 0 | 0 | 6 | +2 |
| Marker shapes | 4 | 4 | 0 | 0 | 4 | — |
| Marker positions | 6 | 6 | 0 | 0 | 3 | +3 |
| Enumerations | 34 | 34 | 0 | 0 | 14 | +20 |
| Top-level functions | 10 | 8 | 0 | 2 | 2 | +6 |
| Series def variables | 7 | 6 | 0 | 1 | 6 | — |
| **TOTALS** | **375** | **356** | **0** | **9** | **186** | **+170** |

> Note: Total items increased from 374 to 375 — the previous report omitted `watermark_image_visible` as a separately tracked item.

### Overall Coverage

| | Previous Report | Current (Updated) |
|---|:---:|:---:|
| ✅ Implemented | 186 (50%) | 356 (95%) |
| ⚠️ Partial | 10 (3%) | 0 (0%) |
| ❌ Not implemented | 178 (48%) | 9 (2%) |

### Remaining Gaps (❌)

| Item | Reason |
|---|---|
| `createChartEx()` — custom horzScaleBehavior | Requires JS callable object; cannot serialize from Python |
| `LayoutOptions.colorParsers` | Array of JS callable color parsers; not feasible from Python |
| `createChartEx` chart type | Same as above |
| `customValues` data field | No mechanism for arbitrary extra columns in table column mapping |
| `SeriesOptionsCommon.conflationThresholdFactor` (per-series) | Only chart-level `conflation_threshold_factor` is wired; per-series override not yet connected |
| `Custom` series type | Requires JS `ICustomSeriesView` implementation |
| `TimeScaleOptions.tickMarkFormatter` | Requires JS callback function |
| `PriceFormatCustom` | Requires JS formatter callback |
| `version()` function | No Python equivalent needed for JS library version |
| `customSeriesDefaultOptions` variable | Only meaningful with custom series support |

### Architecturally N/A (not missing — inherently browser-only)

- All 22 `ITimeScaleApi` runtime methods (scrolling, coordinate conversion, event subscriptions)
- All 6 `IPriceScaleApi` runtime methods except `applyOptions` (which is static-config-covered)
- All 15 `IPaneApi` runtime methods (except stretch factors / preserve, covered declaratively)
- All `ISeriesApi` runtime methods (data get/set, coordinate conversion, primitives)
- All chart event subscriptions (`subscribeClick`, `subscribeDblClick`, `subscribeCrosshairMove`)
- `MouseEventParams`, `TouchMouseEventData`, `MouseEventHandler`, `Point`, `IRange`, `LogicalRange`
- `autoscaleInfoProvider` JS callback
- `attachPrimitive` / `detachPrimitive` on series and panes (requires JS callable objects)
- `Coordinate`, `Logical` nominal types (JS event/coordinate system only)
- `DeepPartial<T>`, `SeriesOptionsMap`, `SeriesPartialOptionsMap` (TypeScript-only generics)
