from __future__ import annotations
from typing import Any, Callable
from .types import (
    # Events
    FocusEventCallable,
    # Layout
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    LabelPosition,
    Alignment,
    # Validation
    NecessityIndicator,
    Orientation,
    ValidationBehavior,
)
from .basic import component_element
from ..elements import Element
from ..types import Undefined, UNDEFINED
from .._internal.utils import create_props


def radio_group(
    *children: Any,
    is_emphasized: bool | Undefined = UNDEFINED,
    orientation: Orientation = "vertical",
    value: str | Undefined = UNDEFINED,
    default_value: str | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    is_read_only: bool | Undefined = UNDEFINED,
    name: str | Undefined = UNDEFINED,
    is_required: bool | Undefined = UNDEFINED,
    is_invalid: bool | Undefined = UNDEFINED,
    validation_behavior: ValidationBehavior | Undefined = UNDEFINED,
    # validate, # omitted because of synchronouse return
    label: Any | Undefined = UNDEFINED,
    description: Any | Undefined = UNDEFINED,
    error_message: Any | Undefined = UNDEFINED,
    label_position: LabelPosition = "top",
    label_align: Alignment | Undefined = UNDEFINED,
    necessity_indicator: NecessityIndicator | Undefined = UNDEFINED,
    contextual_help: Any | Undefined = UNDEFINED,
    show_error_icon: bool | Undefined = UNDEFINED,
    on_focus: FocusEventCallable | Undefined = UNDEFINED,
    on_blur: FocusEventCallable | Undefined = UNDEFINED,
    on_focus_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_change: Callable[[str], None] | Undefined = UNDEFINED,
    flex: LayoutFlex | Undefined = UNDEFINED,
    flex_grow: float | Undefined = UNDEFINED,
    flex_shrink: float | Undefined = UNDEFINED,
    flex_basis: DimensionValue | Undefined = UNDEFINED,
    align_self: AlignSelf | Undefined = UNDEFINED,
    justify_self: JustifySelf | Undefined = UNDEFINED,
    order: int | Undefined = UNDEFINED,
    grid_area: str | Undefined = UNDEFINED,
    grid_row: str | Undefined = UNDEFINED,
    grid_row_start: str | Undefined = UNDEFINED,
    grid_row_end: str | Undefined = UNDEFINED,
    grid_column: str | Undefined = UNDEFINED,
    grid_column_start: str | Undefined = UNDEFINED,
    grid_column_end: str | Undefined = UNDEFINED,
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
    start: DimensionValue | Undefined = UNDEFINED,
    end: DimensionValue | Undefined = UNDEFINED,
    left: DimensionValue | Undefined = UNDEFINED,
    right: DimensionValue | Undefined = UNDEFINED,
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
    key: str | Undefined = UNDEFINED,
) -> Element:
    """
    Radio buttons allow users to select a single option from a list of mutually
    exclusive options. All possible options are exposed up front for users to
    compare.

    Args:
        *children: The Radio(s) contained within the RadioGroup.
        is_emphasized: By default, radio button are not emphasized (gray). The emphasized version provides visual prominence.
        orientation: The axis the Radio Buttons should align with.
        value: The value of the selected radio button.
        default_value: The default value of the radio button.
        is_disabled: Whether the radio button is disabled.
        is_read_only: Whether the radio button can be selected but not changed by the user.
        name: The name of the radio button, used when submitting and HTML form.
        is_required: Whether the radio button is required on the input before form submission.
        is_invalid: Whether the radio button is in an invalid state.
        validation_behavior: Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA.
        label: The content to display as the label.
        description: A description for the field. Provides a hint such as specific requirements for what to choose.
        error_message: An error message for the field.
        label_position: The position of the label relative to the radio button.
        label_align: The horizontal alignment of the label relative to the radio button.
        necessity_indicator: Whether the required state should be shown as an icon or text.
        contextual_help: A ContextualHelp element to place next to the label.
        show_error_icon: Whether an error icon is rendered.
        on_change: Handler that is called when the radio button value changes.
        on_focus: Handler that is called when the radio button is focused.
        on_blur: Handler that is called when the radio button loses focus.
        on_focus_change: Handler that is called when the radio button gains or loses focus.
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
        aria_label: Defines a string value that labels the current element.
        aria_labelledby: Identifies the element (or elements) that labels the current element.
        aria_describedby: Identifies the element (or elements) that describes the object.
        aria_details: Identifies the element (or elements) that provide a detailed, extended description for the object.
        aria_errormessage: Identifies the element that provides an error message for the object.
        UNSAFE_class_name: Set the CSS className for the element. Only use as a last resort. Use style props instead.
        UNSAFE_style: Set the inline style for the element. Only use as a last resort. Use style props instead.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered radio group component.
    """

    children, props = create_props(locals())

    return component_element(f"RadioGroup", *children, **props)
