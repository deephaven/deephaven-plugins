from __future__ import annotations

import logging
import sys
from typing import Callable, Literal, Sequence, Any, cast
from warnings import warn

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict, NotRequired
else:
    from typing import TypedDict, NotRequired

from deephaven.table import Table
from deephaven import SortDirection
from .Element import Element
from ..types import (
    ColumnName,
    AggregationOperation,
    QuickFilterExpression,
    Color,
    ContextMenuAction,
    CellIndex,
    CellPressCallback,
    ColumnPressCallback,
    RowData,
    ContextMenuMode,
    DataBarAxis,
    DataBarValuePlacement,
    DataBarDirection,
    SelectionMode,
    TableSortDirection,
    RowPressCallback,
    StringSortDirection,
)
from .._internal import dict_to_camel_case, RenderContext

logger = logging.getLogger(__name__)


def remap_sort_direction(direction: TableSortDirection | str) -> Literal["ASC", "DESC"]:
    """
    Remap the sort direction to the grid sort direction

    Args:
        direction: The deephaven sort direction or grid sort direction to remap

    Returns:
        The grid sort direction
    """
    if direction == SortDirection.ASCENDING:
        return "ASC"
    elif direction == SortDirection.DESCENDING:
        return "DESC"
    elif direction in {"ASC", "DESC"}:
        return cast(StringSortDirection, direction)
    raise ValueError(f"Invalid table sort direction: {direction}")


class UITableProps(TypedDict):
    on_row_press: NotRequired[RowPressCallback]
    """
    Callback function to run when a row is clicked.
    The first parameter is the row index, and the second is the visible row data provided in a dictionary where the
    column names are the keys.
    """

    on_row_double_press: NotRequired[RowPressCallback]
    """
    The callback function to run when a row is double clicked.
    The first parameter is the row index, and the second is the visible row data provided in a dictionary where the
    column names are the keys.
    """

    on_cell_press: NotRequired[CellPressCallback]
    """
    The callback function to run when a cell is clicked.
    The first parameter is the cell index, and the second is the cell data provided in a dictionary where the
    column names are the keys.
    """

    on_cell_double_press: NotRequired[CellPressCallback]
    """
    The callback function to run when a cell is double clicked.
    The first parameter is the cell index, and the second is the cell data provided in a dictionary where the
    column names are the keys.
    """

    on_column_press: NotRequired[ColumnPressCallback]
    """
    The callback function to run when a column is clicked.
    The first parameter is the column name.
    """

    on_column_double_press: NotRequired[ColumnPressCallback]
    """
    The callback function to run when a column is double clicked.
    The first parameter is the column name.
    """

    table: Table
    """
    The table to wrap
    """


class UITable(Element):
    """
    Wrap a Table with some extra props for giving hints to displaying a table
    """

    _props: UITableProps
    """
    The props that are passed to the frontend
    """

    def __init__(
        self,
        table: Table,
        **props: Any,
    ):
        """
        Create a UITable from the passed in table. UITable provides an [immutable fluent interface](https://en.wikipedia.org/wiki/Fluent_interface#Immutability) for adding UI hints to a table.

        Args:
            table: The table to wrap
            props: UITableProps props to pass to the frontend.
        """

        # Store all the props that were passed in
        self._props = UITableProps(**props, table=table)

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    def _with_prop(self, key: str, value: Any) -> "UITable":
        """
        Create a new UITable with the passed in prop added to the existing props

        Args:
            key: The key to add to the props
            value: The value to add with the associated key

        Returns:
            A new UITable with the passed in prop added to the existing props
        """
        logger.debug("_with_prop(%s, %s)", key, value)
        return UITable(**{**self._props, key: value})

    def _with_appendable_prop(self, key: str, value: Any) -> "UITable":
        """
        Create a new UITable with the passed in prop added to the existing prop
        list (if it exists) or a new list with the passed in value

        Args:
            key: The key to add to the props
            value: The value to add with the associated key

        Returns:
            A new UITable with the passed in prop added to the existing props
        """
        logger.debug("_with_appendable_prop(%s, %s)", key, value)
        existing = self._props.get(key, [])

        if not isinstance(existing, list):
            raise ValueError(f"Expected {key} to be a list")

        value = value if isinstance(value, list) else [value]

        return UITable(**{**self._props, key: existing + value})

    def _with_dict_prop(self, key: str, value: dict[str, Any]) -> "UITable":
        """
        Create a new UITable with the passed in prop in a dictionary.
        This will override any existing prop with the same key within
        the dict stored at prop_name.


        Args:
            prop_name: The key to add to the props
            value: The value to add with the associated key

        Returns:
            A new UITable with the passed in prop added to the existing props
        """
        logger.debug("_with_dict_prop(%s, %s)", key, value)
        existing = (
            self._props.get(key) or {}
        )  # Turn missing or explicit None into empty dict
        return UITable(**{**self._props, key: {**existing, **value}})  # type: ignore

    def render(self, context: RenderContext) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_camel_case({**self._props})

    def aggregations(
        self,
        operations: dict[ColumnName, list[AggregationOperation]],
        operation_order: list[AggregationOperation] | None = None,
        default_operation: AggregationOperation | None = None,
        group_by: list[ColumnName] | None = None,
        show_on_top: bool = False,
    ) -> "UITable":
        """
        Set the totals table to display below the main table.

        Args:
            operations: The operations to apply to the columns of the table.
            operation_order: The order in which to display the operations.
            default_operation: The default operation to apply to columns that do not have an operation specified.
            group_by: The columns to group by.
            show_on_top: Whether to show the totals table above the main table.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def always_fetch_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to always fetch from the server.
        These will not be affected by the users current viewport/horizontal scrolling.
        Useful if you have a column with key value data that you want to always include
        in the data sent for row click operations.

        Args:
            columns: The columns to always fetch from the server.
                May be a single column name.

        Returns:
            A new UITable
        """
        return self._with_appendable_prop("always_fetch_columns", columns)

    def back_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to show at the back of the table.
        These will not be moveable in the UI.

        Args:
            columns: The columns to show at the back of the table.
                May be a single column name.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def column_group(
        self, name: str, children: list[str], color: str | None
    ) -> "UITable":
        """
        Create a group for columns in the table.

        Args:
            name: The group name. Must be a valid column name and not a duplicate of another column or group.
            children: The children in the group. May contain column names or other group names.
                Each item may only be specified as a child once.
            color: The hex color string or Deephaven color name.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def color_column(
        self,
        column: ColumnName,
        where: QuickFilterExpression | None = None,
        color: Color | None = None,
        background_color: Color | None = None,
    ) -> "UITable":
        """
        Applies color formatting to a column of the table.

        Args:
            column: The column name
            where: The filter to apply to the expression.
              Uses quick filter format (e.g. `>10`).
            color: The text color. Accepts hex color strings or Deephaven color names.
            background_color: The background color. Accepts hex color strings or Deephaven color names.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def color_row(
        self,
        column: ColumnName,
        where: QuickFilterExpression | None = None,
        color: Color | None = None,
        background_color: Color | None = None,
    ) -> "UITable":
        """
        Applies color formatting to rows of the table conditionally based on the value of a column.

        Args:
            column: The column name
            where: The filter to apply to the expression.
              Uses quick filter format (e.g. `>10`).
            color: The text color. Accepts hex color strings or Deephaven color names.
            background_color: The background color. Accepts hex color strings or Deephaven color names.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def context_menu(
        self,
        items: (
            ContextMenuAction
            | list[ContextMenuAction]
            | Callable[
                [CellIndex, RowData], ContextMenuAction | list[ContextMenuAction]
            ]
        ),
        mode: ContextMenuMode = "CELL",
    ) -> "UITable":
        """
        Add custom items to the context menu.
        You can provide a list of actions that always appear,
        or a callback that can process the selection and send back menu items asynchronously.
        You can also specify whether you want the menu items provided for a cell context menu,
        a header context menu, or some combination of those.
        You can also chain multiple sets of menu items by calling `.context_menu` multiple times.

        Args:
            items: The items to add to the context menu.
                May be a single `ContextMenuAction`, a list of `ContextMenuAction` objects,
                or a callback function that takes the cell index and row data and returns either a single
                `ContextMenuAction` or a list of `ContextMenuAction` objects.
            mode: Which specific context menu(s) to add the menu item(s) to.
                Can be one or more modes.
                Using `None` will add menu items in all cases.
                `CELL`: Triggered from a cell.
                `ROW_HEADER`: Triggered from a row header.
                `COLUMN_HEADER`: Triggered from a column header.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def data_bar(
        self,
        col: str,
        value_col: str | None = None,
        min: float | str | None = None,
        max: float | str | None = None,
        axis: DataBarAxis | None = None,
        positive_color: Color | list[Color] | None = None,
        negative_color: Color | list[Color] | None = None,
        value_placement: DataBarValuePlacement | None = None,
        direction: DataBarDirection | None = None,
        opacity: float | None = None,
        marker_col: str | None = None,
        marker_color: Color | None = None,
    ) -> "UITable":
        """
        Applies data bar formatting to the specified column.

        Args:
            col: Column to generate data bars in
            value_col: Column containing the values to generate data bars from
            min: Minimum value for data bar scaling or column to get value from
            max: Maximum value for data bar scaling or column to get value from
            axis: Orientation of data bar relative to cell
            positive_color: Color for positive bars. Use list of colors to form a gradient
            negative_color: Color for negative bars. Use list of colors to form a gradient
            value_placement: Orientation of values relative to data bar
            direction: Orientation of data bar relative to horizontal axis
            opacity: Opacity of data bar. Accepts values from 0 to 1
            marker_col: Column containing the values to generate markers from
            marker_color: Color for markers

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def format(self, column: ColumnName, format: str) -> "UITable":
        """
        Specify the formatting to display a column in.

        Args:
            column: The column name
            format: The format to display the column in. Valid format depends on column type

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def freeze_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to freeze to the front of the table.
        These will always be visible and not affected by horizontal scrolling.

        Args:
            columns: The columns to freeze to the front of the table.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def front_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to show at the front of the table. These will not be moveable in the UI.

        Args:
            columns: The columns to show at the front of the table.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def hide_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to hide by default in the table. The user can still resize the columns to view them.

        Args:
            columns: The columns to hide from the table. May be a single column name.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def on_row_double_press(self, callback: RowPressCallback) -> "UITable":
        """
        Add a callback for when a row is double clicked.
        *Deprecated: Use the on_row_double_press keyword arg instead.

        Args:
            callback: The callback function to run when a row is double clicked.
              The first parameter is the row index, and the second is the row data provided in a dictionary where the
              column names are the keys.

        Returns:
            A new UITable
        """
        warn(
            "on_row_double_press function is deprecated. Use the on_row_double_press keyword arg instead.",
            DeprecationWarning,
            stacklevel=2,
        )
        return self._with_prop("on_row_double_press", callback)

    def selection_mode(self, mode: SelectionMode) -> "UITable":
        """
        Set the selection mode for the table.

        Args:
            mode: The selection mode to use. Must be one of `"ROW"`, `"COLUMN"`, or `"CELL"`
            `"ROW"` selects the entire row of the cell you click on.
            `"COLUMN"` selects the entire column of the cell you click on.
            `"CELL"` selects only the cells you click on.

        Returns:
            A new UITable
        """
        raise NotImplementedError()

    def sort(
        self,
        by: str | Sequence[str],
        direction: TableSortDirection | Sequence[TableSortDirection] | None = None,
    ) -> "UITable":
        """
        Provide the default sort that will be used by the UI.

        Args:
            by: The column(s) to sort by. May be a single column name, or a list of column names.
            direction: The sort direction(s) to use. If provided, that must match up with the columns provided.
                May be a single sort direction, or a list of sort directions. The possible sort directions are
                `"ASC"` `"DESC"`, `SortDirection.ASCENDING`, and `SortDirection.DESCENDING`.
                Defaults to "ASC".

        Returns:
            A new UITable
        """
        direction_list: Sequence[TableSortDirection] = []
        if direction:
            direction_list_unmapped = (
                direction if isinstance(direction, Sequence) else [direction]
            )

            # map deephaven sort direction to frontend sort direction
            direction_list = [
                remap_sort_direction(direction) for direction in direction_list_unmapped
            ]

        by_list = [by] if isinstance(by, str) else by

        if direction and len(direction_list) != len(by_list):
            raise ValueError("by and direction must be the same length")

        if direction:
            sorts = [
                {"column": column, "direction": direction, "is_abs": False}
                for column, direction in zip(by_list, direction_list)
            ]
        else:
            sorts = [
                {"column": column, "direction": "ASC", "is_abs": False}
                for column in by_list
            ]

        return self._with_prop("sorts", sorts)
