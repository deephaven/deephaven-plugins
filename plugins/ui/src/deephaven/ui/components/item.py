from typing import Any, Union

from ..elements import BaseElement
from ..types import Stringable

ItemElement = BaseElement
Item = Union[Stringable, ItemElement]


def item(*children: Stringable, **props: Any) -> ItemElement:
    """
    An item that can be added to a menu, such as a picker

    Args:
        children: The options to render within the item.
        **props: Any other Item prop.
    """
    return BaseElement("deephaven.ui.components.Item", *children, **props)
