from __future__ import annotations

from typing import Any
from ..elements import DashboardElement, FunctionElement


def dashboard(
    element: FunctionElement,
    *,
    show_headers: bool = True,
) -> DashboardElement:
    """
    A dashboard is the container for an entire layout.

    Args:
        element: Element to render as the dashboard.
                 The element should render a layout that contains 1 root column or row.
        show_headers: Whether to show headers on the dashboard panels. Defaults to True.

    Returns:
        The rendered dashboard.
    """
    return DashboardElement(element, show_headers=show_headers)
