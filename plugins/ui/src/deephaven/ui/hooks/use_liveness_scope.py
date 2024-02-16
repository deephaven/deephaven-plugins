from .._internal import get_context
from . import use_ref, use_memo
from typing import Any, Callable
from deephaven.liveness_scope import LivenessScope


def use_liveness_scope(func: Callable, dependencies: set[Any]) -> Callable:
    """
    Wraps a Callable in a liveness scope, and ensures that when invoked, if that callable
    causes the component to render, the scope will be retained by that render pass. It is
    not appropriate to wrap functions that will be called within the render - this is intended
    for calls made from outside a currently rendering component.

    Args:
        func: The function to wrap
        dependencies: Dependencies of the provided function, so the hook knows when to re-wrap it

    Returns:
        The wrapped Callable
    """

    scope_ref = use_ref(None)

    def make_wrapper():

        # If the value is set, the wrapped callable was invoked since we were last called - the current render
        # cycle now will manage it, and release it when appropriate.
        if scope_ref.current:
            get_context().manage(scope_ref.current)
            scope_ref.current = None

        def wrapped(*args, **kwargs):
            # If one does not exist, create a liveness scope, to hold actions from running the provided callable.
            # Instead of releasing it right away, we leave it open until the render queue picks up any changes in
            # that callable, see above.
            if scope_ref.current is None:
                scope_ref.current = LivenessScope()
            with scope_ref.current.open():
                func(*args, **kwargs)

        return wrapped

    return use_memo(make_wrapper, dependencies)
