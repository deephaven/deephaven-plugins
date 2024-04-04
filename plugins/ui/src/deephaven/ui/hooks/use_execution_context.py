from __future__ import annotations

from functools import partial
from typing import Callable

from deephaven.execution_context import get_exec_ctx, ExecutionContext

from . import use_memo


def func_with_ctx(
    exec_ctx: ExecutionContext,
    func: Callable,
) -> None:
    """
    Call the function within an execution context.

    Args:
        exec_ctx: ExecutionContext: The execution context to use.
        func: Callable: The function to call.
    """
    with exec_ctx:
        func()


def use_execution_context(
    exec_ctx: ExecutionContext | None = None,
) -> Callable[[Callable], None]:
    """
    Create an execution context wrapper for a function.

    Args:
        exec_ctx: ExecutionContext: The execution context to use. Defaults to
            the current execution context if not provided.
    Returns:
        A callable that will take any callable and invoke it within the current exec context
    """
    exec_ctx = use_memo(lambda: exec_ctx if exec_ctx else get_exec_ctx(), [exec_ctx])
    exec_fn = use_memo(lambda: partial(func_with_ctx, exec_ctx), [exec_ctx])
    return exec_fn
