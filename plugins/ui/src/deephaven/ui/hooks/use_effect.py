from __future__ import annotations

from typing import Callable, Any, cast, Sequence
from .use_ref import use_ref, Ref
from deephaven.liveness_scope import LivenessScope
from .._internal import get_context
from ..types import Dependencies


def use_effect(func: Callable[[], Any], dependencies: Dependencies):
    """
    Call a function when the dependencies change. Optionally return a cleanup function to be called when dependencies change again or component is unmounted.

    Args:
        func: The function to call when the dependencies change.
        dependencies: The dependencies to check for changes.

    Returns:
        None
    """
    deps_ref: Ref[set[Any] | Sequence[Any] | None] = use_ref(None)
    cleanup_ref = use_ref(lambda: None)
    scope_ref: Ref[LivenessScope | None] = use_ref(None)

    # Check if the dependencies have changed
    if deps_ref.current != dependencies:
        if cleanup_ref.current is not None:
            # Call the cleanup function from the previous effect
            cleanup_ref.current()

        # Dependencies have changed, so call the effect function and store the new cleanup that's returned, wrapped
        # with a new liveness scope. We will only open this scope once to capture the operations in the function,
        # and will pass ownership to the current RenderContext, which will release it when appropriate.
        liveness_scope = LivenessScope()
        with liveness_scope.open():
            cleanup_ref.current = func()

        scope_ref.current = liveness_scope

        # Update the dependencies
        deps_ref.current = dependencies

    # Whether new or existing, continue to retain the liveness scope from the most recently invoked effect.
    get_context().manage(cast(LivenessScope, scope_ref.current))
