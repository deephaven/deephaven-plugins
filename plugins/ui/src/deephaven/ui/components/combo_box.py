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
from ..types import Key, UndefinedType, Undefined
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
    menu_trigger: MenuTriggerAction | UndefinedType = "input",
    is_quiet: bool | UndefinedType = Undefined,
    align: Align | UndefinedType = "end",
    direction: MenuDirection | UndefinedType = "bottom",
    loading_state: LoadingState | UndefinedType = Undefined,
    should_flip: bool = True,
    menu_width: DimensionValue | UndefinedType = Undefined,
    form_value: FormValue | UndefinedType = "text",
    should_focus_wrap: bool | UndefinedType = Undefined,
    input_value: str | UndefinedType = Undefined,
    default_input_value: str | UndefinedType = Undefined,
    allows_custom_value: bool | UndefinedType = Undefined,
    disabled_keys: list[Key] | UndefinedType = Undefined,
    selected_key: Key | None | UndefinedType = Undefined,
    default_selected_key: Key | UndefinedType = Undefined,
    is_disabled: bool | UndefinedType = Undefined,
    is_read_only: bool | UndefinedType = Undefined,
    is_required: bool | UndefinedType = Undefined,
    validation_behavior: ValidationBehavior = "aria",
    auto_focus: bool | UndefinedType = Undefined,
    label: Element | UndefinedType = Undefined,
    description: Element | UndefinedType = Undefined,
    error_message: Element | UndefinedType = Undefined,
    name: str | UndefinedType = Undefined,
    validation_state: ValidationState | UndefinedType = Undefined,
    label_position: LabelPosition = "top",
    label_align: Alignment | UndefinedType = Undefined,
    necessity_indicator: NecessityIndicator | UndefinedType = Undefined,
    contextual_help: Element | UndefinedType = Undefined,
    on_open_change: Callable[[bool, MenuTriggerAction], None]
    | UndefinedType = Undefined,
    on_selection_change: Callable[[Key | None], None] | UndefinedType = Undefined,
    on_change: Callable[[Key], None] | UndefinedType = Undefined,
    on_input_change: Callable[[str], None] | UndefinedType = Undefined,
    on_focus: Callable[[FocusEventCallable], None] | UndefinedType = Undefined,
    on_blur: Callable[[FocusEventCallable], None] | UndefinedType = Undefined,
    on_focus_change: Callable[[bool], None] | UndefinedType = Undefined,
    on_key_down: Callable[[KeyboardEventCallable], None] | UndefinedType = Undefined,
    on_key_up: Callable[[KeyboardEventCallable], None] | UndefinedType = Undefined,
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
