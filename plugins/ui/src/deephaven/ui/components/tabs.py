from __future__ import annotations
from typing import Any, Callable, Iterable, Union

from .basic import component_element

from .types import (
    KeyboardActivationType,
    Orientation,
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)

from ..types import Key, TabDensity, Undefined, UNDEFINED
from ..elements import BaseElement

TabElement = BaseElement


def tabs(
    *children: Any,
    disabled_keys: Iterable[Key] | Undefined = UNDEFINED,
    is_disabled: bool | Undefined = UNDEFINED,
    is_quiet: bool | Undefined = UNDEFINED,
    is_emphasized: bool | Undefined = UNDEFINED,
    density: TabDensity | Undefined = "compact",
    keyboard_activation: KeyboardActivationType | Undefined = "automatic",
    orientation: Orientation | Undefined = "horizontal",
    disallow_empty_selection: bool | Undefined = UNDEFINED,
    selected_key: Key | Undefined = UNDEFINED,
    default_selected_key: Key | Undefined = UNDEFINED,
    on_selection_change: Callable[[Key], None] | Undefined = UNDEFINED,
    on_change: Callable[[Key], None] | Undefined = UNDEFINED,
    flex: LayoutFlex | Undefined = UNDEFINED,
    flex_grow: float | Undefined = 1,
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
    aria_labelled_by: str | Undefined = UNDEFINED,
    aria_described_by: str | Undefined = UNDEFINED,
    aria_details: str | Undefined = UNDEFINED,
    UNSAFE_class_name: str | Undefined = UNDEFINED,
    UNSAFE_style: CSSProperties | Undefined = UNDEFINED,
    key: str | Undefined = UNDEFINED,
) -> TabElement:
    """
    Python implementation for the Adobe React Spectrum Tabs component.
    https://react-spectrum.adobe.com/react-spectrum/Tabs.html

    Args:
        *children: The children of the tabs component outline how the tabs will be created, they can be either:
            ui.tab: A tab item that is a shorthand way to create a tab item.
            ui.tab_list & ui.tab_panels: A tab list and tab panels allow for more customization when creating tabs.
        disabled_keys: The keys of the tabs that are disabled. These tabs cannot be selected, focused, or otherwise interacted with.
        is_disabled: Whether the Tabs are disabled.
        is_quiet: Whether the tabs are displayed in a quiet style.
        is_emphasized: Whether the tabs are displayed in an emphasized style.
        density: The amount of space between the tabs.
        keyboard_activation: Whether tabs are activated automatically on focus or manually.
        orientation: The orientation of the tabs.
        disallow_empty_selection: Whether the collection allows empty selection.
        selected_key: The currently selected key in the collection (controlled).
        default_selected_key: The initial selected key in the collection (uncontrolled).
        on_selection_change: Callback for when the selected key changes.
        on_change:
            Alias of `on_selection_change`. Handler that is called when the selection changes.
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
        height: The height of the element.
        min_width: The minimum width of the element.
        min_height: The minimum height of the element.
        max_width: The maximum width of the element.
        max_height: The maximum height of the element.
        position: Specifies how the element is position.
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
        aria_labelled_by: Identifies the element (or elements) that labels the current element.
        aria_described_by: Identifies the element (or elements) that describes the object.
        aria_details: Identifies the element (or elements) that provide a detailed, extended description for the object.
        UNSAFE_class_name: Set the CSS className for the element. Only use as a last resort. Use style props instead.
        UNSAFE_style: Set the inline style for the element. Only use as a last resort. Use style props instead.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered tabs component.

    """
    if not children:
        raise ValueError("Tabs must have at least one child.")

    tab_children = [
        child for child in children if child.name == "deephaven.ui.spectrum.Tab"
    ]

    tab_list_children = [
        child for child in children if child.name == "deephaven.ui.spectrum.TabList"
    ]
    tab_panels_children = [
        child for child in children if child.name == "deephaven.ui.spectrum.TabPanels"
    ]

    tab_list_keys = {list_child.key for list_child in tab_list_children}
    tab_panels_keys = {panel_child.key for panel_child in tab_panels_children}

    if tab_list_keys != tab_panels_keys:
        raise ValueError("Mismatching keys found between tab list and tab panels.")

    if tab_children and (tab_list_children and tab_panels_children):
        raise TypeError("Tabs cannot have both Tab and TabList or TabPanels children.")

    return component_element(
        "Tabs",
        *children,
        disabled_keys=disabled_keys,
        is_disabled=is_disabled,
        is_quiet=is_quiet,
        is_emphasized=is_emphasized,
        density=density,
        keyboard_activation=keyboard_activation,
        orientation=orientation,
        disallow_empty_selection=disallow_empty_selection,
        selected_key=selected_key,
        default_selected_key=default_selected_key,
        on_selection_change=on_selection_change,
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
        grid_column=grid_column,
        grid_row_start=grid_row_start,
        grid_row_end=grid_row_end,
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
        left=left,
        right=right,
        start=start,
        end=end,
        z_index=z_index,
        is_hidden=is_hidden,
        id=id,
        aria_label=aria_label,
        aria_labelled_by=aria_labelled_by,
        aria_described_by=aria_described_by,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
