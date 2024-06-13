from __future__ import annotations

from typing import Callable, Any

from deephaven.table import Table, PartitionedTable
from .section import SectionElement, Item
from .item_table_source import ItemTableSource
from ..elements import BaseElement
from .._internal.utils import create_props, unpack_item_table_source
from ..types import Key

PickerElement = BaseElement

SUPPORTED_SOURCE_ARGS = {
    "key_column",
    "label_column",
    "description_column",
    "icon_column",
    "title_column",
}


def picker(
    *children: Item | SectionElement | Table | PartitionedTable | ItemTableSource,
    default_selected_key: Key | None = None,
    selected_key: Key | None = None,
    on_selection_change: Callable[[Key], None] | None = None,
    on_change: Callable[[Key], None] | None = None,
    **props: Any,
) -> PickerElement:
    """
    A picker that can be used to select from a list. Children should be one of five types:
    1. If children are of type `Item`, they are the dropdown options.
    2. If children are of type `SectionElement`, they are the dropdown sections.
    3. If children are of type `Table`, the values in the table are the dropdown options.
        There can only be one child, the `Table`.
        The first column is used as the key and label by default.
    4. If children are of type `PartitionedTable`, the values in the table are the dropdown options
        and the partitions create multiple sections. There can only be one child, the `PartitionedTable`.
        The first column is used as the key and label by default.
    5. If children are of type `ItemTableSource`, complex items are created from the source.
        There can only be one child, the `ItemTableSource`.
        Supported ItemTableSource arguments are `key_column`, `label_column`, `description_column`,
        `icon_column`, and `title_column`.

    Args:
        *children: The options to render within the picker.
        default_selected_key:
            The initial selected key in the collection (uncontrolled).
        selected_key:
            The currently selected key in the collection (controlled).
        on_selection_change:
            Handler that is called when the selection changes.
        on_change:
            Alias of `on_selection_change`. Handler that is called when the selection changes.
        **props:
            Any other Picker prop, except items.

    Returns:
        The rendered Picker.
    """
    children, props = create_props(locals())

    children, props = unpack_item_table_source(children, props, SUPPORTED_SOURCE_ARGS)

    return BaseElement("deephaven.ui.components.Picker", *children, **props)
