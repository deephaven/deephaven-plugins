from __future__ import annotations
from numbers import Number
from typing import Callable, Iterable

from .item import Item
from .section import SectionElement

from .spectrum.events import TriggerType
from ..types import Key, ActionKey, ActionMenuDirection
from ..elements import BaseElement, Element

from .spectrum import (
    Alignment,
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
)


def action_menu(
    *children: Item | SectionElement,
    is_disabled: bool | None = None,
    is_quiet: bool | None = None,
    auto_focus: bool | None = None,
    disabled_keys: Iterable[Key] | None = None,
    align: Alignment | None = "start",
    direction: ActionMenuDirection | None = "bottom",
    should_flip: bool | None = True,
    close_on_select: bool | None = True,
    trigger: TriggerType | None = "press",
    is_open: bool | None = None,
    default_open: bool | None = None,
    on_action: Callable[[ActionKey], None] | None = None,
    on_open_change: Callable[[bool], None] | None = None,
    flex: LayoutFlex | None = None,
    flex_grow: Number | None = None,
    flex_shrink: Number | None = None,
    flex_basis: DimensionValue | None = None,
    align_self: AlignSelf | None = None,
    justify_self: JustifySelf | None = None,
    order: Number | None = None,
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
    z_index: Number | None = None,
    is_hidden: bool | None = None,
    id: str | None = None,
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
) -> Element:
    """
    ActionMenu combines an ActionButton with a Menu for simple "more actions" use cases.

    Args:
        children: The contents of the collection.
        is_disabled: Whether the button is disabled.
        is_quiet: Whether the button should be displayed with a quiet style.
        auto_focus: Whether the element should receive focus on render.
        disabled_keys: The item keys that are disabled. These items cannot be selected, focused, or otherwise interacted with.
        align: Alignment of the menu relative to the trigger.
        direction: Where the Menu opens relative to its trigger.
        should_flip: Whether the menu should automatically flip direction when space is limited.
        close_on_select: Whether the Menu closes when a selection is made.
        trigger: How the menu is triggered.
        is_open: Whether the overlay is open by default (controlled).
        default_open: Whether the overlay is open by default (uncontrolled).
        on_action: Handler that is called when an item is selected.
        on_open_change: Handler that is called when the overlay's open state changes.
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
    """
    return BaseElement(
        f"deephaven.ui.components.ActionMenu",
        *children,
        is_disabled=is_disabled,
        is_quiet=is_quiet,
        auto_focus=auto_focus,
        disabled_keys=disabled_keys,
        align=align,
        direction=direction,
        should_flip=should_flip,
        close_on_select=close_on_select,
        trigger=trigger,
        is_open=is_open,
        default_open=default_open,
        on_action=on_action,
        on_open_change=on_open_change,
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
        aria_label=aria_label,
        aria_labelledby=aria_labelledby,
        aria_describedby=aria_describedby,
        aria_details=aria_details,
        UNSAFE_class_name=UNSAFE_class_name,
        UNSAFE_style=UNSAFE_style,
    )
