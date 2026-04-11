"""TvlChart class and chart creation functions."""

from __future__ import annotations

from typing import Any, Callable, Optional

from .series import SeriesSpec
from .markers import Marker, MarkerSpec, PriceLine

# Optional imports — unavailable in test environments without a Deephaven server
try:
    from deephaven.liveness_scope import LivenessScope
    from deephaven.table import Table
except ImportError:
    LivenessScope = None  # type: ignore[assignment,misc]
    Table = None  # type: ignore[assignment,misc]
from .options import (
    ChartType,
    CrosshairMode,
    LineStyle,
    LineType,
    PriceScaleMode,
    PriceFormatter,
    CHART_TYPE_MAP,
    CROSSHAIR_MODE_MAP,
    LINE_STYLE_MAP,
    PRICE_SCALE_MODE_MAP,
)
from . import series as series_module

_YIELD_CURVE_SERIES_TYPES = {"Line", "Area"}


def _filter_none(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


class TvlChart:
    """A TradingView Lightweight Chart.

    Holds chart configuration and series specs. When displayed in Deephaven,
    it is serialized to JSON and rendered by the JS plugin.
    """

    def __init__(
        self,
        series_list: list[SeriesSpec],
        chart_options: dict,
        pane_stretch_factors: Optional[list[float]] = None,
        chart_type: str = "standard",
    ):
        self._series_list = series_list
        self._chart_options = chart_options
        self._pane_stretch_factors = pane_stretch_factors
        self._chart_type = chart_type

        # Partition metadata (set by line()/area() when by is used)
        self._partitioned_table: Any = None
        self._by_column: Optional[str] = None
        self._series_factory: Optional[Callable[..., SeriesSpec]] = None
        self._series_kwargs: Optional[dict] = None
        # Extra refs to keep alive (e.g. PartitionedTable)
        self._extra_refs: list[Any] = []

        # Liveness: manage refreshing tables so they survive GC
        self._liveness_scope = None
        if LivenessScope is not None:
            self._liveness_scope = LivenessScope()
            self._manage_tables()

    def _manage_tables(self) -> None:
        """Register refreshing tables with the liveness scope."""
        if self._liveness_scope is None or Table is None:
            return
        for table in self.get_tables():
            # Static tables must not be managed (causes errors later)
            if isinstance(table, Table) and not table.is_refreshing:
                continue
            self._liveness_scope.manage(table)
        # Also manage the PartitionedTable itself
        if self._partitioned_table is not None:
            self._liveness_scope.manage(self._partitioned_table)

    def __del__(self) -> None:
        if self._liveness_scope is not None:
            self._liveness_scope.release()

    @property
    def series_list(self) -> list[SeriesSpec]:
        return self._series_list

    @property
    def chart_options(self) -> dict:
        return self._chart_options

    @property
    def pane_stretch_factors(self) -> Optional[list[float]]:
        return self._pane_stretch_factors

    @property
    def chart_type(self) -> str:
        return self._chart_type

    def get_tables(self) -> list[Any]:
        """Get all unique tables referenced by this chart's series."""
        seen = set()
        tables = []
        for s in self._series_list:
            table_id = id(s.table)
            if table_id not in seen:
                seen.add(table_id)
                tables.append(s.table)
            if s.marker_spec is not None:
                mt_id = id(s.marker_spec.table)
                if mt_id not in seen:
                    seen.add(mt_id)
                    tables.append(s.marker_spec.table)
        return tables

    def to_dict(self, table_id_map: dict) -> dict:
        """Serialize to dict for JSON transport.

        Args:
            table_id_map: Maps table id() to integer reference ID.
        """
        series_dicts = []
        for i, s in enumerate(self._series_list):
            tid = table_id_map[id(s.table)]
            marker_tid = None
            if s.marker_spec is not None:
                marker_tid = table_id_map[id(s.marker_spec.table)]
            series_dicts.append(
                s.to_dict(f"series_{i}", tid, marker_table_id=marker_tid)
            )

        result = {
            "chartType": self._chart_type,
            "chartOptions": self._chart_options,
            "series": series_dicts,
        }
        if self._pane_stretch_factors is not None:
            result["paneStretchFactors"] = self._pane_stretch_factors
        # Partition spec for client-side `by` watching
        if self._partitioned_table is not None and self._series_factory is not None:
            # Map series factory to lightweight-charts type string
            series_type_map = {
                "line_series": "Line",
                "area_series": "Area",
            }
            series_type = series_type_map.get(self._series_factory.__name__, "Line")
            result["partitionSpec"] = {
                "byColumn": self._by_column,
                "seriesType": series_type,
                "columns": {
                    k: v
                    for k, v in (self._series_kwargs or {}).items()
                    if isinstance(v, str)  # only include column name mappings
                },
            }
        return result


def chart(
    *series: SeriesSpec,
    # Chart type
    chart_type: Optional[ChartType] = None,
    # Yield curve options (only for chart_type="yield_curve")
    base_resolution: Optional[int] = None,
    minimum_time_range: Optional[int] = None,
    start_time_range: Optional[int] = None,
    # Layout
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    font_size: Optional[int] = None,
    # Grid
    vert_lines_visible: Optional[bool] = None,
    vert_lines_color: Optional[str] = None,
    vert_lines_style: Optional[LineStyle] = None,
    horz_lines_visible: Optional[bool] = None,
    horz_lines_color: Optional[str] = None,
    horz_lines_style: Optional[LineStyle] = None,
    # Crosshair
    crosshair_mode: Optional[CrosshairMode] = None,
    crosshair_vert_line_width: Optional[int] = None,
    crosshair_vert_line_color: Optional[str] = None,
    crosshair_vert_line_style: Optional[LineStyle] = None,
    crosshair_vert_line_label_background_color: Optional[str] = None,
    crosshair_horz_line_width: Optional[int] = None,
    crosshair_horz_line_color: Optional[str] = None,
    crosshair_horz_line_style: Optional[LineStyle] = None,
    crosshair_horz_line_label_background_color: Optional[str] = None,
    # Right price scale
    right_price_scale_visible: Optional[bool] = None,
    right_price_scale_border_visible: Optional[bool] = None,
    right_price_scale_border_color: Optional[str] = None,
    right_price_scale_auto_scale: Optional[bool] = None,
    right_price_scale_mode: Optional[PriceScaleMode] = None,
    right_price_scale_invert_scale: Optional[bool] = None,
    right_price_scale_align_labels: Optional[bool] = None,
    right_price_scale_text_color: Optional[str] = None,
    right_price_scale_entire_text_only: Optional[bool] = None,
    right_price_scale_ticks_visible: Optional[bool] = None,
    right_price_scale_minimum_width: Optional[int] = None,
    right_price_scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
    # Left price scale
    left_price_scale_visible: Optional[bool] = None,
    left_price_scale_border_visible: Optional[bool] = None,
    left_price_scale_border_color: Optional[str] = None,
    left_price_scale_auto_scale: Optional[bool] = None,
    left_price_scale_mode: Optional[PriceScaleMode] = None,
    left_price_scale_invert_scale: Optional[bool] = None,
    left_price_scale_align_labels: Optional[bool] = None,
    left_price_scale_text_color: Optional[str] = None,
    left_price_scale_entire_text_only: Optional[bool] = None,
    left_price_scale_ticks_visible: Optional[bool] = None,
    left_price_scale_minimum_width: Optional[int] = None,
    left_price_scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
    # Overlay price scale defaults
    overlay_price_scale_border_visible: Optional[bool] = None,
    overlay_price_scale_ticks_visible: Optional[bool] = None,
    overlay_price_scale_minimum_width: Optional[int] = None,
    overlay_price_scale_margin_top: Optional[float] = None,
    overlay_price_scale_margin_bottom: Optional[float] = None,
    # Time scale
    time_visible: Optional[bool] = None,
    seconds_visible: Optional[bool] = None,
    time_scale_border_visible: Optional[bool] = None,
    time_scale_border_color: Optional[str] = None,
    right_offset: Optional[int] = None,
    right_offset_pixels: Optional[int] = None,
    bar_spacing: Optional[float] = None,
    min_bar_spacing: Optional[float] = None,
    max_bar_spacing: Optional[float] = None,
    fix_left_edge: Optional[bool] = None,
    fix_right_edge: Optional[bool] = None,
    lock_visible_time_range_on_resize: Optional[bool] = None,
    right_bar_stays_on_scroll: Optional[bool] = None,
    shift_visible_range_on_new_bar: Optional[bool] = None,
    allow_shift_visible_range_on_whitespace_replacement: Optional[bool] = None,
    time_scale_ticks_visible: Optional[bool] = None,
    tick_mark_max_character_length: Optional[int] = None,
    uniform_distribution: Optional[bool] = None,
    time_scale_minimum_height: Optional[int] = None,
    allow_bold_labels: Optional[bool] = None,
    ignore_whitespace_indices: Optional[bool] = None,
    enable_conflation: Optional[bool] = None,
    conflation_threshold_factor: Optional[float] = None,
    precompute_conflation_on_init: Optional[bool] = None,
    time_scale_visible: Optional[bool] = None,
    # Watermark
    watermark_text: Optional[str] = None,
    watermark_color: Optional[str] = None,
    watermark_visible: Optional[bool] = None,
    watermark_font_size: Optional[int] = None,
    watermark_horz_align: Optional[str] = None,
    watermark_vert_align: Optional[str] = None,
    # Localization
    price_formatter: Optional[PriceFormatter] = None,
    # Panes
    pane_separator_color: Optional[str] = None,
    pane_separator_hover_color: Optional[str] = None,
    pane_enable_resize: Optional[bool] = None,
    pane_stretch_factors: Optional[list[float]] = None,
    # Sizing
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a TradingView Lightweight chart with one or more series.

    Args:
        *series: One or more SeriesSpec objects created by series functions.
        (all chart-level options as kwargs)

    Returns:
        A TvlChart that can be displayed in Deephaven.
    """
    # Resolve chart type
    resolved_type = (
        CHART_TYPE_MAP.get(chart_type, "standard") if chart_type else "standard"
    )

    # Validate yield curve series constraints
    if resolved_type == "yieldCurve":
        for s in series:
            if s.series_type not in _YIELD_CURVE_SERIES_TYPES:
                raise ValueError(
                    f"Yield curve charts only support Line and Area series, "
                    f"got {s.series_type}"
                )

    chart_options: dict = {}

    # Yield curve options
    if resolved_type == "yieldCurve":
        yc = _filter_none(
            {
                "baseResolution": base_resolution,
                "minimumTimeRange": minimum_time_range,
                "startTimeRange": start_time_range,
            }
        )
        if yc:
            chart_options["yieldCurve"] = yc

    # Layout
    layout = _filter_none(
        {
            "textColor": text_color,
            "fontSize": font_size,
        }
    )
    if background_color is not None:
        layout["background"] = {"type": "solid", "color": background_color}
    panes_opts = _filter_none(
        {
            "separatorColor": pane_separator_color,
            "separatorHoverColor": pane_separator_hover_color,
            "enableResize": pane_enable_resize,
        }
    )
    if panes_opts:
        layout["panes"] = panes_opts
    if layout:
        chart_options["layout"] = layout

    # Grid
    grid: dict = {}
    vert = _filter_none(
        {
            "visible": vert_lines_visible,
            "color": vert_lines_color,
            "style": LINE_STYLE_MAP.get(vert_lines_style) if vert_lines_style else None,
        }
    )
    if vert:
        grid["vertLines"] = vert
    horz = _filter_none(
        {
            "visible": horz_lines_visible,
            "color": horz_lines_color,
            "style": LINE_STYLE_MAP.get(horz_lines_style) if horz_lines_style else None,
        }
    )
    if horz:
        grid["horzLines"] = horz
    if grid:
        chart_options["grid"] = grid

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

    # Right price scale
    rps = _filter_none(
        {
            "visible": right_price_scale_visible,
            "borderVisible": right_price_scale_border_visible,
            "borderColor": right_price_scale_border_color,
            "autoScale": right_price_scale_auto_scale,
            "mode": PRICE_SCALE_MODE_MAP.get(right_price_scale_mode)
            if right_price_scale_mode
            else None,
            "invertScale": right_price_scale_invert_scale,
            "alignLabels": right_price_scale_align_labels,
            "textColor": right_price_scale_text_color,
            "entireTextOnly": right_price_scale_entire_text_only,
            "ticksVisible": right_price_scale_ticks_visible,
            "minimumWidth": right_price_scale_minimum_width,
            "ensureEdgeTickMarksVisible": right_price_scale_ensure_edge_tick_marks_visible,
        }
    )
    if rps:
        chart_options["rightPriceScale"] = rps

    # Left price scale
    lps = _filter_none(
        {
            "visible": left_price_scale_visible,
            "borderVisible": left_price_scale_border_visible,
            "borderColor": left_price_scale_border_color,
            "autoScale": left_price_scale_auto_scale,
            "mode": PRICE_SCALE_MODE_MAP.get(left_price_scale_mode)
            if left_price_scale_mode
            else None,
            "invertScale": left_price_scale_invert_scale,
            "alignLabels": left_price_scale_align_labels,
            "textColor": left_price_scale_text_color,
            "entireTextOnly": left_price_scale_entire_text_only,
            "ticksVisible": left_price_scale_ticks_visible,
            "minimumWidth": left_price_scale_minimum_width,
            "ensureEdgeTickMarksVisible": left_price_scale_ensure_edge_tick_marks_visible,
        }
    )
    if lps:
        chart_options["leftPriceScale"] = lps

    # Overlay price scale defaults
    ops: dict = _filter_none(
        {
            "borderVisible": overlay_price_scale_border_visible,
            "ticksVisible": overlay_price_scale_ticks_visible,
            "minimumWidth": overlay_price_scale_minimum_width,
        }
    )
    ops_margins = _filter_none(
        {
            "top": overlay_price_scale_margin_top,
            "bottom": overlay_price_scale_margin_bottom,
        }
    )
    if ops_margins:
        ops["scaleMargins"] = ops_margins
    if ops:
        chart_options["overlayPriceScales"] = ops

    # Time scale
    ts = _filter_none(
        {
            "timeVisible": time_visible,
            "secondsVisible": seconds_visible,
            "borderVisible": time_scale_border_visible,
            "borderColor": time_scale_border_color,
            "visible": time_scale_visible,
            "rightOffset": right_offset,
            "rightOffsetPixels": right_offset_pixels,
            "barSpacing": bar_spacing,
            "minBarSpacing": min_bar_spacing,
            "maxBarSpacing": max_bar_spacing,
            "fixLeftEdge": fix_left_edge,
            "fixRightEdge": fix_right_edge,
            "lockVisibleTimeRangeOnResize": lock_visible_time_range_on_resize,
            "rightBarStaysOnScroll": right_bar_stays_on_scroll,
            "shiftVisibleRangeOnNewBar": shift_visible_range_on_new_bar,
            "allowShiftVisibleRangeOnWhitespaceReplacement": allow_shift_visible_range_on_whitespace_replacement,
            "ticksVisible": time_scale_ticks_visible,
            "tickMarkMaxCharacterLength": tick_mark_max_character_length,
            "uniformDistribution": uniform_distribution,
            "minimumHeight": time_scale_minimum_height,
            "allowBoldLabels": allow_bold_labels,
            "ignoreWhitespaceIndices": ignore_whitespace_indices,
            "enableConflation": enable_conflation,
            "conflationThresholdFactor": conflation_threshold_factor,
            "precomputeConflationOnInit": precompute_conflation_on_init,
        }
    )
    if ts:
        chart_options["timeScale"] = ts

    # Watermark
    wm = _filter_none(
        {
            "text": watermark_text,
            "color": watermark_color,
            "visible": watermark_visible
            if watermark_visible is not None
            else (True if watermark_text else None),
            "fontSize": watermark_font_size,
            "horzAlign": watermark_horz_align,
            "vertAlign": watermark_vert_align,
        }
    )
    if wm:
        chart_options["watermark"] = wm

    # Localization
    if price_formatter is not None:
        chart_options["localization"] = {"priceFormatterName": price_formatter}

    # Sizing
    if width is not None:
        chart_options["width"] = width
    if height is not None:
        chart_options["height"] = height

    return TvlChart(
        series_list=list(series),
        chart_options=chart_options,
        pane_stretch_factors=pane_stretch_factors,
        chart_type=resolved_type,
    )


# --- Convenience functions ---


def candlestick(
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
    title: Optional[str] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    # Common chart options
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    time_visible: Optional[bool] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a candlestick chart. Shorthand for chart(candlestick_series(...))."""
    s = series_module.candlestick_series(
        table,
        time=time,
        open=open,
        high=high,
        low=low,
        close=close,
        up_color=up_color,
        down_color=down_color,
        border_up_color=border_up_color,
        border_down_color=border_down_color,
        wick_up_color=wick_up_color,
        wick_down_color=wick_down_color,
        title=title,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
    )
    return chart(
        s,
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        time_visible=time_visible,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )


def line(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    title: Optional[str] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    by: Optional[str] = None,
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    time_visible: Optional[bool] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a line chart. Shorthand for chart(line_series(...)).

    When ``by`` is set, the table is partitioned by that column and one
    series is created per unique value.  New partition keys that appear
    at runtime (ticking tables) automatically add new series.
    """
    chart_kwargs: dict[str, Any] = dict(
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        time_visible=time_visible,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )

    if by is not None:
        # JS side discovers all keys via PartitionedTable — no initial
        # series needed on the Python side.
        partitioned = table.partition_by([by])
        c = chart(**chart_kwargs)
        c._partitioned_table = partitioned
        c._by_column = by
        c._series_factory = series_module.line_series
        c._series_kwargs = dict(
            time=time,
            value=value,
            line_width=line_width,
            line_style=line_style,
            line_type=line_type,
        )
        c._extra_refs.append(partitioned)
        c._manage_tables()
        return c

    s = series_module.line_series(
        table,
        time=time,
        value=value,
        color=color,
        line_width=line_width,
        line_style=line_style,
        line_type=line_type,
        title=title,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
    )
    return chart(s, **chart_kwargs)


def area(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    line_color: Optional[str] = None,
    top_color: Optional[str] = None,
    bottom_color: Optional[str] = None,
    line_width: Optional[int] = None,
    title: Optional[str] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    by: Optional[str] = None,
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    time_visible: Optional[bool] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create an area chart. Shorthand for chart(area_series(...)).

    When ``by`` is set, the table is partitioned by that column and one
    series is created per unique value.  New partition keys that appear
    at runtime (ticking tables) automatically add new series.
    """
    chart_kwargs: dict[str, Any] = dict(
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        time_visible=time_visible,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )

    if by is not None:
        partitioned = table.partition_by([by])
        c = chart(**chart_kwargs)
        c._partitioned_table = partitioned
        c._by_column = by
        c._series_factory = series_module.area_series
        c._series_kwargs = dict(
            time=time,
            value=value,
            line_width=line_width,
        )
        c._extra_refs.append(partitioned)
        c._manage_tables()
        return c

    s = series_module.area_series(
        table,
        time=time,
        value=value,
        line_color=line_color,
        top_color=top_color,
        bottom_color=bottom_color,
        line_width=line_width,
        title=title,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
    )
    return chart(s, **chart_kwargs)


def bar(
    table: Any,
    time: str = "Timestamp",
    open: str = "Open",
    high: str = "High",
    low: str = "Low",
    close: str = "Close",
    up_color: Optional[str] = None,
    down_color: Optional[str] = None,
    title: Optional[str] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    time_visible: Optional[bool] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a bar chart. Shorthand for chart(bar_series(...))."""
    s = series_module.bar_series(
        table,
        time=time,
        open=open,
        high=high,
        low=low,
        close=close,
        up_color=up_color,
        down_color=down_color,
        title=title,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
    )
    return chart(
        s,
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        time_visible=time_visible,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )


def baseline(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    base_value: float = 0.0,
    top_line_color: Optional[str] = None,
    bottom_line_color: Optional[str] = None,
    line_width: Optional[int] = None,
    title: Optional[str] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    time_visible: Optional[bool] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a baseline chart. Shorthand for chart(baseline_series(...))."""
    s = series_module.baseline_series(
        table,
        time=time,
        value=value,
        base_value=base_value,
        top_line_color=top_line_color,
        bottom_line_color=bottom_line_color,
        line_width=line_width,
        title=title,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
    )
    return chart(
        s,
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        time_visible=time_visible,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )


def histogram(
    table: Any,
    time: str = "Timestamp",
    value: str = "Value",
    color: Optional[str] = None,
    color_column: Optional[str] = None,
    title: Optional[str] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    time_visible: Optional[bool] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a histogram chart. Shorthand for chart(histogram_series(...))."""
    s = series_module.histogram_series(
        table,
        time=time,
        value=value,
        color=color,
        color_column=color_column,
        title=title,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
    )
    return chart(
        s,
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        time_visible=time_visible,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )


# --- Non-standard chart type convenience functions ---


def yield_curve(
    table: Any,
    maturity: str = "Maturity",
    value: str = "Yield",
    series_type: str = "line",
    # Series styling
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    title: Optional[str] = None,
    # Area-specific (only used when series_type="area")
    line_color: Optional[str] = None,
    top_color: Optional[str] = None,
    bottom_color: Optional[str] = None,
    # Yield curve options
    base_resolution: Optional[int] = None,
    minimum_time_range: Optional[int] = None,
    start_time_range: Optional[int] = None,
    # Common chart options
    background_color: Optional[str] = None,
    text_color: Optional[str] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    watermark_text: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> TvlChart:
    """Create a yield curve chart with a single Line or Area series.

    The horizontal axis represents maturity in months (numeric).
    Only Line and Area series are supported by yield curve charts.

    Args:
        table: Deephaven table with the data.
        maturity: Column name for the x-axis (months, numeric).
        value: Column name for the y-axis (yield values).
        series_type: ``"line"`` (default) or ``"area"``.
    """
    st = series_type.lower()
    if st == "area":
        s = series_module.area_series(
            table,
            time=maturity,
            value=value,
            line_color=line_color or color,
            top_color=top_color,
            bottom_color=bottom_color,
            line_width=line_width,
            title=title,
        )
    else:
        s = series_module.line_series(
            table,
            time=maturity,
            value=value,
            color=color,
            line_width=line_width,
            title=title,
        )
    return chart(
        s,
        chart_type="yield_curve",
        base_resolution=base_resolution,
        minimum_time_range=minimum_time_range,
        start_time_range=start_time_range,
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )


def options_chart(
    table: Any,
    strike: str = "Strike",
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
    """Create an options chart with a single series.

    The horizontal axis represents strike prices (numeric).

    Args:
        table: Deephaven table with the data.
        strike: Column name for the x-axis (strike prices, numeric).
        value: Column name for the y-axis.
        series_type: ``"line"`` (default), ``"area"``, or ``"histogram"``.
    """
    st = series_type.lower()
    if st == "area":
        s = series_module.area_series(
            table,
            time=strike,
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
            time=strike,
            value=value,
            color=color,
            title=title,
        )
    else:
        s = series_module.line_series(
            table,
            time=strike,
            value=value,
            color=color,
            line_width=line_width,
            title=title,
        )
    return chart(
        s,
        chart_type="options",
        background_color=background_color,
        text_color=text_color,
        crosshair_mode=crosshair_mode,
        watermark_text=watermark_text,
        width=width,
        height=height,
    )
