from __future__ import annotations

from typing import Callable, Any

from deephaven.table import Table

from .item_table_source import ItemTableSource
from ..elements import BaseElement, Element
from .._internal.utils import create_props, unpack_item_table_source
from .item import Item
from ..types import ListViewDensity, Selection, SelectionMode

ListViewElement = Element

SUPPORTED_SOURCE_ARGS = {
    "key_column",
    "label_column",
    "description_column",
    "icon_column",
    "actions",
}


def list_view(
    *children: Item | Table | ItemTableSource,
    density: ListViewDensity | None = "COMPACT",
    default_selected_keys: Selection | None = None,
    selected_keys: Selection | None = None,
    selection_mode: SelectionMode | None = "MULTIPLE",
    render_empty_state: Element | None = None,
    on_selection_change: Callable[[Selection], None] | None = None,
    on_change: Callable[[Selection], None] | None = None,
    **props: Any,
) -> ListViewElement:
    """
    A list view that can be used to create a list of items. Children should be one of three types:
    1. If children are of type `Item`, they are the list items.
    2. If children are of type `Table`, the values in the table are the list items.
        There can only be one child, the `Table`.
        The first column is used as the key and label by default.
    3. If children are of type `ItemTableSource`, complex items are created from the source.
        There can only be one child, the `ItemTableSource`.
        Supported `ItemTableSource` arguments are `key_column`, `label_column`, `description_column`,
        `icon_column`, and `actions`.

    Args:
        *children: The options to render within the list_view.
        density:
            Sets the amount of vertical padding within each cell.
        default_selected_keys:
            The initial selected keys in the collection (uncontrolled).
        selected_keys:
            The currently selected keys in the collection (controlled).
        selection_mode:
            By default `"MULTIPLE"`, which allows multiple selection.
            May also be `"SINGLE"` to allow only single selection, or `"None"`/`None` to allow no selection.
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

    children, props = unpack_item_table_source(children, props, SUPPORTED_SOURCE_ARGS)

    return BaseElement("deephaven.ui.components.ListView", *children, **props)
