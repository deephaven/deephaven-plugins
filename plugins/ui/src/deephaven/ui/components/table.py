from __future__ import annotations
from typing import Literal

from deephaven.table import Table
from ..elements import UITable
from .types import AlignSelf, DimensionValue, JustifySelf, LayoutFlex, Position
from ..types import (
    CellPressCallback,
    ColumnGroup,
    ColumnName,
    ColumnPressCallback,
    DatabarConfig,
    QuickFilterExpression,
    RowPressCallback,
    ResolvableContextMenuItem,
)


def table(
    table: Table,
    *,
    on_row_press: RowPressCallback | None = None,
    on_row_double_press: RowPressCallback | None = None,
    on_cell_press: CellPressCallback | None = None,
    on_cell_double_press: CellPressCallback | None = None,
    on_column_press: ColumnPressCallback | None = None,
    on_column_double_press: ColumnPressCallback | None = None,
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
    databars: list[DatabarConfig] | None = None,
    key: str | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: float | None = None,
    flex_shrink: float | None = None,
    flex_basis: DimensionValue | None = None,
    align_self: AlignSelf | None = None,
    justify_self: JustifySelf | None = None,
    order: int | None = None,
    grid_area: str | None = None,
    grid_row: str | None = None,
    grid_row_start: str | None = None,
    grid_row_end: str | None = None,
    grid_column: str | None = None,
    grid_column_start: str | None = None,
    grid_column_end: str | None = None,
    margin: DimensionValue | None = None,
    margin_top: DimensionValue | None = None,
    margin_bottom: DimensionValue | None = None,
    margin_start: DimensionValue | None = None,
    margin_end: DimensionValue | None = None,
    margin_x: DimensionValue | None = None,
    margin_y: DimensionValue | None = None,
    width: DimensionValue | None = None,
    height: DimensionValue | None = None,
    min_width: DimensionValue | None = None,
    min_height: DimensionValue | None = None,
    max_width: DimensionValue | None = None,
    max_height: DimensionValue | None = None,
    position: Position | None = None,
    top: DimensionValue | None = None,
    bottom: DimensionValue | None = None,
    start: DimensionValue | None = None,
    end: DimensionValue | None = None,
    left: DimensionValue | None = None,
    right: DimensionValue | None = None,
    z_index: int | None = None,
) -> UITable:
    """
    Customization to how a table is displayed, how it behaves, and listen to UI events.

    Args:
        table: The table to wrap
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
    props = locals()
    del props["table"]
    return UITable(table, **props)
