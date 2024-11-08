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

from ..types import Key, TabDensity
from ..elements import BaseElement

TabElement = BaseElement


def tabs(
    *children: Any,
    disabled_keys: Iterable[Key] | None = None,
    is_disabled: bool | None = None,
    is_quiet: bool | None = None,
    is_emphasized: bool | None = None,
    density: TabDensity | None = "compact",
    keyboard_activation: KeyboardActivationType | None = "automatic",
    orientation: Orientation | None = "horizontal",
    disallow_empty_selection: bool | None = None,
    selected_key: Key | None = None,
    default_selected_key: Key | None = None,
    on_selection_change: Callable[[Key], None] | None = None,
    on_change: Callable[[Key], None] | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: float | None = 1,
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
    aria_labelled_by: str | None = None,
    aria_described_by: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
    key: str | None = None,
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
