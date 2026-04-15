"""Series creation functions for TradingView Lightweight Charts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .options import (
    LastPriceAnimationMode,
    LineStyle,
    LineType,
    LineWidth,
    PriceFormat,
    PriceLineSource,
    PriceScaleMode,
    LAST_PRICE_ANIMATION_MODE_MAP,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
    PRICE_LINE_SOURCE_MAP,
    PRICE_SCALE_MODE_MAP,
)
from .markers import Marker, PriceLine, MarkerSpec

# TODO: createUpDownMarkers plugin support — see notes/coverage-plan/18-utility-types-and-functions.md §3.3
# When implementing, add up_down_markers, up_down_marker_up_color, up_down_marker_down_color
# params to series creation functions and serialize as seriesOptions.upDownMarkers.


def _validate_price_format(price_format: Optional[PriceFormat]) -> None:
    """Raise ValueError if price_format uses the unsupported 'custom' type."""
    if price_format is not None and price_format.get("type") == "custom":
        raise ValueError(
            "PriceFormatCustom (type='custom') is not supported by the Python plugin. "
            "The TradingView JS API requires a JavaScript formatter callback which "
            "cannot be serialized from Python. Use type='price', 'volume', or 'percent'."
        )


@dataclass
class SeriesSpec:
    """Specification for a chart series."""

    series_type: str  # "Candlestick", "Bar", "Line", "Area", "Baseline", "Histogram"
    table: Any  # Deephaven Table
    column_mapping: dict  # {"time": "Timestamp", "open": "Open", ...}
    options: dict = field(default_factory=dict)
    markers: Optional[list[Marker]] = None
    price_lines: Optional[list[PriceLine]] = None
    marker_spec: Optional[MarkerSpec] = None
    price_scale_options: dict = field(default_factory=dict)
    pane: Optional[int] = None

    def to_dict(
        self, series_id: str, table_id: int, marker_table_id: int | None = None
    ) -> dict:
        """Serialize to dict for JSON transport."""
        result = {
            "id": series_id,
            "type": self.series_type,
            "options": self.options,
            "dataMapping": {
                "tableId": table_id,
                "columns": self.column_mapping,
            },
        }
        if self.markers:
            result["markers"] = [m.to_dict() for m in self.markers]
        if self.price_lines:
            result["priceLines"] = [pl.to_dict() for pl in self.price_lines]
        if self.marker_spec is not None and marker_table_id is not None:
            result["markerSpec"] = self.marker_spec.to_dict(marker_table_id)
        if self.price_scale_options:
            result["priceScaleOptions"] = self.price_scale_options
        if self.pane is not None:
            result["paneIndex"] = self.pane
        return result


def _filter_none(d: dict) -> dict:
    """Remove None values from a dict."""
    return {k: v for k, v in d.items() if v is not None}


def _resolve_line_style(style: Optional[LineStyle]) -> Optional[int]:
    if style is None:
        return None
    if style not in LINE_STYLE_MAP:
        raise ValueError(
            f"Invalid line_style {style!r}. Must be one of {list(LINE_STYLE_MAP)}"
        )
    return LINE_STYLE_MAP[style]


def _resolve_line_type(line_type: Optional[LineType]) -> Optional[int]:
    if line_type is None:
        return None
    if line_type not in LINE_TYPE_MAP:
        raise ValueError(
            f"Invalid line_type {line_type!r}. Must be one of {list(LINE_TYPE_MAP)}"
        )
    return LINE_TYPE_MAP[line_type]


def _resolve_last_price_animation(
    mode: Optional[LastPriceAnimationMode],
) -> Optional[int]:
    if mode is None:
        return None
    if mode not in LAST_PRICE_ANIMATION_MODE_MAP:
        raise ValueError(
            f"Invalid last_price_animation {mode!r}. Must be one of {list(LAST_PRICE_ANIMATION_MODE_MAP)}"
        )
    return LAST_PRICE_ANIMATION_MODE_MAP[mode]


def _build_price_scale_options(
    auto_scale: Optional[bool],
    scale_margin_top: Optional[float],
    scale_margin_bottom: Optional[float],
    mode: Optional[PriceScaleMode] = None,
    invert_scale: Optional[bool] = None,
    align_labels: Optional[bool] = None,
    border_visible: Optional[bool] = None,
    border_color: Optional[str] = None,
    text_color: Optional[str] = None,
    entire_text_only: Optional[bool] = None,
    scale_visible: Optional[bool] = None,
    ticks_visible: Optional[bool] = None,
    minimum_width: Optional[int] = None,
    ensure_edge_tick_marks_visible: Optional[bool] = None,
) -> dict:
    """Build priceScaleOptions dict from kwargs."""
    opts = _filter_none(
        {
            "autoScale": auto_scale,
            "mode": PRICE_SCALE_MODE_MAP.get(mode) if mode is not None else None,
            "invertScale": invert_scale,
            "alignLabels": align_labels,
            "borderVisible": border_visible,
            "borderColor": border_color,
            "textColor": text_color,
            "entireTextOnly": entire_text_only,
            "visible": scale_visible,
            "ticksVisible": ticks_visible,
            "minimumWidth": minimum_width,
            "ensureEdgeTickMarksVisible": ensure_edge_tick_marks_visible,
        }
    )
    margins = _filter_none({"top": scale_margin_top, "bottom": scale_margin_bottom})
    if margins:
        opts["scaleMargins"] = margins
    return opts


def _build_common_options(
    last_value_visible: Optional[bool],
    title: Optional[str],
    visible: Optional[bool],
    price_scale_id: Optional[str],
    price_format: Optional[PriceFormat],
    price_line_visible: Optional[bool],
    price_line_source: Optional[PriceLineSource],
    price_line_width: Optional[LineWidth],
    price_line_color: Optional[str],
    price_line_style: Optional[LineStyle],
    base_line_visible: Optional[bool],
    base_line_color: Optional[str],
    base_line_width: Optional[LineWidth],
    base_line_style: Optional[LineStyle],
) -> dict:
    """Build the SeriesOptionsCommon portion of the series options dict.

    Returns a dict with only non-None entries, ready to be merged into the
    per-type options dict via ``{**_build_common_options(...), ...}``.

    Price Line (last-price horizontal rule):
        price_line_visible: Show the price line. Default True.
        price_line_source:  "last_bar" or "last_visible". Default "last_bar".
        price_line_width:   Line width 1-4 px. Default 1.
        price_line_color:   CSS color string. Empty string uses series color.
        price_line_style:   LineStyle value. Default "dashed".

    Baseline (zero/index line in percentage/indexed-to-100 modes):
        base_line_visible: Show the baseline. Default True.
        base_line_color:   CSS color string. Default "#B2B5BE".
        base_line_width:   Line width 1-4 px. Default 1.
        base_line_style:   LineStyle value. Default "solid".
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
    border_color: Optional[str] = None,
    border_up_color: Optional[str] = None,
    border_down_color: Optional[str] = None,
    wick_visible: Optional[bool] = None,
    wick_color: Optional[str] = None,
    wick_up_color: Optional[str] = None,
    wick_down_color: Optional[str] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    last_value_visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[LineWidth] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[LineWidth] = None,
    base_line_style: Optional[LineStyle] = None,
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
    color_column: Optional[str] = None,
    border_color_column: Optional[str] = None,
    wick_color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a candlestick series specification."""
    _validate_price_format(price_format)
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
                "upColor": up_color,
                "downColor": down_color,
                "borderVisible": border_visible,
                "borderColor": border_color,
                "borderUpColor": border_up_color,
                "borderDownColor": border_down_color,
                "wickVisible": wick_visible,
                "wickColor": wick_color,
                "wickUpColor": wick_up_color,
                "wickDownColor": wick_down_color,
            }
        ),
    }
    column_mapping = {
        "time": time,
        "open": open,
        "high": high,
        "low": low,
        "close": close,
    }
    if color_column is not None:
        column_mapping["color"] = color_column
    if border_color_column is not None:
        column_mapping["borderColor"] = border_color_column
    if wick_color_column is not None:
        column_mapping["wickColor"] = wick_color_column
    return SeriesSpec(
        series_type="Candlestick",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(
            auto_scale,
            scale_margin_top,
            scale_margin_bottom,
            mode=scale_mode,
            invert_scale=scale_invert,
            align_labels=scale_align_labels,
            border_visible=scale_border_visible,
            border_color=scale_border_color,
            text_color=scale_text_color,
            entire_text_only=scale_entire_text_only,
            scale_visible=scale_visible,
            ticks_visible=scale_ticks_visible,
            minimum_width=scale_minimum_width,
            ensure_edge_tick_marks_visible=scale_ensure_edge_tick_marks_visible,
        ),
        pane=pane,
    )


def bar_series(
    table: Any,
    time: str = "Timestamp",
    open: str = "Open",
    high: str = "High",
    low: str = "Low",
    close: str = "Close",
    up_color: Optional[str] = None,
    down_color: Optional[str] = None,
    open_visible: Optional[bool] = None,
    thin_bars: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    last_value_visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[LineWidth] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[LineWidth] = None,
    base_line_style: Optional[LineStyle] = None,
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
    color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a bar (OHLC) series specification."""
    _validate_price_format(price_format)
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
                "upColor": up_color,
                "downColor": down_color,
                "openVisible": open_visible,
                "thinBars": thin_bars,
            }
        ),
    }
    column_mapping = {
        "time": time,
        "open": open,
        "high": high,
        "low": low,
        "close": close,
    }
    if color_column is not None:
        column_mapping["color"] = color_column
    return SeriesSpec(
        series_type="Bar",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(
            auto_scale,
            scale_margin_top,
            scale_margin_bottom,
            mode=scale_mode,
            invert_scale=scale_invert,
            align_labels=scale_align_labels,
            border_visible=scale_border_visible,
            border_color=scale_border_color,
            text_color=scale_text_color,
            entire_text_only=scale_entire_text_only,
            scale_visible=scale_visible,
            ticks_visible=scale_ticks_visible,
            minimum_width=scale_minimum_width,
            ensure_edge_tick_marks_visible=scale_ensure_edge_tick_marks_visible,
        ),
        pane=pane,
    )


def line_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,
    point_markers_visible: Optional[bool] = None,
    point_markers_radius: Optional[float] = None,
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    crosshair_marker_border_color: Optional[str] = None,
    crosshair_marker_background_color: Optional[str] = None,
    crosshair_marker_border_width: Optional[float] = None,
    last_price_animation: Optional[LastPriceAnimationMode] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[LineWidth] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[LineWidth] = None,
    base_line_style: Optional[LineStyle] = None,
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
    color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a line series specification."""
    _validate_price_format(price_format)
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
                "color": color,
                "lineWidth": line_width,
                "lineStyle": _resolve_line_style(line_style),
                "lineType": _resolve_line_type(line_type),
                "lineVisible": line_visible,
                "pointMarkersVisible": point_markers_visible,
                "pointMarkersRadius": point_markers_radius,
                "crosshairMarkerVisible": crosshair_marker_visible,
                "crosshairMarkerRadius": crosshair_marker_radius,
                "crosshairMarkerBorderColor": crosshair_marker_border_color,
                "crosshairMarkerBackgroundColor": crosshair_marker_background_color,
                "crosshairMarkerBorderWidth": crosshair_marker_border_width,
                "lastPriceAnimation": _resolve_last_price_animation(
                    last_price_animation
                ),
            }
        ),
    }
    column_mapping = {"time": time, "value": value}
    if color_column is not None:
        column_mapping["color"] = color_column
    return SeriesSpec(
        series_type="Line",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(
            auto_scale,
            scale_margin_top,
            scale_margin_bottom,
            mode=scale_mode,
            invert_scale=scale_invert,
            align_labels=scale_align_labels,
            border_visible=scale_border_visible,
            border_color=scale_border_color,
            text_color=scale_text_color,
            entire_text_only=scale_entire_text_only,
            scale_visible=scale_visible,
            ticks_visible=scale_ticks_visible,
            minimum_width=scale_minimum_width,
            ensure_edge_tick_marks_visible=scale_ensure_edge_tick_marks_visible,
        ),
        pane=pane,
    )


def area_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    line_color: Optional[str] = None,
    top_color: Optional[str] = None,
    bottom_color: Optional[str] = None,
    relative_gradient: Optional[bool] = None,
    invert_filled_area: Optional[bool] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,
    point_markers_visible: Optional[bool] = None,
    point_markers_radius: Optional[float] = None,
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    crosshair_marker_border_color: Optional[str] = None,
    crosshair_marker_background_color: Optional[str] = None,
    crosshair_marker_border_width: Optional[float] = None,
    last_price_animation: Optional[LastPriceAnimationMode] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[LineWidth] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[LineWidth] = None,
    base_line_style: Optional[LineStyle] = None,
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
    line_color_column: Optional[str] = None,
    top_color_column: Optional[str] = None,
    bottom_color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create an area series specification."""
    _validate_price_format(price_format)
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
                "lineColor": line_color,
                "topColor": top_color,
                "bottomColor": bottom_color,
                "relativeGradient": relative_gradient,
                "invertFilledArea": invert_filled_area,
                "lineWidth": line_width,
                "lineStyle": _resolve_line_style(line_style),
                "lineType": _resolve_line_type(line_type),
                "lineVisible": line_visible,
                "pointMarkersVisible": point_markers_visible,
                "pointMarkersRadius": point_markers_radius,
                "crosshairMarkerVisible": crosshair_marker_visible,
                "crosshairMarkerRadius": crosshair_marker_radius,
                "crosshairMarkerBorderColor": crosshair_marker_border_color,
                "crosshairMarkerBackgroundColor": crosshair_marker_background_color,
                "crosshairMarkerBorderWidth": crosshair_marker_border_width,
                "lastPriceAnimation": _resolve_last_price_animation(
                    last_price_animation
                ),
            }
        ),
    }
    column_mapping = {"time": time, "value": value}
    if line_color_column is not None:
        column_mapping["lineColor"] = line_color_column
    if top_color_column is not None:
        column_mapping["topColor"] = top_color_column
    if bottom_color_column is not None:
        column_mapping["bottomColor"] = bottom_color_column
    return SeriesSpec(
        series_type="Area",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(
            auto_scale,
            scale_margin_top,
            scale_margin_bottom,
            mode=scale_mode,
            invert_scale=scale_invert,
            align_labels=scale_align_labels,
            border_visible=scale_border_visible,
            border_color=scale_border_color,
            text_color=scale_text_color,
            entire_text_only=scale_entire_text_only,
            scale_visible=scale_visible,
            ticks_visible=scale_ticks_visible,
            minimum_width=scale_minimum_width,
            ensure_edge_tick_marks_visible=scale_ensure_edge_tick_marks_visible,
        ),
        pane=pane,
    )


def baseline_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    base_value: Optional[float] = None,
    top_line_color: Optional[str] = None,
    top_fill_color1: Optional[str] = None,
    top_fill_color2: Optional[str] = None,
    bottom_line_color: Optional[str] = None,
    bottom_fill_color1: Optional[str] = None,
    bottom_fill_color2: Optional[str] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,
    relative_gradient: Optional[bool] = None,
    point_markers_visible: Optional[bool] = None,
    point_markers_radius: Optional[float] = None,
    crosshair_marker_visible: Optional[bool] = None,
    crosshair_marker_radius: Optional[float] = None,
    crosshair_marker_border_color: Optional[str] = None,
    crosshair_marker_background_color: Optional[str] = None,
    crosshair_marker_border_width: Optional[float] = None,
    last_price_animation: Optional[LastPriceAnimationMode] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[LineWidth] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[LineWidth] = None,
    base_line_style: Optional[LineStyle] = None,
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
    top_line_color_column: Optional[str] = None,
    top_fill_color1_column: Optional[str] = None,
    top_fill_color2_column: Optional[str] = None,
    bottom_line_color_column: Optional[str] = None,
    bottom_fill_color1_column: Optional[str] = None,
    bottom_fill_color2_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a baseline series specification."""
    _validate_price_format(price_format)
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
                **(
                    {"baseValue": {"type": "price", "price": base_value}}
                    if base_value is not None
                    else {}
                ),
                "topLineColor": top_line_color,
                "topFillColor1": top_fill_color1,
                "topFillColor2": top_fill_color2,
                "bottomLineColor": bottom_line_color,
                "bottomFillColor1": bottom_fill_color1,
                "bottomFillColor2": bottom_fill_color2,
                "lineWidth": line_width,
                "lineStyle": _resolve_line_style(line_style),
                "lineType": _resolve_line_type(line_type),
                "lineVisible": line_visible,
                "relativeGradient": relative_gradient,
                "pointMarkersVisible": point_markers_visible,
                "pointMarkersRadius": point_markers_radius,
                "crosshairMarkerVisible": crosshair_marker_visible,
                "crosshairMarkerRadius": crosshair_marker_radius,
                "crosshairMarkerBorderColor": crosshair_marker_border_color,
                "crosshairMarkerBackgroundColor": crosshair_marker_background_color,
                "crosshairMarkerBorderWidth": crosshair_marker_border_width,
                "lastPriceAnimation": _resolve_last_price_animation(
                    last_price_animation
                ),
            }
        ),
    }
    column_mapping = {"time": time, "value": value}
    if top_line_color_column is not None:
        column_mapping["topLineColor"] = top_line_color_column
    if top_fill_color1_column is not None:
        column_mapping["topFillColor1"] = top_fill_color1_column
    if top_fill_color2_column is not None:
        column_mapping["topFillColor2"] = top_fill_color2_column
    if bottom_line_color_column is not None:
        column_mapping["bottomLineColor"] = bottom_line_color_column
    if bottom_fill_color1_column is not None:
        column_mapping["bottomFillColor1"] = bottom_fill_color1_column
    if bottom_fill_color2_column is not None:
        column_mapping["bottomFillColor2"] = bottom_fill_color2_column
    return SeriesSpec(
        series_type="Baseline",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(
            auto_scale,
            scale_margin_top,
            scale_margin_bottom,
            mode=scale_mode,
            invert_scale=scale_invert,
            align_labels=scale_align_labels,
            border_visible=scale_border_visible,
            border_color=scale_border_color,
            text_color=scale_text_color,
            entire_text_only=scale_entire_text_only,
            scale_visible=scale_visible,
            ticks_visible=scale_ticks_visible,
            minimum_width=scale_minimum_width,
            ensure_edge_tick_marks_visible=scale_ensure_edge_tick_marks_visible,
        ),
        pane=pane,
    )


def histogram_series(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    base: Optional[float] = None,
    color_column: Optional[str] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    price_line_visible: Optional[bool] = None,
    price_line_source: Optional[PriceLineSource] = None,
    price_line_width: Optional[LineWidth] = None,
    price_line_color: Optional[str] = None,
    price_line_style: Optional[LineStyle] = None,
    base_line_visible: Optional[bool] = None,
    base_line_color: Optional[str] = None,
    base_line_width: Optional[LineWidth] = None,
    base_line_style: Optional[LineStyle] = None,
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
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a histogram series specification."""
    _validate_price_format(price_format)
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
                "color": color,
                "base": base,
            }
        ),
    }
    column_mapping = {"time": time, "value": value}
    if color_column is not None:
        column_mapping["color"] = color_column
    return SeriesSpec(
        series_type="Histogram",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(
            auto_scale,
            scale_margin_top,
            scale_margin_bottom,
            mode=scale_mode,
            invert_scale=scale_invert,
            align_labels=scale_align_labels,
            border_visible=scale_border_visible,
            border_color=scale_border_color,
            text_color=scale_text_color,
            entire_text_only=scale_entire_text_only,
            scale_visible=scale_visible,
            ticks_visible=scale_ticks_visible,
            minimum_width=scale_minimum_width,
            ensure_edge_tick_marks_visible=scale_ensure_edge_tick_marks_visible,
        ),
        pane=pane,
    )
