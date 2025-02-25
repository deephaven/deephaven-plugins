from __future__ import annotations

from .basic import component_element
from ..elements import Element


def color_editor(
    hide_alpha_channel: bool | None = None,
) -> Element:
    """
    A ColorPicker combines a swatch with a customizable popover for editing a color.

    Returns:
      The rendered color picker.
    """
    return component_element(
        "ColorEditor",
        hide_alpha_channel=hide_alpha_channel,
    )
