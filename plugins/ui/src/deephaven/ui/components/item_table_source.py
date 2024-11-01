from __future__ import annotations

from typing import Union, TypedDict, cast

from deephaven.table import Table, PartitionedTable

from .item import ItemElement
from .list_action_group import ListActionGroupElement
from .list_action_menu import ListActionMenuElement
from ..elements import Element
from ..types import ColumnName, Stringable, Undefined, UNDEFINED

ListViewItem = Union[Stringable, ItemElement]
ListViewElement = Element


class ItemTableSource(TypedDict):
    table: Table | PartitionedTable
    key_column: ColumnName | Undefined
    label_column: ColumnName | Undefined
    description_column: ColumnName | Undefined
    icon_column: ColumnName | Undefined
    title_column: ColumnName | Undefined
    actions: ListActionGroupElement | ListActionMenuElement | Undefined


def item_table_source(
    table: Table | PartitionedTable,
    key_column: ColumnName | Undefined = UNDEFINED,
    label_column: ColumnName | Undefined = UNDEFINED,
    description_column: ColumnName | Undefined = UNDEFINED,
    icon_column: ColumnName | Undefined = UNDEFINED,
    title_column: ColumnName | Undefined = UNDEFINED,
    actions: ListActionGroupElement | ListActionMenuElement | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> ItemTableSource:
    """
    An item table source wraps a Table or PartitionedTable to provide additional information for
    creating complex items from a table.
    A PartitionedTable is only supported if the component itself supports a PartitionedTable as a child.
    A PartitionedTable passed here will lead to the same behavior as passing
    the PartitionedTable directly to a component, such as creating sections from the partitions in the case of a Picker.

    Args:
        table:
            The table to use as the source of items.
        key_column:
            The column of values to use as item keys. Defaults to the first column.
        label_column:
            The column of values to display as primary text. Defaults to the key_column value.
        description_column:
            The column of values to display as descriptions.
        icon_column:
            The column of values to map to icons.
        title_column:
            Only valid if table is of type PartitionedTable.
            The column of values to display as section names.
            Should be the same for all values in the constituent Table.
            If not specified, the section titles will be created from the key_columns of the PartitionedTable.
        actions:
            The action group or menus to render for all elements within the component, if supported.
        key:
            A unique identifier used by React to render elements in a list.

    Returns:
        The item table source to pass as a child to a component that supports it.
    """

    return cast(ItemTableSource, locals())
