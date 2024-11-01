from __future__ import annotations

from typing import Any
from .basic import component_element
from .._internal.utils import create_props
from .types import (
    Direction,
    Wrap,
    JustifyContent,
    AlignContent,
    AlignItems,
    DimensionValue,
    Overflow,
)
from ..elements import Element
from ..types import Undefined, UNDEFINED


def panel(
    *children: Any,
    title: str | Undefined = UNDEFINED,
    direction: Direction | Undefined = "column",
    wrap: Wrap | Undefined = UNDEFINED,
    justify_content: JustifyContent | Undefined = UNDEFINED,
    align_content: AlignContent | Undefined = UNDEFINED,
    align_items: AlignItems | Undefined = "start",
    gap: DimensionValue | Undefined = "size-100",
    column_gap: DimensionValue | Undefined = UNDEFINED,
    row_gap: DimensionValue | Undefined = UNDEFINED,
    overflow: Overflow | Undefined = "auto",
    padding: DimensionValue | Undefined = "size-100",
    padding_top: DimensionValue | Undefined = UNDEFINED,
    padding_bottom: DimensionValue | Undefined = UNDEFINED,
    padding_start: DimensionValue | Undefined = UNDEFINED,
    padding_end: DimensionValue | Undefined = UNDEFINED,
    padding_x: DimensionValue | Undefined = UNDEFINED,
    padding_y: DimensionValue | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
    **props: Any,
) -> Element:
    """
    A panel is a container that can be used to group elements.

    Args:
        *children: Elements to render in the panel.
        title: Title of the panel.
        direction: The direction in which to layout children.
        wrap: Whether children should wrap when they exceed the panel's width.
        justify_content: The distribution of space around items along the main axis.
        align_content: The distribution of space between and around items along the cross axis.
        align_items: The alignment of children within their container.
        gap: The space to display between both rows and columns of children.
        column_gap: The space to display between columns of children.
        row_gap: The space to display between rows of children.
        padding: The padding to apply around the element.
        padding_top: The padding to apply above the element.
        padding_bottom: The padding to apply below the element.
        padding_start: The padding to apply before the element.
        padding_end: The padding to apply after the element.
        padding_x: The padding to apply to the left and right of the element.
        padding_y: The padding to apply to the top and bottom of the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered panel element.
    """

    children, props = create_props(locals())
    return component_element(
        "Panel",
        *children,
        **props,
    )
