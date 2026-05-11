from __future__ import annotations

import re
from typing import Any, Callable

from .text import text
from ..elements import create_context
from ..hooks import use_path, use_memo
from .route import _Route
from .make_component import make_component as component


# Module-level context for route params
_route_params_context = create_context({})


def _normalize_path_segment(path: str | None) -> str:
    """
    Strip leading/trailing slashes from a path segment.

    Args:
        path: The path segment to normalize.

    Returns:
        The normalized path segment.
    """
    if path is None:
        return ""
    return path.strip("/")


def _compile_routes(
    routes: list[_Route],
    parent_path: str = "",
) -> list[tuple[str, Callable[..., Any] | None, list[str], bool]]:
    """
    Recursively compile routes into a flat list of
    (pattern, element, param_names, is_index) tuples.

    pattern is the full resolved path pattern (e.g. "users/{user_id}/posts/{post_id}").
    param_names is a list of parameter names extracted from {var_name} segments.
    is_index indicates whether this is an index route.

    Args:
        routes: The list of _Route definitions to compile

    Returns:
        A list of compiled route tuples (pattern, element, param_names, is_index)
    """
    compiled = []

    for r in routes:
        if r.index:
            # Index route matches the parent's exact path
            compiled.append((parent_path, r.element, [], True))
        else:
            segment = _normalize_path_segment(r.path)
            if parent_path and segment:
                resolved = parent_path + "/" + segment
            elif segment:
                resolved = segment
            else:
                resolved = parent_path

            # Extract param names from pattern
            param_names = []
            for part in resolved.split("/"):
                # Match {var_name} and {var_name?} patterns
                match = re.match(r"^\{(\w+)\??\}$", part)
                if match:
                    param_names.append(match.group(1))
                elif part == "*":
                    param_names.append("*")

            if r.element is not None:
                compiled.append((resolved, r.element, param_names, False))

        # Recurse into children
        if r.children:
            child_parent = parent_path
            if not r.index:
                segment = _normalize_path_segment(r.path)
                if parent_path and segment:
                    child_parent = parent_path + "/" + segment
                elif segment:
                    child_parent = segment
            compiled.extend(_compile_routes(r.children, child_parent))

    return compiled


def _pattern_to_regex(pattern: str) -> str:
    """
    Convert a route pattern to a regex string.

    Supports:
    - {var_name} -> named group matching one segment
    - {var_name?} -> optional named group (zero or one segment)
    - * -> wildcard matching zero or more remaining segments
    - static segments -> literal match

    Args:
        pattern: The route pattern to convert
    Returns:
        A regex string for matching the pattern
    """
    if not pattern:
        return r"^/?$"

    parts = pattern.split("/")
    # Start regex with optional leading slash
    result = r"^/?"

    for i, part in enumerate(parts):
        # Optional {var_name?} pattern
        optional_match = re.match(r"^\{(\w+)\?\}$", part)
        # Required {var_name} pattern
        param_match = re.match(r"^\{(\w+)\}$", part)
        sep = "/" if i > 0 else ""

        if part == "*":
            # Wildcard matches the rest of the path, including slashes
            result += sep + r"(?P<__wildcard__>.*)"
        elif optional_match:
            # Optional segment: non-capturing group that matches either nothing or a slash followed by the param
            name = optional_match.group(1)
            # Include the leading slash in the optional group
            result += rf"(?:/(?P<{name}>[^/]+))?"
        elif param_match:
            # Required segment: named group matching one path segment
            name = param_match.group(1)
            result += sep + rf"(?P<{name}>[^/]+)"
        else:
            # Static segment: escape for literal match
            result += sep + re.escape(part)

    # Allow optional trailing slash and end of string
    result += r"/?$"
    return result


def _specificity_key(pattern: str, is_index: bool) -> tuple[int, int, int, int]:
    """
    Return a sort key for route specificity.

    Higher values = more specific = matched first.
    Order: static segments count, no-wildcard bonus, total segments, index bonus.

    Args:
        pattern: The route pattern to analyze.
        is_index: Whether this route is an index route.

    Returns:
        A tuple key for sorting routes by specificity.
    """
    parts = pattern.split("/") if pattern else []
    # Count static segments (not parameters or wildcards)
    static_count = sum(1 for p in parts if not re.match(r"^\{.*\}$", p) and p != "*")
    has_wildcard = any(p == "*" for p in parts)
    total_segments = len(parts)

    return (
        static_count,  # More static segments = more specific
        0 if has_wildcard else 1,  # Non-wildcard preferred
        total_segments,  # More total segments = more specific
        1 if is_index else 0,  # Index routes preferred for exact match
    )


def _check_conflicts(
    compiled: list[tuple[str, Callable[..., Any] | None, list[str], bool]],
) -> None:
    """
    Check for conflicting route patterns among siblings.
    Two routes conflict if they are both fully static and resolve to the same path.

    Args:
        compiled: The list of compiled routes to check.

    Raises:
        ValueError: If conflicting route paths are detected.
    """
    static_paths: dict[str, int] = {}
    for pattern, _, param_names, is_index in compiled:
        # Only check fully-static, non-index routes
        if not param_names and not is_index and "*" not in pattern:
            normalized = pattern.strip("/")
            if normalized in static_paths:
                raise ValueError(
                    f"Conflicting route paths: '/{normalized}' is defined more than once."
                )
            static_paths[normalized] = 1


def _compile_and_check(
    routes: list[_Route],
) -> list[tuple[str, Callable[..., Any] | None, list[str], bool]]:
    """
    Compile routes and check for conflicts. Returns compiled routes if valid.

    Args:
        routes: The list of _Route definitions to compile and check.

    Returns:
        A list of compiled route tuples (pattern, element, param_names, is_index).

    Raises:
        ValueError: If conflicting route paths are detected among siblings.
    """
    compiled = _compile_routes(routes)
    _check_conflicts(compiled)
    # Sort the compiled routes by specificity so that more specific routes are matched first
    sorted_routes = sorted(
        compiled,
        key=lambda r: _specificity_key(r[0], r[3]),
        reverse=True,
    )
    return sorted_routes


def _match_route(
    path: str,
    compiled: list[tuple[str, Callable[..., Any] | None, list[str], bool]],
) -> tuple[Callable[..., Any] | None, dict[str, str]] | None:
    """
    Match a path against compiled routes.
    Returns (element, params) for the best match, or None.

    Args:
        path: The URL path to match.
        compiled: The list of compiled route tuples (pattern, element, param_names, is_index).

    Returns:
        A tuple of (element, params) for the best match, or None if no match is found.
    """
    # Normalize path for matching
    normalized_path = path.strip("/")
    if not normalized_path:
        normalized_path = ""

    # Iterate through compiled routes in order of specificity and return the first match
    # It's assumed the routes are pre-sorted by specificity, so the first match is the best match.
    for pattern, element, param_names, _ in compiled:
        regex = _pattern_to_regex(pattern)
        match = re.match(regex, "/" + normalized_path if normalized_path else "/")
        if match:
            params: dict[str, str] = {}
            for name in param_names:
                if name == "*":
                    val = match.group("__wildcard__")
                    params["*"] = val if val else ""
                else:
                    val = match.group(name)
                    if val is not None:
                        params[name] = val
            return element, params

    return None


@component
def router(*routes: _Route) -> Any:
    """
    Match the current URL path against the provided routes and render
    the matching route's element.

    Args:
        *routes: Route definitions to match against.

    Returns:
        The element for the matched route wrapped in a params context,
        or an error element if no route matches.

    Raises:
        ValueError: If conflicting route paths are detected among siblings.
    """

    current_path = use_path()

    # Compile routes and check for conflicts
    compiled = use_memo(lambda: _compile_and_check(list(routes)), [routes])

    # Match current path against compiled routes
    result = use_memo(
        lambda: _match_route(current_path, compiled), [current_path, compiled]
    )

    if result is None:
        return text(f"No route matches path: {current_path}")

    element_fn, params = result

    if element_fn is None:
        return text(f"No element defined for matched route at: {current_path}")

    # Render the matched element wrapped in a params context
    return _route_params_context(element_fn(), value=params)
