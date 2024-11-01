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
    PageBehavior,
    HourCycle,
    Alignment,
)

from ..hooks import use_memo
from ..elements import Element
from .._internal.utils import (
    create_props,
    convert_date_props,
    convert_list_prop,
)
from ..types import Date, Granularity, DateRange, Undefined, UNDEFINED
from .basic import component_element
from .make_component import make_component
from deephaven.time import dh_now

DatePickerElement = Element

# All the props that can be date types
_SIMPLE_DATE_PROPS = {
    "placeholder_value",
    "min_value",
    "max_value",
}
_RANGE_DATE_PROPS = {"value", "default_value"}
_LIST_DATE_PROPS = {"unavailable_values"}
_CALLABLE_DATE_PROPS = {"on_change"}
_GRANULARITY_KEY = "granularity"

# The priority of the date props to determine the format of the date passed to the callable date props
_DATE_PROPS_PRIORITY = ["value", "default_value", "placeholder_value"]


def _convert_date_range_picker_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert date range picker props to Java date types.

    Args:
        props: The props passed to the date range picker.

    Returns:
        The converted props.
    """

    convert_date_props(
        props,
        _SIMPLE_DATE_PROPS,
        _RANGE_DATE_PROPS,
        _CALLABLE_DATE_PROPS,
        _DATE_PROPS_PRIORITY,
        _GRANULARITY_KEY,
    )

    return props


@make_component
def date_range_picker(
    placeholder_value: Date | Undefined = dh_now(),
    value: DateRange | Undefined = UNDEFINED,
    default_value: DateRange | Undefined = UNDEFINED,
    min_value: Date | Undefined = UNDEFINED,
    max_value: Date | Undefined = UNDEFINED,
    # TODO (issue # 698) we need to implement unavailable_values
    # unavailable_values: Sequence[Date] | Undefined = UNDEFINED,
    granularity: Granularity | Undefined = UNDEFINED,
    page_behavior: PageBehavior | Undefined = UNDEFINED,
    hour_cycle: HourCycle | Undefined = UNDEFINED,
    hide_time_zone: bool = False,
    should_force_leading_zeros: bool | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    is_read_only: bool | Undefined = UNDEFINED,
    is_required: bool | Undefined = UNDEFINED,
    validation_behavior: ValidationBehavior | Undefined = UNDEFINED,
    auto_focus: bool | Undefined = UNDEFINED,
    label: Element | Undefined = UNDEFINED,
    description: Element | Undefined = UNDEFINED,
    error_message: Element | Undefined = UNDEFINED,
    is_open: bool | Undefined = UNDEFINED,
    default_open: bool | Undefined = UNDEFINED,
    allows_non_contiguous_ranges: bool | Undefined = UNDEFINED,
    start_name: str | Undefined = UNDEFINED,
    end_name: str | Undefined = UNDEFINED,
    max_visible_months: int | Undefined = UNDEFINED,
    should_flip: bool | Undefined = UNDEFINED,
    is_quiet: bool | Undefined = UNDEFINED,
    show_format_help_text: bool | Undefined = UNDEFINED,
    label_position: LabelPosition | Undefined = UNDEFINED,
    label_align: Alignment | Undefined = UNDEFINED,
    necessity_indicator: NecessityIndicator | Undefined = UNDEFINED,
    contextual_help: Element | Undefined = UNDEFINED,
    validation_state: ValidationState | Undefined = UNDEFINED,
    on_focus: FocusEventCallable | Undefined = UNDEFINED,
    on_blur: FocusEventCallable | Undefined = UNDEFINED,
    on_focus_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_key_down: KeyboardEventCallable | Undefined = UNDEFINED,
    on_key_up: KeyboardEventCallable | Undefined = UNDEFINED,
    on_open_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_change: Callable[[DateRange], None] | Undefined = UNDEFINED,
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
    aria_pressed: AriaPressed | Undefined = UNDEFINED,
    aria_details: str | Undefined = UNDEFINED,
    UNSAFE_class_name: str | Undefined = UNDEFINED,
    UNSAFE_style: CSSProperties | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> DatePickerElement:
    """
    A date range picker allows the user to select a range of dates.


    Args:
        placeholder_value: A placeholder date that influences the format of the
            placeholder shown when no value is selected.
            Defaults to today at midnight in the user's timezone.
        value: The current value (controlled).
        default_value: The default value (uncontrolled).
        min_value: The minimum allowed date that a user may select.
        max_value: The maximum allowed date that a user may select.
        granularity: Determines the smallest unit that is displayed in the date picker.
            By default, this is `"DAY"` for `LocalDate`, and `"SECOND"` otherwise.
        page_behavior: Controls the behavior of paging. Pagination either works by
            advancing the visible page by visibleDuration (default)
            or one unit of visibleDuration.
        hour_cycle: Whether to display the time in 12 or 24 hour format.
            By default, this is determined by the user's locale.
        hide_time_zone: Whether to hide the time zone abbreviation.
        should_force_leading_zeros: Whether to always show leading zeros in the
            month, day, and hour fields.
            By default, this is determined by the user's locale.
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
        is_open: Whether the overlay is open by default (controlled).
        default_open: Whether the overlay is open by default (uncontrolled).
        allows_non_contiguous_ranges: When combined with unavailable_values, determines
            whether non-contiguous ranges, i.e. ranges containing unavailable dates, may be selected.
        start_name: The name of the start date input element, used when submitting an HTML form.
        end_name: The name of the end date input element, used when submitting an HTML form.
        max_visible_months: The maximum number of months to display at
            once in the calendar popover, if screen space permits.
        should_flip: Whether the calendar popover should automatically flip direction
            when space is limited.
        is_quiet: Whether the date picker should be displayed with a quiet style.
        show_format_help_text: Whether to show the localized date format as help
            text below the field.
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
            The exact `Date` type will be the same as the type passed to
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
        The date range picker element.
    """
    _, props = create_props(locals())

    _convert_date_range_picker_props(props)

    return component_element("DateRangePicker", **props)
