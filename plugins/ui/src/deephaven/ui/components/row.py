from __future__ import annotations

from typing import Any
from .basic import component_element


def row(*children: Any, height: float | None = None, **kwargs: Any):
    """
    A row is a container that can be used to group elements.
    Each element will be placed to the right of its prior sibling.

    Args:
        *children: Elements to render in the row.
        height: The percent height of the row relative to other children of its parent. If not provided, the row will be sized automatically.
    """
    return component_element("Row", *children, height=height, **kwargs)
