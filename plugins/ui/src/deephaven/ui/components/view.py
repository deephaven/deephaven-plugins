from __future__ import annotations
from typing import Any
from .types import (
    ElementTypes,
    AlignSelf,
    BorderRadius,
    BorderSize,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)
from .basic import component_element
from ..elements import Element
from ..types import Color


def view(
    *children: Any,
    element_type: ElementTypes | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: float | None = None,
    flex_shrink: float | None = None,
    flex_basis: DimensionValue | None = None,
    align_self: AlignSelf | None = None,
    justify_self: JustifySelf | None = None,
    order: int | None = None,
    grid_area: str | None = None,
    grid_row: str | None = None,
    grid_row_start: str | None = None,
    grid_row_end: str | None = None,
    grid_column: str | None = None,
    grid_column_start: str | None = None,
    grid_column_end: str | None = None,
    overflow: str | None = None,
    margin: DimensionValue | None = None,
    margin_top: DimensionValue | None = None,
    margin_bottom: DimensionValue | None = None,
    margin_start: DimensionValue | None = None,
    margin_end: DimensionValue | None = None,
    margin_x: DimensionValue | None = None,
    margin_y: DimensionValue | None = None,
    padding: DimensionValue | None = None,
    padding_top: DimensionValue | None = None,
    padding_bottom: DimensionValue | None = None,
    padding_start: DimensionValue | None = None,
    padding_end: DimensionValue | None = None,
    padding_x: DimensionValue | None = None,
    padding_y: DimensionValue | None = None,
    width: DimensionValue | None = None,
    height: DimensionValue | None = None,
    min_width: DimensionValue | None = None,
    min_height: DimensionValue | None = None,
    max_width: DimensionValue | None = None,
    max_height: DimensionValue | None = None,
    background_color: Color | None = None,
    border_width: BorderSize | None = None,
    border_start_width: BorderSize | None = None,
    border_end_width: BorderSize | None = None,
    border_top_width: BorderSize | None = None,
    border_bottom_width: BorderSize | None = None,
    border_x_width: BorderSize | None = None,
    border_y_width: BorderSize | None = None,
    border_color: Color | None = None,
    border_start_color: Color | None = None,
    border_end_color: Color | None = None,
    border_top_color: Color | None = None,
    border_bottom_color: Color | None = None,
    border_x_color: Color | None = None,
    border_y_color: Color | None = None,
    border_radius: BorderRadius | None = None,
    border_top_start_radius: BorderRadius | None = None,
    border_top_end_radius: BorderRadius | None = None,
    border_bottom_start_radius: BorderRadius | None = None,
    border_bottom_end_radius: BorderRadius | None = None,
    position: Position | None = None,
    top: DimensionValue | None = None,
    bottom: DimensionValue | None = None,
    start: DimensionValue | None = None,
    end: DimensionValue | None = None,
    left: DimensionValue | None = None,
    right: DimensionValue | None = None,
    z_index: int | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
) -> Element:
    """
    View is a general purpose container with no specific semantics that can be used for custom styling purposes. It supports Spectrum style props to ensure consistency with other Spectrum components.

    Args:
        *children: The content to render within the container.
        element_type: The type of element to render.
        flex: When used in a flex layout, specifies how the element will grow or shrink to fit the space available.
        flex_grow: When used in a flex layout, specifies how the element will grow to fit the space available.
        flex_shrink: When used in a flex layout, specifies how the element will shrink to fit the space available.
        flex_basis: When used in a flex layout, specifies the initial main size of the element.
        align_self: Overrides the alignItems property of a flex or grid container.
        justify_self: Species how the element is justified inside a flex or grid container.
        order: The layout order for the element within a flex or grid container.
        grid_area: When used in a grid layout specifies, specifies the named grid area that the element should be placed in within the grid.
        grid_row: When used in a grid layout, specifies the row the element should be placed in within the grid.
        grid_column: When used in a grid layout, specifies the column the element should be placed in within the grid.
        grid_row_start: When used in a grid layout, specifies the starting row to span within the grid.
        grid_row_end: When used in a grid layout, specifies the ending row to span within the grid.
        grid_column_start: When used in a grid layout, specifies the starting column to span within the grid.
        grid_column_end: When used in a grid layout, specifies the ending column to span within the grid.
        overflow: Specifies what to do when the elment's content is too long to fit its size.
        margin: The margin for all four sides of the element.
        margin_top: The margin for the top side of the element.
        margin_bottom: The margin for the bottom side of the element.
        margin_start: The margin for the logical start side of the element, depending on layout direction.
        margin_end: The margin for the logical end side of the element, depending on layout direction.
        margin_x: The margin for the left and right sides of the element.
        margin_y: The margin for the top and bottom sides of the element.
        padding: The padding for all four sides of the element.
        padding_top: The padding for the top side of the element.
        padding_bottom: The padding for the bottom side of the element.
        padding_start: The padding for the logical start side of the element, depending on layout direction.
        padding_end: The padding for the logical end side of the element, depending on layout direction.
        padding_x: The padding for the left and right sides of the element.
        padding_y: The padding for the top and bottom sides of the element.
        width: The width of the element.
        min_width: The minimum width of the element.
        max_width: The maximum width of the element.
        height: The height of the element.
        min_height: The minimum height of the element.
        max_height: The maximum height of the element.
        background_color: The background color of the element.
        border_width: The width of the border for all four sides of the element.
        border_start_width: The width of the border for the start side of the element, depending on layout direction.
        border_end_width: The width of the border for the end side of the element, depending on layout direction.
        border_top_width: The width of the border for the top side of the element.
        border_bottom_width: The width of the border for the bottom side of the element.
        border_x_width: The width of the border for the left and right sides of the element.
        border_y_width: The width of the border for the top and bottom sides of the element.

        border_color: The color of the border for all four sides of the element.
        border_start_color: The color of the border for the start side of the element, depending on layout direction.
        border_end_color: The color of the border for the end side of the element, depending on layout direction.
        border_top_color: The color of the border for the top side of the element.
        border_bottom_color: The color of the border for the bottom side of the element.
        border_x_color: The color of the border for the left and right sides of the element.
        border_y_color: The color of the border for the top and bottom sides of the element.

        border_radius: The radius of the border for all four corners of the element.
        border_top_start_radius: The radius of the border for the top start corner of the element.
        border_top_end_radius: The radius of the border for the top end corner of the element.
        border_bottom_start_radius: The radius of the border for the bottom start corner of the element.
        border_bottom_end_radius: The radius of the border for the bottom end corner of the element.
        position: The position of the element.
        top: The distance from the top of the containing element.
        bottom: The distance from the bottom of the containing element.
        left: The distance from the left of the containing element.
        right: The distance from the right of the containing element.
        start: The distance from the start of the containing element, depending on layout direction.
        end: The distance from the end of the containing element, depending on layout direction.
        z_index: The stack order of the element.
        is_hidden: Whether the element is hidden.
        id: The unique identifier of the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered view.
    """

    return component_element(
        "View",
        children=children,
        element_type=element_type,
        flex=flex,
        flex_grow=flex_grow,
        flex_shrink=flex_shrink,
        flex_basis=flex_basis,
        align_self=align_self,
        justify_self=justify_self,
        order=order,
        grid_area=grid_area,
        grid_row=grid_row,
        grid_row_start=grid_row_start,
        grid_row_end=grid_row_end,
        grid_column=grid_column,
        grid_column_start=grid_column_start,
        grid_column_end=grid_column_end,
        overflow=overflow,
        margin=margin,
        margin_top=margin_top,
        margin_bottom=margin_bottom,
        margin_start=margin_start,
        margin_end=margin_end,
        margin_x=margin_x,
        margin_y=margin_y,
        padding=padding,
        padding_top=padding_top,
        padding_bottom=padding_bottom,
        padding_start=padding_start,
        padding_end=padding_end,
        padding_x=padding_x,
        padding_y=padding_y,
        width=width,
        height=height,
        min_width=min_width,
        min_height=min_height,
        max_width=max_width,
        max_height=max_height,
        background_color=background_color,
        border_width=border_width,
        border_start_width=border_start_width,
        border_end_width=border_end_width,
        border_top_width=border_top_width,
        border_bottom_width=border_bottom_width,
        border_x_width=border_x_width,
        border_y_width=border_y_width,
        border_color=border_color,
        border_start_color=border_start_color,
        border_end_color=border_end_color,
        border_top_color=border_top_color,
        border_bottom_color=border_bottom_color,
        border_x_color=border_x_color,
        border_y_color=border_y_color,
        border_radius=border_radius,
        border_top_start_radius=border_top_start_radius,
        border_top_end_radius=border_top_end_radius,
        border_bottom_start_radius=border_bottom_start_radius,
        border_bottom_end_radius=border_bottom_end_radius,
        position=position,
        top=top,
        bottom=bottom,
        start=start,
        end=end,
        left=left,
        right=right,
        z_index=z_index,
        is_hidden=is_hidden,
        id=id,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
