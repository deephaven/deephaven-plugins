from __future__ import annotations

from typing import Any
from .basic import component_element
from ..elements import Element


def stack(
    *children: Any,
    height: float | None = None,
    width: float | None = None,
    active_item_index: int | None = None,
    key: str | None = None,
) -> Element:
    """
    A stack is a container that can be used to group elements which creates a set of tabs.
    Each element will get a tab and only one element can be visible at a time.

    Args:
        *children: Elements to render in the row.
        height: The percent height of the stack relative to other children of its parent. If not provided, the stack will be sized automatically.
        width: The percent width of the stack relative to other children of its parent. If not provided, the stack will be sized automatically.
        active_item_index: The index of the active item in the stack.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered stack element.
    """
    return component_element(
        "Stack",
        *children,
        height=height,
        width=width,
        active_item_index=active_item_index,
        key=key,
    )
