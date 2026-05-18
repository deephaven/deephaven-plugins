from __future__ import annotations

from urllib.parse import SplitResult, urlsplit, parse_qs

from ..types import QueryParams

# Separator between platform routing and widget routing in the URL
WIDGET_PATH_SEPARATOR = "/-/"


def parse_url(url: str | None) -> SplitResult:
    """
    Parse a URL string into components.

    Args:
        url: The full URL string, or None.

    Returns:
        A SplitResult. If url is None or empty, returns a SplitResult
        with all empty fields.
    """
    return urlsplit(url) if url else urlsplit("")


def get_query_params(url: str | None) -> QueryParams:
    """
    Extract query parameters from a URL string.

    Args:
        url: The full URL string, or None.

    Returns:
        A dictionary mapping parameter names to lists of string values.
    """
    parsed = parse_url(url)
    return parse_qs(parsed.query, keep_blank_values=True)


def get_path(url: str | None, absolute: bool = False) -> str:
    """
    Extract the path from a URL string.

    The /-/ separator divides platform routing from widget routing.
    The section after /-/ is the path relative to the current widget.

    Args:
        url: The full URL string, or None.
        absolute: If True, returns the full path from the URL.
            If False (default), returns the widget-relative path (after /-/).

    Returns:
        The path as a string, defaulting to "/" if not found.
    """
    parsed = parse_url(url)
    if absolute:
        return parsed.path or "/"
    separator_index = parsed.path.find(WIDGET_PATH_SEPARATOR)
    if separator_index == -1:
        return "/"
    relative = parsed.path[separator_index + len(WIDGET_PATH_SEPARATOR) :]
    return f"/{relative}" if relative else "/"
