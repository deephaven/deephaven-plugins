from __future__ import annotations

from ..types import WidgetPath, EnterpriseWidgetPath, resolve_widget_path
from .use_url_components import use_url_components
from .._internal import get_context


def use_widget_path(widget_path: WidgetPath | EnterpriseWidgetPath) -> str:
    """
    Resolve a WidgetPath or EnterpriseWidgetPath to an absolute URL path string.

    Uses the current URL context (via use_url_components()) and the base URL
    from the frontend to construct the resolved path, including automatic
    embed/app detection when ``embed`` is None.

    Args:
        widget_path: A WidgetPath or EnterpriseWidgetPath instance to resolve.

    Returns:
        The resolved absolute URL path string.
    """
    url = use_url_components()
    context = get_context()
    return resolve_widget_path(widget_path, url.path, context.get_base_url())
