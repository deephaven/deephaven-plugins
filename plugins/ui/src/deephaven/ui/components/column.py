from __future__ import annotations

from typing import Any
from .basic import component_element


def column(*children: Any, width: float | None = None, **kwargs: Any):
    """
    A column is a container that can be used to group elements.
    Each element will be placed below its prior sibling.

    Args:
        children: Elements to render in the column.
        width: The percent width of the column relative to other children of its parent. If not provided, the column will be sized automatically.
    """
    return component_element("Column", *children, width=width, **kwargs)
