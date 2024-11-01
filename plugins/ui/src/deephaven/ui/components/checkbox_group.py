from __future__ import annotations
from typing import Any, Callable


from .types import (
    Orientation,
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    ValidationBehavior,
    FocusEventCallable,
)
from .basic import component_element
from ..elements import Element
from ..types import Key, Selection, Undefined, UNDEFINED


def checkbox_group(
    *children: Any,
    orientation: Orientation = "vertical",
    is_emphasized: bool | Undefined = UNDEFINED,
    value: Selection | Undefined = UNDEFINED,
    default_value: Selection | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    is_read_only: bool | Undefined = UNDEFINED,
    name: str | Undefined = UNDEFINED,
    label: Any | Undefined = UNDEFINED,
    description: Any | Undefined = UNDEFINED,
    error_message: Any | Undefined = UNDEFINED,
    is_required: bool | Undefined = UNDEFINED,
    is_invalid: bool | Undefined = UNDEFINED,
    validation_behavior: ValidationBehavior | Undefined = "aria",
    label_position: str | Undefined = UNDEFINED,
    label_align: str | Undefined = UNDEFINED,
    necessity_indicator: str | Undefined = UNDEFINED,
    contextual_help: Any | Undefined = UNDEFINED,
    show_error_icon: bool | Undefined = UNDEFINED,
    on_change: Callable[[Key], None] | Undefined = UNDEFINED,
    on_focus: FocusEventCallable | Undefined = UNDEFINED,
    on_blur: FocusEventCallable | Undefined = UNDEFINED,
    on_focus_change: Callable[[bool], None] | Undefined = UNDEFINED,
    flex: LayoutFlex | Undefined = UNDEFINED,
    flex_grow: float | Undefined = UNDEFINED,
    flex_shrink: float | Undefined = UNDEFINED,
    flex_basis: DimensionValue | Undefined = UNDEFINED,
    align_self: AlignSelf | Undefined = UNDEFINED,
    justify_self: JustifySelf | Undefined = UNDEFINED,
    order: int | Undefined = UNDEFINED,
    grid_area: str | Undefined = UNDEFINED,
    grid_row: str | Undefined = UNDEFINED,
    grid_column: str | Undefined = UNDEFINED,
    grid_column_start: str | Undefined = UNDEFINED,
    grid_column_end: str | Undefined = UNDEFINED,
    grid_row_start: str | Undefined = UNDEFINED,
    grid_row_end: str | Undefined = UNDEFINED,
    margin: DimensionValue | Undefined = UNDEFINED,
    margin_top: DimensionValue | Undefined = UNDEFINED,
    margin_bottom: DimensionValue | Undefined = UNDEFINED,
    margin_start: DimensionValue | Undefined = UNDEFINED,
    margin_end: DimensionValue | Undefined = UNDEFINED,
    margin_x: DimensionValue | Undefined = UNDEFINED,
    margin_y: DimensionValue | Undefined = UNDEFINED,
    width: DimensionValue | Undefined = UNDEFINED,
    height: DimensionValue | Undefined = UNDEFINED,
    min_width: DimensionValue | Undefined = UNDEFINED,
    min_height: DimensionValue | Undefined = UNDEFINED,
    max_width: DimensionValue | Undefined = UNDEFINED,
    max_height: DimensionValue | Undefined = UNDEFINED,
    position: Position | Undefined = UNDEFINED,
    top: DimensionValue | Undefined = UNDEFINED,
    bottom: DimensionValue | Undefined = UNDEFINED,
    left: DimensionValue | Undefined = UNDEFINED,
    right: DimensionValue | Undefined = UNDEFINED,
    start: DimensionValue | Undefined = UNDEFINED,
    end: DimensionValue | Undefined = UNDEFINED,
    z_index: int | Undefined = UNDEFINED,
    is_hidden: bool | Undefined = UNDEFINED,
    id: str | Undefined = UNDEFINED,
    aria_label: str | Undefined = UNDEFINED,
    aria_labelledby: str | Undefined = UNDEFINED,
    aria_describedby: str | Undefined = UNDEFINED,
    aria_details: str | Undefined = UNDEFINED,
    aria_errormessage: str | Undefined = UNDEFINED,
    UNSAFE_class_name: str | Undefined = UNDEFINED,
    UNSAFE_style: CSSProperties | Undefined = UNDEFINED,
) -> Element:
    """
    A grouping of checkbox's that are related to each other.

    Args:

        *children: The children of the checkbox group.
        orientation: The axis the CheckboxGroup should align with.
        is_emphasized: Whether the checkbox's should be displayed with emphasized style.
        value: The selected checkbox within the checkbox group (controlled).
        default_value: The default selected checkbox within the checkbox group (uncontrolled).
        is_disabled: Whether the checkbox group is disabled.
        is_read_only: Whether the checkbox group is read only.
        name: The name of the input element, used when submitting an HTML form.
        label: The label of the checkbox group.
        description: A description for the checkbox group. Provides a hint such as specific requirements for what to choose.
        error_message: An error message to be displayed when the checkbox group is an errored state.
        is_required: Whether user input is required on the input before form submission.
        is_invalid: Whether the checkbox group is in an invalid state.
        validation_behavior: Whether to use native HTML form validation to prevent form
            submission when the value is missing or invalid,
            or mark the field as required or invalid via ARIA.
        label_position: The label's overall position relative to the element it is labeling.
        label_align: The label's horizontal alignment relative to the element it is labeling.
        necessity_indicator: Whether the required state should be shown as an icon or text.
        contextual_help: A ContextualHelp element to place next to the label.
        show_error_icon: Whether an error icon is rendered.
        on_change: Handler that is called when the selection changes.
        on_focus: Handler that is called when the element receives focus.
        on_blur: Handler that is called when the element loses focus.
        on_focus_change: Handler that is called when the element's focus status changes.
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
        aria_label: Defines a string value that labels the current element.
        aria_labelledby: Identifies the element (or elements) that labels the current element.
        aria_describedby: Identifies the element (or elements) that describes the object.
        aria_details: Identifies the element (or elements) that provide a detailed, extended description for the object.
        aria_errormessage: Identifies the element that provides an error message for the object.
        UNSAFE_class_name: Set the CSS className for the element. Only use as a last resort. Use style props instead.
        UNSAFE_style: Set the inline style for the element. Only use as a last resort. Use style props instead.

    Returns:
        The rendered checkbox group element.

    """
    return component_element(
        "CheckboxGroup",
        children=children,
        orientation=orientation,
        is_emphasized=is_emphasized,
        value=value,
        default_value=default_value,
        is_disabled=is_disabled,
        is_read_only=is_read_only,
        name=name,
        label=label,
        description=description,
        error_message=error_message,
        is_required=is_required,
        is_invalid=is_invalid,
        validation_behavior=validation_behavior,
        label_position=label_position,
        label_align=label_align,
        necessity_indicator=necessity_indicator,
        contextual_help=contextual_help,
        show_error_icon=show_error_icon,
        on_change=on_change,
        on_focus=on_focus,
        on_blur=on_blur,
        on_focus_change=on_focus_change,
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
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        aria_errormessage=aria_errormessage,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
    )
