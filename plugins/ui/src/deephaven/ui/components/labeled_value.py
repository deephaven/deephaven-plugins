from __future__ import annotations
from typing import Any, List

from .number_field import NumberFormatOptions
from .._internal.utils import (
    create_props,
    _convert_to_java_date,
    _convert_date_to_nanos,
)
from .types import (
    Alignment,
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    LabelPosition,
)
from ..types import Date, DateRange, NumberRange
from .basic import component_element
from ..elements import Element
from typing import TypedDict


DateFormatJavaString = str


class DateFormatOptions(TypedDict):
    date_format: DateFormatJavaString


def _convert_labeled_value_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    hasDateFormat = (
        "format_options" in props
        and isinstance(props["format_options"], dict)
        and "date_format" in props["format_options"]
    )
    hasRange = isinstance(props["value"], dict)
    props["is_date"] = False

    if isinstance(props["value"], (List)):
        return props
    if isinstance(props["value"], (int, float, str)) and not hasDateFormat:
        return props
    if hasRange:
        # TODO: implement date formatting for date range
        return props

    java_date = _convert_to_java_date(props["value"])  # type: ignore
    props["value"] = _convert_date_to_nanos(java_date)
    props["is_date"] = True
    return props


def labeled_value(
    value: str | List[str] | float | NumberRange | Date | DateRange | None = None,
    label: Element | None = None,
    format_options: NumberFormatOptions | DateFormatOptions | None = None,
    # TODO: add list formatting
    # format_options: NumberFormatOptions | DateFormatOptions | ListFormatOptions | None = None,
    timezone: str | None = None,
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
