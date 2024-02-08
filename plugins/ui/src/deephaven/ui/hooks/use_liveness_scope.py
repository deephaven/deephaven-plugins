from .._internal import get_context
from .use_ref import use_ref
from typing import Callable
from deephaven.liveness_scope import LivenessScope


def use_liveness_scope(func: Callable) -> Callable:
    """
    Wraps a Callable in a liveness scope, and ensures that when invoked, if that callable
    causes the component to render, the scope will be retained by that render pass.

    Args:
        func: The function to wrap

    Returns:
        The wrapped Callable
    """
    scope_ref = use_ref(None)
    if scope_ref.current:
        get_context().manage(scope_ref.current)

    def wrapped(*args, **kwargs):
        scope_ref.current = LivenessScope()
        with scope_ref.current.open():
            func(*args, **kwargs)
        scope_ref.current = None

    return wrapped
