from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable

from ..elements import Element, create_context
from ..hooks.use_path import use_path
from ..hooks.use_url_components import use_url_components
from ..types import WidgetPath, EnterpriseWidgetPath, resolve_widget_path
from .make_component import make_component as component
from .route import _Route
from .text import text


# Module-level context for route params, shared with use_params
_route_params_context = create_context({})
"""
Context providing route parameters extracted by the nearest ancestor router.
"""


@dataclass
class _CompiledRoute:
    """
    A compiled route with a resolved pattern and metadata for matching.
    """

    pattern: str
    """The resolved full path pattern (e.g. "/users/{user_id}")."""
    regex: re.Pattern[str]
    """Compiled regex for matching."""
    param_names: list[str]
    """Ordered list of parameter names extracted from the pattern."""
    element: Callable[..., Element] | None
    """The component to render."""
    is_index: bool
    """Whether this is an index route."""
    has_wildcard: bool
    """Whether the pattern contains a wildcard."""
    static_segment_count: int
    """Number of static (non-parameterized) segments."""
    segment_count: int
    """Total number of segments in the pattern."""


def _path_to_regex(
    pattern: str,
) -> tuple[re.Pattern[str], list[str], bool]:
    """
    Convert a route pattern to a regex.

    Supports:
    - ``{var_name}`` — required parameter segment
    - ``{var_name?}`` — optional parameter segment
    - ``*`` — wildcard (matches zero or more remaining segments)

    Returns:
        A tuple of (compiled regex, list of param names, has_wildcard).
    """
    # Normalize
    if not pattern.startswith("/"):
        pattern = f"/{pattern}"

    param_names: list[str] = []
    has_wildcard = False
    regex_parts = ["^"]

    segments = pattern.strip("/").split("/") if pattern != "/" else []

    for i, segment in enumerate(segments):
        if segment == "*":
            has_wildcard = True
            param_names.append("*")
            # Wildcard matches the rest of the path (including slashes)
            regex_parts.append(r"(?:/(.*))?")
            break
        elif segment.startswith("{") and segment.endswith("}"):
            inner = segment[1:-1]
            if inner.endswith("?"):
                # Optional parameter
                name = inner[:-1]
                param_names.append(name)
                regex_parts.append(rf"(?:/([^/]*))?")
            else:
                # Required parameter
                param_names.append(inner)
                regex_parts.append(rf"/([^/]+)")
        else:
            # Static segment
            regex_parts.append(rf"/{re.escape(segment)}")

    regex_parts.append("/?$")
    return re.compile("".join(regex_parts)), param_names, has_wildcard


def _compile_routes(
    routes: list[_Route],
    parent_path: str,
    current_url_path: str,
) -> list[_CompiledRoute]:
    """
    Recursively compile route definitions into a flat list of _CompiledRoute objects.

    Args:
        routes: The list of _Route objects to compile.
        parent_path: The accumulated parent path prefix.
        current_url_path: The current absolute URL path (for WidgetPath resolution).

    Returns:
        A flat list of compiled routes.
    """
    compiled: list[_CompiledRoute] = []

    for r in routes:
        if r.index:
            # Index route matches the parent path exactly
            resolved = parent_path if parent_path else "/"
            regex, param_names, has_wildcard = _path_to_regex(resolved)
            segments = resolved.strip("/").split("/") if resolved != "/" else []
            static_count = sum(
                1 for s in segments if not s.startswith("{") and s != "*"
            )
            compiled.append(
                _CompiledRoute(
                    pattern=resolved,
                    regex=regex,
                    param_names=param_names,
                    element=r.element,
                    is_index=True,
                    has_wildcard=has_wildcard,
                    static_segment_count=static_count,
                    segment_count=len(segments),
                )
            )
        elif r.path is not None:
            # Resolve WidgetPath / EnterpriseWidgetPath
            if isinstance(r.path, (WidgetPath, EnterpriseWidgetPath)):
                resolved_path = resolve_widget_path(r.path, current_url_path)
            else:
                path_str = r.path
                if not path_str.startswith("/"):
                    path_str = f"/{path_str}"
                resolved_path = (
                    f"{parent_path.rstrip('/')}{path_str}" if parent_path else path_str
                )

            # Compile this route if it has an element
            if r.element is not None:
                regex, param_names, has_wildcard = _path_to_regex(resolved_path)
                segments = (
                    resolved_path.strip("/").split("/") if resolved_path != "/" else []
                )
                static_count = sum(
                    1 for s in segments if not s.startswith("{") and s != "*"
                )
                compiled.append(
                    _CompiledRoute(
                        pattern=resolved_path,
                        regex=regex,
                        param_names=param_names,
                        element=r.element,
                        is_index=False,
                        has_wildcard=has_wildcard,
                        static_segment_count=static_count,
                        segment_count=len(segments),
                    )
                )

            # Recurse into children
            if r.children:
                compiled.extend(
                    _compile_routes(r.children, resolved_path, current_url_path)
                )
        else:
            # No path and not index — just a grouping node, recurse children
            if r.children:
                compiled.extend(
                    _compile_routes(r.children, parent_path, current_url_path)
                )

    return compiled


def _match_route(
    compiled_routes: list[_CompiledRoute], path: str
) -> tuple[_CompiledRoute | None, dict[str, str]]:
    """
    Match a path against compiled routes, returning the best match and extracted params.

    Specificity ordering:
    1. Static segments preferred over parameterized.
    2. More segments preferred over fewer.
    3. Wildcard routes have lowest priority.
    4. Index routes match only exact parent path.

    Returns:
        A tuple of (matched route or None, params dict).
    """
    candidates: list[tuple[_CompiledRoute, dict[str, str]]] = []

    for route in compiled_routes:
        m = route.regex.match(path)
        if m:
            params: dict[str, str] = {}
            for i, name in enumerate(route.param_names):
                value = m.group(i + 1) if m.group(i + 1) is not None else ""
                params[name] = value
            candidates.append((route, params))

    if not candidates:
        return None, {}

    # Sort by specificity:
    # 1. Non-wildcard before wildcard
    # 2. More static segments first
    # 3. More total segments first
    # 4. Index routes preferred for exact matches
    def sort_key(item: tuple[_CompiledRoute, dict[str, str]]) -> tuple:
        r = item[0]
        return (
            0 if not r.has_wildcard else 1,
            -r.static_segment_count,
            -r.segment_count,
            0 if r.is_index else 1,
        )

    candidates.sort(key=sort_key)
    return candidates[0]


def _router_render(*routes: _Route) -> Element:
    """
    Match the current URL path against the provided routes and render
    the matching route's element.
    """
    path = use_path()
    url_components = use_url_components()
    current_url_path = url_components.path

    # Compile all routes
    compiled = _compile_routes(list(routes), "", current_url_path)

    # Match
    matched, params = _match_route(compiled, path)

    if matched is None or matched.element is None:
        return text(f"No route matches path: {path}")

    # Render the matched element wrapped in the params context
    return _route_params_context(matched.element(), value=params)


# Create the component using make_component
router = component(_router_render)
