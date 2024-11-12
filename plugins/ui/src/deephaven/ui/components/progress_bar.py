from __future__ import annotations
from typing import Any, Callable
from .types import (
    AriaExpanded,
    AriaHasPopup,
    AriaPressed,
    StaticColor,
    LabelPosition,
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    ProgressBarSize,
)

from .basic import component_element
from ..elements import Element
from ..types import UndefinedType, Undefined

ProgressBarElement = Element


def progress_bar(
    size: ProgressBarSize = "L",
    static_color: StaticColor | UndefinedType = Undefined,
    label_position: LabelPosition = "top",
    show_value_label: bool | UndefinedType = Undefined,
    label: Element | UndefinedType = Undefined,
    # format_options, # omitted because need to connect it to Deephaven formatting options as well
    value_label: Element | UndefinedType = Undefined,
    value: float = 0,
    min_value: float = 0,
    max_value: float = 100,
    is_indeterminate: bool | UndefinedType = Undefined,
    flex: LayoutFlex | UndefinedType = Undefined,
    flex_grow: float | UndefinedType = Undefined,
    flex_shrink: float | UndefinedType = Undefined,
    flex_basis: DimensionValue | UndefinedType = Undefined,
    align_self: AlignSelf | UndefinedType = Undefined,
    justify_self: JustifySelf | UndefinedType = Undefined,
    order: int | UndefinedType = Undefined,
    grid_area: str | UndefinedType = Undefined,
    grid_row: str | UndefinedType = Undefined,
    grid_row_start: str | UndefinedType = Undefined,
    grid_row_end: str | UndefinedType = Undefined,
    grid_column: str | UndefinedType = Undefined,
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
    start: DimensionValue | UndefinedType = Undefined,
    end: DimensionValue | UndefinedType = Undefined,
    left: DimensionValue | UndefinedType = Undefined,
    right: DimensionValue | UndefinedType = Undefined,
    z_index: int | UndefinedType = Undefined,
    is_hidden: bool | UndefinedType = Undefined,
    id: str | UndefinedType = Undefined,
    exclude_from_tab_order: bool | UndefinedType = Undefined,
    aria_expanded: AriaExpanded | UndefinedType = Undefined,
    aria_haspopup: AriaHasPopup | UndefinedType = Undefined,
    aria_controls: str | UndefinedType = Undefined,
    aria_label: str | UndefinedType = Undefined,
    aria_labelledby: str | UndefinedType = Undefined,
    aria_describedby: str | UndefinedType = Undefined,
    aria_pressed: AriaPressed | UndefinedType = Undefined,
    aria_details: str | UndefinedType = Undefined,
    UNSAFE_class_name: str | UndefinedType = Undefined,
    UNSAFE_style: CSSProperties | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
) -> ProgressBarElement:
    """
    ProgressBars show the progression of a system operation: downloading, uploading, processing, etc., in a visual way. They can represent either determinate or indeterminate progress.

    Args:
        size: How thick the bar should be.
        static_color: The static color style to apply. Useful when the button appears over a color background.
        label_position: The label's overall position relative to the element it is labeling.
        show_value_label: Whether the value label should be displayed. True by default if the label is provided.
        label: The content to display as the label.
        value_label: The content to display as the value's label.
        value: The current value (controlled).
        min_value: The smallest value allowed for the input.
        max_value: The largest value allowed for the input.
        is_indeterminate: Indeterminism is presentational only. The indeterminate visual representation remains regardless of user interaction.
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
        exclude_from_tab_order: Whether the element should be excluded from the tab order.
        aria_expanded: Whether the element is expanded.
        aria_haspopup: Whether the element has a popup.
        aria_controls: The id of the element that the element controls.
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the element.
        aria_describedby: The id of the element that describes the element.
        aria_pressed: Whether the element is pressed.
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered ProgressBar element.
    """
    return component_element(
        "ProgressBar",
        size=size,
        static_color=static_color,
        label_position=label_position,
        show_value_label=show_value_label,
        label=label,
        value_label=value_label,
        value=value,
        min_value=min_value,
        max_value=max_value,
        is_indeterminate=is_indeterminate,
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
        start=start,
        end=end,
        left=left,
        right=right,
        z_index=z_index,
        is_hidden=is_hidden,
        id=id,
        exclude_from_tab_order=exclude_from_tab_order,
        aria_expanded=aria_expanded,
        aria_haspopup=aria_haspopup,
        aria_controls=aria_controls,
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_pressed=aria_pressed,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
