from __future__ import annotations

from typing import Any
from .basic import component_element
from ..elements import Element
from ..types import Undefined, UNDEFINED


def row(
    *children: Any,
    height: float | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> Element:
    """
    A row is a container that can be used to group elements.
    Each element will be placed to the right of its prior sibling.

    Args:
        *children: Elements to render in the row.
        height: The percent height of the row relative to other children of its parent. If not provided, the row will be sized automatically.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered row element.
    """
    return component_element("Row", *children, height=height, key=key)
