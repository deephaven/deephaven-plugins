from .._internal import get_context


def use_path(absolute: bool = False) -> str:
    """
    Get the current URL path.

    The /-/ prefix separates platform routing from widget routing.
    The section after /-/ is the path relative to the current widget.
    If the widget is not loaded via a route containing /-/, the relative
    path falls back to /.

    Args:
        absolute: If True, returns the full absolute path from the URL.
            If False (default), returns the path relative to the
            current widget (after /-/).

    Returns:
        The current path as a string.
    """
    context = get_context()
    if absolute:
        return context.get_absolute_path() or "/"
    return context.get_path() or "/"
