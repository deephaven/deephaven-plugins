from __future__ import annotations

from typing import Callable

from deephaven.execution_context import get_exec_ctx, ExecutionContext

from .use_ref import use_ref


def use_execution_context(func: Callable, exec_ctx: ExecutionContext = None) -> None:
    """
    Execute a function within an execution context.

    Args:
        func: Callable: The function to execute.
        exec_ctx: ExecutionContext: The execution context to use. Defaults to
            the current execution context if not provided.
    """
    exec_ctx = use_ref(exec_ctx if exec_ctx else get_exec_ctx())

    with exec_ctx.current:
        func()
