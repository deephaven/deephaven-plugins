from __future__ import annotations

from typing import Any

from .._internal.utils import create_props
from ..elements import Element, BaseElement
from .item import Item

SectionElement = Element


def section(*children: Item, title: str | None = None, **props: Any) -> SectionElement:
    """
    A section that can be added to a menu, such as a picker. Children are the dropdown options.

    Args:
        *children: The options to render within the section.
        title: The title of the section.
        **props: Any other Section prop.

    Returns:
        The rendered Section.
    """

    children, props = create_props(locals())

    return BaseElement("deephaven.ui.components.Section", *children, **props)
