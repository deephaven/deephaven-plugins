from __future__ import annotations

from typing import Callable, Any, Union

from .item import ItemElement
from ..elements import BaseElement, Element
from .._internal.utils import create_props
from ..types import Stringable, Selection, Key, ActionKey

ActionGroupItem = Union[Stringable, ItemElement]
ListActionGroupElement = Element


def list_action_group(
    *children: ActionGroupItem,
    on_action: Callable[[ActionKey, Key], None] | None = None,
    on_selection_change: Callable[[Selection, Key], None] | None = None,
    on_change: Callable[[Selection, Key], None] | None = None,
    **props: Any,
) -> ListActionGroupElement:
    """
    A group of action buttons that can be used to create a list of actions.
    This component should be used within the actions prop of a `ListView` component.

    Args:
        *children: The options to render within the list_action_group.
        on_action: Handler that is called when an item is pressed.
            The first argument is the key of the action, the second argument is the key of the list_view item.
        on_selection_change: Handler that is called when the selection changes.
            The first argument is the selection, the second argument is the key of the list_view item.
        on_change: Alias of on_selection_change.
            Handler that is called when the selection changes.
            The first argument is the selection, the second argument is the key of the list_view item.
        **props: Any other ActionGroup prop.

    Returns:
        A ListActionGroup that can be used within the actions prop of a `ListView` component.
    """
    children, props = create_props(locals())

    return BaseElement("deephaven.ui.components.ListActionGroup", *children, **props)
