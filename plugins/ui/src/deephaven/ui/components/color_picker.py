from __future__ import annotations
from typing import Any, Callable

from .types import (
    # Events
    FocusEventCallable,
    KeyboardEventCallable,
    # Layout
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)
from .basic import component_element
from ..elements import Element


def color_picker(
    *children: Any,
    label: Any = None,
    size: str = "M",
    rounding: str = "default",
    value: str | None = None,
    default_value: str | None = None,
    on_change: Callable[[str], None] | None = None,  # should be Color type
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    hide_alpha_channel: bool | None = None,
) -> Element:
    return component_element(
        "ColorPicker",
        children=children,
        label=label,
        size=size,
        rounding=rounding,
        value=value,
        default_value=default_value,
        on_change=on_change,
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        hide_alpha_channel=hide_alpha_channel,
    )
