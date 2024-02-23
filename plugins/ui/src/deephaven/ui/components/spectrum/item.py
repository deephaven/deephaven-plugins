from typing import Any

from .basic import spectrum_element
from ...elements import Element
from ...types import Stringable

ItemElement = Element


def item(*children: Stringable, **props: Any) -> ItemElement:
    """
    An item that can be added to a menu, such as a picker

    Args:
        children: The options to render within the item.
        **props: Any other Item prop.
    """
    return spectrum_element("Item", *children, **props)
