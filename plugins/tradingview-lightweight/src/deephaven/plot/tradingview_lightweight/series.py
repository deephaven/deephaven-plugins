"""Series creation functions for TradingView Lightweight Charts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .options import (
    LineStyle,
    LineType,
    PriceFormat,
    PriceScaleMode,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
    PRICE_SCALE_MODE_MAP,
)
from .markers import Marker, PriceLine, MarkerSpec


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
    return LINE_STYLE_MAP.get(style, 0)


def _resolve_line_type(line_type: Optional[LineType]) -> Optional[int]:
    if line_type is None:
        return None
    return LINE_TYPE_MAP.get(line_type, 0)


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
            "mode": PRICE_SCALE_MODE_MAP.get(mode) if mode else None,
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


def candlestick_series(
    table: Any,
    time: str = "Timestamp",
    open: str = "Open",
    high: str = "High",
    low: str = "Low",
    close: str = "Close",
    up_color: Optional[str] = None,
    down_color: Optional[str] = None,
    border_up_color: Optional[str] = None,
    border_down_color: Optional[str] = None,
    wick_up_color: Optional[str] = None,
    wick_down_color: Optional[str] = None,
    border_visible: Optional[bool] = None,
    wick_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    last_value_visible: Optional[bool] = None,
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
    color_column: Optional[str] = None,
    border_color_column: Optional[str] = None,
    wick_color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a candlestick series specification."""
    options = _filter_none(
        {
            "upColor": up_color,
            "downColor": down_color,
            "borderUpColor": border_up_color,
            "borderDownColor": border_down_color,
            "wickUpColor": wick_up_color,
            "wickDownColor": wick_down_color,
            "borderVisible": border_visible,
            "wickVisible": wick_visible,
            "title": title,
            "visible": visible,
            "lastValueVisible": last_value_visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
        }
    )
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
    options = _filter_none(
        {
            "upColor": up_color,
            "downColor": down_color,
            "openVisible": open_visible,
            "thinBars": thin_bars,
            "title": title,
            "visible": visible,
            "lastValueVisible": last_value_visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
        }
    )
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
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a line series specification."""
    options = _filter_none(
        {
            "color": color,
            "lineWidth": line_width,
            "lineStyle": _resolve_line_style(line_style),
            "lineType": _resolve_line_type(line_type),
            "crosshairMarkerVisible": crosshair_marker_visible,
            "crosshairMarkerRadius": crosshair_marker_radius,
            "lastValueVisible": last_value_visible,
            "title": title,
            "visible": visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
        }
    )
    return SeriesSpec(
        series_type="Line",
        table=table,
        column_mapping={"time": time, "value": value},
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
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create an area series specification."""
    options = _filter_none(
        {
            "lineColor": line_color,
            "topColor": top_color,
            "bottomColor": bottom_color,
            "lineWidth": line_width,
            "lineStyle": _resolve_line_style(line_style),
            "lineType": _resolve_line_type(line_type),
            "crosshairMarkerVisible": crosshair_marker_visible,
            "crosshairMarkerRadius": crosshair_marker_radius,
            "lastValueVisible": last_value_visible,
            "title": title,
            "visible": visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
        }
    )
    return SeriesSpec(
        series_type="Area",
        table=table,
        column_mapping={"time": time, "value": value},
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
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a baseline series specification."""
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
            "crosshairMarkerVisible": crosshair_marker_visible,
            "crosshairMarkerRadius": crosshair_marker_radius,
            "lastValueVisible": last_value_visible,
            "title": title,
            "visible": visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
        }
    )
    return SeriesSpec(
        series_type="Baseline",
        table=table,
        column_mapping={"time": time, "value": value},
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
    color_column: Optional[str] = None,
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
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
) -> SeriesSpec:
    """Create a histogram series specification."""
    options = _filter_none(
        {
            "color": color,
            "lastValueVisible": last_value_visible,
            "title": title,
            "visible": visible,
            "priceScaleId": price_scale_id,
            "priceFormat": price_format,
        }
    )
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
