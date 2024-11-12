from __future__ import annotations
from typing import Any, Callable, Dict, List, Union
from .types import (
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    ValidationState,
    ValidationBehavior,
    EncodingType,
    HTTPMethods,
    Target,
    AutoCompleteModes,
    AutoCapitalizeModes,
    LabelPosition,
    Alignment,
    NecessityIndicator,
)
from .basic import component_element
from ..elements import Element
from ..types import UndefinedType, Undefined


def form(
    *children: Any,
    is_quiet: bool | UndefinedType = Undefined,
    is_emphasized: bool | UndefinedType = Undefined,
    is_disabled: bool | UndefinedType = Undefined,
    is_required: bool | UndefinedType = Undefined,
    is_read_only: bool | UndefinedType = Undefined,
    validation_state: ValidationState | UndefinedType = Undefined,
    validation_behavior: ValidationBehavior | UndefinedType = "aria",
    validation_errors: Dict[str, str | List[str]] | UndefinedType = Undefined,
    action: str | UndefinedType = Undefined,
    enc_type: EncodingType | UndefinedType = Undefined,
    method: HTTPMethods | UndefinedType = Undefined,
    target: Target | UndefinedType = Undefined,
    auto_complete: AutoCompleteModes | UndefinedType = Undefined,
    auto_capitalize: AutoCapitalizeModes | UndefinedType = Undefined,
    label_position: LabelPosition = "top",
    label_align: Alignment | UndefinedType = Undefined,
    necessity_indicator: NecessityIndicator | UndefinedType = Undefined,
    on_submit: Callable[[dict[str, str]], None] | UndefinedType = Undefined,
    on_reset: Callable[[dict[str, str]], None] | UndefinedType = Undefined,
    on_invalid: Callable[[dict[str, str]], None] | UndefinedType = Undefined,
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
    overflow: str | UndefinedType = Undefined,
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
    UNSAFE_class_name: str | UndefinedType = Undefined,
    UNSAFE_style: CSSProperties | UndefinedType = Undefined,
    key: str | UndefinedType = Undefined,
) -> Element:
    """
    Forms allow users to enter data that can be submitted while providing alignment and styling for form fields

    Args:
        *children: The content to render within the container.
        is_quiet: Whether the form should be quiet.
        is_emphasized: Whether the form should be emphasized.
        is_disabled: Whether the form should be disabled.
        is_required: Whether the form should be required.
        is_read_only: Whether the form should be read only.
        validation_state: Whether the Form elements should display their "valid" or "invalid" visual styling.
        validation_behavior: Whether to use native HTML form validation to prevent form submission when a field value is missing or invalid, or mark fields as required or invalid via ARIA.
        validation_errors: The validation errors for the form.
        action: The URL to submit the form data to.
        enc_type: The enctype attribute specifies how the form-data should be encoded when submitting it to the server.
        method: The HTTP method of the form.
        target: The target attribute specifies a name or a keyword that indicates where to display the response that is received after submitting the form.
        auto_complete: Indicates whether input elements can by default have their values automatically completed by the browser.
        auto_capitalize: Controls whether inputted text is automatically capitalized and, if so, in what manner.
        label_position: The label's overall position relative to the element it is labeling.
        label_align: The label's horizontal alignment relative to the element it is labeling.
        necessity_indicator: Whether the required state should be shown as an icon or text.
        on_submit: The function to call when the form is submitted.
        on_reset: The function to call when the form is reset.
        on_invalid: The function to call when the form is invalid.
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
        overflow: Specifies what to do when the elment's content is too long to fit its size.
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
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the element.
        aria_describedby: The id of the element that describes the element.
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered form element.
    """
    return component_element(
        "Form",
        children=children,
        is_quiet=is_quiet,
        is_emphasized=is_emphasized,
        is_disabled=is_disabled,
        is_required=is_required,
        is_read_only=is_read_only,
        validation_state=validation_state,
        validation_behavior=validation_behavior,
        validation_errors=validation_errors,
        action=action,
        enc_type=enc_type,
        method=method,
        target=target,
        auto_complete=auto_complete,
        auto_capitalize=auto_capitalize,
        label_position=label_position,
        label_align=label_align,
        necessity_indicator=necessity_indicator,
        on_submit=on_submit,
        on_reset=on_reset,
        on_invalid=on_invalid,
        flex=flex,
        flex_grow=flex_grow,
        flex_shrink=flex_shrink,
        flex_basis=flex_basis,
        align_self=align_self,
        justify_self=justify_self,
        order=order,
        grid_area=grid_area,
        grid_row=grid_row,
        grid_row_start=grid_row_start,
        grid_row_end=grid_row_end,
        grid_column=grid_column,
        grid_column_start=grid_column_start,
        grid_column_end=grid_column_end,
        overflow=overflow,
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
        start=start,
        end=end,
        left=left,
        right=right,
        z_index=z_index,
        is_hidden=is_hidden,
        id=id,
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
