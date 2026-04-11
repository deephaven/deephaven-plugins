"""Marker and price line helpers for TradingView Lightweight Charts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .options import (
    LineStyle,
    MarkerPosition,
    MarkerShape,
    LINE_STYLE_MAP,
    MARKER_POSITION_MAP,
    MARKER_SHAPE_MAP,
)


@dataclass
class Marker:
    """A marker to place on a series at a specific time."""

    time: Any  # str, int, or float
    position: str = "aboveBar"
    shape: str = "circle"
    color: str = "#2196F3"
    text: str = ""
    size: Optional[int] = None

    def to_dict(self) -> dict:
        result = {
            "time": self.time,
            "position": self.position,
            "shape": self.shape,
            "color": self.color,
            "text": self.text,
        }
        if self.size is not None:
            result["size"] = self.size
        return result


@dataclass
class PriceLine:
    """A horizontal price line on a series.

    Provide either a static ``price`` or a ``column`` name.  When
    ``column`` is set the price line tracks the last-row value of that
    column in the series' data table (updated live as the table ticks).
    """

    price: Optional[float] = None
    column: Optional[str] = None
    color: Optional[str] = None
    line_width: Optional[int] = None
    line_style: Optional[str] = None
    axis_label_visible: Optional[bool] = None
    title: Optional[str] = None

    def __post_init__(self) -> None:
        if self.price is None and self.column is None:
            raise ValueError("Either 'price' or 'column' must be provided")
        if self.price is not None and self.column is not None:
            raise ValueError("Cannot specify both 'price' and 'column'")

    def to_dict(self) -> dict:
        result: dict = {}
        if self.price is not None:
            result["price"] = self.price
        if self.column is not None:
            result["column"] = self.column
        if self.color is not None:
            result["color"] = self.color
        if self.line_width is not None:
            result["lineWidth"] = self.line_width
        if self.line_style is not None:
            result["lineStyle"] = LINE_STYLE_MAP.get(self.line_style, 0)
        if self.axis_label_visible is not None:
            result["axisLabelVisible"] = self.axis_label_visible
        if self.title is not None:
            result["title"] = self.title
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
    color: str = "#2196F3"
    text: str = ""
    size: Optional[int] = None
    # Per-row column overrides
    position_column: Optional[str] = None
    shape_column: Optional[str] = None
    color_column: Optional[str] = None
    text_column: Optional[str] = None
    size_column: Optional[str] = None

    def get_columns(self) -> list[str]:
        """Return all column names referenced by this spec."""
        cols = [self.time]
        for col in (
            self.position_column,
            self.shape_column,
            self.color_column,
            self.text_column,
            self.size_column,
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

        defaults: dict = {}
        if self.position_column is None:
            defaults["position"] = MARKER_POSITION_MAP.get(self.position, "aboveBar")
        if self.shape_column is None:
            defaults["shape"] = MARKER_SHAPE_MAP.get(self.shape, "circle")
        if self.color_column is None:
            defaults["color"] = self.color
        if self.text_column is None:
            defaults["text"] = self.text
        if self.size_column is None and self.size is not None:
            defaults["size"] = self.size

        return {
            "tableId": table_id,
            "columns": columns,
            "defaults": defaults,
        }


def marker(
    time: Any,
    position: MarkerPosition = "above_bar",
    shape: MarkerShape = "circle",
    color: str = "#2196F3",
    text: str = "",
    size: Optional[int] = None,
) -> Marker:
    """Create a marker to place on a series at a specific time."""
    return Marker(
        time=time,
        position=MARKER_POSITION_MAP.get(position, "aboveBar"),
        shape=MARKER_SHAPE_MAP.get(shape, "circle"),
        color=color,
        text=text,
        size=size,
    )


def price_line(
    price: Optional[float] = None,
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    axis_label_visible: Optional[bool] = None,
    title: Optional[str] = None,
    column: Optional[str] = None,
) -> PriceLine:
    """Create a horizontal price line on a series.

    Provide either ``price`` (static value) or ``column`` (dynamic,
    tracks the last-row value of the named column in the series' table).
    """
    return PriceLine(
        price=price,
        column=column,
        color=color,
        line_width=line_width,
        line_style=line_style,
        axis_label_visible=axis_label_visible,
        title=title,
    )


def markers_from_table(
    table: Any,
    time: str = "Timestamp",
    # Fixed defaults
    position: MarkerPosition = "above_bar",
    shape: MarkerShape = "circle",
    color: str = "#2196F3",
    text: str = "",
    size: Optional[int] = None,
    # Per-row column overrides
    position_column: Optional[str] = None,
    shape_column: Optional[str] = None,
    color_column: Optional[str] = None,
    text_column: Optional[str] = None,
    size_column: Optional[str] = None,
) -> MarkerSpec:
    """Create markers from a table.  Each row produces a marker.

    ``time`` is always a column name.  For each other property, you may
    pass a fixed value (e.g. ``color="#FF0000"``) that applies to every
    marker, or a ``*_column`` name (e.g. ``color_column="Color"``) to
    read the value per-row from the table.
    """
    return MarkerSpec(
        table=table,
        time=time,
        position=position,
        shape=shape,
        color=color,
        text=text,
        size=size,
        position_column=position_column,
        shape_column=shape_column,
        color_column=color_column,
        text_column=text_column,
        size_column=size_column,
    )
