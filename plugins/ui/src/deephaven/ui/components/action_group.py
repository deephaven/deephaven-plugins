from __future__ import annotations
from typing import Any, Callable, Iterable


from .types import (
    # Events
    ButtonLabelBehavior,
    Orientation,
    StaticColor,
    # Layout
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    OverflowMode,
    Position,
)
from .basic import component_element
from ..elements import Element
from ..types import (
    ActionGroupDensity,
    SelectedKeys,
    SelectionMode,
    Key,
    Selection,
    UndefinedType,
    Undefined,
)


def action_group(
    *children: Any,
    is_emphasized: bool | UndefinedType = Undefined,
    density: ActionGroupDensity | UndefinedType = "regular",
    is_justified: bool | UndefinedType = Undefined,
    is_quiet: bool | UndefinedType = Undefined,
    static_color: StaticColor | UndefinedType = Undefined,
    overflow_mode: OverflowMode | UndefinedType = "wrap",
    button_label_behavior: ButtonLabelBehavior | UndefinedType = "show",
    summary_icon: Element | UndefinedType = Undefined,
    orientation: Orientation | UndefinedType = "horizontal",
    disabled_keys: Iterable[str] | UndefinedType = Undefined,
    is_disabled: bool | UndefinedType = Undefined,
    selection_mode: SelectionMode | UndefinedType = Undefined,
    disallow_empty_selection: bool | UndefinedType = Undefined,
    selected_keys: SelectedKeys | Iterable[str] | UndefinedType = Undefined,
    default_selected_keys: SelectedKeys | Iterable[str] | UndefinedType = Undefined,
    on_action: Callable[[str], None] | UndefinedType = Undefined,
    on_change: Callable[[Key], None] | UndefinedType = Undefined,
    on_selection_change: Callable[[Selection], None] | UndefinedType = Undefined,
    flex: LayoutFlex | UndefinedType = Undefined,
    flex_grow: float | UndefinedType = Undefined,
    flex_shrink: float | UndefinedType = Undefined,
    flex_basis: DimensionValue | UndefinedType = Undefined,
    align_self: AlignSelf | UndefinedType = Undefined,
    justify_self: JustifySelf | UndefinedType = Undefined,
    order: int | UndefinedType = Undefined,
    grid_area: str | UndefinedType = Undefined,
    grid_row: str | UndefinedType = Undefined,
    grid_column: str | UndefinedType = Undefined,
    grid_column_start: str | UndefinedType = Undefined,
    grid_column_end: str | UndefinedType = Undefined,
    grid_row_start: str | UndefinedType = Undefined,
    grid_row_end: str | UndefinedType = Undefined,
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
    left: DimensionValue | UndefinedType = Undefined,
    right: DimensionValue | UndefinedType = Undefined,
    start: DimensionValue | UndefinedType = Undefined,
    end: DimensionValue | UndefinedType = Undefined,
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
) -> Element:
    """
    An action grouping of action items that are related to each other.
    Args:
        *children: The children of the action group.
        is_emphasized: Whether the action buttons should be displayed with emphasized style.
        density: Sets the amount of space between buttons.
        is_justified: Whether the ActionButtons should be justified in their container.
        is_quiet: Whether ActionButtons should use the quiet style.
        static_color: The static color style to apply. Useful when the ActionGroup appears over a color background.
        overflow_mode: The behavior of the ActionGroup when the buttons do not fit in the available space.
        button_label_behaviour: Defines when the text within the buttons should be hidden and only the icon should be shown.
        summary_icon: The icon displayed in the dropdown menu button when a selectable ActionGroup is collapsed.
        orientation: The axis the ActionGroup should align with.
        disabled_keys: A list of keys to disable.
        is_disabled: Whether the ActionGroup is disabled. Shows that a selection exists, but is not available in that circumstance.
        selection_mode: The type of selection that is allowed in the collection.
        disallow_empty_selection: Whether the collection allows empty selection.
        selected_keys: The currently selected keys in the collection (controlled).
        default_selected_keys: The initial selected keys in the collection (uncontrolled).
        on_action: Invoked when an action is taken on a child. Especially useful when selectionMode is none. The sole argument key is the key for the item.
        on_change: Alias of on_selection_change.
            Handler that is called when the selection changes.
            The first argument is the selection, the second argument is the key of the list_view item.
        on_selection_change: Handler that is called when the selection changes.
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
        aria-label: Defines a string value that labels the current element.
        aria-labelledby: Identifies the element (or elements) that labels the current element.
        aria-describedby: Identifies the element (or elements) that describes the object.
        aria-details: Identifies the element (or elements) that provide a detailed, extended description for the object.
        UNSAFE_class_name: Set the CSS className for the element. Only use as a last resort. Use style props instead.
        UNSAFE_style: Set the inline style for the element. Only use as a last resort. Use style props instead.
        key: A unique identifier used by React to render elements in a list.
    """
    return component_element(
        "ActionGroup",
        *children,
        is_emphasized=is_emphasized,
        density=density,
        is_justified=is_justified,
        is_quiet=is_quiet,
        static_color=static_color,
        overflow_mode=overflow_mode,
        button_label_behavior=button_label_behavior,
        summary_icon=summary_icon,
        orientation=orientation,
        disabled_keys=disabled_keys,
        is_disabled=is_disabled,
        selection_mode=selection_mode,
        disallow_empty_selection=disallow_empty_selection,
        selected_keys=selected_keys,
        default_selected_keys=default_selected_keys,
        on_action=on_action,
        on_change=on_change,
        on_selection_change=on_selection_change,
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
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
        key=key,
    )
