from __future__ import annotations
from typing import Callable
from .types import (
    Alignment,
    MenuTriggerDirection,
    MenuTriggerType,
)
from .basic import component_element
from ..elements import BaseElement, Element
from .._internal.utils import create_props

MenuTrigger = BaseElement


def menu_trigger(
    *children: Element,
    align: Alignment | None = None,
    direction: MenuTriggerDirection | None = None,
    should_flip: bool | None = None,
    close_on_select: bool | None = None,
    trigger: MenuTriggerType | None = None,
    is_open: bool | None = None,
    default_open: bool | None = None,
    on_open_change: Callable[[bool], None] | None = None,
    key: str | None = None,
) -> MenuTrigger:
    """
    A menu_trigger serves as a wrapper around a menu and its associated trigger.

    Args:
        *children: The menu and its trigger element.
        align: The alignment of the menu relative to the trigger.
        direction: Where the Menu opens relative to its trigger.
        should_flip: Whether the menu should automatically flip direction when space is limited.
        close_on_select: Whether the menu should close when an item is selected.
        trigger: How the menu is triggered.
        is_open: Whether the menu is open by default (controlled).
        default_open: Whether the menu is open by default (uncontrolled).
        on_open_change: Handler that is called when the overlay's open state changes.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The menu trigger element.
    """

    children, props = create_props(locals())
    return component_element("MenuTrigger", *children, **props)
