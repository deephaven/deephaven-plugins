from __future__ import annotations
from typing import Any, Callable
from .types import (
    # Accessibility
    AriaExpanded,
    AriaHasPopup,
    AriaPressed,
    # Events
    ButtonType,
    FocusEventCallable,
    KeyboardEventCallable,
    PressEventCallable,
    StaticColor,
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
from ..types import Undefined, UNDEFINED


def toggle_button(
    *children: Any,
    is_emphasized: bool | Undefined = UNDEFINED,
    is_selected: bool | Undefined = UNDEFINED,
    default_selected: bool | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    auto_focus: bool | Undefined = UNDEFINED,
    is_quiet: bool | Undefined = UNDEFINED,
    static_color: StaticColor | Undefined = UNDEFINED,
    type: ButtonType = "button",
    on_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_press: PressEventCallable | Undefined = UNDEFINED,
    on_press_start: PressEventCallable | Undefined = UNDEFINED,
    on_press_end: PressEventCallable | Undefined = UNDEFINED,
    on_press_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_press_up: PressEventCallable | Undefined = UNDEFINED,
    on_focus: FocusEventCallable | Undefined = UNDEFINED,
    on_blur: FocusEventCallable | Undefined = UNDEFINED,
    on_focus_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_key_down: KeyboardEventCallable | Undefined = UNDEFINED,
    on_key_up: KeyboardEventCallable | Undefined = UNDEFINED,
    flex: LayoutFlex | Undefined = UNDEFINED,
    flex_grow: float | Undefined = UNDEFINED,
    flex_shrink: float | Undefined = UNDEFINED,
    flex_basis: DimensionValue | Undefined = UNDEFINED,
    align_self: AlignSelf | Undefined = UNDEFINED,
    justify_self: JustifySelf | Undefined = UNDEFINED,
    order: int | Undefined = UNDEFINED,
    grid_area: str | Undefined = UNDEFINED,
    grid_column: str | Undefined = UNDEFINED,
    grid_row: str | Undefined = UNDEFINED,
    grid_column_start: str | Undefined = UNDEFINED,
    grid_column_end: str | Undefined = UNDEFINED,
    grid_row_start: str | Undefined = UNDEFINED,
    grid_row_end: str | Undefined = UNDEFINED,
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
    left: DimensionValue | Undefined = UNDEFINED,
    right: DimensionValue | Undefined = UNDEFINED,
    start: DimensionValue | Undefined = UNDEFINED,
    end: DimensionValue | Undefined = UNDEFINED,
    z_index: int | Undefined = UNDEFINED,
    is_hidden: bool | Undefined = UNDEFINED,
    id: str | Undefined = UNDEFINED,
    exclude_from_tab_order: bool | Undefined = UNDEFINED,
    aria_expanded: AriaExpanded | Undefined = UNDEFINED,
    aria_haspopup: AriaHasPopup | Undefined = UNDEFINED,
    aria_controls: str | Undefined = UNDEFINED,
    aria_label: str | Undefined = UNDEFINED,
    aria_labelledby: str | Undefined = UNDEFINED,
    aria_describedby: str | Undefined = UNDEFINED,
    aria_pressed: AriaPressed | Undefined = UNDEFINED,
    aria_details: str | Undefined = UNDEFINED,
    UNSAFE_class_name: str | Undefined = UNDEFINED,
    UNSAFE_style: CSSProperties | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> Element:
    """
    ToggleButtons allow users to toggle a selection on or off, for example switching between two states or modes.

    Args:
        *children: The children to render inside the button.
        is_emphasized: Whether the button should be displayed with an emphasized style.
        is_selected: Whether the button is selected.
        default_selected: Whether the button is selected by default.
        is_disabled: Whether the button is disabled.
        auto_focus: Whether the button should automatically get focus when the page loads.
        is_quiet: Whether the button should be quiet.
        static_color: The static color style to apply. Useful when the button appears over a color background.
        type: The type of button to render. (default: "button")
        on_change: Handler that is called when the element's selection state changes.
        on_press: Function called when the button is pressed.
        on_press_start: Function called when the button is pressed.
        on_press_end: Function called when a press interaction ends, either over the target or when the pointer leaves the target.
        on_press_up: Function called when the button is released.
        on_press_change: Function called when the press state changes.
        on_focus: Function called when the button receives focus.
        on_blur: Function called when the button loses focus.
        on_focus_change: Function called when the focus state changes.
        on_key_down: Function called when a key is pressed.
        on_key_up: Function called when a key is released.
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
        exclude_from_tab_order: Whether the element should be excluded from the tab order.
        aria_expanded: Whether the element is expanded.
        aria_haspopup: Whether the element has a popup.
        aria_controls: The id of the element that the element controls.
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the element.
        aria_describedby: The id of the element that describes the element.
        aria_pressed: Whether the element is pressed.
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered toggle button element.

    """

    return component_element(
        "ToggleButton",
        *children,
        is_emphasized=is_emphasized,
        is_selected=is_selected,
        default_selected=default_selected,
        is_disabled=is_disabled,
        auto_focus=auto_focus,
        is_quiet=is_quiet,
        static_color=static_color,
        type=type,
        on_change=on_change,
        on_press=on_press,
        on_press_start=on_press_start,
        on_press_end=on_press_end,
        on_press_change=on_press_change,
        on_press_up=on_press_up,
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
        grid_column=grid_column,
        grid_row=grid_row,
        grid_column_start=grid_column_start,
        grid_column_end=grid_column_end,
        grid_row_start=grid_row_start,
        grid_row_end=grid_row_end,
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
        left=left,
        right=right,
        start=start,
        end=end,
        z_index=z_index,
        is_hidden=is_hidden,
        id=id,
        exclude_from_tab_order=exclude_from_tab_order,
        aria_expanded=aria_expanded,
        aria_haspopup=aria_haspopup,
        aria_controls=aria_controls,
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_pressed=aria_pressed,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
