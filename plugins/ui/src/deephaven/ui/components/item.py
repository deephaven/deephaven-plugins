from typing import Any

from ..elements import BaseElement
from ..types import Stringable

ItemElement = BaseElement


def item(*children: Stringable, **props: Any) -> ItemElement:
    """
    An item that can be added to a menu, such as a picker

    Args:
        children: The options to render within the item.
        **props: Any other Item prop.
    """
    # TODO: Revert to deephaven.ui.components, need Brian's change
    return BaseElement("deephaven.ui.spectrum.Item", *children, **props)
