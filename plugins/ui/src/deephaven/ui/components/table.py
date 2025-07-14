from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Any, Optional
import logging
from deephaven.table import Table
from ..elements import Element
from .types import AlignSelf, DimensionValue, JustifySelf, LayoutFlex, Position
from ..types import (
    CellPressCallback,
    Color,
    ColumnGroup,
    ColumnName,
    ColumnPressCallback,
    QuickFilterExpression,
    RowPressCallback,
    ResolvableContextMenuItem,
    SelectionChangeCallback,
)
from .._internal import dict_to_react_props, RenderContext

logger = logging.getLogger(__name__)

AggTypes = Literal[
    "AbsSum",
    "Avg",
    "Count",
    "CountDistinct",
    "Distinct",
    "First",
    "Last",
    "Max",
    "Min",
    "Std",
    "Sum",
    "Unique",
    "Unique",
    "Var",
]


@dataclass
class TableAgg:
    """
    An aggregation for a table.

    Args:
        agg: The name of the aggregation to apply.
        cols: The columns to aggregate. If None, the aggregation will apply to all applicable columns not in ignore_cols. Can only be used if ignore_cols is not specified.
        ignore_cols: The columns to ignore when aggregating. Can only be used if cols is not specified.
    Returns:
        The TableAgg configuration.
    """

    agg: AggTypes
    cols: ColumnName | list[ColumnName] | None = None
    ignore_cols: ColumnName | list[ColumnName] | None = None


@dataclass
class TableFormat:
    """
    A formatting rule for a table.

    Args:
        cols: The columns to format. If None, the format will apply to the entire row.
        if_: Deephaven expression to filter which rows should be formatted. Must resolve to a boolean.
        color: The font color.
        background_color: The cell background color.
        alignment: The cell text alignment.
        value: Format string for the cell value.
            E.g. "0.00%" to format as a percentage with two decimal places.
        mode: The cell rendering mode.
            Currently only databar is supported as an alternate rendering mode.
    Returns:
        The TableFormat.
    """

    cols: ColumnName | list[ColumnName] | None = None
    if_: str | None = None
    color: Color | None = None
    background_color: Color | None = None
    alignment: Literal["left", "center", "right"] | None = None
    value: str | None = None
    mode: TableDatabar | None = None


@dataclass
class TableDatabar:
    """
    A databar configuration for a table.

    Args:
        column: Name of the column to display as a databar.
        value_column: Name of the column to use as the value for the databar.
            If not provided, the databar will use the column value.

            This can be useful if you want to display a databar with
            a log scale, but display the actual value in the cell.
            In this case, the value_column would be the log of the actual value.
        min: Minimum value for the databar. Defaults to the minimum value in the column.

            If a column name is provided, the minimum value will be the value in that column.
            If a constant is providded, the minimum value will be that constant.
        max: Maximum value for the databar. Defaults to the maximum value in the column.

            If a column name is provided, the maximum value will be the value in that column.
            If a constant is providded, the maximum value will be that constant.
        axis: Whether the databar 0 value should be proportional to the min and max values,
            in the middle of the cell, or on one side of the databar based on direction.
        direction: The direction of the databar.
        value_placement: Placement of the value relative to the databar.
        color: The color of the databar.
        opacity: The opacity of the databar.
    """

    column: ColumnName
    value_column: ColumnName | None = None
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    axis: Literal["proportional", "middle", "directional"] | None = None
    direction: Literal["LTR", "RTL"] | None = None
    value_placement: Literal["beside", "overlap", "hide"] | None = None
    color: Color | None = None
    opacity: float | None = None


class table(Element):
    """
    Customization to how a table is displayed, how it behaves, and listen to UI events.

    Args:
        table: The table to wrap
        format_: A formatting rule or list of formatting rules for the table.
        on_row_press: The callback function to run when a row is clicked.
            The callback is invoked with the visible row data provided in a dictionary where the
            column names are the keys.
        on_row_double_press: The callback function to run when a row is double clicked.
            The callback is invoked with the visible row data provided in a dictionary where the
            column names are the keys.
        on_cell_press: The callback function to run when a cell is clicked.
            The callback is invoked with the cell data.
        on_cell_double_press: The callback function to run when a cell is double clicked.
            The callback is invoked with the cell data.
        on_column_press: The callback function to run when a column is clicked.
            The callback is invoked with the column name.
        on_column_double_press: The callback function to run when a column is double clicked.
            The callback is invoked with the column name.
        on_selection_change: The callback function to run when the selection changes.
            The callback is invoked with the selected rows with data from the columns in `always_fetch_columns`.
        always_fetch_columns: The columns to always fetch from the server regardless of if they are in the viewport.
            If True, all columns will always be fetched. This may make tables with many columns slow.
        quick_filters: The quick filters to apply to the table. Dictionary of column name to filter value.
        show_quick_filters: Whether to show the quick filter bar by default.
        aggregations: An aggregation or list of aggregations to apply to the table. These will be shown as a floating row at the bottom of the table by default.
        aggregations_position: The position to show the aggregations. One of "top" or "bottom". "bottom" by default.
        show_grouping_column: Whether to show the grouping column by default for rollup tables.
        show_search: Whether to show the search bar by default.
        reverse: Whether to reverse the table rows. Applied after any sorts.
        front_columns: The columns to pin to the front of the table. These will not be movable by the user.
        back_columns: The columns to pin to the back of the table. These will not be movable by the user.
        frozen_columns: The columns to freeze by default at the front of the table.
            These will always be visible regardless of horizontal scrolling.
            The user may unfreeze columns or freeze additional columns.
        hidden_columns: The columns to hide by default. Users may show the columns by expanding them.
        column_groups: Columns to group together by default. The groups will be shown in the table header.
            Group names must be unique within the column and group names.
            Groups may be nested by providing the group name as a child of another group.
        column_display_names: A dictionary of column names to an alternate display name.
            E.g. {"column1": "Column 1", "column2": "C2"}.
        density: The density of the data displayed in the table.
            One of "compact", "regular", or "spacious".
            If not provided, the app default will be used.
        context_menu: The context menu items to show when a cell is right clicked.
            May contain action items or submenu items.
            May also be a function that receives the cell data and returns the context menu items or None.
        context_header_menu: The context menu items to show when a column header is right clicked.
            May contain action items or submenu items.
            May also be a function that receives the column header data and returns the context menu items or None.
        databars: Databars are experimental and will be moved to column_formatting in the future.
        key: A unique identifier used by React to render elements in a list.
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
    Returns:
        The rendered Table.
    """

    _props: dict[str, Any]
    """
    The props that are passed to the frontend
    """

    def __init__(
        self,
        table: Table,
        *,
        format_: TableFormat | list[TableFormat] | None = None,
        on_row_press: RowPressCallback | None = None,
        on_row_double_press: RowPressCallback | None = None,
        on_cell_press: CellPressCallback | None = None,
        on_cell_double_press: CellPressCallback | None = None,
        on_column_press: ColumnPressCallback | None = None,
        on_column_double_press: ColumnPressCallback | None = None,
        on_selection_change: SelectionChangeCallback | None = None,
        always_fetch_columns: ColumnName | list[ColumnName] | bool | None = None,
        quick_filters: dict[ColumnName, QuickFilterExpression] | None = None,
        show_quick_filters: bool = False,
        aggregations: TableAgg | list[TableAgg] | None = None,
        aggregations_position: Literal["top", "bottom"] | None = None,
        show_grouping_column: bool = True,
        show_search: bool = False,
        reverse: bool = False,
        front_columns: list[ColumnName] | None = None,
        back_columns: list[ColumnName] | None = None,
        frozen_columns: list[ColumnName] | None = None,
        hidden_columns: list[ColumnName] | None = None,
        column_groups: list[ColumnGroup] | None = None,
        column_display_names: dict[ColumnName, str] | None = None,
        density: Literal["compact", "regular", "spacious"] | None = None,
        context_menu: (
            ResolvableContextMenuItem | list[ResolvableContextMenuItem] | None
        ) = None,
        context_header_menu: (
            ResolvableContextMenuItem | list[ResolvableContextMenuItem] | None
        ) = None,
        databars: list[TableDatabar] | None = None,
        key: str | None = None,
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
    ) -> None:
        if on_selection_change is not None and always_fetch_columns is None:
            raise ValueError(
                "ui.table on_selection_change requires always_fetch_columns to be set"
            )

        props = locals()
        del props["self"]
        self._props = props
        self._key = props.get("key")

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    @property
    def key(self) -> str | None:
        return self._key

    def render(self, context: RenderContext) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_react_props(self._props)
