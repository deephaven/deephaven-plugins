from __future__ import annotations
from .basic import component_element
from ..elements import BaseElement, Element
from .._internal.utils import create_props

ContextualHelpTrigger = BaseElement


def contextual_help_trigger(
    *children: Element,
    is_unavailable: bool | None = None,
    key: str | None = None,
) -> ContextualHelpTrigger:
    """
    A contextual_help_trigger disables a menu item's action and replaces it with a popover with information on why the item is unavailable..
    Args:
        *children: The triggering Item and the dialog, respectively.
        is_unavailable: Whether the menu item is currently unavailable.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The contextual help trigger element.
    """
    children, props = create_props(locals())
    return component_element("ContextualHelpTrigger", *children, **props)
