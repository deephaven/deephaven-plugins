from __future__ import annotations

from typing import Callable, Any, cast, Sequence, Union
from .use_callback import use_callback
from .use_ref import use_ref, Ref
from deephaven.liveness_scope import LivenessScope
from .._internal import get_context
from ..types import Dependencies

CleanupFunction = Callable[[], None]
EffectFunction = Callable[[], Union[CleanupFunction, None]]


def use_effect(
    func: EffectFunction, dependencies: Union[Dependencies, None] = None
) -> None:
    """
    Call a function when the dependencies change. Optionally return a cleanup function to be called when dependencies change again or component is unmounted.
    If no dependencies are passed in, the effect will be called on every render.
    If an empty list is passed in, the effect will only be called once when the component mounts.

    Args:
        func: The function to call when the dependencies change.
        dependencies: The dependencies to check for changes.

    Returns:
        None
    """
    deps_ref: Ref[set[Any] | Sequence[Any] | None] = use_ref(None)
    cleanup_ref: Ref[Union[CleanupFunction, None]] = use_ref(lambda: None)
    scope_ref: Ref[LivenessScope | None] = use_ref(None)
    is_mounted_ref: Ref[bool] = use_ref(False)
    is_dirty = (
        not is_mounted_ref.current
        or dependencies is None
        or deps_ref.current != dependencies
    )

    def run_effect():
        # Dependencies have changed, so call the effect function and store the new cleanup that's returned, wrapped
        # with a new liveness scope. We will only open this scope once to capture the operations in the function,
        # and will pass ownership to the current RenderContext, which will release it when appropriate.
        liveness_scope = LivenessScope()

        with liveness_scope.open():
            effect_result = func()
            cleanup_ref.current = effect_result

        scope_ref.current = liveness_scope

        # Update the dependencies
        deps_ref.current = dependencies

    def cleanup():
        if is_dirty and cleanup_ref.current is not None:
            cleanup_ref.current()
            cleanup_ref.current = None

    def effect():
        is_mounted_ref.current = True

        if is_dirty:
            run_effect()

        # Whether new or existing, continue to retain the liveness scope from the most recently invoked effect.
        get_context().manage(cast(LivenessScope, scope_ref.current))

    def unmount():
        is_mounted_ref.current = False
        cleanup()

    handle_unmount = use_callback(unmount, [])

    # We want to listen for when the render cycle is complete or the component is unmounted
    get_context().add_effect(cleanup, effect)
    get_context().add_unmount_listener(handle_unmount)
