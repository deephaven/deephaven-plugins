from __future__ import annotations

from ..types import WidgetPath, EnterpriseWidgetPath, resolve_widget_path
from .._internal import get_context


def use_widget_path(widget_path: WidgetPath | EnterpriseWidgetPath) -> str:
    """
    Resolve a WidgetPath or EnterpriseWidgetPath to an absolute URL path string.

    Uses the base URL from the frontend to construct the resolved path.

    Args:
        widget_path: A WidgetPath or EnterpriseWidgetPath instance to resolve.

    Returns:
        The resolved absolute URL path string.
    """
    context = get_context()
    return resolve_widget_path(widget_path, context.get_base_url())
