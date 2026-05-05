from __future__ import annotations

from typing import Any, Callable
from urllib.parse import urlencode, urlsplit

from ..types import QueryParams
from .use_send_event import use_send_event


_NAVIGATE_EVENT = "navigate.event"


def _normalize_path(path: str | None) -> str | None:
    """
    Normalize a path: None passthrough, reject empty, prepend /.

    Args:
        path: The path to normalize

    Returns:
        The normalized path, or None if input was None

    """
    if path is None:
        return None
    if path == "":
        raise ValueError("Empty string is not a valid path. Use '/' for the root.")
    if not path.startswith("/"):
        path = "/" + path
    return path


def _normalize_query_params(query_params: str | QueryParams | None) -> str | None:
    """
    Normalize query params to a ?-prefixed string. None passthrough, empty clears.

    Args:
        query_params: The query parameters to normalize

    Returns:
        The normalized query parameters, or None if input was None
    """
    if query_params is None:
        return None
    if isinstance(query_params, dict):
        if not query_params:
            return ""
        return "?" + urlencode(query_params, doseq=True)
    if query_params == "":
        return ""
    if query_params.startswith("?"):
        return query_params
    return "?" + query_params


def _normalize_fragment(fragment: str | None) -> str | None:
    """
    Normalize a fragment string. None passthrough, empty clears, strips #.

    Args:
        fragment: The fragment to normalize

    Returns:
        The normalized fragment, or None if input was None
    """
    if fragment is None:
        return None
    if fragment == "":
        return ""
    if fragment.startswith("#"):
        return fragment[1:]
    return fragment


def _parse_inline_url(path: str) -> tuple[str, str | None, str | None]:
    """
    Parse inline ?query and #fragment from a path string.

    Args:
        path: The path string to parse

    Returns:
        A tuple of (clean_path, inline_query, inline_fragment)
    """
    # Use a dummy base URL for urlsplit to easily parse path, query, and fragment
    result = urlsplit("http://dummy" + (path if path.startswith("/") else "/" + path))
    clean_path = result.path
    inline_query = ("?" + result.query) if result.query else None
    inline_fragment = result.fragment if result.fragment else None
    return clean_path, inline_query, inline_fragment


def _build_navigate_payload(
    path: str | None = None,
    query_params: str | QueryParams | None = None,
    fragment: str | None = None,
    replace: bool | None = None,
) -> dict[str, Any]:
    """
    Build a navigate event payload from URL components.

    Parses inline ?query and #fragment from path if present.
    Explicit query_params/fragment args take precedence over inline values.
    Only resolved non-None values are included in the returned dict.
    """
    inline_query: str | None = None
    inline_fragment: str | None = None

    if path is not None:
        if path == "":
            raise ValueError("Empty string is not a valid path. Use '/' for the root.")
        path, inline_query, inline_fragment = _parse_inline_url(path)
        path = _normalize_path(path)

    payload: dict[str, Any] = {}
    if path is not None:
        payload["path"] = path

    eff_query = _normalize_query_params(
        query_params if query_params is not None else inline_query
    )
    if eff_query is not None:
        payload["queryParams"] = eff_query

    eff_fragment = _normalize_fragment(
        fragment if fragment is not None else inline_fragment
    )
    if eff_fragment is not None:
        payload["fragment"] = eff_fragment

    if replace is not None:
        payload["replace"] = replace

    return payload


def use_navigate() -> Callable[..., None]:
    """
    Get a function to navigate to a new URL within the widget's route space.

    Returns:
        A navigate function: navigate(path, query_params, fragment, replace) -> None
    """
    send_event = use_send_event()

    def navigate(
        path: str | None = None,
        query_params: str | QueryParams | None = None,
        fragment: str | None = None,
        replace: bool | None = None,
    ) -> None:
        """
        Navigate to a new URL using SPA navigation.

        At least one of path, query_params, or fragment must be provided.

        Args:
            path: Target path. May include inline ?query and #fragment.
                Explicit query_params/fragment args override inline values.
            query_params: Query string or QueryParams dict.
                Empty string or {} clears all query parameters.
            fragment: URL fragment (leading # optional).
                Empty string clears the fragment.
            replace: If True, replace history entry. If False, push new.
                Defaults to None (replaceState).
        """
        if path is None and query_params is None and fragment is None:
            raise ValueError(
                "At least one of path, query_params, or fragment must be provided."
            )

        payload = _build_navigate_payload(path, query_params, fragment, replace)
        send_event(_NAVIGATE_EVENT, payload)

    return navigate
