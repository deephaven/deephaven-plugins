from __future__ import annotations

from typing import Callable, Any, Sequence

from .use_ref import use_ref, Ref


def use_callback(func: Callable, dependencies: set[Any] | Sequence[Any]) -> Callable:
    """
    Create a stable handle for a callback function. The callback will only be recreated if the dependencies change.

    Args:
        func: The function to create a stable handle to.
        dependencies: The dependencies to check for changes.

    Returns:
        The stable handle to the callback function.
    """
    deps_ref: Ref[set[Any] | Sequence[Any] | None] = use_ref(None)
    callback_ref = use_ref(lambda: None)
    stable_callback_ref = use_ref(
        lambda *args, **kwargs: callback_ref.current(*args, **kwargs)
    )

    if deps_ref.current != dependencies:
        callback_ref.current = func
        deps_ref.current = dependencies

    return stable_callback_ref.current
