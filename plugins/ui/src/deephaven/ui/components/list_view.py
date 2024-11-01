from __future__ import annotations

from typing import Callable, Any

from deephaven.table import Table

from .item_table_source import ItemTableSource
from ..elements import Element
from .._internal.utils import create_props, unpack_item_table_source
from .basic import component_element
from .item import Item
from ..types import (
    ListViewDensity,
    ListViewOverflowMode,
    Selection,
    SelectionMode,
    SelectionStyle,
    Key,
    Undefined,
    UNDEFINED,
)
from .types import (
    LoadingState,
    DisabledBehavior,
    LayoutFlex,
    DimensionValue,
    AlignSelf,
    JustifySelf,
    Position,
    CSSProperties,
)

ListViewElement = Element

SUPPORTED_SOURCE_ARGS = {
    "key_column",
    "label_column",
    "description_column",
    "icon_column",
    "actions",
}


def list_view(
    *children: Item | Table | ItemTableSource,
    density: ListViewDensity | Undefined = "COMPACT",
    is_quiet: bool | Undefined = UNDEFINED,
    loading_state: LoadingState | Undefined = UNDEFINED,
    overflow_mode: ListViewOverflowMode = "truncate",
    render_empty_state: Element | Undefined = UNDEFINED,
    disabled_behavior: DisabledBehavior | Undefined = UNDEFINED,
    disabled_keys: Selection | Undefined = UNDEFINED,
    selection_mode: SelectionMode | Undefined = "MULTIPLE",
    disallow_empty_selection: bool | Undefined = UNDEFINED,
    selected_keys: Selection | Undefined = UNDEFINED,
    default_selected_keys: Selection | Undefined = UNDEFINED,
    selection_style: SelectionStyle | Undefined = UNDEFINED,
    on_action: Callable[[Key, str], None] | Undefined = UNDEFINED,
    on_selection_change: Callable[[Selection], None] | Undefined = UNDEFINED,
    on_change: Callable[[Selection], None] | Undefined = UNDEFINED,
    flex: LayoutFlex | Undefined = UNDEFINED,
    flex_grow: float | Undefined = UNDEFINED,
    flex_shrink: float | Undefined = UNDEFINED,
    flex_basis: DimensionValue | Undefined = UNDEFINED,
    align_self: AlignSelf | Undefined = UNDEFINED,
    justify_self: JustifySelf | Undefined = UNDEFINED,
    order: int | Undefined = UNDEFINED,
    grid_area: str | Undefined = UNDEFINED,
    grid_row: str | Undefined = UNDEFINED,
    grid_column: str | Undefined = UNDEFINED,
    grid_row_start: str | Undefined = UNDEFINED,
    grid_row_end: str | Undefined = UNDEFINED,
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
    left: DimensionValue | Undefined = UNDEFINED,
    right: DimensionValue | Undefined = UNDEFINED,
    start: DimensionValue | Undefined = UNDEFINED,
    end: DimensionValue | Undefined = UNDEFINED,
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
) -> ListViewElement:
    """
    A list view that can be used to create a list of items. Children should be one of three types:
    1. If children are of type `Item`, they are the list items.
    2. If children are of type `Table`, the values in the table are the list items.
        There can only be one child, the `Table`.
        The first column is used as the key and label by default.
    3. If children are of type `ItemTableSource`, complex items are created from the source.
        There can only be one child, the `ItemTableSource`.
        Supported `ItemTableSource` arguments are `key_column`, `label_column`, `description_column`,
        `icon_column`, and `actions`.

    Args:
        *children: The options to render within the list_view.
        density: Sets the amount of vertical padding within each cell.
        is_quiet: Whether the ListView should use the quiet style.
        loading_state: The loading state of the ListView. Determines whether to show a loading spinner.
        overflow_mode: The behaviour of the text when it overflows the cell.
        render_empty_state: Sets what the `list_view` should render when there is no content to display.
        disabled_behavior: Whether disabled_keys applies to all interactions or just selection.
        disabled_keys: The keys that should be disabled. These cannot be selected, focused, or interacted with
        selection_mode: By default `"MULTIPLE"`, which allows multiple selection. May also be `"SINGLE"` to allow only single selection, or `"None"`/`None` to allow no selection.
        disallow_empty_selection: Whether the ListView should disallow empty selection.
        selected_keys: The currently selected keys in the collection (controlled).
        default_selected_keys: The initial selected keys in the collection (uncontrolled).
        selection_style: How the selection should be displayed.
        on_action: Handler that is called when the user performs an action on an item. The user event depends on the collection's selection_style and interaction modality.
        on_change: Handler that is called when the selection changes.
        on_selection_change: Deprecated. Use on_change instead.Handler that is called when the selection changes.
        flex: When used in a flex layout, specifies how the element will grow or shrink to fit the space available.
        flex_grow: When used in a flex layout, specifies how the element will grow to fit the space available.
        flex_shrink: When used in a flex layout, specifies how the element will shrink to fit the space available.
        flex_basis: When used in a flex layout, specifies the initial main size of the element.
        align_self: Overrides the alignItems property of a flex or grid container.
        justify_self: Species how the element is justified inside a flex or grid container.
        order: The layout order for the element within a flex or grid container.
        grid_area: When used in a grid layout, specifies the named grid area that the element should be placed in within the grid.
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
        height: The height of the element.
        min_width: The minimum width of the element.
        min_height: The minimum height of the element.
        max_width: The maximum width of the element.
        max_height: The maximum height of the element.
        position: Specifies how the element is positioned.
        top: The top position of the element.
        bottom: The bottom position of the element.
        left: The left position of the element.
        right: The right position of the element.
        start: The logical start position of the element, depending on layout direction.
        end: The logical end position of the element, depending on layout direction.
        z_index: The stacking order for the element
        is_hidden: Hides the element.
        id: The unique identifier of the element.
        aria_label: Defines a string value that labels the current element.
        aria_labelledby: Identifies the element (or elements) that labels the current element.
        aria_describedby: Identifies the element (or elements) that describes the object.
        aria_details: Identifies the element (or elements) that provide a detailed, extended description for the object.
        UNSAFE_class_name: Set the CSS className for the element. Only use as a last resort. Use style props instead.
        UNSAFE_style: Set the inline style for the element. Only use as a last resort. Use style props instead.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered ListView.
    """
    children, props = create_props(locals())

    children, props = unpack_item_table_source(children, props, SUPPORTED_SOURCE_ARGS)

    return component_element("ListView", *children, **props)
