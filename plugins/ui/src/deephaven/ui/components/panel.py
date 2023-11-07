from typing import Any
from ..elements import BaseElement


def panel(*children: list[Any], title: str | None = None, **kwargs: dict[str, Any]):
    """
    A panel is a container that can be used to group elements.

    Args:
        children: Elements to render in the panel.
        title: Title of the panel.
    """
    return BaseElement(
        "deephaven.ui.components.Panel", *children, title=title, **kwargs
    )
