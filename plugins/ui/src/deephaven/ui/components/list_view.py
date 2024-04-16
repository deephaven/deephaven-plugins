from __future__ import annotations

from typing import Callable, Any, Union

from deephaven.table import Table

from .item import ItemElement
from .list_action_group import ListActionGroupElement
from .list_action_menu import ListActionMenuElement
from ..elements import BaseElement, Element
from .._internal.utils import create_props
from ..types import ColumnName, Stringable, Selection, SelectionMode

ListViewItem = Union[Stringable, ItemElement]
ListViewElement = Element


def list_view(
    *children: ListViewItem | Table,
    key_column: ColumnName | None = None,
    label_column: ColumnName | None = None,
    description_column: ColumnName | None = None,
    icon_column: ColumnName | None = None,
    actions: ListActionGroupElement | ListActionMenuElement | None = None,
    default_selected_keys: Selection | None = None,
    selected_keys: Selection | None = None,
    selection_mode: SelectionMode | None = "MULTIPLE",
    render_empty_state: Element | None = None,
    on_selection_change: Callable[[Selection], None] | None = None,
    on_change: Callable[[Selection], None] | None = None,
    **props: Any,
) -> ListViewElement:
    """
    A list view that can be used to create a list of items. Children should be one of two types:
    1. If children are of type `ListViewItem`, they are the list items.
    2. If children are of type `Table`, the values in the table are the list items.
        There can only be one child, the `Table`.


    Args:
        *children: The options to render within the list_view.
        key_column:
            Only valid if children are of type Table.
            The column of values to use as item keys. Defaults to the first column.
        label_column:
            Only valid if children are of type Table.
            The column of values to display as primary text. Defaults to the key_column value.
        description_column:
            Only valid if children are of type Table.
            The column of values to display as descriptions.
        icon_column: Only valid if children are of type Table.
            The column of values to map to icons.
        actions:
            Only valid if children are of type Table.
            The action group or menus to render for all elements within the list view.
        default_selected_keys:
            The initial selected keys in the collection (uncontrolled).
        selected_keys:
            The currently selected keys in the collection (controlled).
        render_empty_state:
            Sets what the `list_view` should render when there is no content to display.
        on_selection_change:
            Handler that is called when the selection changes.
        on_change:
            Alias of `on_selection_change`. Handler that is called when the selection changes.
        **props:
            Any other ListView prop, except items, dragAndDropHooks, and onLoadMore.

    Returns:
        The rendered ListView.
    """
    children, props = create_props(locals())

    return BaseElement("deephaven.ui.components.ListView", *children, **props)
