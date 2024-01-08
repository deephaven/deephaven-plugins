from __future__ import annotations

from typing import Any
from ..elements import BaseElement


def stack(
    *children: Any,
    height: float | None = None,
    width: float | None = None,
    activeItemIndex: int | None = None,
    **kwargs: Any,
):
    """
    A stack is a container that can be used to group elements which creates a set of tabs.
    Each element will get a tab and only one element can be visible at a time.

    Args:
        children: Elements to render in the row.
        height: The percent height of the stack relative to other children of its parent. If not provided, the stack will be sized automatically.
        width: The percent width of the stack relative to other children of its parent. If not provided, the stack will be sized automatically.
    """
    return BaseElement(
        "deephaven.ui.components.Stack",
        *children,
        height=height,
        width=width,
        activeItemIndex=activeItemIndex,
        **kwargs,
    )
