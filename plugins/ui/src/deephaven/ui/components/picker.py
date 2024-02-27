from __future__ import annotations

from typing import Callable, Any

from deephaven.table import Table, PartitionedTable
from .section import SectionElement, PickerItem
from ..elements import BaseElement
from .._internal.utils import create_props
from ..types import ColumnName, Key, TooltipOptions

PickerElement = BaseElement


def picker(
    *children: PickerItem | SectionElement | Table | PartitionedTable,
    key_column: ColumnName | None = None,
    label_column: ColumnName | None = None,
    description_column: ColumnName | None = None,
    icon_column: ColumnName | None = None,
    title_column: ColumnName | None = None,
    default_selected_key: Key | None = None,
    selected_key: Key | None = None,
    on_selection_change: Callable[[Key], None] | None = None,
    on_change: Callable[[Key], None] | None = None,
    tooltip: bool | TooltipOptions | None = None,
    **props: Any,
) -> PickerElement:
    """
    A picker that can be used to select from a list. Children should be one of four types:
    If children are of type PickerItem, they are the dropdown options.
    If children are of type SectionElement, they are the dropdown sections.
    If children are of type Table, the values in the table are the dropdown options.
        There can only be one child, the Table.
    If children are of type PartitionedTable, the values in the table are the dropdown options
        and the partitions create multiple sections. There can only be one child, the PartitionedTable.

    Args:
        *children: The options to render within the picker.
        key_column:
            Only valid if children are of type Table or PartitionedTable.
            The column of values to use as item keys. Defaults to the first column.
        label_column:
            Only valid if children are of type Table or PartitionedTable.
            The column of values to display as primary text. Defaults to the key_column value.
        description_column:
            Only valid if children are of type Table or PartitionedTable.
            The column of values to display as descriptions.
        icon_column: Only valid if children are of type Table or PartitionedTable.
            The column of values to map to icons.
        title_column:
            Only valid if children is of type PartitionedTable.
            The column of values to display as section names.
            Should be the same for all values in the constituent Table.
            If not specified, the section titles will be created from the key_columns of the PartitionedTable.
        default_selected_key:
            The initial selected key in the collection (uncontrolled).
        selected_key:
            The currently selected key in the collection (controlled).
        on_selection_change:
            Handler that is called when the selection changes.
        on_change:
            Alias of `on_selection_change`. Handler that is called when the selection changes.
        tooltip:
            Whether to show a tooltip on hover.
            If `True`, the tooltip will show.
            If `TooltipOptions`, the tooltip will be created with the specified options.
        **props:
            Any other Picker prop, except items.

    Returns:
        The rendered Picker.
    """
    children, props = create_props(locals())

    return BaseElement("deephaven.ui.components.Picker", *children, **props)
