from __future__ import annotations
from typing import Any
from .basic import spectrum_element
from .layout import (
    LayoutFlex,
    Direction,
    Wrap,
    JustifyContent,
    AlignContent,
    AlignItems,
    DimensionValue,
)


def flex(
    *children: Any,
    flex: LayoutFlex | None = "auto",
    direction: Direction | None = None,
    wrap: Wrap | None = None,
    justify_content: JustifyContent | None = None,
    align_content: AlignContent | None = None,
    align_items: AlignItems | None = None,
    gap: DimensionValue | None = "size-100",
    column_gap: DimensionValue | None = None,
    row_gap: DimensionValue | None = None,
    **props: Any,
):
    """
    Base Flex component for laying out children in a flexbox.

    Args:
        children: Elements to render in the flexbox.
        flex: The flex property of the flexbox.
        direction: The direction in which to layout children.
        wrap: Whether children should wrap when they exceed the panel's width.
        justify_content: The distribution of space around items along the main axis.
        align_content: The distribution of space between and around items along the cross axis.
        align_items: The alignment of children within their container.
        gap: The space to display between both rows and columns of children.
        column_gap: The space to display between columns of children.
        row_gap: The space to display between rows of children.
    """
    return spectrum_element(
        "Flex",
        *children,
        flex=flex,
        direction=direction,
        wrap=wrap,
        justify_content=justify_content,
        align_content=align_content,
        align_items=align_items,
        gap=gap,
        column_gap=column_gap,
        row_gap=row_gap,
        **props,
    )
