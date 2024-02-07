from __future__ import annotations

from typing import Any
from ..elements import DashboardElement, FunctionElement


def dashboard(element: FunctionElement):
    """
    A dashboard is the container for an entire layout.

    Args:
        element: Element to render as the dashboard.
                 The element should render a layout that contains 1 root column or row.
    """
    return DashboardElement(element)
