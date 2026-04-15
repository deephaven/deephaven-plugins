"""Marker and price line helpers for TradingView Lightweight Charts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .options import (
    LineStyle,
    LineWidth,
    MarkerPosition,
    MarkerShape,
    LINE_STYLE_MAP,
    MARKER_POSITION_MAP,
    MARKER_SHAPE_MAP,
)

# camelCase (used by Marker, which stores translated values)
_PRICE_POSITIONS_JS = {"atPriceTop", "atPriceBottom", "atPriceMiddle"}
# snake_case (used by MarkerSpec/factories, which store Python-style values)
_PRICE_POSITIONS_PY = {"at_price_top", "at_price_bottom", "at_price_middle"}


@dataclass
class Marker:
    """A marker to place on a series at a specific time."""

    time: Any  # str, int, or float
    position: str = "aboveBar"
    shape: str = "circle"
    color: Optional[str] = None
    text: str = ""
    size: Optional[int] = None
    id: Optional[str] = None
    price: Optional[float] = None

    def __post_init__(self) -> None:
        if (
            self.position in _PRICE_POSITIONS_JS or self.position in _PRICE_POSITIONS_PY
        ) and self.price is None:
            raise ValueError(
                f"Marker position '{self.position}' requires the 'price' field to be set."
            )

    def to_dict(self) -> dict:
        result: dict = {
            "time": self.time,
            "position": self.position,
            "shape": self.shape,
            "text": self.text,
        }
        if self.color is not None:
            result["color"] = self.color
        if self.size is not None:
            result["size"] = self.size
        if self.id is not None:
            result["id"] = self.id
        if self.price is not None:
            result["price"] = self.price
        return result


@dataclass
class PriceLine:
    """A horizontal price line on a series.

    Provide either a static ``price`` or a ``column`` name.  When
    ``column`` is set the price line tracks the last-row value of that
    column in the series' data table (updated live as the table ticks).

    Parameters
    ----------
    price:
        Static price level.  Mutually exclusive with ``column``.
    column:
        Deephaven extension — column name in the series' data table whose
        last-row value sets the price level dynamically.  Mutually
        exclusive with ``price``.
    color:
        Line color (CSS color string).  Also used as the axis label
        background color unless ``axis_label_color`` is set explicitly.
    line_width:
        Line thickness in pixels (1–4).
    line_style:
        One of ``"solid"``, ``"dotted"``, ``"dashed"``,
        ``"large_dashed"``, ``"sparse_dotted"``.
    line_visible:
        Whether the horizontal line rule is drawn.  The axis label can
        still be shown even when ``line_visible=False``.
    axis_label_visible:
        Whether the axis label is shown on the price scale.
    title:
        Short text label drawn on the chart pane next to the line.
    axis_label_color:
        Background color of the price-scale axis label.  Defaults to
        the line ``color`` when not set.
    axis_label_text_color:
        Text color of the price-scale axis label.
    id:
        Optional string identifier for the price line.
    """

    price: Optional[float] = None
    column: Optional[str] = None
    color: Optional[str] = None
    line_width: Optional[LineWidth] = None
    line_style: Optional[str] = None
    line_visible: Optional[bool] = None
    axis_label_visible: Optional[bool] = None
    title: Optional[str] = None
    axis_label_color: Optional[str] = None
    axis_label_text_color: Optional[str] = None
    id: Optional[str] = None

    def __post_init__(self) -> None:
        if self.price is None and self.column is None:
            raise ValueError("Either 'price' or 'column' must be provided")
        if self.price is not None and self.column is not None:
            raise ValueError("Cannot specify both 'price' and 'column'")

    def to_dict(self) -> dict:
        result: dict = {}
        if self.id is not None:
            result["id"] = self.id
        if self.price is not None:
            result["price"] = self.price
        if self.column is not None:
            result["column"] = self.column
        if self.color is not None:
            result["color"] = self.color
        if self.line_width is not None:
            result["lineWidth"] = self.line_width
        if self.line_style is not None:
            if self.line_style not in LINE_STYLE_MAP:
                raise ValueError(
                    f"Invalid line_style {self.line_style!r}. "
                    f"Must be one of {list(LINE_STYLE_MAP)}"
                )
            result["lineStyle"] = LINE_STYLE_MAP[self.line_style]
        if self.line_visible is not None:
            result["lineVisible"] = self.line_visible
        if self.axis_label_visible is not None:
            result["axisLabelVisible"] = self.axis_label_visible
        if self.title is not None:
            result["title"] = self.title
        if self.axis_label_color is not None:
            result["axisLabelColor"] = self.axis_label_color
        if self.axis_label_text_color is not None:
            result["axisLabelTextColor"] = self.axis_label_text_color
        return result


@dataclass
class MarkerSpec:
    """Markers driven by a table.  Each row produces a marker.

    The ``time`` parameter is always a column name (every marker has a
    different time).  For the other properties you can provide either a
    **fixed value** (applied to every marker) or a **column name** via
    the corresponding ``*_column`` parameter (resolved per-row).
    """

    table: Any  # Deephaven Table
    time: str = "Timestamp"
    # Fixed defaults (apply to every marker unless overridden by a column)
    position: str = "above_bar"
    shape: str = "circle"
    color: Optional[str] = None
    text: str = ""
    size: Optional[int] = None
    price: Optional[float] = None
    # Per-row column overrides
    id_column: Optional[str] = None
    price_column: Optional[str] = None
    position_column: Optional[str] = None
    shape_column: Optional[str] = None
    color_column: Optional[str] = None
    text_column: Optional[str] = None
    size_column: Optional[str] = None

    def __post_init__(self) -> None:
        if self.price is not None and self.price_column is not None:
            raise ValueError(
                "Cannot specify both 'price' and 'price_column' on MarkerSpec."
            )
        if (
            self.position in _PRICE_POSITIONS_PY
            and self.price is None
            and self.price_column is None
        ):
            raise ValueError(
                f"MarkerSpec position '{self.position}' requires 'price' or 'price_column' to be set."
            )

    def get_columns(self) -> list[str]:
        """Return all column names referenced by this spec."""
        cols = [self.time]
        for col in (
            self.position_column,
            self.shape_column,
            self.color_column,
            self.text_column,
            self.size_column,
            self.id_column,
            self.price_column,
        ):
            if col is not None:
                cols.append(col)
        return cols

    def to_dict(self, table_id: int) -> dict:
        """Serialize to dict for JSON transport."""
        columns: dict = {"time": self.time}
        if self.position_column is not None:
            columns["position"] = self.position_column
        if self.shape_column is not None:
            columns["shape"] = self.shape_column
        if self.color_column is not None:
            columns["color"] = self.color_column
        if self.text_column is not None:
            columns["text"] = self.text_column
        if self.size_column is not None:
            columns["size"] = self.size_column
        if self.id_column is not None:
            columns["id"] = self.id_column
        if self.price_column is not None:
            columns["price"] = self.price_column

        defaults: dict = {}
        if self.position_column is None:
            defaults["position"] = MARKER_POSITION_MAP.get(self.position, "aboveBar")
        if self.shape_column is None:
            defaults["shape"] = MARKER_SHAPE_MAP.get(self.shape, "circle")
        if self.color_column is None and self.color is not None:
            defaults["color"] = self.color
        if self.text_column is None:
            defaults["text"] = self.text
        if self.size_column is None and self.size is not None:
            defaults["size"] = self.size
        if self.price_column is None and self.price is not None:
            defaults["price"] = self.price

        return {
            "tableId": table_id,
            "columns": columns,
            "defaults": defaults,
        }


def marker(
    time: Any,
    position: MarkerPosition = "above_bar",
    shape: MarkerShape = "circle",
    color: Optional[str] = None,
    text: str = "",
    size: Optional[int] = None,
    id: Optional[str] = None,
    price: Optional[float] = None,
) -> Marker:
    """Create a marker to place on a series at a specific time.

    For price-based positions ('at_price_top', 'at_price_bottom',
    'at_price_middle') you must also supply ``price``.
    """
    return Marker(
        time=time,
        position=MARKER_POSITION_MAP.get(position, "aboveBar"),
        shape=MARKER_SHAPE_MAP.get(shape, "circle"),
        color=color,
        text=text,
        size=size,
        id=id,
        price=price,
    )


def up_down_markers(
    up_times: list[Any],
    down_times: list[Any],
    up_color: Optional[str] = None,
    down_color: Optional[str] = None,
    up_text: str = "",
    down_text: str = "",
    up_size: Optional[int] = None,
    down_size: Optional[int] = None,
) -> list[Marker]:
    """Create a combined list of up and down markers.

    Equivalent to the JS ``createUpDownMarkers()`` convenience helper.
    Up-markers are placed below the bar with an upward arrow; down-markers
    are placed above the bar with a downward arrow.

    The returned list can be passed directly to the ``markers=`` parameter
    of any series factory.  The JS library will sort markers by time, so
    Python ordering does not matter.

    Args:
        up_times: Time values for bullish / up events.
        down_times: Time values for bearish / down events.
        up_color: Fill color for up-markers.  Default: theme OHLC increase color.
        down_color: Fill color for down-markers.  Default: theme OHLC decrease color.
        up_text: Label text for up-markers.  Default: ``""`` (no label).
        down_text: Label text for down-markers.  Default: ``""`` (no label).
        up_size: Size multiplier for up-markers.  Default: library default (1).
        down_size: Size multiplier for down-markers.  Default: library default (1).

    Returns:
        Flat list of :class:`Marker` objects — up events followed by down events.
    """
    up_markers = [
        Marker(
            time=t,
            position="belowBar",
            shape="arrowUp",
            color=up_color,
            text=up_text,
            size=up_size,
        )
        for t in up_times
    ]
    down_markers = [
        Marker(
            time=t,
            position="aboveBar",
            shape="arrowDown",
            color=down_color,
            text=down_text,
            size=down_size,
        )
        for t in down_times
    ]
    return up_markers + down_markers


def price_line(
    price: Optional[float] = None,
    color: Optional[str] = None,
    line_width: Optional[LineWidth] = None,
    line_style: Optional[LineStyle] = None,
    line_visible: Optional[bool] = None,
    axis_label_visible: Optional[bool] = None,
    title: Optional[str] = None,
    axis_label_color: Optional[str] = None,
    axis_label_text_color: Optional[str] = None,
    id: Optional[str] = None,
    column: Optional[str] = None,
) -> PriceLine:
    """Create a horizontal price line on a series.

    Provide either ``price`` (static value) or ``column`` (dynamic,
    tracks the last-row value of the named column in the series' table).

    Parameters
    ----------
    price:
        Static price level.  Mutually exclusive with ``column``.
    color:
        Line color (CSS color string).
    line_width:
        Line thickness in pixels (1–4).
    line_style:
        One of ``"solid"``, ``"dotted"``, ``"dashed"``,
        ``"large_dashed"``, ``"sparse_dotted"``.
    line_visible:
        Whether the horizontal line rule is drawn (default ``True`` in
        TV-LW).  Set to ``False`` to show only the axis label.
    axis_label_visible:
        Whether the axis label is shown on the price scale.
    title:
        Short text drawn on the chart pane next to the line.
    axis_label_color:
        Background color of the price-scale axis label.
    axis_label_text_color:
        Text color of the price-scale axis label.
    id:
        Optional string identifier for the price line.
    column:
        Deephaven extension — column name whose last-row value sets the
        price level dynamically.  Mutually exclusive with ``price``.
    """
    return PriceLine(
        price=price,
        column=column,
        color=color,
        line_width=line_width,
        line_style=line_style,
        line_visible=line_visible,
        axis_label_visible=axis_label_visible,
        title=title,
        axis_label_color=axis_label_color,
        axis_label_text_color=axis_label_text_color,
        id=id,
    )


def markers_from_table(
    table: Any,
    time: str = "Timestamp",
    # Fixed defaults
    position: MarkerPosition = "above_bar",
    shape: MarkerShape = "circle",
    color: Optional[str] = None,
    text: str = "",
    size: Optional[int] = None,
    price: Optional[float] = None,
    # Per-row column overrides
    position_column: Optional[str] = None,
    shape_column: Optional[str] = None,
    color_column: Optional[str] = None,
    text_column: Optional[str] = None,
    size_column: Optional[str] = None,
    id_column: Optional[str] = None,
    price_column: Optional[str] = None,
) -> MarkerSpec:
    """Create markers from a table.  Each row produces a marker.

    ``time`` is always a column name.  For each other property, you may
    pass a fixed value (e.g. ``color="#FF0000"``) that applies to every
    marker, or a ``*_column`` name (e.g. ``color_column="Color"``) to
    read the value per-row from the table.

    For price-based positions ('at_price_top', 'at_price_bottom',
    'at_price_middle') supply either ``price`` (same price for every row)
    or ``price_column`` (different price per row).
    """
    return MarkerSpec(
        table=table,
        time=time,
        position=position,
        shape=shape,
        color=color,
        text=text,
        size=size,
        price=price,
        position_column=position_column,
        shape_column=shape_column,
        color_column=color_column,
        text_column=text_column,
        size_column=size_column,
        id_column=id_column,
        price_column=price_column,
    )
