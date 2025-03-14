from __future__ import annotations
from typing import Any, List

from .._internal.utils import (
    create_props,
    convert_to_java_date,
    convert_date_for_labeled_value,
)
from .types import (
    Alignment,
    AlignSelf,
    CSSProperties,
    NumberFormatOptions,
    ListFormatOptions,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    LabelPosition,
)
from ..types import Date, DateFormatOptions, DateRange, NumberRange, JavaDate
from .basic import component_element
from ..elements import Element
from typing import Tuple


def _get_serialized_date_props(
    value_prop: Any, timezone_prop: str | None, has_date_format: bool
) -> Tuple[int | str | None, str | None]:
    """
    Checks if the value prop should be parsed as a date, and parses it into a
    serialized date value and also a timezone value if present in the value_prop.

    Args:
        value_prop: The value property.
        timezone_prop: The timezone property.
        has_date_format: Whether a date format has been defined on labeled_value.

    Returns:
        The serialized int or str date value, and a timezone identifier as a str if present in input.
        (None, None) if the inputs do not represent a valid date value.

    """
    if isinstance(value_prop, (List, float)) or (
        isinstance(value_prop, (int, str)) and not has_date_format
    ):
        # not a date value, don't convert props
        return (None, None)

    date = (
        value_prop
        if isinstance(value_prop, JavaDate)
        else convert_to_java_date(value_prop)
    )
    date = convert_date_for_labeled_value(date)

    timezone = None
    if isinstance(date, Tuple):
        date_value, timezone = date
    else:
        date_value = date

    timezone_value = (
        timezone
        if timezone_prop is None
        and timezone is not None
        and timezone != "Z"
        and timezone != "UTC"
        else timezone_prop
    )
    return (date_value, timezone_value)


def _convert_labeled_value_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    if "format_options" not in props or props["format_options"] is None:
        props["format_options"] = {}
    else:
        props["format_options"] = props["format_options"].copy()

    has_date_format = (
        isinstance(props["format_options"], dict)
        and "date_format" in props["format_options"]
    )
    # allows JS component to distinguish between dates passed as a string and other values
    props["is_date"] = False
    # allows JS component to distinguish between nanoseconds strings and other date strings
    # nanoseconds need to be passed as a string to prevent loss of precision
    props["is_nanoseconds"] = False

    if isinstance(props["value"], dict):
        # range value
        start_date_value, start_tz = _get_serialized_date_props(
            props["value"]["start"],
            props["format_options"].get("timezone"),
            has_date_format,
        )
        end_date_value, end_tz = _get_serialized_date_props(
            props["value"]["end"],
            props["format_options"].get("timezone"),
            has_date_format,
        )

        if start_date_value and end_date_value:
            props["value"] = {
                "start": str(start_date_value),
                "end": str(end_date_value),
                # start and end can both be either a nanoseconds or date string
                "isStartNanoseconds": isinstance(start_date_value, int),
                "isEndNanoseconds": isinstance(end_date_value, int),
            }
            props["is_date"] = True
            if start_tz or end_tz:
                props["format_options"]["timezone"] = start_tz if start_tz else end_tz
        return props

    # single value
    date_value, tz = _get_serialized_date_props(
        props["value"], props["format_options"].get("timezone"), has_date_format
    )
    if date_value:
        props["value"] = str(date_value)
        props["is_date"] = True
        if isinstance(date_value, int):
            props["is_nanoseconds"] = True
        if tz:
            props["format_options"]["timezone"] = tz

    return props


def labeled_value(
    value: str | List[str] | float | NumberRange | Date | DateRange | None = None,
    label: Element | None = None,
    format_options: NumberFormatOptions
    | DateFormatOptions
    | ListFormatOptions
    | None = None,
    label_position: LabelPosition | None = "top",
    label_align: Alignment | None = None,
    contextual_help: Any | None = None,
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
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
) -> Element:
    """
    Labeled values displays non-editable values with a corresponding label

    Args:
        value: The value to be displayed.
        label: The content of the label.
        format_options: Formatting options for the value displayed in the number field.
        label_position: The label's overall position relative to the element it is labeling.
        label_align: The label's horizontal alignment relative to the element it is labeling.
        contextual_help: A contextual help element to place next to the label.
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
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.

    Returns:
        The rendered labeled value element.
    """

    _, props = create_props(locals())
    props = _convert_labeled_value_props(props)

    return component_element("LabeledValue", **props)
