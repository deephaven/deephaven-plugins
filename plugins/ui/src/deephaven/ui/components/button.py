from __future__ import annotations
from typing import Any, Callable
from .types import (
    # Accessibility
    AriaExpanded,
    AriaHasPopup,
    AriaPressed,
    # Events
    ButtonType,
    ButtonVariant,
    ButtonStyle,
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


def button(
    *children: Any,
    variant: ButtonVariant | None = "accent",
    style: ButtonStyle | None = "fill",
    static_color: StaticColor | None = None,
    is_pending: bool | None = None,
    type: ButtonType = "button",
    is_disabled: bool | None = None,
    auto_focus: bool | None = None,
    href: str | None = None,
    target: str | None = None,
    rel: str | None = None,
    on_press: PressEventCallable | None = None,
    on_press_start: PressEventCallable | None = None,
    on_press_end: PressEventCallable | None = None,
    on_press_up: PressEventCallable | None = None,
    on_press_change: Callable[[bool], None] | None = None,
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
    grid_column: str | None = None,
    grid_row: str | None = None,
    grid_column_start: str | None = None,
    grid_column_end: str | None = None,
    grid_row_start: str | None = None,
    grid_row_end: str | None = None,
    margin: DimensionValue | None = None,
    margin_top: DimensionValue | None = None,
    margin_bottom: DimensionValue | None = None,
    margin_start: DimensionValue | None = None,
    margin_end: DimensionValue | None = None,
    margin_x: DimensionValue | None = None,
    margin_y: DimensionValue | None = None,
    width: DimensionValue | None = None,
    min_width: DimensionValue | None = None,
    max_width: DimensionValue | None = None,
    height: DimensionValue | None = None,
    min_height: DimensionValue | None = None,
    max_height: DimensionValue | None = None,
    position: Position | None = None,
    top: DimensionValue | None = None,
    bottom: DimensionValue | None = None,
    left: DimensionValue | None = None,
    right: DimensionValue | None = None,
    start: DimensionValue | None = None,
    end: DimensionValue | None = None,
    z_index: int | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    exclude_from_tab_order: bool | None = None,
    aria_expanded: AriaExpanded | None = None,
    aria_has_popup: AriaHasPopup | None = None,
    aria_controls: str | None = None,
    aria_pressed: AriaPressed | None = None,
    aria_label: str | None = None,
    aria_labelled_by: str | None = None,
    aria_described_by: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
) -> Element:
    """
    Buttons allow users to perform an action or to navigate to another page. They have multiple styles for various needs, and are ideal for calling attention to where a user needs to do something in order to move forward in a flow.
    Python implementation for the Adobe React Spectrum Button component: https://react-spectrum.adobe.com/react-spectrum/Button.html

    Args:
        *children: The contents to display inside the button.
        variant: The visual style of the button.
        style: The background style of the button.
        static_color: The static color style to apply. Useful when the button appears over a color background.
        is_pending: Whether to disable events immediately and display a loading spinner after a 1 second delay.
        type: The behavior of the button when used in an HTML form.
        is_disabled: Whether the button is disabled.
        auto_focus: Whether the button should automatically receive focus when the page loads.
        href: A URL to link to when the button is pressed.
        target: The target window or tab to open the linked URL in.
        rel: The relationship between the current document and the linked URL.
        on_press: Function called when the button is pressed.
        on_press_start: Function called when the button is pressed and held.
        on_press_end: Function called when the button is released after being pressed.
        on_press_up: Function called when the button is released.
        on_press_change: Function called when the pressed state changes.
        on_focus: Function called when the button receives focus.
        on_blur: Function called when the button loses focus.
        on_focus_change: Function called when the focus state changes.
        on_key_down: Function called when a key is pressed down.
        on_key_up: Function called when a key is released.
        flex: When used in a flex layout, specifies how the element will grow or shrink to fit the space available.
        flex_grow: When used in a flex layout, specifies how much the element will grow to fit the space available.
        flex_shrink: When used in a flex layout, specifies how much the element will shrink to fit the space available.
        flex_basis: When used in a flex layout, specifies the initial size of the element.
        align_self: Overrides the alignItems property of a flex or grid container.
        justify_self: Specifies how the element is justified inside a flex or grid container.
        order: The layout for the element within a flex or grid container.
        grid_area: The name of grid area to place the element in.
        grid_column: The name of grid column to place the element in.
        grid_row: The name of grid row to place the element in.
        grid_column_start: The name of grid column to start the element in.
        grid_column_end: The name of grid column to end the element in.
        grid_row_start: The name of grid row to start the element in.
        grid_row_end: The name of grid row to end the element in.
        margin: The margin around the element.
        margin_top: The margin above the element.
        margin_bottom: The margin below the element.
        margin_start: The margin for the logical start side of the element, depending on layout direction.
        margin_end: The margin for the logical end side of the element, depending on layout direction.
        margin_x: The margin for the horizontal sides of the element.
        margin_y: The margin for the vertical sides of the element.
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
        exclude_from_tab_order: Whether the element should be excluded from the tab order.
        aria_expanded: Whether the element is expanded.
        aria_has_popup: Whether the element has a popup.
        aria_controls: The id of the element controlled by the current element.
        aria_pressed: Whether the element is pressed.
        aria_label: The label for the element.
        aria_labelled_by: The id of the element that labels the current element.
        aria_described_by: The id of the element that describes the current element.
        aria_details: The details of the current element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered button component.
    """
    return component_element(
        "Button",
        *children,
        variant=variant,
        style=style,
        static_color=static_color,
        is_pending=is_pending,
        type=type,
        is_disabled=is_disabled,
        auto_focus=auto_focus,
        href=href,
        target=target,
        rel=rel,
        # intentionally not exposing element_type to the user
        # for href links we can handle on their behalf
        element_type=None if href is None else "a",
        on_press=on_press,
        on_press_start=on_press_start,
        on_press_end=on_press_end,
        on_press_up=on_press_up,
        on_press_change=on_press_change,
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
        min_width=min_width,
        max_width=max_width,
        height=height,
        min_height=min_height,
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
        aria_has_popup=aria_has_popup,
        aria_controls=aria_controls,
        aria_pressed=aria_pressed,
        aria_label=aria_label,
        aria_labelled_by=aria_labelled_by,
        aria_described_by=aria_described_by,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
