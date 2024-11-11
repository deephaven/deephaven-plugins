from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Any, Optional
import logging
from deephaven.table import Table
from ..elements import Element
from .types import AlignSelf, DimensionValue, JustifySelf, LayoutFlex, Position
from ..types import (
    CellPressCallback,
    Color,
    ColumnGroup,
    ColumnName,
    ColumnPressCallback,
    QuickFilterExpression,
    RowPressCallback,
    ResolvableContextMenuItem,
    Undefined,
    UNDEFINED,
)
from .._internal import dict_to_react_props, RenderContext

logger = logging.getLogger(__name__)


@dataclass
class TableFormat:
    """
    A formatting rule for a table.

    Args:
        cols: The columns to format. If None, the format will apply to the entire row.
        if_: Deephaven expression to filter which rows should be formatted. Must resolve to a boolean.
        color: The font color.
        background_color: The cell background color.
        alignment: The cell text alignment.
        value: Format string for the cell value.
            E.g. "0.00%" to format as a percentage with two decimal places.
        mode: The cell rendering mode.
            Currently only databar is supported as an alternate rendering mode.
    Returns:
        The TableFormat.
    """

    cols: ColumnName | list[ColumnName] | Undefined = UNDEFINED
    if_: str | Undefined = UNDEFINED
    color: Color | Undefined = UNDEFINED
    background_color: Color | Undefined = UNDEFINED
    alignment: Literal["left", "center", "right"] | Undefined = UNDEFINED
    value: str | Undefined = UNDEFINED
    mode: TableDatabar | Undefined = UNDEFINED


@dataclass
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
    value_column: ColumnName | Undefined = UNDEFINED
    min: ColumnName | float | Undefined = UNDEFINED
    max: ColumnName | float | Undefined = UNDEFINED
    axis: Literal["proportional", "middle", "directional"] | Undefined = UNDEFINED
    direction: Literal["LTR", "RTL"] | Undefined = UNDEFINED
    value_placement: Literal["beside", "overlap", "hide"] | Undefined = UNDEFINED
    color: Color | Undefined = UNDEFINED
    opacity: float | Undefined = UNDEFINED


class table(Element):
    """
    Customization to how a table is displayed, how it behaves, and listen to UI events.

    Args:
        table: The table to wrap
        format_: A formatting rule or list of formatting rules for the table.
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
        flex: When used in a flex layout, specifies how the element will grow or shrink to fit the space available.
        flex_grow: When used in a flex layout, specifies how much the element will grow to fit the space available.
        flex_shrink: When used in a flex layout, specifies how much the element will shrink to fit the space available.
        flex_basis: When used in a flex layout, specifies the initial size of the element.
        align_self: Overrides the align_items property of a flex or grid container.
        justify_self: Specifies how the element is justified inside a flex or grid container.
        order: The layout order for the element within a flex or grid container.
        grid_area: The name of the grid area to place the element in.
        grid_row: The name of the grid row to place the element in.
        grid_row_start: The name of the grid row to start the element in.
        grid_row_end: The name of the grid row to end the element in.
        grid_column: The name of the grid column to place the element in.
        grid_column_start: The name of the grid column to start the element in.
        grid_column_end: The name of the grid column to end the element in.
        margin: The margin to apply around the element.
        margin_top: The margin to apply above the element.
        margin_bottom: The margin to apply below the element.
        margin_start: The margin to apply before the element.
        margin_end: The margin to apply after the element.
        margin_x: The margin to apply to the left and right of the element.
        margin_y: The margin to apply to the top and bottom of the element.
        width: The width of the element.
        height: The height of the element.
        min_width: The minimum width of the element.
        min_height: The minimum height of the element.
        max_width: The maximum width of the element.
        max_height: The maximum height of the element.
        position: Specifies how the element is positioned.
        top: The distance from the top of the containing element.
        bottom: The distance from the bottom of the containing element.
        start: The distance from the start of the containing element.
        end: The distance from the end of the containing element.
        left: The distance from the left of the containing element.
        right: The distance from the right of the containing element.
        z_index: The stack order of the element.
    Returns:
        The rendered Table.
    """

    _props: dict[str, Any]
    """
    The props that are passed to the frontend
    """

    def __init__(
        self,
        table: Table,
        *,
        format_: TableFormat | list[TableFormat] | Undefined = UNDEFINED,
        on_row_press: RowPressCallback | Undefined = UNDEFINED,
        on_row_double_press: RowPressCallback | Undefined = UNDEFINED,
        on_cell_press: CellPressCallback | Undefined = UNDEFINED,
        on_cell_double_press: CellPressCallback | Undefined = UNDEFINED,
        on_column_press: ColumnPressCallback | Undefined = UNDEFINED,
        on_column_double_press: ColumnPressCallback | Undefined = UNDEFINED,
        always_fetch_columns: ColumnName
        | list[ColumnName]
        | bool
        | Undefined = UNDEFINED,
        quick_filters: dict[ColumnName, QuickFilterExpression] | Undefined = UNDEFINED,
        show_quick_filters: bool = False,
        show_grouping_column: bool = True,
        show_search: bool = False,
        reverse: bool = False,
        front_columns: list[ColumnName] | Undefined = UNDEFINED,
        back_columns: list[ColumnName] | Undefined = UNDEFINED,
        frozen_columns: list[ColumnName] | Undefined = UNDEFINED,
        hidden_columns: list[ColumnName] | Undefined = UNDEFINED,
        column_groups: list[ColumnGroup] | Undefined = UNDEFINED,
        density: Literal["compact", "regular", "spacious"] | Undefined = UNDEFINED,
        context_menu: (
            ResolvableContextMenuItem | list[ResolvableContextMenuItem] | Undefined
        ) = UNDEFINED,
        context_header_menu: (
            ResolvableContextMenuItem | list[ResolvableContextMenuItem] | Undefined
        ) = UNDEFINED,
        databars: list[TableDatabar] | Undefined = UNDEFINED,
        key: str | Undefined = UNDEFINED,
        flex: LayoutFlex | Undefined = UNDEFINED,
        flex_grow: float | Undefined = UNDEFINED,
        flex_shrink: float | Undefined = UNDEFINED,
        flex_basis: DimensionValue | Undefined = UNDEFINED,
        align_self: AlignSelf | Undefined = UNDEFINED,
        justify_self: JustifySelf | Undefined = UNDEFINED,
        order: int | Undefined = UNDEFINED,
        grid_area: str | Undefined = UNDEFINED,
        grid_row: str | Undefined = UNDEFINED,
        grid_row_start: str | Undefined = UNDEFINED,
        grid_row_end: str | Undefined = UNDEFINED,
        grid_column: str | Undefined = UNDEFINED,
        grid_column_start: str | Undefined = UNDEFINED,
        grid_column_end: str | Undefined = UNDEFINED,
        margin: DimensionValue | Undefined = UNDEFINED,
        margin_top: DimensionValue | Undefined = UNDEFINED,
        margin_bottom: DimensionValue | Undefined = UNDEFINED,
        margin_start: DimensionValue | Undefined = UNDEFINED,
        margin_end: DimensionValue | Undefined = UNDEFINED,
        margin_x: DimensionValue | Undefined = UNDEFINED,
        margin_y: DimensionValue | Undefined = UNDEFINED,
        width: DimensionValue | Undefined = UNDEFINED,
        height: DimensionValue | Undefined = UNDEFINED,
        min_width: DimensionValue | Undefined = UNDEFINED,
        min_height: DimensionValue | Undefined = UNDEFINED,
        max_width: DimensionValue | Undefined = UNDEFINED,
        max_height: DimensionValue | Undefined = UNDEFINED,
        position: Position | Undefined = UNDEFINED,
        top: DimensionValue | Undefined = UNDEFINED,
        bottom: DimensionValue | Undefined = UNDEFINED,
        start: DimensionValue | Undefined = UNDEFINED,
        end: DimensionValue | Undefined = UNDEFINED,
        left: DimensionValue | Undefined = UNDEFINED,
        right: DimensionValue | Undefined = UNDEFINED,
        z_index: int | Undefined = UNDEFINED,
    ) -> None:
        props = locals()
        del props["self"]
        self._props = props
        self._key: str | Undefined = props.get("key")  # type: ignore

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    @property
    def key(self) -> str | Undefined:
        return self._key

    def render(self, context: RenderContext) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_react_props(self._props)
