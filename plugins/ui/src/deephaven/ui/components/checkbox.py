from __future__ import annotations
from typing import Any, Callable

from .types import (
    # Events
    FocusEventCallable,
    KeyboardEventCallable,
    # Layout
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)
from .basic import component_element
from ..elements import Element


def checkbox(
    *children: Any,
    is_emphasized: bool | None = None,
    is_indeterminate: bool | None = None,
    default_selected: bool | None = None,
    is_selected: bool | None = None,
    value: str | None = None,
    is_disabled: bool | None = None,
    is_read_only: bool | None = None,
    is_required: bool | None = None,
    is_invalid: bool | None = None,
    # validation_behaviour, # omitted because validate is not implemented
    # validate, # omitted because it needs to return a ValidationError synchronously
    auto_focus: bool | None = None,
    name: str | None = None,
    on_change: Callable[[bool], None] | None = None,
    on_focus: FocusEventCallable | None = None,
    on_blur: FocusEventCallable | None = None,
    on_focus_change: Callable[[bool], None] | None = None,
    on_key_down: KeyboardEventCallable | None = None,
    on_key_up: KeyboardEventCallable | None = None,
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
    exclude_from_tab_order: bool | None = None,
    aria_controls: str | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    aria_errormessage: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
) -> Element:
    """
    Checkboxes allow users to select multiple items from a list of individual items, or to mark one individual item as selected.

    Args:
        *children: The checkbox label.
        is_emphasized: This prop sets the emphasized style which provides visual prominence.
        is_indeterminate: Indeterminism is presentational only. The indeterminate visual representation remains regardless of user interaction.
        default_selected: Whether the element should be selected (uncontrolled).
        is_selected: Whether the element should be selected (controlled).
        value: The value of the input element, used when submitting a form.
        is_disabled: Whether the element is disabled.
        is_read_only: Whether the element is read-only.
        is_required: Whether the element is required before form submission.
        is_invalid: Whether the element is invalid.
        auto_focus: Whether the element should automatically get focus on render.
        name: The name of the input element, used when submitting a form.
        on_change: Handler that is called when the element is selected or deselected.
        on_focus: Handler that is called when the element receives focus.
        on_blur: Handler that is called when the element loses focus.
        on_focus_change: Handler that is called when the element receives or loses focus.
        on_key_down: Handler that is called when a key is pressed down.
        on_key_up: Handler that is called when a key is released.
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
        exclude_from_tab_order: Whether the element should be excluded from the tab order. If true, the element will not be focusable via the keyboard by tabbing.
        aria_controls: The id of the element that the current element controls.
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the current element.
        aria_describedby: The id of the element that describes the current element.
        aria_details: The id of the element that provides additional information about the current element.
        aria_errormessage: The id of the element that provides error information for the current element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered checkbox.
    """

    return component_element(
        "Checkbox",
        children=children,
        is_emphasized=is_emphasized,
        is_indeterminate=is_indeterminate,
        default_selected=default_selected,
        is_selected=is_selected,
        value=value,
        is_disabled=is_disabled,
        is_read_only=is_read_only,
        is_required=is_required,
        is_invalid=is_invalid,
        # validation_behaviour = validation_behaviour,
        # validate = validate,
        auto_focus=auto_focus,
        name=name,
        on_change=on_change,
        on_focus=on_focus,
        on_blur=on_blur,
        on_focus_change=on_focus_change,
        on_key_down=on_key_down,
        on_key_up=on_key_up,
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
        exclude_from_tab_order=exclude_from_tab_order,
        aria_controls=aria_controls,
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        aria_errormessage=aria_errormessage,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
