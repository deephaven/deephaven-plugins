"""TvlChart class and chart creation functions."""

from __future__ import annotations

import inspect
from typing import Any, Optional, Union

from .series import SeriesSpec
from .markers import Marker, MarkerSpec, PriceLine
from .events import (
    PressEventCallable,
    PRESS,
    DOUBLE_PRESS,
)

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
    LastPriceAnimationMode,
    LineStyle,
    LineType,
    LineWidth,
    PriceFormat,
    PriceScaleId,
    PriceFormatter,
    TickmarksPriceFormatter,
    PercentageFormatter,
    TickmarksPercentageFormatter,
    TrackingModeExitMode,
    BaseLine,
    Crosshair,
    CrosshairMarker,
    Grid,
    LastPriceLine,
    PriceScale,
    TimeScale,
    Watermark,
    WatermarkImage,
    Tooltip,
    Scroll,
    Scale,
    CHART_TYPE_MAP,
    TRACKING_MODE_EXIT_MODE_MAP,
)
from . import series as series_module
from ._colors import Color

_YIELD_CURVE_SERIES_TYPES = {"Line", "Area"}

# Per-type constructor kwargs that are chart-level (not series-factory args).
# Excluded from the ``locals()`` dict forwarded to the ``*_series`` factory.
_CHART_ONLY_KWARGS = {
    "by",
    "on_press",
    "on_double_press",
}


def _filter_none(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


def _wrap_as_chart(
    spec: SeriesSpec,
    by: Optional[str],
    func_name: str,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> "TvlChart":
    """Build a default-styled TvlChart wrapping a single SeriesSpec.

    Used by the per-type unified constructors (``tvl.line``, ``tvl.area``,
    etc.). When ``by`` is set, the source table is partitioned and the
    resulting :class:`PartitionedTable` is stashed on the spec for the
    JS partition-watcher. Press handlers are chart-level and forwarded to
    the wrapping :class:`TvlChart` (they survive standalone display; when
    the result is later passed to :func:`chart`, that call's handlers win).
    """
    _validate_series_columns(spec, func_name)
    if by is not None:
        _validate_by_column(spec.table, by, func_name)
        spec.by = by
        spec.partitioned_table = spec.table.partition_by([by])
    return TvlChart(
        series_list=[spec],
        chart_options={},
        on_press=on_press,
        on_double_press=on_double_press,
    )


def _table_column_names(table: Any) -> Optional[list[str]]:
    """Column names of ``table``, or ``None`` if they can't be determined.

    Mock/typeless tables used in unit tests don't expose a real ``.columns``;
    a ``MagicMock`` iterates to an empty list rather than raising. Either way
    we can't validate, so return ``None`` (an empty result is treated the same
    as unreadable) and let callers skip validation rather than reject every
    column. A real Deephaven table always has at least one column.
    """
    try:
        names = [c.name for c in table.columns]
    except Exception:
        return None
    return names or None


def _validate_by_column(table: Any, by: str, func: str) -> None:
    """Raise a clear ValueError if ``by`` is not a column on ``table``.

    Without this check ``table.partition_by([by])`` would still raise, but
    with a much less actionable error wrapped in a Java exception. Surface
    a Python-native error early so a typo in ``by="Symm"`` is obvious.
    """
    col_names = _table_column_names(table)
    if col_names is None:
        return
    if by not in col_names:
        raise ValueError(
            f"{func}(by={by!r}) — column not found on table. "
            f"Available columns: {col_names}"
        )


def _check_columns(table: Any, needed: Any, func: str, what: str) -> None:
    """Raise ValueError if any name in ``needed`` is missing from ``table``.

    ``what`` names the kind of column for the message (e.g. ``"column"``,
    ``"price line column"``). Skips validation when the table's columns can't
    be determined (mock/typeless tables — see :func:`_table_column_names`).
    """
    col_names = _table_column_names(table)
    if col_names is None:
        return
    missing = sorted({c for c in needed if c not in col_names})
    if missing:
        raise ValueError(
            f"{func} — {what}(s) not found on table: {missing}. "
            f"Available columns: {col_names}"
        )


def _validate_series_columns(spec: SeriesSpec, func: str) -> None:
    """Raise a clear ValueError if any column the series reads is missing.

    Covers every prop that accepts a column name, so a typo like
    ``value="Emaa"`` is surfaced as a Python-native error here — before the
    figure is ever sent to the client — rather than silently rendering an
    empty series (the unknown column is dropped client-side at subscribe time):

    - the time / value / OHLC data channels and per-row color columns held in
      ``column_mapping`` (validated against the series table);
    - column-driven price lines (:attr:`PriceLine.column`, same table);
    - table-driven markers (every column in :meth:`MarkerSpec.get_columns`,
      validated against the marker spec's own table).
    """
    _check_columns(spec.table, spec.column_mapping.values(), func, "column")

    if spec.price_lines:
        pl_cols = [pl.column for pl in spec.price_lines if pl.column is not None]
        _check_columns(spec.table, pl_cols, func, "price line column")

    if spec.marker_spec is not None:
        _check_columns(
            spec.marker_spec.table,
            spec.marker_spec.get_columns(),
            func,
            "marker column",
        )


class TvlChart:
    """A TradingView Lightweight Chart.

    Holds chart configuration and series specs.  When displayed in
    Deephaven, the chart is serialized to JSON and rendered by the
    TVL JS plugin.

    Construct instances through :func:`chart` (or one of the
    convenience helpers like :func:`candlestick`, :func:`line`,
    :func:`area`) rather than calling this constructor directly.  The
    constructor signature is considered semi-internal: it accepts the
    already-resolved chart options dict and may change between
    releases.

    Args:
        series_list: One or more :class:`SeriesSpec` instances to plot.
        chart_options: Pre-resolved camelCase JS-shaped options dict
            (the output of :func:`chart`'s argument processing).
        pane_stretch_factors: Optional list of per-pane stretch
            factors.  Length must match the highest ``pane`` index used
            by any series + 1.
        pane_preserve_empty: Optional list of booleans controlling
            whether each pane is preserved even when empty.
        chart_type: One of ``"standard"``, ``"yieldCurve"``,
            ``"options"`` (camelCase TVL backend names).  Use
            :func:`chart` to translate from the Pythonic
            :data:`ChartType` aliases.
    """

    def __init__(
        self,
        series_list: list[SeriesSpec],
        chart_options: dict,
        pane_stretch_factors: Optional[list[float]] = None,
        pane_preserve_empty: Optional[list[bool]] = None,
        chart_type: str = "standard",
        on_press: Optional[PressEventCallable] = None,
        on_double_press: Optional[PressEventCallable] = None,
    ):
        self._series_list = series_list
        self._chart_options = chart_options
        self._pane_stretch_factors = pane_stretch_factors
        self._pane_preserve_empty = pane_preserve_empty
        self._chart_type = chart_type
        self._on_press = on_press
        self._on_double_press = on_double_press

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
        # Per-series partitioned tables must also be managed.
        for s in self._series_list:
            if s.partitioned_table is not None:
                self._liveness_scope.manage(s.partitioned_table)

    @property
    def partitioned_series(self) -> list[SeriesSpec]:
        """Series in this chart that carry a partition (``by=``) template."""
        return [s for s in self._series_list if s.by is not None]

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

    @property
    def on_press(self) -> Optional[PressEventCallable]:
        return self._on_press

    @property
    def on_double_press(self) -> Optional[PressEventCallable]:
        return self._on_double_press

    def enabled_handlers(self) -> list[str]:
        """Handler ids that are wired, in advertise order.

        Mirrors the ``enabledHandlers`` array emitted in :meth:`to_dict`;
        the listener uses this to build its dispatch registry so the two
        never drift apart.
        """
        handlers: list[str] = []
        if self._on_press is not None:
            handlers.append(PRESS)
        if self._on_double_press is not None:
            handlers.append(DOUBLE_PRESS)
        return handlers

    def get_tables(self) -> list[Any]:
        """Return all unique Deephaven tables referenced by this chart's
        series and marker specs.

        Returns:
            list[Any]: De-duplicated list of tables (order = first
            occurrence in :attr:`series_list`).  Marker-spec tables
            are appended after series tables.
        """
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
        """Serialize this chart to a dict suitable for JSON transport
        to the JS plugin.

        Args:
            table_id_map: dict mapping Python ``id(table)`` to the
                integer reference ID used by the wire protocol.

        Returns:
            dict: A JSON-serializable dict with keys ``chartType``,
            ``chartOptions``, ``series``, and (when set)
            ``paneStretchFactors``, ``panePreserveEmpty``. Each series
            entry may carry a ``"partition"`` block when its ``by``
            field is set.
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
        enabled = self.enabled_handlers()
        if enabled:
            result["enabledHandlers"] = enabled
        return result


def chart(
    *sources: "TvlChart | SeriesSpec",
    # Chart type
    chart_type: Optional[ChartType] = None,
    # Yield curve options (only for chart_type="yield_curve")
    base_resolution: Optional[int] = None,
    minimum_time_range: Optional[int] = None,
    start_time_range: Optional[int] = None,
    # Layout
    background_color: Optional[Color] = None,
    background_top_color: Optional[Color] = None,
    background_bottom_color: Optional[Color] = None,
    text_color: Optional[Color] = None,
    font_size: Optional[int] = None,
    # fontFamily is intentionally omitted — we do not allow font customization.
    attribution_logo: Optional[bool] = None,
    color_space: Optional[ColorSpace] = None,
    hovered_series_on_top: Optional[bool] = None,
    default_visible_price_scale_id: Optional[PriceScaleId] = None,
    # Grid
    grid: Optional[Grid] = None,
    # Crosshair
    crosshair: Optional[Crosshair] = None,
    # Price scales — right / left / overlay-defaults (reuse one PriceScale)
    right_price_scale: Optional[PriceScale] = None,
    left_price_scale: Optional[PriceScale] = None,
    overlay_price_scale: Optional[PriceScale] = None,
    # Time scale
    time_scale: Optional[TimeScale] = None,
    # Watermark (text + image)
    watermark: Optional[Watermark] = None,
    watermark_image: Optional[WatermarkImage] = None,
    # Scroll / Scale — bool master toggle OR a granular Scroll/Scale object
    handle_scroll: Optional[Union[bool, Scroll]] = None,
    handle_scale: Optional[Union[bool, Scale]] = None,
    kinetic_scroll_touch: Optional[bool] = None,
    kinetic_scroll_mouse: Optional[bool] = None,
    # Localization
    price_formatter: Optional[PriceFormatter] = None,
    locale: Optional[str] = None,
    tickmarks_price_formatter: Optional[TickmarksPriceFormatter] = None,
    percentage_formatter: Optional[PercentageFormatter] = None,
    tickmarks_percentage_formatter: Optional[TickmarksPercentageFormatter] = None,
    # Panes
    pane_separator_color: Optional[Color] = None,
    pane_separator_hover_color: Optional[Color] = None,
    pane_enable_resize: Optional[bool] = None,
    pane_stretch_factors: Optional[list[float]] = None,
    pane_preserve_empty: Optional[list[bool]] = None,
    # Pane primitives (attachPrimitive / detachPrimitive) are not supported.
    # They require callable JS objects with a draw() method that receives a
    # canvas rendering context at browser render time. The Python plugin is a
    # static configuration builder with no mechanism to express JS callables.
    # Behavior / interaction
    tracking_mode_exit_mode: Optional[TrackingModeExitMode] = None,
    add_default_pane: Optional[bool] = None,
    # Tracking tooltip (cursor-following overlay)
    tooltip: Optional[Tooltip] = None,
    # Event handlers
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Compose one or more series into a TradingView Lightweight chart.

    This is the chart-composition entry point. Each positional input is
    a :class:`TvlChart` returned by one of the per-type constructors
    (:func:`candlestick`, :func:`line`, :func:`area`, :func:`bar`,
    :func:`baseline`, :func:`histogram`). Their series are concatenated
    in order, and the chart-level styling kwargs supplied here apply to
    the composed chart. Any chart-level state on the input sources
    (default options from standalone use) is discarded.

    A single-series chart is most often created by the per-type
    constructor directly (e.g. ``tvl.area(t, timestamp="T", value="V")``).
    Reach for ``tvl.chart(...)`` when you want multi-series, multi-pane,
    or fine-grained chart styling.

    Args:
        *sources (TvlChart): One or more per-type construction results
            (e.g. ``tvl.candlestick(...)``, ``tvl.line(...)``). Their
            series are merged in order; the pane each series targets
            comes from its ``pane=`` argument (default pane 0).

        chart_type (Optional[ChartType]): Selects the horizontal scale
            backend.  See :data:`ChartType` for the allowed values
            (``"standard"`` (default), ``"yield_curve"``, ``"options"``,
            ``"custom_numeric"``).


        base_resolution (Optional[int]): The base time resolution in
            seconds — controls how the maturity axis is rendered.
        minimum_time_range (Optional[int]): Minimum visible time range
            in maturity units.
        start_time_range (Optional[int]): Initial visible time range.


        background_color (Optional[Color]): Solid background color as a
            CSS color string (e.g. ``"#1a1a2e"``).  Mutually exclusive
            with the gradient pair.
        background_top_color (Optional[Color]): Top color for a vertical
            gradient.  Must be set together with
            ``background_bottom_color``.
        background_bottom_color (Optional[Color]): Bottom color of the
            gradient; pair with ``background_top_color``.
        text_color (Optional[Color]): Default text color for axis labels
            and tooltips.
        font_size (Optional[int]): Base font size in pixels for axis
            labels and tooltips.
        attribution_logo (Optional[bool]): Show the TradingView
            attribution logo (default ``True``).
        color_space (Optional[ColorSpace]): Canvas color space — see
            :data:`ColorSpace`.
        hovered_series_on_top (Optional[bool]): Render the hovered
            series above its siblings in the same pane (default
            ``True``).
        default_visible_price_scale_id (Optional[PriceScaleId]):
            Default price scale (``"left"`` / ``"right"``) for series
            that do not specify one.


        grid (Optional[Grid]): Grid-line configuration built with
            :func:`grid` / :func:`grid_lines`, e.g.
            ``grid=tvl.grid(vert=tvl.grid_lines(visible=False))``.

        crosshair (Optional[Crosshair]): Crosshair configuration built
            with :func:`crosshair` / :func:`crosshair_line`, e.g.
            ``crosshair=tvl.crosshair(mode="magnet",
            vert_line=tvl.crosshair_line(color="#aaa"))``.

        right_price_scale (Optional[PriceScale]): Right price-scale
            styling/behavior built with :func:`price_scale`.
        left_price_scale (Optional[PriceScale]): Left price-scale
            config built with :func:`price_scale`.
        overlay_price_scale (Optional[PriceScale]): Default styling for
            overlay (stub) price scales, built with :func:`price_scale`.
            One :class:`PriceScale` instance can be reused across all
            three slots.


        time_scale (Optional[TimeScale]): Time-axis configuration built
            with :func:`time_scale`, e.g.
            ``time_scale=tvl.time_scale(time_visible=True, bar_spacing=8)``.

        watermark (Optional[Watermark]): Text watermark built with
            :func:`watermark` — single-line (``text=``) or multi-line
            (``lines=[tvl.watermark_line(...)]``).
        watermark_image (Optional[WatermarkImage]): Image watermark built
            with :func:`watermark_image`; coexists with a text watermark.

        handle_scroll (Optional[bool | Scroll]): ``True`` / ``False`` toggles
            all scroll interactions at once; pass :func:`scroll` for
            per-gesture control.
        handle_scale (Optional[bool | Scale]): ``True`` / ``False`` toggles
            all scale/zoom interactions at once; pass :func:`scale` for
            per-gesture control.
        kinetic_scroll_touch (Optional[bool]): Enable kinetic scrolling
            on touch devices.
        kinetic_scroll_mouse (Optional[bool]): Enable kinetic scrolling
            with the mouse.


        price_formatter (Optional[PriceFormatter]): Price formatter
            preset; see :data:`PriceFormatter`.
        locale (Optional[str]): BCP 47 locale string for number
            formatting (e.g. ``"en-US"``).
        tickmarks_price_formatter (Optional[TickmarksPriceFormatter]):
            Tick-label price formatter; see :data:`TickmarksPriceFormatter`.
        percentage_formatter (Optional[PercentageFormatter]):
            Crosshair percentage formatter; see :data:`PercentageFormatter`.
        tickmarks_percentage_formatter (Optional[TickmarksPercentageFormatter]):
            Tick-label percentage formatter; see
            :data:`TickmarksPercentageFormatter`.


        pane_separator_color (Optional[Color]): Color of the lines
            between panes.
        pane_separator_hover_color (Optional[Color]): Pane separator
            color when hovered.
        pane_enable_resize (Optional[bool]): Allow the user to resize
            panes by dragging separators.
        pane_stretch_factors (Optional[list[float]]): Relative stretch
            factor per pane (longer list = more panes).
        pane_preserve_empty (Optional[list[bool]]): Per-pane flag — if
            ``True``, the pane is kept visible even when empty.


        tracking_mode_exit_mode (Optional[TrackingModeExitMode]): When
            the touch-device tracking mode exits; see
            :data:`TrackingModeExitMode`.
        add_default_pane (Optional[bool]): Add a default pane on
            chart creation (default ``True``).  Set ``False`` for
            advanced multi-pane setups that fully specify their own
            panes.
        tooltip (Optional[Tooltip]): Tracking-tooltip configuration built
            with :func:`tooltip` — a small overlay that follows the cursor
            and shows the focused series' title, value, and time. Constructing
            a ``tvl.tooltip(...)`` enables it; its colors come from the active
            Deephaven theme (no color options). In a multi-series chart it
            shows the single series under the cursor (falling back to the one
            whose value is nearest).
        on_press (Optional[PressEventCallable]): Server-side callback
            invoked when the user presses (clicks) on the chart. Receives
            a ``TvlPressEvent`` dict (or no argument). See
            :mod:`deephaven.plot.tradingview_lightweight.events`.
        on_double_press (Optional[PressEventCallable]): Server-side
            callback invoked when the user double-presses on the chart.

    Returns:
        TvlChart: A chart object that can be displayed in Deephaven.

    Note:
        ``createChartEx`` with a custom ``horzScaleBehavior`` is not
        supported from Python.  The named :data:`ChartType` values
        cover all built-in horizontal-scale behaviors shipped with TVL
        v5.  Users needing arbitrary custom horizontal scales must
        ship a plugin extension.

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> c = tvl.chart(tvl.line(my_table, timestamp="Timestamp", value="Price"),
        ...               background_color="#1a1a2e",
        ...               time_scale=tvl.time_scale(time_visible=True))
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
            f"from Python — use a plugin extension for fully custom horizontal scales."
        )

    # Extract series from each source. Accept both TvlChart (the new
    # public API) and bare SeriesSpec (for internal callers like
    # yield_curve / options_chart / custom_numeric).
    series_list: list[SeriesSpec] = []
    for src in sources:
        if isinstance(src, TvlChart):
            # Specs from tvl.line()/area()/etc. were validated in _wrap_as_chart.
            series_list.extend(src.series_list)
        elif isinstance(src, SeriesSpec):
            # Bare specs reach chart() from yield_curve/options_chart/
            # custom_numeric — validate their columns here.
            _validate_series_columns(src, f"chart() {src.series_type} series")
            series_list.append(src)
        else:
            raise TypeError(
                f"chart() inputs must be TvlChart instances (returned by "
                f"tvl.line(), tvl.area(), etc.), got {type(src).__name__}"
            )

    # Validate yield curve series constraints
    if resolved_type == "yieldCurve":
        for s in series_list:
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

    # fontFamily is intentionally not user-configurable and intentionally not
    # set here: the client resolves the Deephaven theme's font stack
    # ("Fira Sans", ...) and any value sent in chartOptions would override it.
    # (A previous hardcoded "Fira, sans-serif" here silently knocked every
    # chart() figure's axis labels into the browser's generic sans-serif —
    # "Fira" is not a registered font family; the web font is "Fira Sans".)
    layout = _filter_none(
        {
            "textColor": text_color,
            "fontSize": font_size,
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
    if grid is not None:
        grid_dict = grid.to_dict()
        if grid_dict:
            chart_options["grid"] = grid_dict

    # Crosshair
    if crosshair is not None:
        crosshair_dict = crosshair.to_dict()
        if crosshair_dict:
            chart_options["crosshair"] = crosshair_dict

    # Price scales (right / left / overlay defaults)
    if right_price_scale is not None:
        rps = right_price_scale.to_dict()
        if rps:
            chart_options["rightPriceScale"] = rps
    if left_price_scale is not None:
        lps = left_price_scale.to_dict()
        if lps:
            chart_options["leftPriceScale"] = lps
    if overlay_price_scale is not None:
        ops = overlay_price_scale.to_dict()
        if ops:
            chart_options["overlayPriceScales"] = ops

    # Time scale
    if time_scale is not None:
        ts = time_scale.to_dict()
        if ts:
            chart_options["timeScale"] = ts

    # Watermark (text + image)
    if watermark is not None:
        wm = watermark.to_dict()
        if wm:
            chart_options["watermark"] = wm
    if watermark_image is not None:
        iwm = watermark_image.to_dict()
        if iwm:
            chart_options["imageWatermark"] = iwm

    # HandleScroll — bool toggles everything; a Scroll object is per-gesture
    if handle_scroll is not None:
        if isinstance(handle_scroll, bool):
            chart_options["handleScroll"] = handle_scroll
        else:
            hs = handle_scroll.to_dict()
            if hs:
                chart_options["handleScroll"] = hs

    # HandleScale — bool toggles everything; a Scale object is per-gesture
    if handle_scale is not None:
        if isinstance(handle_scale, bool):
            chart_options["handleScale"] = handle_scale
        else:
            hsc = handle_scale.to_dict()
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

    # Behavior / interaction
    if tracking_mode_exit_mode is not None:
        chart_options["trackingMode"] = {
            "exitMode": TRACKING_MODE_EXIT_MODE_MAP[tracking_mode_exit_mode]
        }
    if add_default_pane is not None:
        chart_options["addDefaultPane"] = add_default_pane
    if hovered_series_on_top is not None:
        chart_options["hoveredSeriesOnTop"] = hovered_series_on_top
    if default_visible_price_scale_id is not None:
        chart_options["defaultVisiblePriceScaleId"] = default_visible_price_scale_id

    # --- Tracking tooltip ---
    if tooltip is not None:
        tt = tooltip.to_dict()
        if tt:
            chart_options["tooltip"] = tt

    return TvlChart(
        series_list=series_list,
        chart_options=chart_options,
        pane_stretch_factors=pane_stretch_factors,
        pane_preserve_empty=pane_preserve_empty,
        chart_type=resolved_type,
        on_press=on_press,
        on_double_press=on_double_press,
    )


# --- Per-type unified constructors ---
#
# Each of the six functions below is the public entry point for a series
# type. They accept the FULL series-factory signature from series.py +
# `by=` for partitioning, and return a single-series TvlChart with default
# chart options. The returned TvlChart can be displayed directly OR passed
# to tvl.chart(...) to be combined with other series under shared chart
# styling. Chart-styling options (background_color, text_color, watermark,
# crosshair, time_scale, tooltip, etc.) live only on tvl.chart.


def candlestick(
    table: Any,
    timestamp: str = "Timestamp",
    open: str = "Open",
    high: str = "High",
    low: str = "Low",
    close: str = "Close",
    up_color: Optional[Color] = None,
    down_color: Optional[Color] = None,
    border_visible: Optional[bool] = None,
    border_color: Optional[Color] = None,
    border_up_color: Optional[Color] = None,
    border_down_color: Optional[Color] = None,
    wick_visible: Optional[bool] = None,
    wick_color: Optional[Color] = None,
    wick_up_color: Optional[Color] = None,
    wick_down_color: Optional[Color] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    last_value_visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    last_price_line: Optional[LastPriceLine] = None,
    base_line: Optional[BaseLine] = None,
    price_scale: Optional[PriceScale] = None,
    color_column: Optional[str] = None,
    border_color_column: Optional[str] = None,
    wick_color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    auto_bin: Optional[bool] = None,
    bin_width: Optional[str] = None,
    bin_count: Optional[int] = None,
    by: Optional[str] = None,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Create a candlestick series.

    The result is a single-series :class:`TvlChart` that can be
    displayed directly OR passed to :func:`chart` to be combined with
    other series under shared chart styling.

    All series-level options are accepted (full TVL Candlestick
    options surface). Chart-level styling (background_color,
    watermark_text, crosshair_mode, time_visible, width, height, etc.)
    lives on :func:`chart` — wrap this result in ``tvl.chart(...)`` to
    customize them.

    Args:
        table: Deephaven table containing OHLC data.
        timestamp, open, high, low, close: Column names for the OHLC channels.
        by (Optional[str]): Column name to partition the table by. When
            set, one runtime series is created per unique value.
        Other parameters: see :func:`candlestick_series`-equivalent docs.

    Returns:
        TvlChart: A chart wrapping a single candlestick series.

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> c = tvl.candlestick(ohlc)
        >>> # Composed with other series:
        >>> c = tvl.chart(tvl.candlestick(ohlc), tvl.line(sma, "Timestamp", "Sma"))
    """
    kwargs = {k: v for k, v in locals().items() if k not in _CHART_ONLY_KWARGS}
    spec = series_module.candlestick_series(**kwargs)
    return _wrap_as_chart(spec, by, "candlestick", on_press, on_double_press)


def line(
    table: Any,
    timestamp: str,
    value: str,
    color: Optional[Color] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,
    point_markers_visible: Optional[bool] = None,
    point_markers_radius: Optional[float] = None,
    crosshair_marker: Optional[CrosshairMarker] = None,
    last_price_animation: Optional[LastPriceAnimationMode] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    last_price_line: Optional[LastPriceLine] = None,
    base_line: Optional[BaseLine] = None,
    price_scale: Optional[PriceScale] = None,
    color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    by: Optional[str] = None,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Create a line series.

    The result is a single-series :class:`TvlChart` that can be
    displayed directly OR passed to :func:`chart` to be combined with
    other series under shared chart styling.

    Args:
        table: Deephaven table with the data.
        timestamp: Column name for the time axis.
        value: Column name for the y-axis.
        by (Optional[str]): Column name to partition the table by.
            When set, one line is drawn per unique value of this column;
            new partition keys discovered at runtime (ticking tables)
            add new lines automatically.
        Other parameters: full TVL Line series options surface (see
            equivalent of :func:`line_series`).

    Returns:
        TvlChart: A chart wrapping a single line series (or one line per
        partition when ``by`` is set).

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> tvl.line(t, "Timestamp", "Price")
        >>> tvl.chart(tvl.line(t, "Timestamp", "Price", by="Sym"))
    """
    kwargs = {k: v for k, v in locals().items() if k not in _CHART_ONLY_KWARGS}
    spec = series_module.line_series(**kwargs)
    return _wrap_as_chart(spec, by, "line", on_press, on_double_press)


def area(
    table: Any,
    timestamp: str,
    value: str,
    line_color: Optional[Color] = None,
    top_color: Optional[Color] = None,
    bottom_color: Optional[Color] = None,
    relative_gradient: Optional[bool] = None,
    invert_filled_area: Optional[bool] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,
    point_markers_visible: Optional[bool] = None,
    point_markers_radius: Optional[float] = None,
    crosshair_marker: Optional[CrosshairMarker] = None,
    last_price_animation: Optional[LastPriceAnimationMode] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    last_price_line: Optional[LastPriceLine] = None,
    base_line: Optional[BaseLine] = None,
    price_scale: Optional[PriceScale] = None,
    line_color_column: Optional[str] = None,
    top_color_column: Optional[str] = None,
    bottom_color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    by: Optional[str] = None,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Create an area series.

    The result is a single-series :class:`TvlChart` that can be
    displayed directly OR passed to :func:`chart` to be combined with
    other series under shared chart styling.

    Args:
        table: Deephaven table with the data.
        timestamp: Column name for the time axis.
        value: Column name for the y-axis.
        by (Optional[str]): Column name to partition by. One area series
            per unique value (new keys at runtime add new series).
        Other parameters: full TVL Area series options surface.

    Returns:
        TvlChart: A chart wrapping a single area series (or one per
        partition when ``by`` is set).

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> tvl.area(t, "Timestamp", "Price")
        >>> tvl.chart(tvl.area(t, "Timestamp", "Price"), background_color="#111")
    """
    kwargs = {k: v for k, v in locals().items() if k not in _CHART_ONLY_KWARGS}
    spec = series_module.area_series(**kwargs)
    return _wrap_as_chart(spec, by, "area", on_press, on_double_press)


def bar(
    table: Any,
    timestamp: str = "Timestamp",
    open: str = "Open",
    high: str = "High",
    low: str = "Low",
    close: str = "Close",
    up_color: Optional[Color] = None,
    down_color: Optional[Color] = None,
    open_visible: Optional[bool] = None,
    thin_bars: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    last_value_visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    last_price_line: Optional[LastPriceLine] = None,
    base_line: Optional[BaseLine] = None,
    price_scale: Optional[PriceScale] = None,
    color_column: Optional[str] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    auto_bin: Optional[bool] = None,
    bin_width: Optional[str] = None,
    bin_count: Optional[int] = None,
    by: Optional[str] = None,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Create a bar (OHLC) series.

    Bar charts render each bucket as a vertical line with open/close
    ticks; contrast with :func:`candlestick` which fills the body.
    The result is a single-series :class:`TvlChart` standalone-renderable
    or nestable inside :func:`chart`.

    Args:
        table: Deephaven OHLC table.
        timestamp, open, high, low, close: Column names for OHLC channels.
        by (Optional[str]): Partition column.
        Other parameters: full TVL Bar series options surface.

    Returns:
        TvlChart: A chart wrapping a single bar series.
    """
    kwargs = {k: v for k, v in locals().items() if k not in _CHART_ONLY_KWARGS}
    spec = series_module.bar_series(**kwargs)
    return _wrap_as_chart(spec, by, "bar", on_press, on_double_press)


def baseline(
    table: Any,
    timestamp: str,
    value: str,
    base_value: Optional[float] = None,
    top_line_color: Optional[Color] = None,
    top_fill_color1: Optional[Color] = None,
    top_fill_color2: Optional[Color] = None,
    bottom_line_color: Optional[Color] = None,
    bottom_fill_color1: Optional[Color] = None,
    bottom_fill_color2: Optional[Color] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_type: Optional[LineType] = None,
    line_visible: Optional[bool] = None,
    relative_gradient: Optional[bool] = None,
    point_markers_visible: Optional[bool] = None,
    point_markers_radius: Optional[float] = None,
    crosshair_marker: Optional[CrosshairMarker] = None,
    last_price_animation: Optional[LastPriceAnimationMode] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    last_price_line: Optional[LastPriceLine] = None,
    base_line: Optional[BaseLine] = None,
    price_scale: Optional[PriceScale] = None,
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
    by: Optional[str] = None,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Create a baseline series.

    Fills the area between the value line and a horizontal base value
    with different gradient colors above (top) and below (bottom).
    Single-series :class:`TvlChart` standalone-renderable or nestable in
    :func:`chart`.

    Args:
        table: Deephaven table.
        timestamp, value: Column names.
        base_value: Baseline price level (default 0.0).
        by (Optional[str]): Partition column.
        Other parameters: full TVL Baseline series options surface.
    """
    kwargs = {k: v for k, v in locals().items() if k not in _CHART_ONLY_KWARGS}
    spec = series_module.baseline_series(**kwargs)
    return _wrap_as_chart(spec, by, "baseline", on_press, on_double_press)


def histogram(
    table: Any,
    timestamp: str,
    value: str,
    color: Optional[Color] = None,
    base: Optional[float] = None,
    color_column: Optional[str] = None,
    last_value_visible: Optional[bool] = None,
    title: Optional[str] = None,
    visible: Optional[bool] = None,
    price_scale_id: Optional[str] = None,
    price_format: Optional[PriceFormat] = None,
    last_price_line: Optional[LastPriceLine] = None,
    base_line: Optional[BaseLine] = None,
    price_scale: Optional[PriceScale] = None,
    pane: Optional[int] = None,
    markers: Optional[list[Marker]] = None,
    price_lines: Optional[list[PriceLine]] = None,
    marker_spec: Optional[MarkerSpec] = None,
    auto_bin: Optional[bool] = None,
    bin_width: Optional[str] = None,
    bin_count: Optional[int] = None,
    agg: str = "sum",
    by: Optional[str] = None,
    on_press: Optional[PressEventCallable] = None,
    on_double_press: Optional[PressEventCallable] = None,
) -> TvlChart:
    """Create a histogram series.

    One vertical bar per time bucket. ``agg`` selects the per-bin
    reduction (sum / count / avg / last) when auto-binning fires.
    Single-series :class:`TvlChart` standalone-renderable or nestable in
    :func:`chart`.

    Args:
        table: Deephaven table.
        timestamp, value: Column names.
        agg: Per-bin reduction (``"sum"``, ``"count"``, ``"avg"``, ``"last"``).
        by (Optional[str]): Partition column.
        Other parameters: full TVL Histogram series options surface.
    """
    kwargs = {k: v for k, v in locals().items() if k not in _CHART_ONLY_KWARGS}
    spec = series_module.histogram_series(**kwargs)
    return _wrap_as_chart(spec, by, "histogram", on_press, on_double_press)


# --- Non-standard chart type convenience functions ---


def yield_curve(
    table: Any,
    maturity: str = "Maturity",
    value: str = "Yield",
    series_type: str = "line",
    # Series styling
    color: Optional[Color] = None,
    line_width: Optional[LineWidth] = None,
    title: Optional[str] = None,
    # Area-specific (only used when series_type="area")
    line_color: Optional[Color] = None,
    top_color: Optional[Color] = None,
    bottom_color: Optional[Color] = None,
    # Yield curve options
    base_resolution: Optional[int] = None,
    minimum_time_range: Optional[int] = None,
    start_time_range: Optional[int] = None,
    # Common chart options
    background_color: Optional[Color] = None,
    text_color: Optional[Color] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    watermark_text: Optional[str] = None,
) -> TvlChart:
    """Create a yield curve chart with a single Line or Area series.

    A yield-curve chart has a numeric horizontal axis representing
    maturity in months and is rendered via the TVL
    ``createYieldCurveChart`` backend.  Only Line and Area series are
    supported.

    Args:
        table (Any): Deephaven table with the yield-curve data.
        maturity (str): Column name for the x-axis (months, numeric).
        value (str): Column name for the y-axis (yield values).
        series_type (str): ``"line"`` (default) or ``"area"``.
        color (Optional[Color]): Line color (also used as the area's
            line color when ``line_color`` is not set).
        line_width (Optional[LineWidth]): Stroke width in pixels (1–4).
        title (Optional[str]): Title shown in the series tooltip /
            legend.
        line_color (Optional[Color]): Area-only: explicit line color
            (overrides ``color``).
        top_color (Optional[Color]): Area-only: top gradient fill color.
        bottom_color (Optional[Color]): Area-only: bottom gradient fill
            color.
        base_resolution (Optional[int]): Yield-curve x-axis base
            resolution in seconds.
        minimum_time_range (Optional[int]): Minimum visible time range.
        start_time_range (Optional[int]): Initial visible time range.
        background_color (Optional[Color]): Chart background CSS color.
        text_color (Optional[Color]): Axis / label text color.
        crosshair_mode (Optional[CrosshairMode]): Crosshair mode; see
            :data:`CrosshairMode`.
        watermark_text (Optional[str]): Single-line watermark text.

    Returns:
        TvlChart: A yield-curve chart with a single series.

    Raises:
        ValueError: If ``series_type`` is not ``"line"`` or ``"area"``.

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> c = tvl.yield_curve(curve, maturity="Maturity",
        ...                     value="Yield", series_type="line")
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
            timestamp=maturity,
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
            timestamp=maturity,
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
        crosshair=(
            Crosshair(mode=crosshair_mode) if crosshair_mode is not None else None
        ),
        watermark=(
            Watermark(text=watermark_text) if watermark_text is not None else None
        ),
    )


def options_chart(
    table: Any,
    strike: str = "Strike",
    value: str = "Value",
    series_type: str = "line",
    # Series styling
    color: Optional[Color] = None,
    line_width: Optional[LineWidth] = None,
    title: Optional[str] = None,
    # Area-specific
    line_color: Optional[Color] = None,
    top_color: Optional[Color] = None,
    bottom_color: Optional[Color] = None,
    # Common chart options
    background_color: Optional[Color] = None,
    text_color: Optional[Color] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    watermark_text: Optional[str] = None,
) -> TvlChart:
    """Create an options chart with a single series.

    The horizontal axis represents strike prices (numeric) and the
    chart is rendered via the TVL ``createOptionsChart`` backend.
    For non-strike numeric x-axes (frequency, distance, etc.), prefer
    :func:`custom_numeric`, which uses the same renderer with a more
    descriptive name and parameter (``x`` instead of ``strike``).

    Args:
        table (Any): Deephaven table with the data.
        strike (str): Column name for the x-axis (strike prices,
            numeric).
        value (str): Column name for the y-axis.
        series_type (str): ``"line"`` (default), ``"area"``, or
            ``"histogram"``.
        color (Optional[Color]): Line / histogram color.  For area
            series, falls back to ``line_color`` when set.
        line_width (Optional[LineWidth]): Stroke width in pixels (1–4).
        title (Optional[str]): Title shown in the series tooltip /
            legend.
        line_color (Optional[Color]): Area-only: explicit line color.
        top_color (Optional[Color]): Area-only: top gradient fill color.
        bottom_color (Optional[Color]): Area-only: bottom gradient fill
            color.
        background_color (Optional[Color]): Chart background CSS color.
        text_color (Optional[Color]): Axis / label text color.
        crosshair_mode (Optional[CrosshairMode]): Crosshair mode; see
            :data:`CrosshairMode`.
        watermark_text (Optional[str]): Single-line watermark text.

    Returns:
        TvlChart: An options chart with a single series.

    Raises:
        ValueError: If ``series_type`` is not ``"line"``, ``"area"``,
            or ``"histogram"``.

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> c = tvl.options_chart(opt_chain, strike="Strike",
        ...                       value="IV", series_type="line")
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
            timestamp=strike,
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
            timestamp=strike,
            value=value,
            color=color,
            title=title,
        )
    else:
        s = series_module.line_series(
            table,
            timestamp=strike,
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
        crosshair=(
            Crosshair(mode=crosshair_mode) if crosshair_mode is not None else None
        ),
        watermark=(
            Watermark(text=watermark_text) if watermark_text is not None else None
        ),
    )


def custom_numeric(
    table: Any,
    x: str = "X",
    value: str = "Value",
    series_type: str = "line",
    # Series styling
    color: Optional[Color] = None,
    line_width: Optional[LineWidth] = None,
    title: Optional[str] = None,
    # Area-specific
    line_color: Optional[Color] = None,
    top_color: Optional[Color] = None,
    bottom_color: Optional[Color] = None,
    # Common chart options
    background_color: Optional[Color] = None,
    text_color: Optional[Color] = None,
    crosshair_mode: Optional[CrosshairMode] = None,
    watermark_text: Optional[str] = None,
) -> TvlChart:
    """Create a chart with a generic numeric x-axis.

    Use this when the x-axis represents arbitrary numeric values
    (frequency, distance, price level, etc.) rather than timestamps.
    Internally uses the same ``createOptionsChart`` renderer as
    :func:`options_chart`, which provides a linearly-spaced numeric
    horizontal scale.

    Args:
        table (Any): Deephaven table with the data.
        x (str): Column name for the x-axis (numeric values).
        value (str): Column name for the y-axis.
        series_type (str): ``"line"`` (default), ``"area"``, or
            ``"histogram"``.
        color (Optional[Color]): Line / histogram color.
        line_width (Optional[LineWidth]): Stroke width in pixels (1–4).
        title (Optional[str]): Title shown in the series tooltip /
            legend.
        line_color (Optional[Color]): Area-only: explicit line color.
        top_color (Optional[Color]): Area-only: top gradient fill color.
        bottom_color (Optional[Color]): Area-only: bottom gradient fill
            color.
        background_color (Optional[Color]): Chart background CSS color.
        text_color (Optional[Color]): Axis / label text color.
        crosshair_mode (Optional[CrosshairMode]): Crosshair mode; see
            :data:`CrosshairMode`.
        watermark_text (Optional[str]): Single-line watermark text.

    Returns:
        TvlChart: A chart with a generic numeric x-axis.

    Raises:
        ValueError: If ``series_type`` is not ``"line"``, ``"area"``,
            or ``"histogram"``.

    Note:
        ``createChartEx`` with a fully custom ``horzScaleBehavior``
        is not supported from Python.  Ship a plugin extension for
        that use case.

    Example:
        >>> import deephaven.plot.tradingview_lightweight as tvl
        >>> c = tvl.custom_numeric(data, x="Frequency",
        ...                        value="Amplitude")
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
            timestamp=x,
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
            timestamp=x,
            value=value,
            color=color,
            title=title,
        )
    else:
        s = series_module.line_series(
            table,
            timestamp=x,
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
        crosshair=(
            Crosshair(mode=crosshair_mode) if crosshair_mode is not None else None
        ),
        watermark=(
            Watermark(text=watermark_text) if watermark_text is not None else None
        ),
    )


def _inherit_series_docstring(
    unified_fn: Any, factory_fn: Any, returns_desc: str
) -> None:
    """Replace the unified constructor's terse docstring with one derived
    from the matching ``*_series`` factory.

    The deephaven_autodoc Sphinx extension iterates the function signature
    and requires every parameter to appear in the rendered Args list with
    ``name (type) -- description`` format. The unified constructors share
    the factory's parameter set + ``by``, so the factory's Args block is
    reused verbatim and a ``by`` entry is appended. The Returns line is
    rewritten to ``TvlChart`` since the unified constructor wraps the spec.
    """
    # Normalize indentation first: Python 3.13+ dedents docstrings at
    # compile time, so the raw __doc__ indentation differs across
    # versions. After cleandoc, sections sit at column 0 and Args
    # entries at 4 regardless of interpreter.
    factory_doc = inspect.cleandoc(factory_fn.__doc__ or "")
    lines = factory_doc.split("\n")
    # Find Args: and Returns: section boundaries
    args_idx = None
    returns_idx = None
    for i, ln in enumerate(lines):
        if ln.strip() == "Args:":
            args_idx = i
        elif ln.strip().startswith("Returns:"):
            returns_idx = i
            break
    if args_idx is None or returns_idx is None:
        return  # factory has no Args/Returns; leave the existing terse doc

    # Insert `by` + event-handler entries as the last items in Args
    # (before Returns). These params are added by the per-type constructor
    # on top of the factory's signature, so they need explicit Args lines
    # for the autodoc coverage check.
    by_doc = [
        "    by (Optional[str]): Column name to partition the table by.",
        "        When set, one runtime series is created per unique value;",
        "        new partition keys discovered at runtime (ticking tables)",
        "        add new series automatically.",
        "    on_press (Optional[PressEventCallable]): Server-side callback",
        "        invoked when the user presses (clicks) on the chart. Receives",
        "        a TvlPressEvent dict, or no argument.",
        "    on_double_press (Optional[PressEventCallable]): Server-side",
        "        callback invoked when the user double-presses on the chart.",
    ]
    # Find the last non-blank line of the Args block.
    insert_at = returns_idx
    while insert_at > args_idx + 1 and not lines[insert_at - 1].strip():
        insert_at -= 1

    new_lines = lines[:insert_at] + by_doc + [""] + lines[returns_idx:]

    # Rewrite the Returns body. Find the indented description line(s)
    # after `Returns:` and replace with the unified-constructor's return.
    out: list[str] = []
    in_returns = False
    skipped_returns_body = False
    for ln in new_lines:
        if ln.strip().startswith("Returns:"):
            out.append(ln)
            in_returns = True
            skipped_returns_body = False
            continue
        if in_returns and not skipped_returns_body:
            # Replace the first description with our own.
            if ln.strip() and ln.startswith(" "):
                out.append("    TvlChart: " + returns_desc)
                skipped_returns_body = True
                continue
            elif ln.strip() == "":
                continue
        if in_returns and ln and not ln.startswith(" "):
            in_returns = False
        out.append(ln)

    # Take the first paragraph of the factory's docstring as the summary
    # and prepend a sentence about the unified constructor's behavior.
    summary_end = 0
    for i, ln in enumerate(lines):
        if i > 0 and ln.strip() == "":
            summary_end = i
            break
    summary = "\n".join(lines[:summary_end])

    unified_fn.__doc__ = (
        summary
        + "\n\nThe result is a single-series :class:`TvlChart` that can be displayed\n"
        + "directly OR passed to :func:`chart` to be combined with other series\n"
        + "under shared chart styling.\n\n"
        + "\n".join(out[summary_end:])
    )


_inherit_series_docstring(
    candlestick,
    series_module.candlestick_series,
    "A chart wrapping a single candlestick series.",
)
_inherit_series_docstring(
    line,
    series_module.line_series,
    "A chart wrapping a single line series (or one line per partition when ``by`` is set).",
)
_inherit_series_docstring(
    area,
    series_module.area_series,
    "A chart wrapping a single area series (or one per partition when ``by`` is set).",
)
_inherit_series_docstring(
    bar,
    series_module.bar_series,
    "A chart wrapping a single bar series.",
)
_inherit_series_docstring(
    baseline,
    series_module.baseline_series,
    "A chart wrapping a single baseline series.",
)
_inherit_series_docstring(
    histogram,
    series_module.histogram_series,
    "A chart wrapping a single histogram series.",
)
