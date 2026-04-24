from __future__ import annotations

from typing import Callable
from urllib.parse import urlencode, urlsplit

from ..types import QueryParams
from .use_send_event import use_send_event
from .use_url_components import use_url_components

_NAVIGATE_EVENT = "navigate.event"


def _query_params_to_query_string(query_params: QueryParams) -> str:
    """
    Convert a ``QueryParams`` dict to a URL query string.

    Args:
        query_params: The query params dict to convert.

    Returns:
        A query string like ``"?page=1&tag=python&tag=java"``,
        or ``""`` if empty.
    """
    if not query_params:
        return ""
    return f"?{urlencode(query_params, doseq=True)}"


def _normalize_path(path: str | None) -> str | None:
    """
    Normalize a plain string path.

    - Returns *None* for ``None`` (preserve current).
    - Raises ``ValueError`` for an empty string.
    - Prepends ``/`` if missing.
    - Extracts inline query params and fragment, returns only the path portion.

    Returns:
        A tuple ``(normalized_path, inline_query, inline_fragment)`` where the
        latter two may be *None* when not present in *path*.
    """
    if path is None:
        return None
    if path == "":
        raise ValueError("Empty string is not a valid path. Use '/' for the root.")
    if not path.startswith("/"):
        path = f"/{path}"
    return path


def _parse_path_components(
    path: str,
) -> tuple[str, str | None, str | None]:
    """
    Split inline query params and fragment from a path string.

    Returns:
        ``(path, query_or_none, fragment_or_none)``
    """
    parts = urlsplit(path)
    query = parts.query if parts.query else None
    fragment = parts.fragment if parts.fragment else None
    return parts.path, query, fragment


def _normalize_query_params(
    query_params: str | QueryParams | None,
) -> str | None:
    """
    Normalize query params.

    - Returns *None* for ``None`` (preserve current).
    - Returns ``""`` for ``""`` or ``{}`` (clear).
    - Converts a ``QueryParams`` dict to a query string.
    - Strips leading ``?`` from string form.
    """
    if query_params is None:
        return None
    if query_params == "" or query_params == {}:
        return ""
    if isinstance(query_params, dict):
        qs = _query_params_to_query_string(query_params)
        # Strip leading '?'
        return qs.lstrip("?") if qs else ""
    # String form
    return query_params.lstrip("?")


def _normalize_fragment(fragment: str | None) -> str | None:
    """
    Normalize a fragment.

    - Returns *None* for ``None`` (preserve current).
    - Returns ``""`` for ``""`` (clear).
    - Strips leading ``#``.
    """
    if fragment is None:
        return None
    if fragment == "":
        return ""
    return fragment.lstrip("#")


def use_navigate() -> Callable[..., None]:
    """
    Get a function to navigate to a new URL.

    Returns:
        A navigate function with signature::

            navigate(
                path: str | None = None,
                query_params: str | QueryParams | None = None,
                fragment: str | None = None,
                absolute: bool | None = None,
                replace: bool | None = None,
            ) -> None
    """
    send_event = use_send_event()
    # Read current URL to enable WidgetPath resolution if needed in the future
    use_url_components()

    def navigate(
        path: str | None = None,
        query_params: str | QueryParams | None = None,
        fragment: str | None = None,
        absolute: bool | None = None,
        replace: bool | None = None,
    ) -> None:
        if path is None and query_params is None and fragment is None:
            raise ValueError(
                "At least one of path, query_params, or fragment must be provided."
            )

        # Normalize path
        norm_path = _normalize_path(path)

        # If path is provided as a string, parse inline query/fragment
        inline_query: str | None = None
        inline_fragment: str | None = None
        if norm_path is not None:
            norm_path, inline_query, inline_fragment = _parse_path_components(norm_path)

        # Normalize explicit query_params and fragment
        norm_query = _normalize_query_params(query_params)
        norm_fragment = _normalize_fragment(fragment)

        # Merge: explicit args override inline values from path.
        # If path is provided and query_params is not explicitly given, use inline
        # (or clear if no inline). If path is not provided, preserve (None).
        if path is not None:
            # When path is provided, query_params and fragment are cleared unless
            # explicitly provided or found inline.
            if norm_query is None:
                norm_query = inline_query if inline_query is not None else ""
            if norm_fragment is None:
                norm_fragment = inline_fragment if inline_fragment is not None else ""

        # Determine absolute default
        if absolute is None:
            absolute = False

        # Build payload — None values tell the frontend to preserve current
        payload: dict = {}
        if norm_path is not None:
            payload["path"] = norm_path
        if norm_query is not None:
            # Prepend '?' for non-empty query strings for the frontend
            payload["queryParams"] = f"?{norm_query}" if norm_query else ""
        if norm_fragment is not None:
            payload["fragment"] = norm_fragment
        if absolute is not None:
            payload["absolute"] = absolute
        if replace is not None:
            payload["replace"] = replace

        send_event(_NAVIGATE_EVENT, payload)

    return navigate
