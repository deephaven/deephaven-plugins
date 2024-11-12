from __future__ import annotations
from typing import Any
from .types import (
    # Events
    Orientation,
    # Layout
    AlignSelf,
    ButtonGroupAlignment,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)
from .basic import component_element
from ..elements import Element
from ..types import UndefinedType, Undefined


def button_group(
    *children: Any,
    is_disabled: bool | UndefinedType = Undefined,
    orientation: Orientation = "horizontal",
    align: ButtonGroupAlignment = "start",
    flex: LayoutFlex | UndefinedType = Undefined,
    flex_grow: float | UndefinedType = Undefined,
    flex_shrink: float | UndefinedType = Undefined,
    flex_basis: DimensionValue | UndefinedType = Undefined,
    align_self: AlignSelf | UndefinedType = Undefined,
    justify_self: JustifySelf | UndefinedType = Undefined,
    order: int | UndefinedType = Undefined,
    grid_area: str | UndefinedType = Undefined,
    grid_row: str | UndefinedType = Undefined,
    grid_column: str | UndefinedType = Undefined,
    grid_row_start: str | UndefinedType = Undefined,
    grid_row_end: str | UndefinedType = Undefined,
    grid_column_start: str | UndefinedType = Undefined,
    grid_column_end: str | UndefinedType = Undefined,
    margin: DimensionValue | UndefinedType = Undefined,
    margin_top: DimensionValue | UndefinedType = Undefined,
    margin_bottom: DimensionValue | UndefinedType = Undefined,
    margin_start: DimensionValue | UndefinedType = Undefined,
    margin_end: DimensionValue | UndefinedType = Undefined,
    margin_x: DimensionValue | UndefinedType = Undefined,
    margin_y: DimensionValue | UndefinedType = Undefined,
    width: DimensionValue | UndefinedType = Undefined,
    height: DimensionValue | UndefinedType = Undefined,
    min_width: DimensionValue | UndefinedType = Undefined,
    min_height: DimensionValue | UndefinedType = Undefined,
    max_width: DimensionValue | UndefinedType = Undefined,
    max_height: DimensionValue | UndefinedType = Undefined,
    position: Position | UndefinedType = Undefined,
    top: DimensionValue | UndefinedType = Undefined,
    bottom: DimensionValue | UndefinedType = Undefined,
    left: DimensionValue | UndefinedType = Undefined,
    right: DimensionValue | UndefinedType = Undefined,
    start: DimensionValue | UndefinedType = Undefined,
    end: DimensionValue | UndefinedType = Undefined,
    z_index: int | UndefinedType = Undefined,
    is_hidden: bool | UndefinedType = Undefined,
    id: str | UndefinedType = Undefined,
    UNSAFE_class_name: str | UndefinedType = Undefined,
    UNSAFE_style: CSSProperties | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
) -> Element:
    """
    A button group is a grouping of button whose actions are related to each other.

    Args:
        *children: The children of the button group.
        is_disabled: Whether the button group is disabled.
        orientation: The axis the ButtonGroup should align with. Setting this to 'vertical' will prevent any switching behaviours between 'vertical' and horizontal'.
        align: The alignment of the buttons within the ButtonGroup.
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
        margin: The margin for all four sides of the element.
        margin_top: The margin for the top side of the element.
        margin_bottom: The margin for the bottom side of the element.
        margin_start: The margin for the logical start side of the element, depending on layout direction.
        margin_end: The margin for the logical end side of the element, depending on layout direction.
        margin_x: The margin for the left and right sides of the element.
        margin_y: The margin for the top and bottom sides of the element.
        width: The width of the element.
        height: The height of the element.
        min_width: The minimum width of the element.
        min_height: The minimum height of the element.
        max_width: The maximum width of the element.
        max_height: The maximum height of the element.
        position: Specifies how the element is position.
        top: The top position of the element.
        bottom: The bottom position of the element.
        left: The left position of the element.
        right: The right position of the element.
        start: The logical start position of the element, depending on layout direction.
        end: The logical end position of the element, depending on layout direction.
        z_index: The stacking order for the element
        is_hidden: Hides the element.
        id: The unique identifier of the element.
        UNSAFE_class_name: Set the CSS className for the element. Only use as a last resort. Use style props instead.
        UNSAFE_style: Set the inline style for the element. Only use as a last resort. Use style props instead.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered button group element.

    """
    return component_element(
        "ButtonGroup",
        *children,
        is_disabled=is_disabled,
        orientation=orientation,
        align=align,
        flex=flex,
        flex_grow=flex_grow,
        flex_shrink=flex_shrink,
        flex_basis=flex_basis,
        align_self=align_self,
        justify_self=justify_self,
        order=order,
        grid_area=grid_area,
        grid_row=grid_row,
        grid_column=grid_column,
        grid_row_start=grid_row_start,
        grid_row_end=grid_row_end,
        grid_column_start=grid_column_start,
        grid_column_end=grid_column_end,
        margin=margin,
        margin_top=margin_top,
        margin_bottom=margin_bottom,
        margin_start=margin_start,
        margin_end=margin_end,
        margin_x=margin_x,
        margin_y=margin_y,
        width=width,
        height=height,
        min_width=min_width,
        min_height=min_height,
        max_width=max_width,
        max_height=max_height,
        position=position,
        top=top,
        bottom=bottom,
        left=left,
        right=right,
        start=start,
        end=end,
        z_index=z_index,
        is_hidden=is_hidden,
        id=id,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
