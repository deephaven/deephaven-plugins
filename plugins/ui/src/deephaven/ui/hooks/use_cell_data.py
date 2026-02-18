from __future__ import annotations

from typing import Any
import pandas as pd

from deephaven.table import Table

from .use_memo import use_memo
from .use_table_data import first_column_table, use_table_data
from ..types import Sentinel


def _cell_data(
    data: pd.DataFrame | Sentinel | None, is_sentinel: bool
) -> Any | Sentinel:
    """
    Return the first cell of the table.

    Args:
        data: The table to extract the cell from.
        is_sentinel: Whether the sentinel value was returned.

    Returns:
        The first cell of the table.
    """
    try:
        return data if is_sentinel or data is None else data.iloc[0, 0]
    except IndexError:
        # if there is a static table with no rows, we will get an IndexError
        raise IndexError("Cannot get cell data from an empty table")


def use_cell_data(table: Table | None, sentinel: Sentinel = None) -> Any | Sentinel:
    """
    Return the top left cell of the table. The table should already be filtered to have the cell located in the top left.

    Args:
        table: The table to extract the cell from.
        sentinel: The sentinel value to return if the table is ticking but empty. Defaults to None.

    Returns:
        Any: The top left cell of the table.
    """
    filtered_table = use_memo(
        lambda: None if table is None else first_column_table(table).head(1),
        [table],
    )
    return use_table_data(filtered_table, sentinel, _cell_data)
