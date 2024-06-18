from __future__ import annotations
from typing import Any

from .basic import component_element

from ..types import Key


def tab(
    *children: Any,
    title: Any | None = None,
    key: Key | None = None,
):
    """
    Tab item implementation for tabs component.

    Args:
        *children: Content of the tab item.
        title: The title of the tab item.
        key: The unique key of the tab item.
    """
    return component_element(
        "Tab",
        *children,
        title=title,
        key=key,
    )
