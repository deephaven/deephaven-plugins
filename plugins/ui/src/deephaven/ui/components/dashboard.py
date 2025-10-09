from __future__ import annotations

from typing import Any, Union
from ..elements import BaseElement, FunctionElement


def dashboard(
    element: FunctionElement,
    show_close_icon: Union[bool, None] = None,
    show_headers: Union[bool, None] = None,
) -> BaseElement:
    """
    A dashboard is the container for an entire layout.

    Args:
        element: Element to render as the dashboard.
                 The element should render a layout that contains 1 root column or row.

        show_close_icon: Whether to show the close icon in the top right corner of the dashboard. Defaults to False.
        show_headers: Whether to show headers for the dashboard. Defaults to True.

    Returns:
        The rendered dashboard.
    """
    # return DashboardElement(element)
    return BaseElement("deephaven.ui.components.Dashboard", element, show_close_icon=show_close_icon, show_headers=show_headers)  # type: ignore[return-value]
