from __future__ import annotations

from typing import Callable, Any, Union

from deephaven.table import Table

from .item import ItemElement
from .item_table_source import ItemTableSource
from ..elements import BaseElement, Element
from .._internal.utils import create_props
from ..types import Stringable, Selection, SelectionMode

ListViewItem = Union[Stringable, ItemElement]
ListViewElement = Element


def list_view(
    *children: ListViewItem | Table | ItemTableSource,
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
    1. If children are of type `ListViewItem`, they are the list items.
    2. If children are of type `Table`, the values in the table are the list items.
        There can only be one child, the `Table`.
        The first column is used as the key and label by default.
    3. If children are of type ItemTableSource, complex items are created from the source.
        There can only be one child, the `ItemTableSource`.
        Supported `ItemTableSource` arguments are `key_column`, `label_column`, `description_column`,
        `icon_column`, and `actions`.

    Args:
        *children: The options to render within the list_view.
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

    return BaseElement("deephaven.ui.components.ListView", *children, **props)
