from __future__ import annotations

from .._internal import get_context


def use_path(absolute: bool = False) -> str:
    """
    Get the current URL path.

    Args:
        absolute: If True, returns the full absolute path.
                  If False (default), returns the path relative to the current widget.

    Returns:
        The current path as a string.
    """
    context = get_context()
    if absolute:
        return context.get_absolute_path()
    return context.get_path()
