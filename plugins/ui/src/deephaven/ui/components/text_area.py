from __future__ import annotations
from typing import Any, Callable
from .types import (
    # Accessibility
    AriaHasPopup,
    AriaAutoComplete,
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
    LabelPosition,
    Alignment,
    # Validation
    TextFieldInputMode,
    TextFieldValidationState,
    NecessityIndicator,
)

from .types import IconTypes
from .basic import component_element
from ..elements import Element
from ..types import Undefined, UndefinedType

from .icon import icon as icon_component


_NULLABLE_PROPS = ["icon"]


def text_area(
    icon: Element | IconTypes | None | UndefinedType = Undefined,
    is_quiet: bool | None = None,
    is_disabled: bool | None = None,
    is_read_only: bool | None = None,
    is_required: bool | None = None,
    description: Any | None = None,
    error_message: Any | None = None,
    auto_focus: bool | None = None,
    value: str | None = None,
    default_value: str | None = None,
    label: Any | None = None,
    auto_complete: str | None = None,
    max_length: int | None = None,
    min_length: int | None = None,
    input_mode: TextFieldInputMode | None = None,
    name: str | None = None,
    validation_state: TextFieldValidationState | None = None,
    label_position: LabelPosition = "top",
    label_align: Alignment | None = None,
    necessity_indicator: NecessityIndicator | None = None,
    contextual_help: Any | None = None,
    on_focus: FocusEventCallable | None = None,
    on_blur: FocusEventCallable | None = None,
    on_focus_change: Callable[[bool], None] | None = None,
    on_key_down: KeyboardEventCallable | None = None,
    on_key_up: KeyboardEventCallable | None = None,
    on_change: Callable[[str], None] | None = None,
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
    aria_active_descendant: str | None = None,
    aria_auto_complete: AriaAutoComplete | None = None,
    aria_haspopup: AriaHasPopup | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    aria_errormessage: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
    # missing properties that are clipboard or composition events
) -> Element:
    """
    TextAreas are multiline text inputs, useful for cases where users have a sizable amount of text to enter. They allow for all customizations that are available to text fields.

    Args:
        icon: An icon to display at the start of the input
        is_quiet: Whether the input should be displayed with a quiet style
        is_disabled: Whether the input should be disabled
        is_read_only: Whether the input scan be selected but not changed by the user
        is_required: Whether the input is required before form submission
        description: A description for the area. Provides a hint such as specific requirements for what to choose.
        error_message: An error message to display when the area is invalid
        auto_focus: Whether the input should be focused on page load
        value: The current value of the input
        default_value: The default value of the input
        label: The label for the input
        auto_complete: Describes the type of autocomplete functionality the input should provide
        max_length: The maximum number of characters the input can accept
        min_length: The minimum number of characters the input can accept
        input_mode: Hints at the tpye of data that might be entered by the user while editing the element or its contents
        name: The name of the input, used when submitting an HTML form
        validation_state: Whether the input should display its "valid" or "invalid" state
        label_position: The position of the label relative to the input
        label_align: The alignment of the label relative to the input
        necessity_indicator: Whether the required state should be shown as an icon or text
        contextual_help: A ContentualHelp element to place next to the label
        on_focus: Function called when the button receives focus.
        on_blur: Function called when the button loses focus.
        on_focus_change: Function called when the focus state changes.
        on_key_down: Function called when a key is pressed.
        on_key_up: Function called when a key is released.
        on_change: Function called when the input value changes
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
        exclude_from_tab_order: Whether the element should be excluded from the tab order.
        aria_active_descendant: Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.
        aria_auto_complete: Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made.
        aria_haspopup: Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the current element.
        aria_describedby: The id of the element that describes the current element.
        aria_details: The id of the element that provides additional information about the current element.
        aria_errormessage: The id of the element that provides an error message for the current element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The element representing the text area
    """

    return component_element(
        "TextArea",
        icon=icon_component(name=icon) if type(icon) == str else icon,
        is_quiet=is_quiet,
        is_disabled=is_disabled,
        is_read_only=is_read_only,
        is_required=is_required,
        description=description,
        error_message=error_message,
        auto_focus=auto_focus,
        value=value,
        default_value=default_value,
        label=label,
        auto_complete=auto_complete,
        max_length=max_length,
        min_length=min_length,
        input_mode=input_mode,
        name=name,
        validation_state=validation_state,
        label_position=label_position,
        label_align=label_align,
        necessity_indicator=necessity_indicator,
        contextual_help=contextual_help,
        on_focus=on_focus,
        on_blur=on_blur,
        on_focus_change=on_focus_change,
        on_key_down=on_key_down,
        on_key_up=on_key_up,
        on_change=on_change,
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
        aria_active_descendant=aria_active_descendant,
        aria_auto_complete=aria_auto_complete,
        aria_haspopup=aria_haspopup,
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        aria_errormessage=aria_errormessage,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
        _nullable_props=_NULLABLE_PROPS,
    )
