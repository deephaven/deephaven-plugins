"""
Callback types and utilities for chart event handling.
"""

from __future__ import annotations

from inspect import signature, Parameter
from typing import Any, Callable

ChartEventCallback = Callable[..., None]
"""Callback for chart events that do not control default behavior."""

ChartPreventableEventCallback = Callable[..., "bool | None"]
"""Callback for chart events that can return False to prevent default behavior."""

# Events where returning False prevents the default client-side behavior.
# on_click is conditionally preventable (only on hierarchical charts).
ALWAYS_PREVENTABLE_EVENTS = frozenset({"on_legend_click", "on_legend_double_click"})

# Hierarchical trace types where on_click controls drill-down
HIERARCHICAL_TRACE_TYPES = frozenset({"sunburst", "treemap", "icicle"})


def wrap_callable(fn: Callable) -> Callable:
    """Wrap a callable to trim excess positional args based on its signature.

    This allows users to define callbacks with 0 or 1 args regardless of
    how many args are passed internally.

    Args:
        fn: The callable to wrap

    Returns:
        A wrapper that calls fn with the appropriate number of args
    """
    sig = signature(fn)
    max_args = 0
    accepts_var_positional = False
    for param in sig.parameters.values():
        if param.kind in (Parameter.POSITIONAL_ONLY, Parameter.POSITIONAL_OR_KEYWORD):
            max_args += 1
        elif param.kind == Parameter.VAR_POSITIONAL:
            accepts_var_positional = True

    def _wrapper(*args: Any) -> Any:
        if accepts_var_positional:
            return fn(*args)
        else:
            return fn(*args[:max_args])

    return _wrapper
