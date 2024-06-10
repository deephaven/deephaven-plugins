from __future__ import annotations

from deephaven.table import Table
from ..elements import UITable
from ..types import (
    CellPressCallback,
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
    """
    props = locals()
    del props["table"]
    return UITable(table, **props)
