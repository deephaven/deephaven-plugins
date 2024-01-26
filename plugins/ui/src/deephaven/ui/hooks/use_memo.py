from __future__ import annotations

from .use_ref import use_ref, Ref
from typing import Any, Callable, TypeVar

T = TypeVar("T")


def use_memo(func: Callable[[], T], dependencies: set[Any]) -> T:
    """
    Memoize the result of a function call. The function will only be called again if the dependencies change.

    Args:
        func: The function to memoize.
        dependencies: The dependencies to check for changes.

    Returns:
        The memoized result of the function call.
    """
    deps_ref: Ref[set[Any] | None] = use_ref(None)
    value_ref: Ref[T | None] = use_ref(None)

    if deps_ref.current != dependencies:
        value_ref.current = func()
        deps_ref.current = dependencies

    return value_ref.current  # type: ignore
