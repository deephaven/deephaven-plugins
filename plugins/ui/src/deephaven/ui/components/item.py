from __future__ import annotations
from typing import Any, Union, List

from ..elements import BaseElement
from ..types import Stringable

ItemElement = BaseElement
Item = Union[Stringable, ItemElement]
ItemList = List[Item]


def item(
    *children: Stringable,
    title: str | None = None,
    text_value: str | None = None,
    aria_label: str | None = None,
    child_items: ItemList | None = None,
    has_child_items: bool | None = None,
    **props: Any,
) -> ItemElement:
    """
    An item that can be added to a menu, such as a picker

    Args:
        children: The options to render within the item.
        title: Rendered contents of the item if `children` contains child items.
        text_value: A string representation of the item's contents, used for features like typeahead.
        aria_label: An accessibility label for this item.
        child_items: A list of child items objects. Used for dynamic collections.
        has_child_items: Whether this item has children, even if not loaded yet.
        **props: Any other Item prop.
    """
    props = locals()
    return BaseElement("deephaven.ui.components.Item", *children, **props)
