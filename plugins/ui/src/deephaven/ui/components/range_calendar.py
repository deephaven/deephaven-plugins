from __future__ import annotations

from typing import Any, Callable

from .types import (
    LayoutFlex,
    DimensionValue,
    AlignSelf,
    JustifySelf,
    Position,
    AriaPressed,
    CSSProperties,
    PageBehavior,
)

from ..elements import Element
from .._internal.utils import create_props, convert_date_props, wrap_local_date_callable
from ..types import Date, LocalDateConvertible, DateRange, Undefined, UNDEFINED
from .basic import component_element
from .make_component import make_component
from deephaven.time import dh_now

RangeCalendarElement = Element

# All the props that can be date types
_SIMPLE_DATE_PROPS = {
    "focused_value",
    "default_focused_value",
    "min_value",
    "max_value",
}
_RANGE_DATE_PROPS = {"value", "default_value"}
_CALLABLE_DATE_PROPS = {"on_change"}
_ON_FOCUS_CHANGE_KEY = "on_focus_change"

# The priority of the date props to determine the format of the date passed to the callable date props
_DATE_PROPS_PRIORITY = [
    "value",
    "default_value",
    "focused_value",
    "default_focused_value",
]


def _convert_range_calendar_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert range_calendar props to Java date types.

    Args:
        props: The props passed to the range_calendar.

    Returns:
        The converted props.
    """

    convert_date_props(
        props,
        _SIMPLE_DATE_PROPS,
        _RANGE_DATE_PROPS,
        _CALLABLE_DATE_PROPS,
        _DATE_PROPS_PRIORITY,
    )

    if props.get(_ON_FOCUS_CHANGE_KEY) is not None:
        props[_ON_FOCUS_CHANGE_KEY] = wrap_local_date_callable(
            props[_ON_FOCUS_CHANGE_KEY]
        )

    return props


@make_component
def range_calendar(
    value: DateRange | Undefined = UNDEFINED,
    default_value: DateRange | Undefined = UNDEFINED,
    focused_value: Date | Undefined = UNDEFINED,
    default_focused_value: Date | Undefined = UNDEFINED,
    min_value: Date | Undefined = UNDEFINED,
    max_value: Date | Undefined = UNDEFINED,
    page_behavior: PageBehavior | Undefined = UNDEFINED,
    is_invalid: bool | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    is_read_only: bool | Undefined = UNDEFINED,
    auto_focus: bool | Undefined = UNDEFINED,
    error_message: Element | Undefined = UNDEFINED,
    visible_months: int | Undefined = UNDEFINED,
    on_focus_change: Callable[[LocalDateConvertible], None] | Undefined = UNDEFINED,
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
) -> RangeCalendarElement:
    """
    A range_calendar allows the user to select a range of dates.


    Args:
        value: The current value (controlled).
        default_value: The default value (uncontrolled).
        focused_value: Controls the currently focused date within the range_calendar.
        default_focused_value: The date that is focused when the range_calendar first mounts (uncountrolled).
        min_value: The minimum allowed date that a user may select.
        max_value: The maximum allowed date that a user may select.
        page_behavior: Controls the behavior of paging. Pagination either works by
            advancing the visible page by visibleDuration (default)
            or one unit of visibleDuration.
        is_invalid: Whether the current selection is invalid according to application logic.
        is_disabled: Whether the input is disabled.
        is_read_only: Whether the input can be selected but not changed by the user.
        auto_focus: Whether the element should receive focus on render.
        error_message: An error message for the field.
        visible_months: The number of months to display at once. Up to 3 months are supported.
        on_focus_change: Function called when the focus state changes.
        on_change: Handler that is called when the value changes.
            The exact `Date` type will be the same as the type passed to
            `value`, `default_value`, `focused_value`, or `default_focused_value` in that order of precedence.
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
        The range_calendar element.
    """
    _, props = create_props(locals())

    _convert_range_calendar_props(props)

    return component_element("RangeCalendar", **props)
