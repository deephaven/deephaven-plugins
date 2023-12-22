from __future__ import annotations

from functools import partial
from typing import Callable

from deephaven.table import Table
from deephaven.table_listener import listen, TableUpdate, TableListener
from deephaven.execution_context import get_exec_ctx, ExecutionContext

from .use_effect import use_effect
from ..types import LockType


def listener_with_ctx(
    exec_ctx: ExecutionContext,
    listener: Callable[[TableUpdate, bool], None],
    update: TableUpdate,
    is_replay: bool,
) -> None:
    """
    Call the listener within an execution context.

    Args:
        exec_ctx: ExecutionContext: The execution context to use.
        listener: Callable[[TableUpdate, bool], None]: The listener to call.
        update: TableUpdate: The update to pass to the listener.
        is_replay: bool: Whether the update is a replay.
    """
    with exec_ctx:
        listener(update, is_replay)


def with_ctx(
    listener: Callable[[TableUpdate, bool], None]
) -> partial[[TableUpdate, bool], None]:
    """
    Wrap the listener in an execution context.

    Args:
        listener: The listener to wrap.

    Returns:
        partial[[TableUpdate, bool], None]: The wrapped listener.
    """
    return partial(listener_with_ctx, get_exec_ctx(), listener)


def wrap_listener(
    listener: Callable[[TableUpdate, bool], None] | TableListener
) -> partial[[TableUpdate, bool], None]:
    """
    Wrap the listener in an execution context.

    Args:
        listener: Callable[[TableUpdate, bool], None]: The listener to wrap.

    Returns:
        partial[[TableUpdate, bool], None]: The wrapped listener.
    """
    if isinstance(listener, TableListener):
        return with_ctx(listener.on_update)
    elif callable(listener):
        return with_ctx(listener)


def use_table_listener(
    table: Table,
    listener: Callable[[TableUpdate, bool], None] | TableListener,
    description: str | None = None,
    do_replay: bool = False,
    replay_lock: LockType = "shared",
) -> None:
    """
    Listen to a table and call a listener when the table updates.

    Args:
        table: Table: The table to listen to.
        listener: Callable[[TableUpdate, bool], None] | TableListener: Either a function or a TableListener with an
        on_update function. The function must take a TableUpdate and is_replay bool.
        description: str | None: An optional description for the UpdatePerformanceTracker to append to the listener’s
        entry description, default is None.
        do_replay: bool: Whether to replay the initial snapshot of the table, default is False.
        replay_lock: LockType: The lock type used during replay, default is ‘shared’, can also be ‘exclusive’.
    """

    if not table.is_refreshing:
        # if the table is not refreshing, there is nothing to listen to
        return

    def start_listener() -> Callable[[], None]:
        """
        Start the listener. Returns a function that can be called to stop the listener by the use_effect hook.

        Returns:
            Callable[[], None]: A function that can be called to stop the listener by the use_effect hook.
        """
        handle = listen(
            table,
            wrap_listener(listener),
            description=description,
            do_replay=do_replay,
            replay_lock=replay_lock,
        )

        return lambda: handle.stop()

    use_effect(start_listener, [table, listener, description, do_replay, replay_lock])
