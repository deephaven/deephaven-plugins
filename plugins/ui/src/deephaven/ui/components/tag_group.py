from __future__ import annotations

from typing import Callable, List

from .basic import component_element
from .section import Item
from ..elements import Element, NodeType
from ..types import Key
from .types import (
    LabelPosition,
    Alignment,
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)


def tag_group(
    *children: Item,
    action_label: str | None = None,
    render_empty_state: Element | None = None,
    max_rows: int | None = None,
    error_message: NodeType = None,
    label: NodeType = None,
    description: NodeType = None,
    label_position: LabelPosition = "top",
    label_align: Alignment | None = "start",
    contextual_help: NodeType = None,
    is_invalid: bool | None = None,
    on_action: Callable[[None], None] | None = None,
    on_remove: Callable[[List[Key]], None] | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: float | None = None,
    flex_shrink: float | None = None,
    flex_basis: DimensionValue | None = None,
    align_self: AlignSelf | None = None,
    justify_self: JustifySelf | None = None,
    order: int | None = None,
    grid_area: str | None = None,
    grid_column: str | None = None,
    grid_row: str | None = None,
    grid_column_start: str | None = None,
    grid_column_end: str | None = None,
    grid_row_start: str | None = None,
    grid_row_end: str | None = None,
    margin: DimensionValue | None = None,
    margin_top: DimensionValue | None = None,
    margin_bottom: DimensionValue | None = None,
    margin_start: DimensionValue | None = None,
    margin_end: DimensionValue | None = None,
    margin_x: DimensionValue | None = None,
    margin_y: DimensionValue | None = None,
    width: DimensionValue | None = None,
    min_width: DimensionValue | None = None,
    max_width: DimensionValue | None = None,
    height: DimensionValue | None = None,
    min_height: DimensionValue | None = None,
    max_height: DimensionValue | None = None,
    position: Position | None = None,
    top: DimensionValue | None = None,
    bottom: DimensionValue | None = None,
    left: DimensionValue | None = None,
    right: DimensionValue | None = None,
    start: DimensionValue | None = None,
    end: DimensionValue | None = None,
    z_index: int | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
) -> Element:
    """
    A tag group displays a list of keywords to describe an item.

    Args:
        *children: The tags to render within the tag_group.
        action_label: The label for the action button. If provided, an action button will be displayed.
        render_empty_state: The element that will be rendered when there is no content to display.
        max_rows: The maximum amount of rows to show. If provided, will render a button that allows the user to expand the tag group.
        error_message: An error message for the field.
        label: The label for the tag group.
        description: A description for the tag group.
        label_position: The position of the label relative to the input.
        label_align: The alignment of the label relative to the input.
        contextual_help: A ContextualHelp element to place next to the label.
        is_invalid: Whether the tag group is in an invalid state.
        on_action: The handler that is called when action button is clicked.
        on_remove: The handler that is called when remove button is clicked. If provided, a remove button will be displayed on each tag.
        flex: When used in a flex layout, specifies how the element will grow or shrink to fit the space available.
        flex_grow: When used in a flex layout, specifies how much the element will grow to fit the space available.
        flex_shrink: When used in a flex layout, specifies how much the element will shrink to fit the space available.
        flex_basis: When used in a flex layout, specifies the initial size of the element.
        align_self: Overrides the align_items property of a flex or grid container.
        justify_self: Specifies how the element is justified inside a flex or grid container.
        order: The layout order for the element within a flex or grid container.
        grid_area: The name of the grid area to place the element in.
        grid_row: The name of the grid row to place the element in.
        grid_row_start: The name of the grid row to start the element in.
        grid_row_end: The name of the grid row to end the element in.
        grid_column: The name of the grid column to place the element in.
        grid_column_start: The name of the grid column to start the element in.
        grid_column_end: The name of the grid column to end the element in.
        margin: The margin to apply around the element.
        margin_top: The margin to apply above the element.
        margin_bottom: The margin to apply below the element.
        margin_start: The margin to apply before the element.
        margin_end: The margin to apply after the element.
        margin_x: The margin to apply to the left and right of the element.
        margin_y: The margin to apply to the top and bottom of the element.
        width: The width of the element.
        height: The height of the element.
        min_width: The minimum width of the element.
        min_height: The minimum height of the element.
        max_width: The maximum width of the element.
        max_height: The maximum height of the element.
        position: Specifies how the element is positioned.
        top: The distance from the top of the containing element.
        bottom: The distance from the bottom of the containing element.
        start: The distance from the start of the containing element.
        end: The distance from the end of the containing element.
        left: The distance from the left of the containing element.
        right: The distance from the right of the containing element.
        z_index: The stack order of the element.
        is_hidden: Whether the element is hidden.
        id: A unique identifier for the element.
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the element.
        aria_describedby: The id of the element that describes the element.
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.


    Returns:
        The rendered tag group element.
    """

    return component_element(
        "TagGroup",
        *children,
        action_label=action_label,
        render_empty_state=render_empty_state,
        max_rows=max_rows,
        error_message=error_message,
        label=label,
        description=description,
        label_position=label_position,
        label_align=label_align,
        contextual_help=contextual_help,
        is_invalid=is_invalid,
        on_action=on_action,
        on_remove=on_remove,
        flex=flex,
        flex_grow=flex_grow,
        flex_shrink=flex_shrink,
        flex_basis=flex_basis,
        align_self=align_self,
        justify_self=justify_self,
        order=order,
        grid_area=grid_area,
        grid_column=grid_column,
        grid_row=grid_row,
        grid_column_start=grid_column_start,
        grid_column_end=grid_column_end,
        grid_row_start=grid_row_start,
        grid_row_end=grid_row_end,
        margin=margin,
        margin_top=margin_top,
        margin_bottom=margin_bottom,
        margin_start=margin_start,
        margin_end=margin_end,
        margin_x=margin_x,
        margin_y=margin_y,
        width=width,
        min_width=min_width,
        max_width=max_width,
        height=height,
        min_height=min_height,
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
        aria_label=aria_label,
        aria_labelled_by=aria_labelledby,
        aria_described_by=aria_describedby,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
