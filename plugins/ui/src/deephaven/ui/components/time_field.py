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
from ..types import Time, TimeGranularity
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
    placeholder_value: Time | None = None,
    value: Time | None = None,
    default_value: Time | None = None,
    min_value: Time | None = None,
    max_value: Time | None = None,
    granularity: TimeGranularity | None = "SECOND",
    hour_cycle: HourCycle | None = None,
    hide_time_zone: bool = False,
    should_force_leading_zeros: bool | None = None,
    is_disabled: bool | None = None,
    is_read_only: bool | None = None,
    is_required: bool | None = None,
    validation_behavior: ValidationBehavior | None = None,
    auto_focus: bool | None = None,
    label: Element | None = None,
    description: Element | None = None,
    error_message: Element | None = None,
    name: str | None = None,
    is_quiet: bool | None = None,
    label_position: LabelPosition | None = None,
    label_align: Alignment | None = None,
    necessity_indicator: NecessityIndicator | None = None,
    contextual_help: Element | None = None,
    validation_state: ValidationState | None = None,
    on_focus: FocusEventCallable | None = None,
    on_blur: FocusEventCallable | None = None,
    on_focus_change: Callable[[bool], None] | None = None,
    on_key_down: KeyboardEventCallable | None = None,
    on_key_up: KeyboardEventCallable | None = None,
    on_open_change: Callable[[bool], None] | None = None,
    on_change: Callable[[Time], None] | None = None,
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
    z_index: int | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_pressed: AriaPressed | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
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
