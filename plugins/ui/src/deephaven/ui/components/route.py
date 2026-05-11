from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class _Route:
    """Internal data class representing a route definition."""

    path: str | None = None
    element: Callable[..., Any] | None = None
    children: list[_Route] | None = None
    index: bool = False


def route(
    *children: _Route,
    path: str | None = None,
    element: Callable[..., Any] | None = None,
    index: bool = False,
) -> _Route:
    """
    Define a route mapping a URL path pattern to a component.

    Args:
        *children: Child routes for nested routing.
        path: The path segment appended to the parent route's path. Variables
            are defined with {var_name} syntax and extracted as route
            params. Optional variables use {var_name?} syntax. Wildcard
            segments are supported with "*". Leading / is optional.
            Mutually exclusive with index.
        element: The component function to render when this route matches.
        index: If True, this route matches the parent's exact path (like
            an index route). Mutually exclusive with path.

    Returns:
        A _Route instance, to be consumed by the router component.

    Raises:
        ValueError: If both path and index=True are provided.
    """
    if path is not None and index:
        raise ValueError(
            "path and index=True are mutually exclusive. "
            "Use path=None with index=True, or set index=False with a path."
        )

    return _Route(
        path=path,
        element=element,
        children=list(children) if children else None,
        index=index,
    )
