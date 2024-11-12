from __future__ import annotations

from typing import Any, Sequence, Callable

from .types import (
    FocusEventCallable,
    KeyboardEventCallable,
    LayoutFlex,
    DimensionValue,
    AlignSelf,
    JustifySelf,
    Position,
    AriaPressed,
    CSSProperties,
    LabelPosition,
    ValidationBehavior,
    NecessityIndicator,
    ValidationState,
    HourCycle,
    Alignment,
)

from ..elements import Element
from .._internal.utils import (
    create_props,
    convert_time_props,
)
from ..types import Time, TimeGranularity, UndefinedType, Undefined
from .basic import component_element
from .make_component import make_component

TimeFieldElement = Element

# All the props that can be time types
_SIMPLE_TIME_PROPS = {
    "placeholder_value",
    "value",
    "default_value",
    "min_value",
    "max_value",
}
_CALLABLE_TIME_PROPS = {"on_change"}

# The priority of the time props to determine the format of the time passed to the callable time props
_TIME_PROPS_PRIORITY = ["value", "default_value", "placeholder_value"]


def _convert_time_field_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert time field props to Java time types.

    Args:
        props: The props passed to the time field.

    Returns:
        The converted props.
    """

    convert_time_props(
        props,
        _SIMPLE_TIME_PROPS,
        _CALLABLE_TIME_PROPS,
        _TIME_PROPS_PRIORITY,
    )

    return props


@make_component
def time_field(
    placeholder_value: Time | UndefinedType = Undefined,
    value: Time | UndefinedType = Undefined,
    default_value: Time | UndefinedType = Undefined,
    min_value: Time | UndefinedType = Undefined,
    max_value: Time | UndefinedType = Undefined,
    granularity: TimeGranularity | UndefinedType = "SECOND",
    hour_cycle: HourCycle | UndefinedType = Undefined,
    hide_time_zone: bool = False,
    should_force_leading_zeros: bool | UndefinedType = Undefined,
    is_disabled: bool | UndefinedType = Undefined,
    is_read_only: bool | UndefinedType = Undefined,
    is_required: bool | UndefinedType = Undefined,
    validation_behavior: ValidationBehavior | UndefinedType = Undefined,
    auto_focus: bool | UndefinedType = Undefined,
    label: Element | UndefinedType = Undefined,
    description: Element | UndefinedType = Undefined,
    error_message: Element | UndefinedType = Undefined,
    name: str | UndefinedType = Undefined,
    is_quiet: bool | UndefinedType = Undefined,
    label_position: LabelPosition | UndefinedType = Undefined,
    label_align: Alignment | UndefinedType = Undefined,
    necessity_indicator: NecessityIndicator | UndefinedType = Undefined,
    contextual_help: Element | UndefinedType = Undefined,
    validation_state: ValidationState | UndefinedType = Undefined,
    on_focus: FocusEventCallable | UndefinedType = Undefined,
    on_blur: FocusEventCallable | UndefinedType = Undefined,
    on_focus_change: Callable[[bool], None] | UndefinedType = Undefined,
    on_key_down: KeyboardEventCallable | UndefinedType = Undefined,
    on_key_up: KeyboardEventCallable | UndefinedType = Undefined,
    on_open_change: Callable[[bool], None] | UndefinedType = Undefined,
    on_change: Callable[[Time], None] | UndefinedType = Undefined,
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
    aria_pressed: AriaPressed | UndefinedType = Undefined,
    aria_details: str | UndefinedType = Undefined,
    UNSAFE_class_name: str | UndefinedType = Undefined,
    UNSAFE_style: CSSProperties | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
) -> TimeFieldElement:
    """
    A time field allows the user to select a time.


    Args:
        placeholder_value: A placeholder time that influences the format of the
            placeholder shown when no value is selected. Defaults to 12:00 AM or
            00:00 depending on the hour cycle.
        value: The current value (controlled).
        default_value: The default value (uncontrolled).
        min_value: The minimum allowed time that a user may select.
        max_value: The maximum allowed time that a user may select.
        granularity: Determines the smallest unit that is displayed in the time field.
            By default, this is `"SECOND"`.
        hour_cycle: Whether to display the time in 12 or 24 hour format.
            By default, this is determined by the user's locale.
        hide_time_zone: Whether to hide the time zone abbreviation.
        should_force_leading_zeros: Whether to force leading zeros in the time field.
        is_disabled: Whether the input is disabled.
        is_read_only: Whether the input can be selected but not changed by the user.
        is_required: Whether user input is required on the input before form submission.
        validation_behavior: Whether to use native HTML form validation to prevent form
            submission when the value is missing or invalid,
            or mark the field as required or invalid via ARIA.
        auto_focus: Whether the element should receive focus on render.
        label: The content to display as the label.
        description: A description for the field.
            Provides a hint such as specific requirements for what to choose.
        error_message: An error message for the field.
        name: The name of the input element, used when submitting an HTML form.
        is_quiet: Whether the time field should be displayed with a quiet style.
        label_position: The label's overall position relative to the element it is labeling.
        label_align: The label's horizontal alignment relative to the element it is labeling.
        necessity_indicator: Whether the required state should be shown as an icon or text.
        contextual_help: A ContextualHelp element to place next to the label.
        validation_state: Whether the input should display its "valid" or "invalid" visual styling.
        on_focus: Function called when the button receives focus.
        on_blur: Function called when the button loses focus.
        on_focus_change: Function called when the focus state changes.
        on_key_down: Function called when a key is pressed.
        on_key_up: Function called when a key is released.
        on_open_change: Handler that is called when the overlay's open state changes.
        on_change: Handler that is called when the value changes.
            The exact `Time` type will be the same as the type passed to
            `value`, `default_value` or `placeholder_value`, in that order of precedence.
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
        aria_pressed: Whether the element is pressed.
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The time field element.
    """
    _, props = create_props(locals())

    _convert_time_field_props(props)

    return component_element("TimeField", **props)
