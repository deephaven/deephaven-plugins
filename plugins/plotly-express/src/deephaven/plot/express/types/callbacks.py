"""
Callback types and utilities for chart event handling.
"""

from __future__ import annotations

from functools import partial
from inspect import signature
import sys
from typing import (
    Any,
    Callable,
    Set,
    cast,
)

ChartEventCallback = Callable[..., None]
"""Callback for chart events that do not control default behavior."""

ChartPreventableEventCallback = Callable[..., "bool | None"]
"""Callback for chart events that can return False to prevent default behavior."""

# Events where returning False prevents the default client-side behavior.
# on_click is conditionally preventable (only on hierarchical charts).
ALWAYS_PREVENTABLE_EVENTS = frozenset({"on_legend_click", "on_legend_double_click"})

# Hierarchical trace types where on_click controls drill-down
HIERARCHICAL_TRACE_TYPES = frozenset({"sunburst", "treemap", "icicle"})


def _wrapped_callable(
    max_args: int | None,
    kwargs_set: set[str] | None,
    func: Callable,
    *args: Any,
    **kwargs: Any,
) -> Any:
    """
    Filter the args and kwargs and call the specified function with the filtered args and kwargs.

    Args:
        max_args: The maximum number of positional arguments to pass to the function.
          If None, all args are passed.
        kwargs_set: The set of keyword arguments to pass to the function.
          If None, all kwargs are passed.
        func: The function to call
        *args: args, used by the dispatcher
        **kwargs: kwargs, used by the dispatcher

    Returns:
        The result of the function call.
    """
    args = args if max_args is None else args[:max_args]
    kwargs = (
        kwargs
        if kwargs_set is None
        else {k: v for k, v in kwargs.items() if k in kwargs_set}
    )
    return func(*args, **kwargs)


def wrap_callable(func: Callable) -> Callable:
    """
    Wrap the function so args are dropped if they are not in the signature.

    Args:
        func: The callable to wrap

    Returns:
        The wrapped callable
    """
    try:
        if sys.version_info.major == 3 and sys.version_info.minor >= 10:
            sig = signature(func, eval_str=True)  # type: ignore
        else:
            sig = signature(func)

        max_args: int | None = 0
        kwargs_set: Set | None = set()

        for param in sig.parameters.values():
            if param.kind == param.POSITIONAL_ONLY:
                max_args = cast(int, max_args)
                max_args += 1
            elif param.kind == param.POSITIONAL_OR_KEYWORD:
                # Don't know until runtime whether this will be passed as a positional or keyword arg
                max_args = cast(int, max_args)
                kwargs_set = cast(Set, kwargs_set)
                max_args += 1
                kwargs_set.add(param.name)
            elif param.kind == param.VAR_POSITIONAL:
                max_args = None
            elif param.kind == param.KEYWORD_ONLY:
                kwargs_set = cast(Set, kwargs_set)
                kwargs_set.add(param.name)
            elif param.kind == param.VAR_KEYWORD:
                kwargs_set = None

        return partial(_wrapped_callable, max_args, kwargs_set, func)
    except ValueError or TypeError:
        # This function has no signature, so we can't wrap it
        # Return the original function should be okay
        return func
