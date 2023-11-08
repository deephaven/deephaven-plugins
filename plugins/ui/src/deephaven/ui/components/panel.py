from __future__ import annotations

from typing import Any
from ..elements import BaseElement


def panel(*children: Any, title: str | None = None, **kwargs: Any):
    """
    A panel is a container that can be used to group elements.

    Args:
        children: Elements to render in the panel.
        title: Title of the panel.
    """
    return BaseElement(
        "deephaven.ui.components.Panel", *children, title=title, **kwargs
    )
