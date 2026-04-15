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
    ColorSpace,
    CrosshairMode,
    HorzAlign,
    LineStyle,
    LineType,
    LineWidth,
    PrecomputeConflationPriority,
    PriceScaleMode,
    PriceFormatter,
    TickmarksPriceFormatter,
    PercentageFormatter,
    TickmarksPercentageFormatter,
    TrackingModeExitMode,
    VertAlign,
    WatermarkLine,
    _watermark_line_to_dict,
    CHART_TYPE_MAP,
    CROSSHAIR_MODE_MAP,
    LINE_STYLE_MAP,
    PRICE_SCALE_MODE_MAP,
    TRACKING_MODE_EXIT_MODE_MAP,
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
        pane_preserve_empty: Optional[list[bool]] = None,
        chart_type: str = "standard",
    ):
        self._series_list = series_list
        self._chart_options = chart_options
        self._pane_stretch_factors = pane_stretch_factors
        self._pane_preserve_empty = pane_preserve_empty
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
    def pane_preserve_empty(self) -> Optional[list[bool]]:
        return self._pane_preserve_empty

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
        if self._pane_preserve_empty is not None:
            result["panePreserveEmpty"] = self._pane_preserve_empty
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
    background_top_color: Optional[str] = None,
    background_bottom_color: Optional[str] = None,
    text_color: Optional[str] = None,
    font_size: Optional[int] = None,
    # fontFamily is intentionally omitted — we do not allow font customization.
    attribution_logo: Optional[bool] = None,
    color_space: Optional[ColorSpace] = None,
    # Grid
    vert_lines_visible: Optional[bool] = None,
    vert_lines_color: Optional[str] = None,
    vert_lines_style: Optional[LineStyle] = None,
    horz_lines_visible: Optional[bool] = None,
    horz_lines_color: Optional[str] = None,
    horz_lines_style: Optional[LineStyle] = None,
    # Crosshair
    crosshair_mode: Optional[CrosshairMode] = None,
    crosshair_vert_line_width: Optional[LineWidth] = None,
    crosshair_vert_line_color: Optional[str] = None,
    crosshair_vert_line_style: Optional[LineStyle] = None,
    crosshair_vert_line_visible: Optional[bool] = None,
    crosshair_vert_line_label_visible: Optional[bool] = None,
    crosshair_vert_line_label_background_color: Optional[str] = None,
    crosshair_horz_line_width: Optional[LineWidth] = None,
    crosshair_horz_line_color: Optional[str] = None,
    crosshair_horz_line_style: Optional[LineStyle] = None,
    crosshair_horz_line_visible: Optional[bool] = None,
    crosshair_horz_line_label_visible: Optional[bool] = None,
    crosshair_horz_line_label_background_color: Optional[str] = None,
    crosshair_do_not_snap_to_hidden_series: Optional[bool] = None,
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
    right_price_scale_margin_top: Optional[float] = None,
    right_price_scale_margin_bottom: Optional[float] = None,
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
    left_price_scale_margin_top: Optional[float] = None,
    left_price_scale_margin_bottom: Optional[float] = None,
    # Overlay price scale defaults
    overlay_price_scale_border_visible: Optional[bool] = None,
    overlay_price_scale_ticks_visible: Optional[bool] = None,
    overlay_price_scale_minimum_width: Optional[int] = None,
    overlay_price_scale_margin_top: Optional[float] = None,
    overlay_price_scale_margin_bottom: Optional[float] = None,
    overlay_price_scale_auto_scale: Optional[bool] = None,
    overlay_price_scale_mode: Optional[PriceScaleMode] = None,
    overlay_price_scale_invert_scale: Optional[bool] = None,
    overlay_price_scale_align_labels: Optional[bool] = None,
    overlay_price_scale_border_color: Optional[str] = None,
    overlay_price_scale_text_color: Optional[str] = None,
    overlay_price_scale_entire_text_only: Optional[bool] = None,
    overlay_price_scale_ensure_edge_tick_marks_visible: Optional[bool] = None,
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
    precompute_conflation_priority: Optional[PrecomputeConflationPriority] = None,
    time_scale_visible: Optional[bool] = None,
    # Watermark — single-line shortcut (backwards-compatible)
    watermark_text: Optional[str] = None,
    watermark_color: Optional[str] = None,
    watermark_visible: Optional[bool] = None,
    watermark_font_size: Optional[int] = None,
    # watermark_font_family is intentionally omitted — we do not allow font customization.
    watermark_font_style: Optional[str] = None,
    watermark_line_height: Optional[float] = None,
    watermark_horz_align: Optional[HorzAlign] = None,
    watermark_vert_align: Optional[VertAlign] = None,
    # Watermark — multi-line (mutually exclusive with single-line shortcut)
    watermark_lines: Optional[list[WatermarkLine]] = None,
    # Watermark — image (independent; can coexist with text watermark)
    watermark_image_url: Optional[str] = None,
    watermark_image_max_width: Optional[int] = None,
    watermark_image_max_height: Optional[int] = None,
    watermark_image_padding: Optional[int] = None,
    watermark_image_alpha: Optional[float] = None,
    watermark_image_visible: Optional[bool] = None,
    # Scroll / Scale / Kinetic scroll
    handle_scroll: Optional[bool] = None,
    handle_scroll_mouse_wheel: Optional[bool] = None,
    handle_scroll_pressed_mouse_move: Optional[bool] = None,
    handle_scroll_horz_touch_drag: Optional[bool] = None,
    handle_scroll_vert_touch_drag: Optional[bool] = None,
    handle_scale: Optional[bool] = None,
    handle_scale_mouse_wheel: Optional[bool] = None,
    handle_scale_pinch: Optional[bool] = None,
    handle_scale_axis_pressed_mouse_move: Optional[bool] = None,
    handle_scale_axis_double_click_reset: Optional[bool] = None,
    kinetic_scroll_touch: Optional[bool] = None,
    kinetic_scroll_mouse: Optional[bool] = None,
    # Localization
    price_formatter: Optional[PriceFormatter] = None,
    locale: Optional[str] = None,
    tickmarks_price_formatter: Optional[TickmarksPriceFormatter] = None,
    percentage_formatter: Optional[PercentageFormatter] = None,
    tickmarks_percentage_formatter: Optional[TickmarksPercentageFormatter] = None,
    # Panes
    pane_separator_color: Optional[str] = None,
    pane_separator_hover_color: Optional[str] = None,
    pane_enable_resize: Optional[bool] = None,
    pane_stretch_factors: Optional[list[float]] = None,
    pane_preserve_empty: Optional[list[bool]] = None,
    # Pane primitives (attachPrimitive / detachPrimitive) are not supported.
    # They require callable JS objects with a draw() method that receives a
    # canvas rendering context at browser render time. The Python plugin is a
    # static configuration builder with no mechanism to express JS callables.
    # Sizing
    width: Optional[int] = None,
    height: Optional[int] = None,
    # Behavior / interaction
    auto_size: Optional[bool] = None,
    tracking_mode_exit_mode: Optional[TrackingModeExitMode] = None,
    add_default_pane: Optional[bool] = None,
) -> TvlChart:
    """Create a TradingView Lightweight chart with one or more series.

    Args:
        *series: One or more SeriesSpec objects created by series functions.
        chart_type: Selects the horizontal scale backend. Allowed values:

            - ``"standard"`` (default) -- time-based x-axis via ``createChart``.
            - ``"yield_curve"`` -- monthly-duration numeric x-axis via
              ``createYieldCurveChart``; only Line and Area series are valid.
            - ``"options"`` -- numeric x-axis via ``createOptionsChart``; any
              series type is valid.  Best used through ``options_chart()``.
            - ``"custom_numeric"`` -- alias for ``"options"``; prefer this name
              when the x-axis represents arbitrary numeric values (e.g.
              strike prices, frequencies) rather than option strikes specifically.

        background_color: Solid background color as a CSS color string (e.g.,
            ``'#1a1a2e'``). Mutually exclusive with ``background_top_color`` /
            ``background_bottom_color``.
        background_top_color: Top color for a vertical gradient background. Must
            be provided together with ``background_bottom_color``. Mutually
            exclusive with ``background_color``.
        background_bottom_color: Bottom color for a vertical gradient background.
            Must be provided together with ``background_top_color``. Mutually
            exclusive with ``background_color``.
        attribution_logo: Whether to display the TradingView attribution logo.
            Defaults to ``True`` (library default). Set ``False`` to hide it.
        color_space: Canvas color space -- ``'srgb'`` (default) or
            ``'display-p3'`` for wide-gamut displays. Must be set at chart
            creation; cannot be changed later.
        (all other chart-level options as kwargs)

    Returns:
        A TvlChart that can be displayed in Deephaven.

    Note:
        ``createChartEx`` with a custom ``horzScaleBehavior`` is not supported
        from Python. The named chart types above cover all built-in horizontal
        scale behaviors shipped with TVL v5.
    """
    # Resolve chart type
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
    # --- Background validation ---
    # Note: colorParsers (array of CustomColorParser JS callables) is not
    # implementable from Python — the plugin serializes static JSON config
    # and cannot ship Python callables as JS functions.
    _has_gradient = (
        background_top_color is not None or background_bottom_color is not None
    )
    if background_color is not None and _has_gradient:
        raise ValueError(
            "Cannot set both background_color and gradient background parameters. "
            "Use background_color for a solid background, or use "
            "background_top_color and background_bottom_color together for a gradient."
        )
    if (background_top_color is None) != (background_bottom_color is None):
        raise ValueError(
            "Both background_top_color and background_bottom_color must be provided "
            "together for a gradient background; only one was given."
        )

    # fontFamily is intentionally not user-configurable; we always use Fira.
    layout = _filter_none(
        {
            "textColor": text_color,
            "fontSize": font_size,
            "fontFamily": "Fira, sans-serif",
            "attributionLogo": attribution_logo,
            "colorSpace": color_space,
        }
    )
    if background_color is not None:
        layout["background"] = {"type": "solid", "color": background_color}
    elif background_top_color is not None:
        # Both are set (validated above)
        layout["background"] = {
            "type": "gradient",
            "topColor": background_top_color,
            "bottomColor": background_bottom_color,
        }
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
    if crosshair_do_not_snap_to_hidden_series is not None:
        crosshair[
            "doNotSnapToHiddenSeriesIndices"
        ] = crosshair_do_not_snap_to_hidden_series
    vert_line = _filter_none(
        {
            "width": crosshair_vert_line_width,
            "color": crosshair_vert_line_color,
            "style": (
                LINE_STYLE_MAP.get(crosshair_vert_line_style)
                if crosshair_vert_line_style
                else None
            ),
            "visible": crosshair_vert_line_visible,
            "labelVisible": crosshair_vert_line_label_visible,
            "labelBackgroundColor": crosshair_vert_line_label_background_color,
        }
    )
    if vert_line:
        crosshair["vertLine"] = vert_line
    horz_line = _filter_none(
        {
            "width": crosshair_horz_line_width,
            "color": crosshair_horz_line_color,
            "style": (
                LINE_STYLE_MAP.get(crosshair_horz_line_style)
                if crosshair_horz_line_style
                else None
            ),
            "visible": crosshair_horz_line_visible,
            "labelVisible": crosshair_horz_line_label_visible,
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
            "mode": (
                PRICE_SCALE_MODE_MAP.get(right_price_scale_mode)
                if right_price_scale_mode
                else None
            ),
            "invertScale": right_price_scale_invert_scale,
            "alignLabels": right_price_scale_align_labels,
            "textColor": right_price_scale_text_color,
            "entireTextOnly": right_price_scale_entire_text_only,
            "ticksVisible": right_price_scale_ticks_visible,
            "minimumWidth": right_price_scale_minimum_width,
            "ensureEdgeTickMarksVisible": right_price_scale_ensure_edge_tick_marks_visible,
        }
    )
    rps_margins = _filter_none(
        {
            "top": right_price_scale_margin_top,
            "bottom": right_price_scale_margin_bottom,
        }
    )
    if rps_margins:
        rps["scaleMargins"] = rps_margins
    if rps:
        chart_options["rightPriceScale"] = rps

    # Left price scale
    lps = _filter_none(
        {
            "visible": left_price_scale_visible,
            "borderVisible": left_price_scale_border_visible,
            "borderColor": left_price_scale_border_color,
            "autoScale": left_price_scale_auto_scale,
            "mode": (
                PRICE_SCALE_MODE_MAP.get(left_price_scale_mode)
                if left_price_scale_mode
                else None
            ),
            "invertScale": left_price_scale_invert_scale,
            "alignLabels": left_price_scale_align_labels,
            "textColor": left_price_scale_text_color,
            "entireTextOnly": left_price_scale_entire_text_only,
            "ticksVisible": left_price_scale_ticks_visible,
            "minimumWidth": left_price_scale_minimum_width,
            "ensureEdgeTickMarksVisible": left_price_scale_ensure_edge_tick_marks_visible,
        }
    )
    lps_margins = _filter_none(
        {
            "top": left_price_scale_margin_top,
            "bottom": left_price_scale_margin_bottom,
        }
    )
    if lps_margins:
        lps["scaleMargins"] = lps_margins
    if lps:
        chart_options["leftPriceScale"] = lps

    # Overlay price scale defaults
    ops: dict = _filter_none(
        {
            "autoScale": overlay_price_scale_auto_scale,
            "mode": (
                PRICE_SCALE_MODE_MAP.get(overlay_price_scale_mode)
                if overlay_price_scale_mode
                else None
            ),
            "invertScale": overlay_price_scale_invert_scale,
            "alignLabels": overlay_price_scale_align_labels,
            "borderVisible": overlay_price_scale_border_visible,
            "borderColor": overlay_price_scale_border_color,
            "textColor": overlay_price_scale_text_color,
            "entireTextOnly": overlay_price_scale_entire_text_only,
            "ticksVisible": overlay_price_scale_ticks_visible,
            "minimumWidth": overlay_price_scale_minimum_width,
            "ensureEdgeTickMarksVisible": overlay_price_scale_ensure_edge_tick_marks_visible,
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
            "precomputeConflationPriority": precompute_conflation_priority,
        }
    )
    if ts:
        chart_options["timeScale"] = ts

    # --- Watermark ---

    # Validate mutual exclusion
    if watermark_lines is not None and watermark_text is not None:
        raise ValueError(
            "Provide either 'watermark_text' (single-line shortcut) or "
            "'watermark_lines' (multi-line), not both."
        )

    # Single-line styling params are not applicable with watermark_lines
    if watermark_lines is not None and any(
        p is not None
        for p in (
            watermark_color,
            watermark_font_size,
            watermark_font_style,
            watermark_line_height,
        )
    ):
        raise ValueError(
            "Single-line watermark params (watermark_color, watermark_font_size, "
            "watermark_font_style, watermark_line_height) cannot be combined with "
            "'watermark_lines'. Set per-line styling on each WatermarkLine instead."
        )

    if watermark_lines is not None:
        # Multi-line path: serialise each WatermarkLine to a dict
        lines_payload = [_watermark_line_to_dict(ln) for ln in watermark_lines]
        wm: dict = {
            "lines": lines_payload,
        }
        if watermark_visible is not None:
            wm["visible"] = watermark_visible
        elif lines_payload:
            wm["visible"] = True
        if watermark_horz_align is not None:
            wm["horzAlign"] = watermark_horz_align
        if watermark_vert_align is not None:
            wm["vertAlign"] = watermark_vert_align
        chart_options["watermark"] = wm

    elif watermark_text is not None or watermark_visible is not None:
        # Legacy single-line path (fully backwards-compatible)
        wm = _filter_none(
            {
                "text": watermark_text,
                "color": watermark_color,
                "visible": (
                    watermark_visible
                    if watermark_visible is not None
                    else (True if watermark_text else None)
                ),
                "fontSize": watermark_font_size,
                "fontStyle": watermark_font_style,
                "lineHeight": watermark_line_height,
                "horzAlign": watermark_horz_align,
                "vertAlign": watermark_vert_align,
            }
        )
        if wm:
            chart_options["watermark"] = wm

    # Image watermark (orthogonal to text watermark)
    if watermark_image_url is not None or watermark_image_visible is not None:
        img_wm = _filter_none(
            {
                "url": watermark_image_url,
                "maxWidth": watermark_image_max_width,
                "maxHeight": watermark_image_max_height,
                "padding": watermark_image_padding,
                "alpha": watermark_image_alpha,
                "visible": (
                    watermark_image_visible
                    if watermark_image_visible is not None
                    else (True if watermark_image_url else None)
                ),
            }
        )
        if img_wm:
            chart_options["imageWatermark"] = img_wm

    # HandleScroll
    if handle_scroll is not None:
        chart_options["handleScroll"] = handle_scroll
    else:
        hs = _filter_none(
            {
                "mouseWheel": handle_scroll_mouse_wheel,
                "pressedMouseMove": handle_scroll_pressed_mouse_move,
                "horzTouchDrag": handle_scroll_horz_touch_drag,
                "vertTouchDrag": handle_scroll_vert_touch_drag,
            }
        )
        if hs:
            chart_options["handleScroll"] = hs

    # HandleScale
    if handle_scale is not None:
        chart_options["handleScale"] = handle_scale
    else:
        hsc = _filter_none(
            {
                "mouseWheel": handle_scale_mouse_wheel,
                "pinch": handle_scale_pinch,
                "axisPressedMouseMove": handle_scale_axis_pressed_mouse_move,
                "axisDoubleClickReset": handle_scale_axis_double_click_reset,
            }
        )
        if hsc:
            chart_options["handleScale"] = hsc

    # KineticScroll
    ks = _filter_none(
        {
            "touch": kinetic_scroll_touch,
            "mouse": kinetic_scroll_mouse,
        }
    )
    if ks:
        chart_options["kineticScroll"] = ks

    # Localization
    loc: dict = {}
    if price_formatter is not None:
        loc["priceFormatterName"] = price_formatter
    if locale is not None:
        loc["locale"] = locale
    if tickmarks_price_formatter is not None:
        loc["tickmarksPriceFormatterName"] = tickmarks_price_formatter
    if percentage_formatter is not None:
        loc["percentageFormatterName"] = percentage_formatter
    if tickmarks_percentage_formatter is not None:
        loc["tickmarksPercentageFormatterName"] = tickmarks_percentage_formatter
    if loc:
        chart_options["localization"] = loc

    # Sizing
    if width is not None:
        chart_options["width"] = width
    if height is not None:
        chart_options["height"] = height

    # Behavior / interaction
    if auto_size is not None:
        chart_options["autoSize"] = auto_size
    if tracking_mode_exit_mode is not None:
        chart_options["trackingMode"] = {
            "exitMode": TRACKING_MODE_EXIT_MODE_MAP[tracking_mode_exit_mode]
        }
    if add_default_pane is not None:
        chart_options["addDefaultPane"] = add_default_pane

    return TvlChart(
        series_list=list(series),
        chart_options=chart_options,
        pane_stretch_factors=pane_stretch_factors,
        pane_preserve_empty=pane_preserve_empty,
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
    line_width: Optional[LineWidth] = None,
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
            color=color,
            line_width=line_width,
            line_style=line_style,
            line_type=line_type,
            title=title,
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
    line_width: Optional[LineWidth] = None,
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
            line_color=line_color,
            top_color=top_color,
            bottom_color=bottom_color,
            line_width=line_width,
            title=title,
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
    line_width: Optional[LineWidth] = None,
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
    line_width: Optional[LineWidth] = None,
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
    _valid_yc = {"line", "area"}
    if st not in _valid_yc:
        raise ValueError(
            f"yield_curve() series_type must be one of {sorted(_valid_yc)}, got {series_type!r}"
        )
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
    line_width: Optional[LineWidth] = None,
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
    _valid_oc = {"line", "area", "histogram"}
    if st not in _valid_oc:
        raise ValueError(
            f"options_chart() series_type must be one of {sorted(_valid_oc)}, got {series_type!r}"
        )
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


def custom_numeric(
    table: Any,
    x: str = "X",
    value: str = "Value",
    series_type: str = "line",
    # Series styling
    color: Optional[str] = None,
    line_width: Optional[LineWidth] = None,
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
    _valid_cn = {"line", "area", "histogram"}
    if st not in _valid_cn:
        raise ValueError(
            f"custom_numeric() series_type must be one of {sorted(_valid_cn)}, got {series_type!r}"
        )
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
