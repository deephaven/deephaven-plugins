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
from ..types import Date, LocalDateConvertible, Undefined, UndefinedType
from .basic import component_element
from .make_component import make_component

CalendarElement = Element

# All the props that can be date types
_SIMPLE_DATE_PROPS = {
    "value",
    "default_value",
    "focused_value",
    "default_focused_value",
    "min_value",
    "max_value",
}
_RANGE_DATE_PROPS = set()
_CALLABLE_DATE_PROPS = {"on_change"}
_ON_FOCUS_CHANGE_KEY = "on_focus_change"

# The priority of the date props to determine the format of the date passed to the callable date props
_DATE_PROPS_PRIORITY = [
    "value",
    "default_value",
    "focused_value",
    "default_focused_value",
]

_NULLABLE_PROPS = ["value", "default_value"]


def _convert_calendar_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert calendar props to Java date types.

    Args:
        props: The props passed to the calendar.

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
def calendar(
    value: Date | None | UndefinedType = Undefined,
    default_value: Date | None | UndefinedType = Undefined,
    focused_value: Date | None = None,
    default_focused_value: Date | None = None,
    min_value: Date | None = None,
    max_value: Date | None = None,
    page_behavior: PageBehavior | None = None,
    is_invalid: bool | None = None,
    is_disabled: bool | None = None,
    is_read_only: bool | None = None,
    auto_focus: bool | None = None,
    error_message: Element | None = None,
    visible_months: int | None = None,
    on_focus_change: Callable[[LocalDateConvertible], None] | None = None,
    on_change: Callable[[Date], None] | None = None,
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
) -> CalendarElement:
    """
    A calendar allows the user to select a date.


    Args:
        value: The current value (controlled).
        default_value: The default value (uncontrolled).
        focused_value: Controls the currently focused date within the calendar.
        default_focused_value: The date that is focused when the calendar first mounts (uncountrolled).
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
        The calendar element.
    """
    _, props = create_props(locals())

    _convert_calendar_props(props)

    return component_element("Calendar", _nullable_props=_NULLABLE_PROPS, **props)
