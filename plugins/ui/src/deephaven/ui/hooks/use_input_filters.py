from __future__ import annotations
from typing import Callable
from . import use_state, use_memo

from deephaven.table import Table


def use_input_filters(table: Table) -> tuple[Table, Callable[[list[str]], None]]:
    """
    Hook to add input filters to a table.

    Args:
        table: The table to add input filters to.

    Returns:
        A tuple containing the filtered table and a function to set the input filters.
    """
    filters, set_filters = use_state([])
    filtered_table = use_memo(lambda: table.where(filters), [filters])
    return filtered_table, set_filters
