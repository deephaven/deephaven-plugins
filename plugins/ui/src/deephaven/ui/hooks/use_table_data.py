from __future__ import annotations

from functools import partial
from typing import Callable
import pandas as pd

from deephaven.table import Table
from deephaven.table_listener import TableUpdate
from deephaven.pandas import to_pandas
from deephaven.execution_context import ExecutionContext, get_exec_ctx
from deephaven.server.executors import submit_task
from deephaven.update_graph import has_exclusive_lock

import deephaven.ui as ui

from ..types import Sentinel, TableData, TransformedData


def _deferred_update(ctx: ExecutionContext, func: Callable[[], None]) -> None:
    """
    Call the function within an execution context.

    Args:
        ctx: ExecutionContext: The execution context to use.
        func: Callable[[], None]: The function to call.
    """
    with ctx:
        func()


def _on_update(
    ctx: ExecutionContext,
    func: Callable[[], None],
    executor_name: str,
    update: TableUpdate,
    is_replay: bool,
) -> None:
    """
    Call the function within an execution context, deferring the call to a thread pool.

    Args:
        ctx: ExecutionContext: The execution context to use.
        func: Callable[[], None]: The function to call.
        executor_name: str: The name of the executor to use.
        update: TableUpdate: The update to pass to the function.
        is_replay: True if the update is a replay, False otherwise.
    """
    submit_task(executor_name, partial(_deferred_update, ctx, func))


def _get_data_values(table: Table, sentinel: Sentinel):
    """
    Called to get the new data and is_sentinel values when the table updates.

    Args:
        table: Table: The table that updated.
        sentinel: Sentinel: The sentinel value to return if the table is empty and refreshing.

    Returns:
        tuple[pd.DataFrame | Sentinel, bool]: The table data and whether the sentinel value was
            returned.
    """
    data = to_pandas(table)
    if table.is_refreshing:
        if data.empty:
            return sentinel, True
        else:
            return data, False
    else:
        return data, False


def _set_new_data(
    table: Table,
    sentinel: Sentinel,
    set_data: Callable[[pd.DataFrame | Sentinel], None],
    set_is_sentinel: Callable[[bool], None],
) -> None:
    """
    Called to set the new data and is_sentinel values when the table updates.

    Args:
        table: Table: The table that updated.
        sentinel: Sentinel: The sentinel value to return if the table is empty.
        set_data: Callable[[pd.DataFrame | Sentinel], None]: The function to call to set the new data.
        set_is_sentinel: Callable[[bool], None]: The function to call to set the is_sentinel value.
    """
    new_data, new_is_sentinel = _get_data_values(table, sentinel)
    set_data(new_data)
    set_is_sentinel(new_is_sentinel)


def _table_data(data: pd.DataFrame, is_sentinel: bool) -> TableData:
    """
    Returns the table as a dictionary.

    Args:
        data: pd.DataFrame | Sentinel: The dataframe to extract the table data from or the
            sentinel value.
        is_sentinel: bool: Whether the sentinel value was returned.

    Returns:
        TableData: The table data.
    """
    return data if is_sentinel else data.to_dict(orient="list")


def use_table_data(
    table: Table,
    sentinel: Sentinel = None,
    transform: Callable[
        [pd.DataFrame | Sentinel, bool], TransformedData | Sentinel
    ] = None,
) -> TableData | Sentinel | TransformedData:
    """
    Returns a dictionary with the contents of the table. Component will redraw if the table
    changes, resulting in an updated frame.

    Args:
        table: Table: The table to listen to.
        sentinel: Sentinel: The sentinel value to return if the table is ticking but empty. Defaults to None.
        transform: Callable[[pd.DataFrame | Sentinel, bool], tuple[pd.DataFrame | Sentinel, bool]]: A
            function to transform the table data and is_sentinel values. Defaults to None, which will
            return the data as TableData.

    Returns:
        TableData | Sentinel: The table data or the sentinel value.
    """
    initial_data, initial_is_sentinel = _get_data_values(table, sentinel)
    data, set_data = ui.use_state(initial_data)
    is_sentinel, set_is_sentinel = ui.use_state(initial_is_sentinel)

    if not transform:
        transform = _table_data

    ctx = get_exec_ctx()

    # Decide which executor to submit callbacks to now, while we hold any locks from the caller
    if has_exclusive_lock(ctx.update_graph):
        executor_name = "serial"
    else:
        executor_name = "concurrent"

    table_updated = lambda: _set_new_data(table, sentinel, set_data, set_is_sentinel)

    ui.use_table_listener(table, partial(_on_update, ctx, table_updated, executor_name))

    return transform(data, is_sentinel)
