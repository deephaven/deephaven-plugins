from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Any, Optional
import logging
from deephaven.table import Table
from ..elements import Element
from ..types import (
    CellPressCallback,
    ColumnGroup,
    ColumnName,
    ColumnPressCallback,
    QuickFilterExpression,
    RowPressCallback,
    ResolvableContextMenuItem,
)
from .._internal import dict_to_camel_case, RenderContext

logger = logging.getLogger(__name__)


@dataclass()
class TableFormat:
    """
    A formatting rule for a table.

    Args:
        cols: The columns to format. If None, the format will apply to the entire row.
        where: Query string to filter which rows should be formatted.
        color: The font color.
        background_color: The cell background color.
        alignment: The cell text alignment.
        value: Format string for the cell value.
            E.g. "0.00%" to format as a percentage with two decimal places.
        mode: The cell rendering mode.
            Currently only databar is supported as an alternate rendering mode.
    """

    cols: ColumnName | list[ColumnName] | None = None
    where: str | None = None
    color: str | None = None
    background_color: str | None = None
    alignment: Literal["left", "center", "right"] | None = None
    value: str | None = None
    mode: TableDatabar | None = None


@dataclass()
class TableDatabar:
    """
    A databar configuration for a table.

    Args:
        column: Name of the column to display as a databar.
        value_column: Name of the column to use as the value for the databar.
            If not provided, the databar will use the column value.

            This can be useful if you want to display a databar with
            a log scale, but display the actual value in the cell.
            In this case, the value_column would be the log of the actual value.
        min: Minimum value for the databar. Defaults to the minimum value in the column.

            If a column name is provided, the minimum value will be the value in that column.
            If a constant is providded, the minimum value will be that constant.
        max: Maximum value for the databar. Defaults to the maximum value in the column.

            If a column name is provided, the maximum value will be the value in that column.
            If a constant is providded, the maximum value will be that constant.
        axis: Whether the databar 0 value should be proportional to the min and max values,
            in the middle of the cell, or on one side of the databar based on direction.
        direction: The direction of the databar.
        value_placement: Placement of the value relative to the databar.
        color: The color of the databar.
        opacity: The opacity of the databar.
    """

    column: ColumnName
    value_column: ColumnName | None = None
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    axis: Literal["proportional", "middle", "directional"] | None = None
    direction: Literal["LTR", "RTL"] | None = None
    value_placement: Literal["beside", "overlap", "hide"] | None = None
    color: str | None = None
    opacity: float | None = None


class table(Element):
    """
    Customization to how a table is displayed, how it behaves, and listen to UI events.

    Args:
        table: The table to wrap
        formatting: A list of formatting rules for the table.
        on_row_press: The callback function to run when a row is clicked.
            The callback is invoked with the visible row data provided in a dictionary where the
            column names are the keys.
        on_row_double_press: The callback function to run when a row is double clicked.
            The callback is invoked with the visible row data provided in a dictionary where the
            column names are the keys.
        on_cell_press: The callback function to run when a cell is clicked.
            The callback is invoked with the cell data.
        on_cell_double_press: The callback function to run when a cell is double clicked.
            The callback is invoked with the cell data.
        on_column_press: The callback function to run when a column is clicked.
            The callback is invoked with the column name.
        on_column_double_press: The callback function to run when a column is double clicked.
            The callback is invoked with the column name.
        always_fetch_columns: The columns to always fetch from the server regardless of if they are in the viewport.
            If True, all columns will always be fetched. This may make tables with many columns slow.
        quick_filters: The quick filters to apply to the table. Dictionary of column name to filter value.
        show_quick_filters: Whether to show the quick filter bar by default.
        show_grouping_column: Whether to show the grouping column by default for rollup tables.
        show_search: Whether to show the search bar by default.
        reverse: Whether to reverse the table rows. Applied after any sorts.
        front_columns: The columns to pin to the front of the table. These will not be movable by the user.
        back_columns: The columns to pin to the back of the table. These will not be movable by the user.
        frozen_columns: The columns to freeze by default at the front of the table.
            These will always be visible regardless of horizontal scrolling.
            The user may unfreeze columns or freeze additional columns.
        hidden_columns: The columns to hide by default. Users may show the columns by expanding them.
        column_groups: Columns to group together by default. The groups will be shown in the table header.
            Group names must be unique within the column and group names.
            Groups may be nested by providing the group name as a child of another group.
        density: The density of the data displayed in the table.
            One of "compact", "regular", or "spacious".
            If not provided, the app default will be used.
        context_menu: The context menu items to show when a cell is right clicked.
            May contain action items or submenu items.
            May also be a function that receives the cell data and returns the context menu items or None.
        context_header_menu: The context menu items to show when a column header is right clicked.
            May contain action items or submenu items.
            May also be a function that receives the column header data and returns the context menu items or None.
        databars: Databars are experimental and will be moved to column_formatting in the future.
        key: A unique identifier used by React to render elements in a list.
    """

    _props: dict[str, Any]
    """
    The props that are passed to the frontend
    """

    def __init__(
        self,
        table: Table,
        *,
        formatting: list[TableFormat] | None = None,
        on_row_press: RowPressCallback | None = None,
        on_row_double_press: RowPressCallback | None = None,
        on_cell_press: CellPressCallback | None = None,
        on_cell_double_press: CellPressCallback | None = None,
        on_column_press: ColumnPressCallback | None = None,
        on_column_double_press: ColumnPressCallback | None = None,
        always_fetch_columns: ColumnName | list[ColumnName] | bool | None = None,
        quick_filters: dict[ColumnName, QuickFilterExpression] | None = None,
        show_quick_filters: bool = False,
        show_grouping_column: bool = True,
        show_search: bool = False,
        reverse: bool = False,
        front_columns: list[ColumnName] | None = None,
        back_columns: list[ColumnName] | None = None,
        frozen_columns: list[ColumnName] | None = None,
        hidden_columns: list[ColumnName] | None = None,
        column_groups: list[ColumnGroup] | None = None,
        density: Literal["compact", "regular", "spacious"] | None = None,
        context_menu: (
            ResolvableContextMenuItem | list[ResolvableContextMenuItem] | None
        ) = None,
        context_header_menu: (
            ResolvableContextMenuItem | list[ResolvableContextMenuItem] | None
        ) = None,
        databars: list[TableDatabar] | None = None,
        key: str | None = None,
    ):
        props = locals()
        del props["self"]
        self._props = props
        self._key = props.get("key")

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    @property
    def key(self) -> str | None:
        return self._key

    def render(self, context: RenderContext) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_camel_case(self._props)
