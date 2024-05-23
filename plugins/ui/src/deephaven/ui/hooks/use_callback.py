from __future__ import annotations

from typing import Callable

from .use_memo import use_memo
from ..types import Dependencies


def use_callback(func: Callable, dependencies: Dependencies) -> Callable:
    """
    Memoize a callback function. The callback will only be recreated if the dependencies change.

    Args:
        func: The function to create a memoized callback for.
        dependencies: The dependencies to check for changes.

    Returns:
        The memoized callback function.
    """
    return use_memo(lambda: func, dependencies)
