from __future__ import annotations
from .basic import component_element
from ..elements import BaseElement, Element
from .._internal.utils import create_props

SubmenuTrigger = BaseElement


def submenu_trigger(
    *children: Element,
    key: str | None = None,
) -> SubmenuTrigger:
    """
    A submenu_trigger serves as a wrapper around a menu and item in a submenu.
    Args:
        *children: An item and a menu.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The submenu trigger element.
    """
    children, props = create_props(locals())
    return component_element("SubmenuTrigger", *children, **props)
