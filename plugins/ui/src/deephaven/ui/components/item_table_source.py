from __future__ import annotations

from typing import Union, TypedDict, cast

from deephaven.table import Table, PartitionedTable

from .item import ItemElement
from .list_action_group import ListActionGroupElement
from .list_action_menu import ListActionMenuElement
from ..elements import Element
from ..types import ColumnName, Stringable

ListViewItem = Union[Stringable, ItemElement]
ListViewElement = Element


class ItemTableSource(TypedDict):
    table: Table | PartitionedTable
    key_column: ColumnName | None
    label_column: ColumnName | None
    description_column: ColumnName | None
    icon_column: ColumnName | None
    title_column: ColumnName | None
    actions: ListActionGroupElement | ListActionMenuElement | None


def item_table_source(
    table: Table | PartitionedTable,
    key_column: ColumnName | None = None,
    label_column: ColumnName | None = None,
    description_column: ColumnName | None = None,
    icon_column: ColumnName | None = None,
    title_column: ColumnName | None = None,
    actions: ListActionGroupElement | ListActionMenuElement | None = None,
    key: str | None = None,
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
