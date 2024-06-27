from __future__ import annotations

from deephaven.table import Table
from ..elements import UITable
from ..types import (
    CellPressCallback,
    ColumnGroup,
    ColumnName,
    ColumnPressCallback,
    QuickFilterExpression,
    RowPressCallback,
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
    show_search: bool = False,
    front_columns: list[ColumnName] | None = None,
    back_columns: list[ColumnName] | None = None,
    frozen_columns: list[ColumnName] | None = None,
    hidden_columns: list[ColumnName] | None = None,
    column_groups: list[ColumnGroup] | None = None,
) -> UITable:
    """
    Customization to how a table is displayed, how it behaves, and listen to UI events.

    Args:
        table: The table to wrap
        on_row_press: The callback function to run when a row is clicked.
            The first parameter is the row index, and the second is the visible row data provided in a dictionary where the
            column names are the keys.
        on_row_double_press: The callback function to run when a row is double clicked.
            The first parameter is the row index, and the second is the visible row data provided in a dictionary where the
            column names are the keys.
        on_cell_press: The callback function to run when a cell is clicked.
            The first parameter is the cell index, and the second is the cell data provided in a dictionary where the
            column names are the keys.
        on_cell_double_press: The callback function to run when a cell is double clicked.
            The first parameter is the cell index, and the second is the cell data provided in a dictionary where the
            column names are the keys.
        on_column_press: The callback function to run when a column is clicked.
            The first parameter is the column name.
        on_column_double_press: The callback function to run when a column is double clicked.
            The first parameter is the column name.
        quick_filters: The quick filters to apply to the table. Dictionary of column name to filter value.
        show_quick_filters: Whether to show the quick filter bar by default.
        show_search: Whether to show the search bar by default.
        front_columns: The columns to pin to the front of the table. These will not be movable by the user.
        back_columns: The columns to pin to the back of the table. These will not be movable by the user.
        frozen_columns: The columns to freeze at the front of the table.
            These will always be visible regardless of horizontal scrolling.
        hidden_columns: The columns to hide by default. Users may show the columns by expanding them.
        column_groups: Columns to group together. The groups will be shown in the table header.
            Group names must be unique within the column and group names.
            Groups may be nested by providing the group name as a child of another group.
    """
    props = locals()
    del props["table"]
    return UITable(table, **props)
