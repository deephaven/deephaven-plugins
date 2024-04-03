from __future__ import annotations

from typing import Callable, Any, Union


from .item import ItemElement
from ..elements import BaseElement, Element
from .._internal.utils import create_props
from ..types import Stringable, Key, ActionKey

ActionMenuItem = Union[Stringable, ItemElement]
ListActionMenuElement = Element


def list_action_menu(
    *children: ActionMenuItem,
    on_action: Callable[[ActionKey, Key], None] | None = None,
    on_open_change: Callable[[bool, Key], None] | None = None,
    **props: Any,
) -> ListActionMenuElement:
    """
    A menu of action buttons that can be used to create a list of actions.
    This component should be used within the actions prop of a `ListView` component.

    Args:
        *children: The options to render within the list_action_menu.
        on_action: Handler that is called when an item is selected.
            The first argument is the key of the action, the second argument is the key of the list_view item.
        on_open_change: Handler that is called when the menu is opened or closed.
            The first argument is a boolean indicating if the menu is open, the second argument is the key of the list_view item.
        **props: Any other ActionMenu prop.

    Returns:
        A ListActionMenu that can be used within the actions prop of a `ListView` component.
    """
    children, props = create_props(locals())

    return BaseElement("deephaven.ui.components.ListActionMenu", *children, **props)
