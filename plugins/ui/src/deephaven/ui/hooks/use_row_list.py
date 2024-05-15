from __future__ import annotations

from typing import Any
import pandas as pd

from deephaven.table import Table

from .use_table_data import use_table_data
from ..types import Sentinel


def _row_list(
    data: pd.DataFrame | Sentinel | None, is_sentinel: bool
) -> list[Any] | Sentinel | None:
    """
    Return the first row of the table as a list.

    Args:
        data: The dataframe to extract the row from or the sentinel value.
        is_sentinel: Whether the sentinel value was returned.

    Returns:
        The first row of the table as a list.
    """
    try:
        return data if is_sentinel or data is None else data.iloc[0].values.tolist()
    except IndexError:
        # if there is a static table with no rows, we will get an IndexError
        raise IndexError("Cannot get row list from an empty table")


def use_row_list(
    table: Table | None, sentinel: Sentinel = ()
) -> list[Any] | Sentinel | None:
    """
    Return the first row of the table as a list. The table should already be filtered to only have a single row.

    Args:
        table: The table to extract the row from.
        sentinel: The sentinel value to return if the table is ticking but empty. Defaults to ().

    Returns:
        The first row of the table as a list or the sentinel value.
    """
    return use_table_data(table, sentinel, _row_list)
