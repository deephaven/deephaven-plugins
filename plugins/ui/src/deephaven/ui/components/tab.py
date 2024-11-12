from __future__ import annotations
from typing import Any

from .basic import component_element
from ..elements import Element
from ..types import Key, UndefinedType, Undefined


def tab(
    *children: Any,
    title: Any | UndefinedType = Undefined,
    key: Key | UndefinedType = Undefined,
    icon: Element | UndefinedType = Undefined,
    text_value: str | UndefinedType = Undefined,
):
    """
    Tab item implementation for tabs component.

    Args:
        *children: Content of the tab item.
        title: The title of the tab item.
        key: The unique key of the tab item. Defaults to title.
        icon: The icon of the tab item.
        text_value: The text value of the tab item.
    """
    return component_element(
        "Tab", *children, title=title, key=key, icon=icon, text_value=text_value
    )
