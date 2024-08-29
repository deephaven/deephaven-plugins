from __future__ import annotations

from typing import Any, Callable, TypeVar

from .use_memo import use_memo
from ..types import Dependencies

T = TypeVar("T", bound=Callable[..., Any])


def use_callback(func: T, dependencies: Dependencies) -> T:
    """
    Memoize a callback function. The callback will only be recreated if the dependencies change.

    Args:
        func: The function to create a memoized callback for.
        dependencies: The dependencies to check for changes.

    Returns:
        The memoized callback function.
    """
    return use_memo(lambda: func, dependencies)
