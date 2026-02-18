from __future__ import annotations

import pandas as pd

from deephaven.table import Table

from .use_memo import use_memo
from .use_table_data import first_column_table, use_table_data
from ..types import Sentinel, ColumnData


def _column_data(
    data: pd.DataFrame | Sentinel | None, is_sentinel: bool
) -> ColumnData | Sentinel | None:
    """
    Return the first column of the table as a list.

    Args:
        data: The table to extract the column from.
        is_sentinel: Whether the sentinel value was returned.

    Returns:
        The first column of the table as a list.
    """
    try:
        return data if is_sentinel or data is None else data.iloc[:, 0].tolist()
    except IndexError:
        # if there is a static table with no columns, we will get an IndexError
        raise IndexError("Cannot get column data from an empty table")


def use_column_data(
    table: Table | None, sentinel: Sentinel = None
) -> ColumnData | Sentinel | None:
    """
    Return the first column of the table as a list. The table should already be filtered to only have a single column.

    Args:
        table: The table to extract the column from.
        sentinel: The sentinel value to return if the table is ticking but empty. Defaults to None.

    Returns:
        The first column of the table as a list or the sentinel value.
    """
    filtered_table = use_memo(
        lambda: None if table is None else first_column_table(table),
        [table],
    )
    return use_table_data(filtered_table, sentinel, _column_data)
