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
    density: ListViewDensity | None = "COMPACT",
    is_quiet: bool | None = None,
    loading_state: LoadingState | None = None,
    overflow_mode: ListViewOverflowMode = "truncate",
    render_empty_state: Element | None = None,
    disabled_behavior: DisabledBehavior | None = None,
    disabled_keys: Selection | None = None,
    selection_mode: SelectionMode | None = "MULTIPLE",
    disallow_empty_selection: bool | None = None,
    selected_keys: Selection | None = None,
    default_selected_keys: Selection | None = None,
    selection_style: SelectionStyle | None = None,
    on_action: Callable[[Key, str], None] | None = None,
    on_selection_change: Callable[[Selection], None] | None = None,
    on_change: Callable[[Selection], None] | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: float | None = None,
    flex_shrink: float | None = None,
    flex_basis: DimensionValue | None = None,
    align_self: AlignSelf | None = None,
    justify_self: JustifySelf | None = None,
    order: int | None = None,
    grid_area: str | None = None,
    grid_row: str | None = None,
    grid_column: str | None = None,
    grid_row_start: str | None = None,
    grid_row_end: str | None = None,
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
    left: DimensionValue | None = None,
    right: DimensionValue | None = None,
    start: DimensionValue | None = None,
    end: DimensionValue | None = None,
    z_index: int | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
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
        disabled_keys: The keys that should be disabled. These cannot be selected, focused, or interacted with.
        selection_mode: By default `"MULTIPLE"`, which allows multiple selection. May also be `"SINGLE"` to allow only single selection, or `"None"`/`None` to allow no selection.
        disallow_empty_selection: Whether the ListView should disallow empty selection.
        selected_keys: The currently selected keys in the collection (controlled).
        default_selected_keys: The initial selected keys in the collection (uncontrolled).
        selection_style: How the selection should be displayed.
        on_action: Handler that is called when the user performs an action on an item. The user event depends on the collection's selection_style and interaction modality.
        on_change: Handler that is called when the selection changes.
        on_selection_change: Deprecated. Use on_change instead. Handler that is called when the selection changes.
        flex: When used in a flex layout, specifies how the element will grow or shrink to fit the space available.
        flex_grow: When used in a flex layout, specifies how the element will grow to fit the space available.
        flex_shrink: When used in a flex layout, specifies how the element will shrink to fit the space available.
        flex_basis: When used in a flex layout, specifies the initial main size of the element.
        align_self: Overrides the alignItems property of a flex or grid container.
        justify_self: Specifies how the element is justified inside a flex or grid container.
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
        z_index: The stacking order for the element.
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
