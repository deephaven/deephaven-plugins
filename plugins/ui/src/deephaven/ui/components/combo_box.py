from __future__ import annotations

from typing import Callable, Any

from .types import (
    FocusEventCallable,
    KeyboardEventCallable,
    LayoutFlex,
    DimensionValue,
    AlignSelf,
    JustifySelf,
    Position,
    CSSProperties,
    LabelPosition,
    ValidationBehavior,
    NecessityIndicator,
    ValidationState,
    MenuTriggerAction,
    Align,
    MenuDirection,
    LoadingState,
    FormValue,
    Alignment,
)

from deephaven.table import Table, PartitionedTable
from .section import SectionElement
from .item import Item
from .item_table_source import ItemTableSource
from ..elements import BaseElement, Element
from .._internal.utils import create_props, unpack_item_table_source
from ..types import Key, Undefined, UNDEFINED
from .basic import component_element

ComboBoxElement = BaseElement

SUPPORTED_SOURCE_ARGS = {
    "key_column",
    "label_column",
    "description_column",
    "icon_column",
    "title_column",
}


def combo_box(
    *children: Item | SectionElement | Table | PartitionedTable | ItemTableSource,
    menu_trigger: MenuTriggerAction | Undefined = "input",
    is_quiet: bool | Undefined = UNDEFINED,
    align: Align | Undefined = "end",
    direction: MenuDirection | Undefined = "bottom",
    loading_state: LoadingState | Undefined = UNDEFINED,
    should_flip: bool = True,
    menu_width: DimensionValue | Undefined = UNDEFINED,
    form_value: FormValue | Undefined = "text",
    should_focus_wrap: bool | Undefined = UNDEFINED,
    input_value: str | Undefined = UNDEFINED,
    default_input_value: str | Undefined = UNDEFINED,
    allows_custom_value: bool | Undefined = UNDEFINED,
    disabled_keys: list[Key] | Undefined = UNDEFINED,
    selected_key: Key | Undefined = UNDEFINED,
    default_selected_key: Key | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    is_read_only: bool | Undefined = UNDEFINED,
    is_required: bool | Undefined = UNDEFINED,
    validation_behavior: ValidationBehavior = "aria",
    auto_focus: bool | Undefined = UNDEFINED,
    label: Element | Undefined = UNDEFINED,
    description: Element | Undefined = UNDEFINED,
    error_message: Element | Undefined = UNDEFINED,
    name: str | Undefined = UNDEFINED,
    validation_state: ValidationState | Undefined = UNDEFINED,
    label_position: LabelPosition = "top",
    label_align: Alignment | Undefined = UNDEFINED,
    necessity_indicator: NecessityIndicator | Undefined = UNDEFINED,
    contextual_help: Element | Undefined = UNDEFINED,
    on_open_change: Callable[[bool, MenuTriggerAction], None] | Undefined = UNDEFINED,
    on_selection_change: Callable[[Key], None] | Undefined = UNDEFINED,
    on_change: Callable[[Key], None] | Undefined = UNDEFINED,
    on_input_change: Callable[[str], None] | Undefined = UNDEFINED,
    on_focus: Callable[[FocusEventCallable], None] | Undefined = UNDEFINED,
    on_blur: Callable[[FocusEventCallable], None] | Undefined = UNDEFINED,
    on_focus_change: Callable[[bool], None] | Undefined = UNDEFINED,
    on_key_down: Callable[[KeyboardEventCallable], None] | Undefined = UNDEFINED,
    on_key_up: Callable[[KeyboardEventCallable], None] | Undefined = UNDEFINED,
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
    aria_details: str | Undefined = UNDEFINED,
    UNSAFE_class_name: str | Undefined = UNDEFINED,
    UNSAFE_style: CSSProperties | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> ComboBoxElement:
    """
    A combo box that can be used to search or select from a list. Children should be one of five types:
    1. If children are of type `Item`, they are the dropdown options.
    2. If children are of type `SectionElement`, they are the dropdown sections.
    3. If children are of type `Table`, the values in the table are the dropdown options.
        There can only be one child, the `Table`.
        The first column is used as the key and label by default.
    4. If children are of type `PartitionedTable`, the values in the table are the dropdown options
        and the partitions create multiple sections. There can only be one child, the `PartitionedTable`.
        The first column is used as the key and label by default.
    5. If children are of type `ItemTableSource`, complex items are created from the source.
        There can only be one child, the `ItemTableSource`.
        Supported ItemTableSource arguments are `key_column`, `label_column`, `description_column`,
        `icon_column`, and `title_column`.

    Args:
        *children: The options to render within the combo box.
        menu_trigger: The interaction required to display the ComboBox menu.
        is_quiet: Whether the ComboBox should be displayed with a quiet style.
        align: Alignment of the menu relative to the input target.
        direction: Direction the menu will render relative to the ComboBox.
        loading_state: The current loading state of the ComboBox.
            Determines whether or not the progress circle should be shown.
        should_flip: Whether the menu should automatically flip direction when space is limited.
        menu_width: Width of the menu. By default, matches width of the combobox.
            Note that the minimum width of the dropdown is always equal to the combobox's width.
        form_value: Whether the text or key of the selected item is submitted as part of an HTML form.
            When allowsCustomValue is true, this option does not apply and the text is always submitted.
        should_focus_wrap: Whether keyboard navigation is circular.
        input_value: The value of the search input (controlled).
        default_input_value: The default value of the search input (uncontrolled).
        allows_custom_value: Whether the ComboBox allows a non-item matching input value to be set.
        disabled_keys: The item keys that are disabled.
            These items cannot be selected, focused, or otherwise interacted with.
        selected_key: The currently selected key in the collection (controlled).
        default_selected_key: The initial selected key in the collection (uncontrolled).
        is_disabled: Whether the input is disabled.
        is_read_only: Whether the input can be selected but not changed by the user.
        is_required: Whether user input is required on the input before form submission.
        validation_behavior: Whether to use native HTML form validation to prevent
            form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA.
        auto_focus: Whether the element should receive focus on render.
        label: The content to display as the label.
        description: A description for the field. Provides a hint such as specific requirements for what to choose.
        error_message: An error message for the field.
        name: The name of the input element, used when submitting an HTML form.
        validation_state: Whether the input should display its "valid" or "invalid" visual styling.
        label_position: The label's overall position relative to the element it is labeling.
        label_align: The label's horizontal alignment relative to the element it is labeling.
        necessity_indicator: Whether the required state should be shown as an icon or text.
        contextual_help: A ContextualHelp element to place next to the label.
        on_open_change: Method that is called when the open state of the menu changes.
            Returns the new open state and the action that caused the opening of the menu.
        on_selection_change: Handler that is called when the selection changes.
        on_change: Alias of `on_selection_change`. Handler that is called when the selection changes.
        on_input_change: Handler that is called when the ComboBox input value changes.
        on_focus: Handler that is called when the element receives focus.
        on_blur: Handler that is called when the element loses focus.
        on_focus_change: Handler that is called when the element's focus status changes.
        on_key_down: Handler that is called when a key is pressed.
        on_key_up: Handler that is called when a key is released.
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
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered ComboBox.
    """
    children, props = create_props(locals())

    children, props = unpack_item_table_source(children, props, SUPPORTED_SOURCE_ARGS)

    return component_element("ComboBox", *children, **props)
