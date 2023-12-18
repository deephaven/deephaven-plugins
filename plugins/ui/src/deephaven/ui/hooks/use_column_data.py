from __future__ import annotations

import pandas as pd

from deephaven.table import Table

from .use_table_data import _use_table_data
from ..types import Sentinel, ColumnData


def _column_data(data: pd.DataFrame) -> ColumnData:
    """
    Return the first column of the table as a list.

    Args:
        data: pd.DataFrame: The table to extract the column from.

    Returns:
        ColumnData: The first column of the table as a list.
    """
    try:
        return data.iloc[:, 0].tolist()
    except IndexError:
        # if there is a static table with no columns, we will get an IndexError
        raise IndexError("Cannot get column data from an empty table")


def use_column_data(table: Table, sentinel: Sentinel = None) -> ColumnData | Sentinel:
    """
    Return the first column of the table as a list. The table should already be filtered to only have a single column.

    Args:
        table: Table: The table to extract the column from.
        sentinel: Sentinel: The sentinel value to return if the table is ticking but empty. Defaults to None.

    Returns:
        ColumnData | Sentinel: The first column of the table as a list or the
            sentinel value.
    """
    data, is_sentinel = _use_table_data(table, sentinel)

    return data if is_sentinel else _column_data(data)
