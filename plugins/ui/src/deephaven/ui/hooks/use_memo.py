from __future__ import annotations

from .use_ref import use_ref, Ref
from .._internal import ValueWithLiveness, get_context
from typing import Any, Callable, TypeVar
from deephaven.liveness_scope import LivenessScope

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
    value_ref: Ref[ValueWithLiveness[T | None]] = use_ref(
        ValueWithLiveness(value=None, liveness_scope=None)
    )

    if deps_ref.current != dependencies:
        liveness_scope = LivenessScope()
        with liveness_scope.open():
            new_value = func()
        value_ref.current = ValueWithLiveness(
            value=new_value, liveness_scope=liveness_scope
        )

        # The current RenderContext will then own the newly created liveness scope, and release when appropriate.
        get_context().manage(value_ref.current.liveness_scope)

        deps_ref.current = dependencies
    elif value_ref.current.liveness_scope:
        # Using a cached value, and it has a liveness scope, RenderContext needs to own it
        get_context().manage(value_ref.current.liveness_scope)

    return value_ref.current.value  # type: ignore
