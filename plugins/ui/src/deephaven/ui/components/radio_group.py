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
from ..types import UndefinedType, Undefined
from .._internal.utils import create_props


def radio_group(
    *children: Any,
    is_emphasized: bool | UndefinedType = Undefined,
    orientation: Orientation = "vertical",
    value: str | UndefinedType = Undefined,
    default_value: str | UndefinedType = Undefined,
    is_disabled: bool | UndefinedType = Undefined,
    is_read_only: bool | UndefinedType = Undefined,
    name: str | UndefinedType = Undefined,
    is_required: bool | UndefinedType = Undefined,
    is_invalid: bool | UndefinedType = Undefined,
    validation_behavior: ValidationBehavior | UndefinedType = Undefined,
    # validate, # omitted because of synchronouse return
    label: Any | UndefinedType = Undefined,
    description: Any | UndefinedType = Undefined,
    error_message: Any | UndefinedType = Undefined,
    label_position: LabelPosition = "top",
    label_align: Alignment | UndefinedType = Undefined,
    necessity_indicator: NecessityIndicator | UndefinedType = Undefined,
    contextual_help: Any | UndefinedType = Undefined,
    show_error_icon: bool | UndefinedType = Undefined,
    on_focus: FocusEventCallable | UndefinedType = Undefined,
    on_blur: FocusEventCallable | UndefinedType = Undefined,
    on_focus_change: Callable[[bool], None] | UndefinedType = Undefined,
    on_change: Callable[[str], None] | UndefinedType = Undefined,
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
    aria_label: str | UndefinedType = Undefined,
    aria_labelledby: str | UndefinedType = Undefined,
    aria_describedby: str | UndefinedType = Undefined,
    aria_details: str | UndefinedType = Undefined,
    aria_errormessage: str | UndefinedType = Undefined,
    UNSAFE_class_name: str | UndefinedType = Undefined,
    UNSAFE_style: CSSProperties | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
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
