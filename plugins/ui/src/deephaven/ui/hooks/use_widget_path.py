from __future__ import annotations

from ..types import WidgetPath, EnterpriseWidgetPath, resolve_widget_path
from .use_url_components import use_url_components


def use_widget_path(widget_path: WidgetPath | EnterpriseWidgetPath) -> str:
    """
    Resolve a WidgetPath or EnterpriseWidgetPath to an absolute URL path string.

    Uses the current URL context (via use_url_components()) to extract the
    base URL and detect the embed/app context, then delegates to the same
    resolution logic used by ui.router.

    Args:
        widget_path: A WidgetPath or EnterpriseWidgetPath instance to resolve.

    Returns:
        The resolved absolute URL path string.
    """
    url = use_url_components()
    return resolve_widget_path(widget_path, url.path)
