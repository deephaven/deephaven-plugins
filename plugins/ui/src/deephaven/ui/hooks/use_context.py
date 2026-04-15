from __future__ import annotations

from typing import TypeVar
from .._internal import get_context
from ..elements import Context

T = TypeVar("T")


def use_context(context: Context[T]) -> T:
    """
    Read the current value of a Context.

    Returns the value from the nearest provider up the tree,
    or the context's default value if no provider is active.

    Args:
        context: The Context object to read from.

    Returns:
        The current context value.
    """
    get_context()  # Ensure we're inside a render
    return context._current_value()
