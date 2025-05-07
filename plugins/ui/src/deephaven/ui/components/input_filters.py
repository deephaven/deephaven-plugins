from __future__ import annotations
from typing import Any, Callable

from .types import FilterChangeEventCallable
from ..types import ColumnName
from .basic import component_element
from ..elements import Element
from .._internal.utils import create_props
from deephaven.table import Table


def input_filters(
    table: Table,
    on_change: FilterChangeEventCallable | None = None,
    on_filters: Callable[[list[str]], None] | None = None,
    column_names: list[ColumnName] | None = None,
    key: str | None = None,
) -> Element:
    """
    This will call on_input_filters_changes when the filters change on the client.

    Args:
        on_change: Called with list of all FilterChangeEvents when the input filters change.
        on_filters: Called with list of applicable filter strings when the input filters change.
        columns: The list of columns to filter on.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered button component.
    """

    # _, props = create_props(locals())
    children, props = create_props(locals())

    return component_element("InputFilters", *children, **props)
