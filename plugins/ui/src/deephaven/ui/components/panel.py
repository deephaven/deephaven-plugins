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
    CSSProperties,
)
from ..elements import Element
from ..types import Color, UndefinedType, Undefined


def panel(
    *children: Any,
    title: str | UndefinedType = Undefined,
    direction: Direction | UndefinedType = "column",
    wrap: Wrap | UndefinedType = Undefined,
    justify_content: JustifyContent | UndefinedType = Undefined,
    align_content: AlignContent | UndefinedType = Undefined,
    align_items: AlignItems | UndefinedType = "start",
    gap: DimensionValue | UndefinedType = "size-100",
    column_gap: DimensionValue | UndefinedType = Undefined,
    row_gap: DimensionValue | UndefinedType = Undefined,
    overflow: Overflow | UndefinedType = "auto",
    padding: DimensionValue | UndefinedType = "size-100",
    padding_top: DimensionValue | UndefinedType = Undefined,
    padding_bottom: DimensionValue | UndefinedType = Undefined,
    padding_start: DimensionValue | UndefinedType = Undefined,
    padding_end: DimensionValue | UndefinedType = Undefined,
    padding_x: DimensionValue | UndefinedType = Undefined,
    padding_y: DimensionValue | UndefinedType = Undefined,
    background_color: Color | UndefinedType = Undefined,
    UNSAFE_class_name: str | UndefinedType = Undefined,
    UNSAFE_style: CSSProperties | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
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
        overflow: Specifies what to do when the elment's content is too long to fit its size.
        padding: The padding to apply around the element.
        padding_top: The padding to apply above the element.
        padding_bottom: The padding to apply below the element.
        padding_start: The padding to apply before the element.
        padding_end: The padding to apply after the element.
        padding_x: The padding to apply to the left and right of the element.
        padding_y: The padding to apply to the top and bottom of the element.
        background_color: The background color of the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
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
