from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from ..elements import Element
from ..types import RoutePath


@dataclass
class _Route:
    """
    Internal data class representing a single route definition.
    """

    path: RoutePath | None = None
    element: Callable[..., Element] | None = None
    children: list[_Route] | None = None
    index: bool = False


def route(
    *children: _Route,
    path: RoutePath | None = None,
    element: Callable[..., Element] | None = None,
    index: bool = False,
) -> _Route:
    """
    Define a route mapping a URL path pattern to a component.

    Args:
        *children: Child _Route instances for nested routing, passed as
                   positional arguments.
        path: The path segment appended to the parent route's path. Variables
              are defined with {var_name} syntax and extracted as route params.
              Optional variables use {var_name?} syntax. Wildcard segments are
              supported with "*". Leading "/" is optional.
              Mutually exclusive with ``index``. Pass None (or omit) when using
              ``index=True``.
        element: The component function to render when this route matches.
        index: If True, this route matches the parent's exact path (like
               an index route). Mutually exclusive with ``path``.

    Returns:
        A _Route data object.

    Raises:
        ValueError: If both ``path`` and ``index=True`` are provided.
    """
    if path is not None and index:
        raise ValueError(
            "path and index=True are mutually exclusive. "
            "Provide one or the other, not both."
        )
    return _Route(
        path=path,
        element=element,
        children=list(children) if children else None,
        index=index,
    )
