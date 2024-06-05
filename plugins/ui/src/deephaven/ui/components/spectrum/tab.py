from __future__ import annotations
from typing import Any

from ...elements import BaseElement


from ...types import Key

# from .basic import spectrum_element


def tab(
    *children: Any,
    title: Any | None = None,
    key: Key | None = None,
):
    """
    Tab item implemenation for tabs component.

    Args:
        *children: The children of the button group.
        title: The title of the tab item.
        key: The key of the tab item.
    """
    return BaseElement(
        "deephaven.ui.components.Item",
        *children,
        title=title,
        key=key,
    )
