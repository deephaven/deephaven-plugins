from __future__ import annotations

from typing import Callable

from .basic import component_element
from .section import Item
from .submenu_trigger import SubmenuTrigger
from .contextual_help_trigger import ContextualHelpTrigger
from ..elements import BaseElement
from .._internal.utils import create_props
from ..types import Key, List
from .types import (
    AlignSelf,
    CSSProperties,
    DimensionValue,
    FocusStrategy,
    JustifySelf,
    LayoutFlex,
    Position,
    SelectionAll,
    SelectionMode,
)

MenuElement = BaseElement


def menu(
    *children: Item | SubmenuTrigger | ContextualHelpTrigger,
    auto_focus: bool | FocusStrategy | None = None,
    should_focus_wrap: bool | None = None,
    disabled_keys: List[Key] | None = None,
    selection_mode: SelectionMode | None = None,
    disallow_empty_selection: bool | None = None,
    selected_keys: SelectionAll | List[Key] | None = None,
    default_selected_keys: SelectionAll | List[Key] | None = None,
    on_action: Callable[[Key], None] | None = None,
    on_close: Callable[[], None] | None = None,
    on_change: Callable[[SelectionAll | List[Key]], None] | None = None,
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
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
) -> MenuElement:
    """
    A menu displays a list of actions or options that a user can choose.

    Args:
        *children: The contents of the collection.
        auto_focus: Where the focus should be set.
        should_focus_wrap: Whether keyboard navigation is circular.
        disabled_keys: The item keys that are disabled. These items cannot be selected, focused, or otherwise interacted with.
        selection_mode: The type of selection that is allowed in the collection.
        disallow_empty_selection: Whether the collection allows empty selection.
        selected_keys: The currently selected keys in the collection (controlled).
        default_selected_keys: The default selected keys in the collection (uncontrolled).
        on_action: Handler that is called when an item is selected.
        on_close: Handler that is called when the menu should close after selecting an item.
        on_change: Handler that is called when the selection changes.
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
        aria_label: The label for the element.
        aria_labelledby: The id of the element that labels the element.
        aria_describedby: The id of the element that describes the element.
        aria_details: The details for the element.
        UNSAFE_class_name: A CSS class to apply to the element.
        UNSAFE_style: A CSS style to apply to the element.
        key: A unique identifier used by React to render elements in a list.


    Returns:
        The menu element.
    """

    children, props = create_props(locals())
    return component_element("Menu", *children, **props)
