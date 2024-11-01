from __future__ import annotations
from typing import Callable, Union
from .types import (
    DialogTriggerType,
    DialogTriggerMobileType,
    Placement,
)
from .basic import component_element
from ..elements import Element
from ..types import Undefined, UNDEFINED
from .._internal.utils import create_props


def dialog_trigger(
    *children: Element,
    type: DialogTriggerType | Undefined = "modal",
    mobile_type: DialogTriggerMobileType | Undefined = UNDEFINED,
    placement: Placement | Undefined = "bottom",
    is_open: bool | Undefined = UNDEFINED,
    default_open: bool | Undefined = UNDEFINED,
    container_padding: float | Undefined = UNDEFINED,
    offset: float | Undefined = UNDEFINED,
    cross_offset: float | Undefined = UNDEFINED,
    should_flip: bool | Undefined = UNDEFINED,
    hide_arrow: bool | Undefined = UNDEFINED,
    is_dismissable: bool | Undefined = UNDEFINED,
    is_keyboard_dismiss_disabled: bool | Undefined = UNDEFINED,
    on_open_change: Callable[[bool], None] | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> Element:
    """
    A dialog_trigger serves as a wrapper around a dialog and its associated trigger.
    Args:
        *children: The Dialog and its trigger element.
        type: The type of Dialog that should be rendered.
        mobile_type: The type of Dialog that should be rendered when on a mobile device.
        placement: The placement of the popover relative to the action button.
        is_open: Whether the popover is open by default (controlled).
        default_open: Whether the popover is open by default (uncontrolled).
        container_padding: The placement padding that should be applied between the element and its surrounding container.
        offset: The additional offset applied along the main axis between the element and its anchor element.
        cross_offset: The additional offset applied along the cross axis between the element and its anchor element.
        should_flip: Whether the element should flip its orientation when there is insufficient room for it to render completely.
        hide_arrow: Whether a popover type Dialog's arrow should be hidden.
        is_dismissable: Whether a modal type Dialog should be dismissable.
        is_keyboard_dismiss_disabled: Whether pressing the escape key to close the dialog should be disabled.
        on_open_change: Handler that is called when the overlay's open state changes.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The dialog trigger element.
    """
    children, props = create_props(locals())
    return component_element("DialogTrigger", *children, **props)
