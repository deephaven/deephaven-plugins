from __future__ import annotations

import pandas as pd

from deephaven.table import Table

from .use_table_data import use_table_data
from ..types import Sentinel, RowData


def _row_data(
    data: pd.DataFrame | Sentinel | None, is_sentinel: bool
) -> RowData | Sentinel | None:
    """
    Return the first row of the table as a dictionary.

    Args:
        data: The dataframe to extract the row from or the sentinel value.
        is_sentinel: Whether the sentinel value was returned.

    Returns:
        The first row of the table as a dictionary.
    """
    try:
        return data if is_sentinel or data is None else data.iloc[0].to_dict()
    except IndexError:
        # if there is a static table with no rows, we will get an IndexError
        raise IndexError("Cannot get row data from an empty table")


def use_row_data(
    table: Table | None, sentinel: Sentinel = None
) -> RowData | Sentinel | None:
    """
    Return the first row of the table as a dictionary. The table should already be filtered to only have a single row.

    Args:
        table: The table to extract the row from.
        sentinel: The sentinel value to return if the table is ticking but empty. Defaults to None.

    Returns:
        The first row of the table as a dictionary or the sentinel value.
    """
    return use_table_data(table, sentinel, _row_data)
