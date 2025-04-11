from __future__ import annotations
from typing import Any, Callable
from .types import FilterChangeEvent
from .basic import component_element
from ..elements import Element
from .._internal.utils import create_props


def input_filters(
    on_change: FilterChangeEvent | None = None,
    # on_change: Callable[[str], None] | None = None,
    key: str | None = None,
) -> Element:
    """
    This will call on_input_filters_changes when the filters change on the client.
    We'll have a utility function to apply filters to a table. // TODO

    Args:
        on_input_filters_changes: A callback function that is called when the input filters change.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered button component.
    """

    # _, props = create_props(locals())
    children, props = create_props(locals())

    return component_element("InputFilters", *children, **props)
