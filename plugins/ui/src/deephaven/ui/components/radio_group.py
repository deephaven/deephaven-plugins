from __future__ import annotations
from typing import Any, Callable
from .types import (
    # Events
    FocusEventCallable,
    # Layout
    AlignSelf,
    CSSProperties,
    DimensionValue,
    JustifySelf,
    LayoutFlex,
    Position,
    LabelPosition,
    Align,
    # Validation
    NecessityIndicator,
    Orientation,
)
from .basic import component_element
from ..elements import Element
from .._internal.utils import create_props


# TODO: Add pydocs #514
def radio_group(
    *children,
    is_emphasized: bool | None = None,
    orientation: Orientation = "vertical",
    value: str | None = None,
    default_value: str | None = None,
    is_disabled: bool | None = None,
    is_read_only: bool | None = None,
    name: str | None = None,
    is_required: bool | None = None,
    is_invalid: bool | None = None,
    # validation_behaviour # omitted because validate is omitted
    # validate, # omitted because of synchronouse return
    label: Any | None = None,
    description: Any | None = None,
    error_message: Any | None = None,
    label_position: LabelPosition = "top",
    label_align: Align = "start",
    necessity_indicator: NecessityIndicator = "icon",
    contextual_help: Any | None = None,
    show_error_icon: bool | None = None,
    on_focus: FocusEventCallable | None = None,
    on_blur: FocusEventCallable | None = None,
    on_focus_change: Callable[[bool], None] | None = None,
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
    aria_label: str | None = None,
    aria_labelledby: str | None = None,
    aria_describedby: str | None = None,
    aria_details: str | None = None,
    aria_errormessage: str | None = None,
    UNSAFE_class_name: str | None = None,
    UNSAFE_style: CSSProperties | None = None,
) -> Element:
    """
    Radio buttons allow users to select a single option from a list of mutually
    exclusive options. All possible options are exposed up front for users to
    compare.

    Args:
        children: The Radio(s) contained within the RadioGroup.
    """

    children, props = create_props(locals())

    return component_element(f"RadioGroup", *children, **props)
