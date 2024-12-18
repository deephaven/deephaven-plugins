from __future__ import annotations

from functools import partial
from typing import Callable
import pandas as pd

from deephaven.table import Table
from deephaven.table_listener import TableUpdate
from deephaven.pandas import to_pandas
from deephaven.execution_context import ExecutionContext, get_exec_ctx
from deephaven.liveness_scope import liveness_scope
from deephaven.server.executors import submit_task
from deephaven.update_graph import has_exclusive_lock

from .use_callback import use_callback
from .use_effect import use_effect
from .use_state import use_state
from .use_table_listener import use_table_listener

from ..types import Sentinel, TableData, TransformedData


def _deferred_update(ctx: ExecutionContext, func: Callable[[], None]) -> None:
    """
    Call the function within an execution context.

    Args:
        ctx: The execution context to use.
        func: The function to call.
    """
    with ctx, liveness_scope():
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
        ctx: The execution context to use.
        func: The function to call.
        executor_name: The name of the executor to use.
        update: The update to pass to the function.
        is_replay: True if the update is a replay, False otherwise.
    """
    submit_task(executor_name, partial(_deferred_update, ctx, func))


def _get_data_values(
    table: Table | None, sentinel: Sentinel
) -> tuple[pd.DataFrame | None, bool]:
    """
    Called to get the new data and is_sentinel values when the table updates.
    None is returned if the table is None.
    The sentinel value is returned if the table is empty and refreshing.
    Otherwise, the table data is returned.

    Args:
        table: The table that updated.
        sentinel: The sentinel value to return if the table is empty and refreshing.

    Returns:
        The table data and whether the sentinel value was returned.
    """
    if table is None:
        return None, False
    data = to_pandas(table)
    if table.is_refreshing:
        if data.empty:
            return sentinel, True
        else:
            return data, False
    else:
        return data, False


def _set_new_data(
    table: Table | None,
    sentinel: Sentinel,
    set_data: Callable[[pd.DataFrame | Sentinel], None],
    set_is_sentinel: Callable[[bool], None],
) -> None:
    """
    Called to set the new data and is_sentinel values when the table updates.

    Args:
        table: The table that updated.
        sentinel: The sentinel value to return if the table is empty.
        set_data: The function to call to set the new data.
        set_is_sentinel: The function to call to set the is_sentinel value.
    """
    new_data, new_is_sentinel = _get_data_values(table, sentinel)
    set_data(new_data)
    set_is_sentinel(new_is_sentinel)


def _table_data(
    data: pd.DataFrame | Sentinel, is_sentinel: bool
) -> TableData | Sentinel:
    """
    Returns the table as a dictionary.

    Args:
        data: The dataframe to extract the table data from or the sentinel value.
        is_sentinel: Whether the sentinel value was returned.

    Returns:
        The table data.
    """
    return data if is_sentinel or data is None else data.to_dict(orient="list")


def use_table_data(
    table: Table | None,
    sentinel: Sentinel = None,
    transform: (
        Callable[[pd.DataFrame | Sentinel | None, bool], TransformedData | Sentinel]
        | None
    ) = None,
) -> TableData | Sentinel | TransformedData:
    """
    Returns a dictionary with the contents of the table. Component will redraw if the table
    changes, resulting in an updated frame.

    Args:
        table: The table to listen to. If None, None will be returned, not the sentinel value.
        sentinel: The sentinel value to return if the table is ticking but empty. Defaults to None.
        transform: A function to transform the table data and is_sentinel values. Defaults to None, which will
            return the data as TableData.

    Returns:
        The table data or the sentinel value.
    """
    initial_data, initial_is_sentinel = _get_data_values(table, sentinel)
    data, set_data = use_state(initial_data)
    is_sentinel, set_is_sentinel = use_state(initial_is_sentinel)

    if not transform:
        transform = _table_data

    ctx = get_exec_ctx()

    # Decide which executor to submit callbacks to now, while we hold any locks from the caller
    if has_exclusive_lock(ctx.update_graph):
        executor_name = "serial"
    else:
        executor_name = "concurrent"

    # memoize table_updated (and listener) so that they don't cause a start and stop of the listener
    table_updated = use_callback(
        lambda: _set_new_data(table, sentinel, set_data, set_is_sentinel),
        [table, sentinel],
    )

    # call table_updated in the case of new table or sentinel
    use_effect(table_updated, [table, sentinel])
    listener = use_callback(
        partial(_on_update, ctx, table_updated, executor_name),
        [table_updated, executor_name, ctx],
    )

    # call table_updated every time the table updates
    use_table_listener(table, listener, [])

    return transform(data, is_sentinel)
