from __future__ import annotations
from typing import Any, Callable
from .accessibility import AriaExpanded, AriaHasPopup, AriaPressed
from .events import (
    ButtonType,
    FocusEventCallable,
    KeyboardEventCallable,
    PressEventCallable,
    StaticColor,
    Orientation,
)
from .layout import (
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Number,
    Position,
    LabelPosition,
)
from .basic import spectrum_element
from ...elements import Element


def slider(
    is_filled: bool | None = None,
    fill_offset: Number | None = None,
    track_gradient: list[str] | None = None,
    # format_options, # omitted because need to connect it to Deephaven formatting options as well
    label_position: LabelPosition = "top",
    show_value_label: bool | None = None,
    # get_value_label, # omitted because it needs to return a string synchronously
    contextual_help: Any | None = None,
    orientation: Orientation = "horizontal",
    is_disabled: bool | None = None,
    min_value: Number = 0,
    max_value: Number = 100,
    step: Number = 1,
    value: Number | None = None,
    default_value: Number | None = None,
    label: Any | None = None,
    name: str | None = None,
    on_change_end: Callable[[Number], None] | None = None,
    on_change: Callable[[Number], None] | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: Number | None = None,
    flex_shrink: Number | None = None,
    flex_basis: DimensionValue | None = None,
    align_self: AlignSelf | None = None,
    justify_self: JustifySelf | None = None,
    order: Number | None = None,
    grid_area: str | None = None,
    grid_row: str | None = None,
    grid_row_start: str | None = None,
    grid_row_end: str | None = None,
    grid_column: str | None = None,
    grid_column_start: str | None = None,
    grid_column_end: str | None = None,
    margin: DimensionValue | None = None,
    margin_top: DimensionValue | None = None,
    margin_bottom: DimensionValue | None = None,
    margin_start: DimensionValue | None = None,
    margin_end: DimensionValue | None = None,
    margin_x: DimensionValue | None = None,
    margin_y: DimensionValue | None = None,
    width: DimensionValue | None = None,
    height: DimensionValue | None = None,
    min_width: DimensionValue | None = None,
    min_height: DimensionValue | None = None,
    max_width: DimensionValue | None = None,
    max_height: DimensionValue | None = None,
    position: Position | None = None,
    top: DimensionValue | None = None,
    bottom: DimensionValue | None = None,
    start: DimensionValue | None = None,
    end: DimensionValue | None = None,
    left: DimensionValue | None = None,
    right: DimensionValue | None = None,
    z_index: Number | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
) -> Element:
    """
    Sliders allow users to quickly select a value within a range. They should be used when the upper and lower bounds to the range are invariable.

    Args:
        is_filled: Whether the slider should be filled between the start of the slider and the current value.
        fill_offset: The offset of the filled area from the start of the slider.
        track_gradient: The background of the track, specified as the stops for a CSS background: linear-gradient(to right/left, ...trackGradient).
        label_position: The position of the label relative to the slider.
        show_value_label: Whether the value label should be displayed. True by default if the label is provided.
        contextual_help: A ContextualHelp element to place next to the label.
        orientation: The orientation of the slider.
        is_disabled: Whether the slider is disabled.
        min_value: The minimum value of the slider.
        max_value: The maximum value of the slider.
        step: The step value for the slider.
        value: The current value of the slider.
        default_value: The default value of the slider.
        label: The content to display as the label.
        name: The name of the input element, used when submitting an HTML form.
        on_change_end: Function called when the slider stops moving
        on_change: Function called when the input value changes
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
        min_width: The minimum width of the element.
        max_width: The maximum width of the element.
        height: The height of the element.
        min_height: The minimum height of the element.
        max_height: The maximum height of the element.
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
        aria_label: The label for the element.
        aria_labelled_by: The id of the element that labels the current element.
        aria_described_by: The id of the element that describes the current element.
        aria_details: The id of the element that provides additional information about the current element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
    """
    return spectrum_element(
        "Slider",
        is_filled=is_filled,
        fill_offset=fill_offset,
        track_gradient=track_gradient,
        # format_options=format_options,
        label_position=label_position,
        show_value_label=show_value_label,
        # get_value_label=get_value_label,
        contextual_help=contextual_help,
        orientation=orientation,
        is_disabled=is_disabled,
        min_value=min_value,
        max_value=max_value,
        step=step,
        value=value,
        default_value=default_value,
        label=label,
        name=name,
        on_change_end=on_change_end,
        on_change=on_change,
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
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
    )
