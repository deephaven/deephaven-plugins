from __future__ import annotations

from typing import Any
import pandas as pd

from deephaven.table import Table
from .use_table_data import _use_table_data, Sentinel


def _cell_data(data: pd.DataFrame) -> None:
    """
    Return the first cell of the table.

    Args:
        data: pd.DataFrame: The table to extract the cell from.

    Returns:
        Any: The first cell of the table.
    """
    try:
        return data.iloc[0, 0]
    except IndexError:
        # if there is a static table with no rows, we will get an IndexError
        raise IndexError("Cannot get row list from an empty table")


def use_cell_data(table: Table, sentinel: Sentinel = None) -> Any:
    """
    Return the first cell of the table. The table should already be filtered to only have a single cell.

    Args:
        table: Table: The table to extract the cell from.
        sentinel: Sentinel: The sentinel value to return if the table is empty. Defaults to None.

    Returns:
        Any: The first cell of the table.
    """
    data, is_sentinel = _use_table_data(table, sentinel)

    return data if is_sentinel else _cell_data(data)
