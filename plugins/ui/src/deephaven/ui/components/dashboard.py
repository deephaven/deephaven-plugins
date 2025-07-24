from __future__ import annotations

from typing import Any
from ..elements import BaseElement, FunctionElement


def dashboard(element: FunctionElement) -> BaseElement:
    """
    A dashboard is the container for an entire layout.

    Args:
        element: Element to render as the dashboard.
                 The element should render a layout that contains 1 root column or row.

    Returns:
        The rendered dashboard.
    """
    # return DashboardElement(element)
    return BaseElement("deephaven.ui.components.Dashboard", element)  # type: ignore[return-value]
