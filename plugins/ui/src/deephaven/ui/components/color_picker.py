from __future__ import annotations
from typing import Any, Callable

from .basic import component_element
from ..elements import Element
from ..types import CSSColor


def color_picker(
    *children: Any,
    label: Any = None,
    size: str = "M",
    rounding: str = "default",
    value: str | None = None,
    default_value: str | None = None,
    on_change: Callable[[CSSColor], None] | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    hide_alpha_channel: bool | None = None,
) -> Element:
    """
    A ColorPicker combines a swatch with a customizable popover for editing a color.

    Args:
      *children: Elements to render in the color picker.
      label: The label for the color picker.
      size: The size of the color picker.
      rounding: The rounding of the color picker.
      value: The current value of the color picker.
      default_value: The default value of the color picker.
      on_change: The callback to call when the color picker value changes.
      aria_label: The aria label for the color picker.
      aria_labelledby: The aria labelledby for the color picker.
      aria_describedby: The aria describedby for the color picker.
      aria_details: The aria details for the color picker.
      hide_alpha_channel: Whether to hide the alpha channel in the color picker.

    Returns:
      The rendered color picker.
    """
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
