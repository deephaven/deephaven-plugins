from __future__ import annotations

from typing import Any

from .._internal.utils import create_props
from ..elements import Element
from ..types import UndefinedType, Undefined
from .basic import component_element
from .item import Item

SectionElement = Element


def section(
    *children: Item,
    title: str | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
) -> SectionElement:
    """
    A section that can be added to a menu, such as a picker. Children are the dropdown options.

    Args:
        *children: The options to render within the section.
        title: The title of the section.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered Section.
    """

    children, props = create_props(locals())

    return component_element("Section", *children)
