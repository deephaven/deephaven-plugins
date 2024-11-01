from __future__ import annotations
from typing import Any, Union, List

from ..elements import BaseElement
from ..types import Stringable, Undefined, UNDEFINED
from .._internal.utils import create_props
from .basic import component_element

ItemElement = BaseElement
Item = Union[Stringable, ItemElement]
ItemList = List[Item]


def item(
    *children: Stringable,
    title: str | Undefined = UNDEFINED,
    text_value: str | Undefined = UNDEFINED,
    aria_label: str | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
    **props: Any,
) -> ItemElement:
    """
    An item that can be added to a menu, such as a picker

    Args:
        children: The options to render within the item.
        title: Rendered contents of the item if `children` contains child items.
        text_value: A string representation of the item's contents, used for features like typeahead.
        aria_label: An accessibility label for this item.
        key: A unique identifier used by React to render elements in a list.
        **props: Any other Item prop.
    """
    children, props = create_props(locals())
    return component_element("Item", *children, **props)
