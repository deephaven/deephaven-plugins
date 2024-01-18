from __future__ import annotations

from typing import Any
from ..elements import DashboardElement


def dashboard(*children: Any, **kwargs: Any):
    """
    A dashboard is the container for an entire layout.

    Args:
        children: Elements to render in the dashboard. Must have only 1 root element.
    """
    return DashboardElement(*children, **kwargs)
