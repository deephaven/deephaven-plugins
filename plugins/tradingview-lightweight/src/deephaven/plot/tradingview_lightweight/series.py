"""Series creation functions for TradingView Lightweight Charts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .options import (
    BaseLine,
    CrosshairMarker,
    LastPriceAnimationMode,
    LastPriceLine,
    LineStyle,
    LineType,
    LineWidth,
    PriceFormat,
    PriceScale,
    LAST_PRICE_ANIMATION_MODE_MAP,
    LINE_STYLE_MAP,
    LINE_TYPE_MAP,
)
from .markers import Marker, PriceLine, MarkerSpec
from ._colors import Color

# TODO: createUpDownMarkers plugin support — see notes/coverage-plan/18-utility-types-and-functions.md §3.3
# When implementing, add up_down_markers, up_down_marker_up_color, up_down_marker_down_color
# params to series creation functions and serialize as seriesOptions.upDownMarkers.


def _validate_price_format(price_format: Optional[PriceFormat]) -> None:
    """Raise ValueError if price_format uses an unsupported type."""
    if price_format is not None and price_format.type not in (
        "price",
        "volume",
        "percent",
    ):
        raise ValueError(
            f"Unsupported price_format type {price_format.type!r}. "
            "Use 'price', 'volume', or 'percent'."
        )


@dataclass
class SeriesSpec:
    """Specification for a single chart series.

    Holds everything required to render one series on a TVL chart:
    the source Deephaven table, the column-to-channel mapping, any
    styling options, optional markers / price lines / table-driven
    marker spec, and auto-bin (downsampling) controls.

    Construct instances through one of the typed factories
    (:func:`candlestick_series`, :func:`bar_series`,
    :func:`line_series`, :func:`area_series`,
    :func:`baseline_series`, :func:`histogram_series`) rather than
    instantiating directly — the factories validate inputs and build
    the camelCase JS-shaped ``options`` and ``price_scale_options``
    dicts.

    Attributes:
        series_type: One of ``"Candlestick"``, ``"Bar"``, ``"Line"``,
            ``"Area"``, ``"Baseline"``, ``"Histogram"``.
        table: The source Deephaven table.
        column_mapping: Dict mapping series channel names to table
            column names (e.g.
            ``{"time": "Timestamp", "open": "Open", "high": "High"}``).
        options: camelCase JS-shaped series options dict.
        markers: Optional list of static :class:`Marker` instances.
        price_lines: Optional list of :class:`PriceLine` instances.
        marker_spec: Optional table-driven :class:`MarkerSpec`.
        price_scale_options: camelCase price-scale options for the
            series' scale.
        pane: Optional pane index (default ``0``).
        auto_bin: Tri-state auto-bin control.  ``None`` (default) =
            auto-detect by table size; ``True`` = force aggregation;
            ``False`` = opt out and ship raw rows.
        bin_width: Optional ISO 8601 duration override (e.g.
            ``"PT1S"``, ``"PT5M"``).  Bypasses nice-duration snapping.
        bin_count: Optional target bin count for the initial
            aggregation (default ``5000``).
        agg: Histogram-only per-bin aggregation: ``"sum"``,
            ``"count"``, ``"avg"``, or ``"last"``.  Set by the
            factory; not user-facing on non-histogram series.
        continuous: Continuous (end-to-end) rendering for Histogram /
            Candlestick / Bar series.  ``True`` (default) renders each
            item's body spanning its full time bin via a custom
            client-side series; ``False`` uses the built-in fixed
            pixel-width renderer.  Ignored for other series types.
    """

    series_type: str  # "Candlestick", "Bar", "Line", "Area", "Baseline", "Histogram"
    table: Any  # Deephaven Table
    column_mapping: dict  # {"time": "Timestamp", "open": "Open", ...}
    options: dict = field(default_factory=dict)
    markers: Optional[list[Marker]] = None
    price_lines: Optional[list[PriceLine]] = None
    marker_spec: Optional[MarkerSpec] = None
    price_scale_options: dict = field(default_factory=dict)
    pane: Optional[int] = None

    # ---- Auto-bin (server-side time-bucket aggregation) ----
    # Tri-state: None=auto-detect by table size, True=force on, False=opt out.
    auto_bin: Optional[bool] = None
    # ISO 8601 duration override (e.g. 'PT1S'). When set, overrides nice_bin_width.
    bin_width: Optional[str] = None
    # Override TARGET_BINS for the initial aggregation.
    bin_count: Optional[int] = None
    # Histogram-only aggregation mode: "sum" | "count" | "avg" | "last".
    agg: Optional[str] = None

    # Continuous (end-to-end) rendering for Histogram/Candlestick/Bar.
    # True (default) = custom client series with bin-spanning bodies;
    # False = built-in fixed pixel-width renderer.
    continuous: bool = True

    # ---- Partition-by-key (`by=`) ----
    # When set, the source table is partitioned by this column and one
    # runtime series is created per unique key. JS watches the partitioned
    # table for new/dropped keys.
    by: Optional[str] = None
    # Resolved PartitionedTable from table.partition_by([by]). Set by the
    # caller (unified constructors) so liveness can manage it.
    partitioned_table: Any = None

    def to_dict(
        self, series_id: str, table_id: int, marker_table_id: int | None = None
    ) -> dict:
        """Serialize the series spec to a JSON-transport dict.

        Args:
            series_id: Stable string ID assigned to this series
                (usually ``"series_<i>"``).
            table_id: Wire-protocol integer reference for
                :attr:`table`.
            marker_table_id: Wire-protocol integer reference for the
                :attr:`marker_spec` table, or ``None`` if no marker
                spec is set.

        Returns:
            dict: JSON-serializable dict with ``id``, ``type``,
            ``options``, ``dataMapping``, and (when set) ``markers``,
            ``priceLines``, ``markerSpec``, ``priceScaleOptions``,
            ``paneIndex``.
        """
        result = {
            "id": series_id,
            "type": self.series_type,
            "options": self.options,
            "dataMapping": {
                "tableId": table_id,
                "columns": self.column_mapping,
            },
        }
        # Bar types gate their custom renderer on this; line types only
        # gate the chart-wide time-proportional axis (whitespace scaffold).
        if self.series_type in (
            "Histogram",
            "Candlestick",
            "Bar",
            "Line",
            "Area",
            "Baseline",
        ):
            result["continuous"] = self.continuous
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
        if self.by is not None:
            # JS uses this to watch the partitioned table and spawn one
            # runtime series per partition key, using `options`, `column_mapping`,
            # and `priceScaleOptions` from this spec as the template.
            result["partition"] = {"byColumn": self.by}
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


def _build_price_scale_options(price_scale: Optional[PriceScale]) -> dict:
    """Serialise a grouped :class:`PriceScale` to priceScaleOptions (or ``{}``)."""
    return price_scale.to_dict() if price_scale is not None else {}


def _build_common_options(
    last_value_visible: Optional[bool],
    title: Optional[str],
    visible: Optional[bool],
    price_scale_id: Optional[str],
    price_format: Optional[PriceFormat],
    last_price_line: Optional[LastPriceLine],
    base_line: Optional[BaseLine],
) -> dict:
    """Build the SeriesOptionsCommon portion of the series options dict.

    Returns a dict with only non-None entries, ready to be merged into the
    per-type options dict via ``{**_build_common_options(...), ...}``.
    The grouped ``last_price_line`` / ``base_line`` objects serialise to
    their flat camelCase ``priceLine*`` / ``baseLine*`` option keys.
    """
    return {
        **_filter_none(
            {
                "lastValueVisible": last_value_visible,
                "title": title,
                "visible": visible,
                "priceScaleId": price_scale_id,
                "priceFormat": price_format.to_dict()
                if price_format is not None
                else None,
            }
        ),
        **(last_price_line.to_dict() if last_price_line is not None else {}),
        **(base_line.to_dict() if base_line is not None else {}),
    }


def candlestick_series(
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
    continuous: bool = True,
) -> SeriesSpec:
    """Create a candlestick series specification.

    A candlestick series renders four channels (open, high, low,
    close) per time bucket as a filled body with wicks.  When the
    source table is large, auto-binning aggregates OHLC values
    server-side before the data is shipped to the browser.

    Args:
        table (Any): The Deephaven table containing OHLC data.
        timestamp (str): Column name for the time axis.
        open (str): Column name for the opening price.
        high (str): Column name for the bar high.
        low (str): Column name for the bar low.
        close (str): Column name for the closing price.
        up_color (Optional[Color]): Body color for up-bars.
        down_color (Optional[Color]): Body color for down-bars.
        border_visible (Optional[bool]): Show the body border.
        border_color (Optional[Color]): Border color for both directions.
        border_up_color (Optional[Color]): Border color for up-bars
            (overrides ``border_color`` for up).
        border_down_color (Optional[Color]): Border color for down-bars.
        wick_visible (Optional[bool]): Show wicks.
        wick_color (Optional[Color]): Wick color for both directions.
        wick_up_color (Optional[Color]): Wick color for up-bars.
        wick_down_color (Optional[Color]): Wick color for down-bars.
        title (Optional[str]): Title shown in the series tooltip /
            legend.
        visible (Optional[bool]): Whether the series is visible.
        last_value_visible (Optional[bool]): Show the last-value
            badge on the price scale.
        price_scale_id (Optional[str]): ID of the price scale this
            series uses (``"left"``, ``"right"``, or a custom overlay
            ID).
        price_format (Optional[PriceFormat]): Per-series number format;
            build with :func:`price_format`.
        last_price_line (Optional[LastPriceLine]): Styling for the auto
            last-price horizontal rule; build with :func:`last_price_line`.
        base_line (Optional[BaseLine]): Styling for the zero/index base
            line (``percentage`` / ``indexed_to_100`` price modes);
            build with :func:`base_line`.
        price_scale (Optional[PriceScale]): Options for the price scale
            this series binds to; build with :func:`price_scale`.
        color_column (Optional[str]): Column name supplying per-row
            body color (overrides ``up_color`` / ``down_color``).
        border_color_column (Optional[str]): Column name supplying
            per-row border color.
        wick_color_column (Optional[str]): Column name supplying
            per-row wick color.
        pane (Optional[int]): Pane index (default ``0``).
        markers (Optional[list[Marker]]): Static markers.
        price_lines (Optional[list[PriceLine]]): Horizontal price
            lines.
        marker_spec (Optional[MarkerSpec]): Table-driven marker spec.
        auto_bin (Optional[bool]): Tri-state.  ``None`` (default)
            auto-bins when the table exceeds the auto-bin threshold
            (5000 rows); ``True`` forces aggregation even for small
            tables; ``False`` ships the raw table.
        bin_width (Optional[str]): ISO 8601 duration override (e.g.
            ``"PT1S"``, ``"PT5M"``).
        bin_count (Optional[int]): Target number of bins (default
            ``5000``).
        continuous (bool): ``True`` (default) renders candle bodies
            spanning their full time bin (end-to-end); ``False`` uses
            the built-in fixed pixel-width renderer.

    Returns:
        SeriesSpec: A series specification suitable for passing to
        :func:`chart`.

    Note:
        Auto-bin aggregation for OHLC: ``first(open)``, ``max(high)``,
        ``min(low)``, ``last(close)``.  Four distinct OHLC columns are
        required; passing the same column for more than one role will
        raise at chart build time.

    Example:
        >>> s = tvl.candlestick_series(ohlc, timestamp="Timestamp",
        ...                            open="Open", high="High",
        ...                            low="Low", close="Close")
    """
    _validate_price_format(price_format)
    options = {
        **_build_common_options(
            last_value_visible=last_value_visible,
            title=title,
            visible=visible,
            price_scale_id=price_scale_id,
            price_format=price_format,
            last_price_line=last_price_line,
            base_line=base_line,
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
        "time": timestamp,
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
        price_scale_options=_build_price_scale_options(price_scale),
        pane=pane,
        auto_bin=auto_bin,
        bin_width=bin_width,
        bin_count=bin_count,
        agg="ohlc",
        continuous=continuous,
    )


def bar_series(
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
    continuous: bool = True,
) -> SeriesSpec:
    """Create a bar (OHLC) series specification.

    Bar series render each bucket as a vertical line with small
    open/close ticks; contrast with :func:`candlestick_series` which
    fills the body.  Same auto-bin behavior as candlestick.

    Args:
        table (Any): Deephaven table containing OHLC data.
        timestamp (str): Column name for the time axis.
        open (str): Column name for the opening price.
        high (str): Column name for the bar high.
        low (str): Column name for the bar low.
        close (str): Column name for the closing price.
        up_color (Optional[Color]): Bar color for up-bars.
        down_color (Optional[Color]): Bar color for down-bars.
        open_visible (Optional[bool]): Show the open tick (default
            ``True``).
        thin_bars (Optional[bool]): Use thin bar style.
        title (Optional[str]): Title shown in the series tooltip /
            legend.
        visible (Optional[bool]): Series visibility.
        last_value_visible (Optional[bool]): Show the last-value
            badge.
        price_scale_id (Optional[str]): Price-scale ID.
        price_format (Optional[PriceFormat]): Per-series price format.
        last_price_line (Optional[LastPriceLine]): Styling for the auto
            last-price horizontal rule; build with :func:`last_price_line`.
        base_line (Optional[BaseLine]): Styling for the zero/index base
            line; build with :func:`base_line`.
        price_scale (Optional[PriceScale]): Options for the price scale
            this series binds to; build with :func:`price_scale`.
        color_column (Optional[str]): Column name supplying per-row
            bar color.
        pane (Optional[int]): Pane index.
        markers (Optional[list[Marker]]): Static markers.
        price_lines (Optional[list[PriceLine]]): Horizontal price
            lines.
        marker_spec (Optional[MarkerSpec]): Table-driven marker spec.
        auto_bin (Optional[bool]): Auto-bin tri-state.  See
            :func:`candlestick_series` for full semantics.
        bin_width (Optional[str]): ISO 8601 duration override.
        bin_count (Optional[int]): Target number of bins.
        continuous (bool): ``True`` (default) renders bars spanning
            their full time bin (end-to-end); ``False`` uses the
            built-in fixed pixel-width renderer.

    Returns:
        SeriesSpec: A bar-series specification.

    Example:
        >>> s = tvl.bar_series(ohlc, timestamp="Timestamp",
        ...                    open="Open", high="High",
        ...                    low="Low", close="Close")
    """
    _validate_price_format(price_format)
    options = {
        **_build_common_options(
            last_value_visible=last_value_visible,
            title=title,
            visible=visible,
            price_scale_id=price_scale_id,
            price_format=price_format,
            last_price_line=last_price_line,
            base_line=base_line,
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
        "time": timestamp,
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
        price_scale_options=_build_price_scale_options(price_scale),
        pane=pane,
        auto_bin=auto_bin,
        bin_width=bin_width,
        bin_count=bin_count,
        agg="ohlc",
        continuous=continuous,
    )


def line_series(
    table: Any,
    timestamp: str = "Timestamp",
    value: str = "Value",
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
    continuous: bool = True,
) -> SeriesSpec:
    """Create a line series specification.

    Args:
        table (Any): Deephaven table with the data.
        timestamp (str): Column name for the time axis.
        value (str): Column name for the y-axis.
        color (Optional[Color]): Line color (CSS string).
        line_width (Optional[LineWidth]): Stroke width 1–4 px.
        line_style (Optional[LineStyle]): Dash pattern; see
            :data:`LineStyle`.
        line_type (Optional[LineType]): Geometry between data points;
            see :data:`LineType`.
        line_visible (Optional[bool]): Show the line itself (set
            ``False`` to render only crosshair / point markers).
        point_markers_visible (Optional[bool]): Show point markers
            at every data point.
        point_markers_radius (Optional[float]): Point marker radius in
            pixels.
        crosshair_marker (Optional[CrosshairMarker]): Styling for the
            crosshair marker dot; build with :func:`crosshair_marker`.
        last_price_animation (Optional[LastPriceAnimationMode]):
            Last-price dot animation; see :data:`LastPriceAnimationMode`.
        last_value_visible (Optional[bool]): Show the last-value badge.
        title (Optional[str]): Title in the series tooltip / legend.
        visible (Optional[bool]): Series visibility.
        price_scale_id (Optional[str]): Price-scale ID.
        price_format (Optional[PriceFormat]): Per-series price format.
        last_price_line (Optional[LastPriceLine]): Styling for the auto
            last-price horizontal rule; build with :func:`last_price_line`.
        base_line (Optional[BaseLine]): Styling for the zero/index base
            line; build with :func:`base_line`.
        price_scale (Optional[PriceScale]): Options for the price scale
            this series binds to; build with :func:`price_scale`.
        color_column (Optional[str]): Column name supplying per-row
            line color.
        pane (Optional[int]): Pane index.
        markers (Optional[list[Marker]]): Static markers.
        price_lines (Optional[list[PriceLine]]): Horizontal price
            lines.
        marker_spec (Optional[MarkerSpec]): Table-driven marker spec.
        continuous (bool): ``True`` (default) lays the chart's time axis
            out proportionally, so real time gaps render as open gaps.
            ``False`` opts the whole chart back to the plain ordinal
            layout (gaps collapse to one step).

    Returns:
        SeriesSpec: A line-series specification.

    Example:
        >>> s = tvl.line_series(my_table, timestamp="Timestamp",
        ...                     value="Price", color="#26a69a")
    """
    _validate_price_format(price_format)
    options = {
        **_build_common_options(
            last_value_visible=last_value_visible,
            title=title,
            visible=visible,
            price_scale_id=price_scale_id,
            price_format=price_format,
            last_price_line=last_price_line,
            base_line=base_line,
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
                "lastPriceAnimation": _resolve_last_price_animation(
                    last_price_animation
                ),
            }
        ),
        **(crosshair_marker.to_dict() if crosshair_marker is not None else {}),
    }
    column_mapping = {"time": timestamp, "value": value}
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
        price_scale_options=_build_price_scale_options(price_scale),
        pane=pane,
        continuous=continuous,
    )


def area_series(
    table: Any,
    timestamp: str = "Timestamp",
    value: str = "Value",
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
    continuous: bool = True,
) -> SeriesSpec:
    """Create an area series specification.

    Renders a filled area between the value line and the bottom of
    the chart, using a vertical gradient between ``top_color`` and
    ``bottom_color``.

    Args:
        table (Any): Deephaven table with the data.
        timestamp (str): Column name for the time axis.
        value (str): Column name for the y-axis.
        line_color (Optional[Color]): Line color at the top of the
            filled area.
        top_color (Optional[Color]): Gradient fill color at the top.
        bottom_color (Optional[Color]): Gradient fill color at the
            bottom (typically transparent).
        relative_gradient (Optional[bool]): If ``True``, the gradient
            is measured relative to the series values rather than the
            chart bounds.
        invert_filled_area (Optional[bool]): If ``True``, fill above
            the line instead of below.
        line_width (Optional[LineWidth]): Stroke width 1–4 px.
        line_style (Optional[LineStyle]): Dash pattern; see
            :data:`LineStyle`.
        line_type (Optional[LineType]): Geometry between data points;
            see :data:`LineType`.
        line_visible (Optional[bool]): Show the line.
        point_markers_visible (Optional[bool]): Show point markers
            at every data point.
        point_markers_radius (Optional[float]): Point marker radius.
        crosshair_marker (Optional[CrosshairMarker]): Styling for the
            crosshair marker dot; build with :func:`crosshair_marker`.
        last_price_animation (Optional[LastPriceAnimationMode]):
            Last-price dot animation.
        last_value_visible (Optional[bool]): Show the last-value badge.
        title (Optional[str]): Title.
        visible (Optional[bool]): Series visibility.
        price_scale_id (Optional[str]): Price-scale ID.
        price_format (Optional[PriceFormat]): Per-series price format.
        last_price_line (Optional[LastPriceLine]): Styling for the auto
            last-price horizontal rule; build with :func:`last_price_line`.
        base_line (Optional[BaseLine]): Styling for the zero/index base
            line; build with :func:`base_line`.
        price_scale (Optional[PriceScale]): Options for the price scale
            this series binds to; build with :func:`price_scale`.
        line_color_column (Optional[str]): Per-row line color column.
        top_color_column (Optional[str]): Per-row top-color column.
        bottom_color_column (Optional[str]): Per-row bottom-color
            column.
        pane (Optional[int]): Pane index.
        markers (Optional[list[Marker]]): Static markers.
        price_lines (Optional[list[PriceLine]]): Horizontal price
            lines.
        marker_spec (Optional[MarkerSpec]): Table-driven marker spec.
        continuous (bool): ``True`` (default) = time-proportional chart
            axis; ``False`` opts the whole chart back to the plain
            ordinal layout.  See :func:`line_series`.

    Returns:
        SeriesSpec: An area-series specification.

    Example:
        >>> s = tvl.area_series(my_table, timestamp="Timestamp",
        ...                     value="Price",
        ...                     top_color="rgba(38,166,154,0.4)",
        ...                     bottom_color="rgba(38,166,154,0)")
    """
    _validate_price_format(price_format)
    options = {
        **_build_common_options(
            last_value_visible=last_value_visible,
            title=title,
            visible=visible,
            price_scale_id=price_scale_id,
            price_format=price_format,
            last_price_line=last_price_line,
            base_line=base_line,
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
                "lastPriceAnimation": _resolve_last_price_animation(
                    last_price_animation
                ),
            }
        ),
        **(crosshair_marker.to_dict() if crosshair_marker is not None else {}),
    }
    column_mapping = {"time": timestamp, "value": value}
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
        price_scale_options=_build_price_scale_options(price_scale),
        pane=pane,
        continuous=continuous,
    )


def baseline_series(
    table: Any,
    timestamp: str = "Timestamp",
    value: str = "Value",
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
    continuous: bool = True,
) -> SeriesSpec:
    """Create a baseline series specification.

    A baseline series renders an area between the value line and a
    horizontal "base value", with different gradient fills above
    (top) and below (bottom) the baseline.  Useful for visualizing
    diff-from-reference quantities (P&L vs 0, return vs index, etc.).

    Args:
        table (Any): Deephaven table with the data.
        timestamp (str): Column name for the time axis.
        value (str): Column name for the y-axis.
        base_value (Optional[float]): The baseline price level.  The
            fill color flips at this y-value.  Defaults to ``0.0``.
        top_line_color (Optional[Color]): Line color above the baseline.
        top_fill_color1 (Optional[Color]): Gradient stop 1 (closer to
            line) for the area above the baseline.
        top_fill_color2 (Optional[Color]): Gradient stop 2 (farther
            from line) above the baseline.
        bottom_line_color (Optional[Color]): Line color below the
            baseline.
        bottom_fill_color1 (Optional[Color]): Gradient stop 1 below.
        bottom_fill_color2 (Optional[Color]): Gradient stop 2 below.
        line_width (Optional[LineWidth]): Stroke width 1–4 px.
        line_style (Optional[LineStyle]): Dash pattern.
        line_type (Optional[LineType]): Geometry; see :data:`LineType`.
        line_visible (Optional[bool]): Show the line.
        relative_gradient (Optional[bool]): Gradient measured relative
            to series values rather than chart bounds.
        point_markers_visible (Optional[bool]): Show point markers.
        point_markers_radius (Optional[float]): Point marker radius.
        crosshair_marker (Optional[CrosshairMarker]): Styling for the
            crosshair marker dot; build with :func:`crosshair_marker`.
        last_price_animation (Optional[LastPriceAnimationMode]):
            Last-price dot animation.
        last_value_visible (Optional[bool]): Show the last-value badge.
        title (Optional[str]): Title.
        visible (Optional[bool]): Series visibility.
        price_scale_id (Optional[str]): Price-scale ID.
        price_format (Optional[PriceFormat]): Per-series price format.
        last_price_line (Optional[LastPriceLine]): Styling for the auto
            last-price horizontal rule; build with :func:`last_price_line`.
        base_line (Optional[BaseLine]): Styling for the secondary
            baseline (TVL's built-in zero/index rule — not the same as
            ``base_value``); build with :func:`base_line`.
        price_scale (Optional[PriceScale]): Options for the price scale
            this series binds to; build with :func:`price_scale`.
        top_line_color_column (Optional[str]): Per-row top line color
            column.
        top_fill_color1_column (Optional[str]): Per-row top gradient
            stop 1 column.
        top_fill_color2_column (Optional[str]): Per-row top gradient
            stop 2 column.
        bottom_line_color_column (Optional[str]): Per-row bottom line
            color column.
        bottom_fill_color1_column (Optional[str]): Per-row bottom
            gradient stop 1 column.
        bottom_fill_color2_column (Optional[str]): Per-row bottom
            gradient stop 2 column.
        pane (Optional[int]): Pane index.
        markers (Optional[list[Marker]]): Static markers.
        price_lines (Optional[list[PriceLine]]): Horizontal price
            lines.
        marker_spec (Optional[MarkerSpec]): Table-driven marker spec.
        continuous (bool): ``True`` (default) = time-proportional chart
            axis; ``False`` opts the whole chart back to the plain
            ordinal layout.  See :func:`line_series`.

    Returns:
        SeriesSpec: A baseline-series specification.

    Example:
        >>> s = tvl.baseline_series(pnl, timestamp="Timestamp",
        ...                         value="Pnl", base_value=0.0)
    """
    _validate_price_format(price_format)
    options = {
        **_build_common_options(
            last_value_visible=last_value_visible,
            title=title,
            visible=visible,
            price_scale_id=price_scale_id,
            price_format=price_format,
            last_price_line=last_price_line,
            base_line=base_line,
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
                "lastPriceAnimation": _resolve_last_price_animation(
                    last_price_animation
                ),
            }
        ),
        **(crosshair_marker.to_dict() if crosshair_marker is not None else {}),
    }
    column_mapping = {"time": timestamp, "value": value}
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
        price_scale_options=_build_price_scale_options(price_scale),
        pane=pane,
        continuous=continuous,
    )


def histogram_series(
    table: Any,
    timestamp: str = "Timestamp",
    value: str = "Value",
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
    continuous: bool = True,
) -> SeriesSpec:
    """Create a histogram series specification.

    A histogram series renders one vertical bar per time bucket with
    height equal to the per-bin aggregated value.  Use the ``agg``
    parameter to select the reduction (sum / count / avg / last).

    Args:
        table (Any): Deephaven table with the data.
        timestamp (str): Column name for the time axis.
        value (str): Column name supplying the bar height value.
        color (Optional[Color]): Fixed bar color (CSS color).
        base (Optional[float]): Baseline value from which bars are
            drawn (default ``0``).
        color_column (Optional[str]): Per-row bar color column.
        last_value_visible (Optional[bool]): Show the last-value
            badge.
        title (Optional[str]): Title shown in the series tooltip /
            legend.
        visible (Optional[bool]): Series visibility.
        price_scale_id (Optional[str]): Price-scale ID.
        price_format (Optional[PriceFormat]): Per-series price format.
        last_price_line (Optional[LastPriceLine]): Styling for the auto
            last-price horizontal rule; build with :func:`last_price_line`.
        base_line (Optional[BaseLine]): Styling for the zero/index base
            line; build with :func:`base_line`.
        price_scale (Optional[PriceScale]): Options for the price scale
            this series binds to; build with :func:`price_scale`.
        pane (Optional[int]): Pane index.
        markers (Optional[list[Marker]]): Static markers.
        price_lines (Optional[list[PriceLine]]): Horizontal price
            lines.
        marker_spec (Optional[MarkerSpec]): Table-driven marker spec.
        auto_bin (Optional[bool]): Tri-state auto-bin control.
            ``None`` (default) auto-bins when the table exceeds 5000
            rows; ``True`` forces aggregation even for small tables;
            ``False`` ships the raw table.
        bin_width (Optional[str]): ISO 8601 duration override (e.g.
            ``"PT1S"``, ``"PT5M"``, ``"P1D"``).  Bypasses
            nice-duration snapping.
        bin_count (Optional[int]): Target number of bins for the
            initial aggregation (default ``5000``).
        agg (str): Per-bin reduction for the value column.  One of
            ``"sum"`` (default), ``"count"``, ``"avg"``, ``"last"``.
        continuous (bool): ``True`` (default) renders bars spanning
            their full time bin (end-to-end, no gaps between adjacent
            bins); ``False`` uses the built-in fixed pixel-width
            renderer.

    Returns:
        SeriesSpec: A histogram-series specification.

    Raises:
        ValueError: If ``agg`` is not one of the supported values.

    Example:
        >>> s = tvl.histogram_series(volumes, timestamp="Timestamp",
        ...                          value="Volume", agg="sum")
    """
    _validate_price_format(price_format)
    options = {
        **_build_common_options(
            last_value_visible=last_value_visible,
            title=title,
            visible=visible,
            price_scale_id=price_scale_id,
            price_format=price_format,
            last_price_line=last_price_line,
            base_line=base_line,
        ),
        **_filter_none(
            {
                "color": color,
                "base": base,
            }
        ),
    }
    column_mapping = {"time": timestamp, "value": value}
    if color_column is not None:
        column_mapping["color"] = color_column
    from .auto_bin import HIST_AGGS as _HIST_AGGS

    if agg not in _HIST_AGGS:
        raise ValueError(f"agg must be one of {sorted(_HIST_AGGS)}, got {agg!r}")
    return SeriesSpec(
        series_type="Histogram",
        table=table,
        column_mapping=column_mapping,
        options=options,
        markers=markers,
        price_lines=price_lines,
        marker_spec=marker_spec,
        price_scale_options=_build_price_scale_options(price_scale),
        pane=pane,
        auto_bin=auto_bin,
        bin_width=bin_width,
        bin_count=bin_count,
        agg=agg,
        continuous=continuous,
    )
