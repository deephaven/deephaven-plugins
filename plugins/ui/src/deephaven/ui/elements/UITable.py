from __future__ import annotations

import logging
from typing import Any, Callable, Literal, Sequence
from deephaven.table import Table
from deephaven import SortDirection
from .Element import Element
from ..types import (
    ColumnName,
    AggregationOperation,
    SearchMode,
    QuickFilterExpression,
    Color,
    ContextMenuAction,
    CellIndex,
    RowData,
    ContextMenuMode,
    DataBarAxis,
    DataBarValuePlacement,
    DataBarDirection,
    RowIndex,
    RowDataMap,
    SelectionMode,
    TableSortDirection,
)
from .._internal import dict_to_camel_case, RenderContext

logger = logging.getLogger(__name__)


def remap_sort_direction(direction: TableSortDirection) -> Literal["ASC", "DESC"]:
    """
    Remap the sort direction to the grid sort direction

    Args:
        direction: TableSortDirection: The deephaven sort direction or
        grid sort direction to remap

    Returns:
        Literal["ASC", "DESC"]: The grid sort direction
    """
    if direction == SortDirection.ASCENDING:
        return "ASC"
    elif direction == SortDirection.DESCENDING:
        return "DESC"
    elif direction in {"ASC", "DESC"}:
        return direction
    raise ValueError(f"Invalid table sort direction: {direction}")


class UITable(Element):
    """
    Wrap a Table with some extra props for giving hints to displaying a table
    """

    _table: Table
    """
    The table that is wrapped with some extra props
    """

    _props: dict[str, Any]
    """
    The extra props that are added by each method
    """

    def __init__(self, table: Table, props: dict[str, Any] = {}):
        """
        Create a UITable from the passed in table. UITable provides an [immutable fluent interface](https://en.wikipedia.org/wiki/Fluent_interface#Immutability) for adding UI hints to a table.

        Args:
            table: The table to wrap
        """
        self._table = table

        # Store the extra props that are added by each method
        # This is a shallow copy of the props so that we don't mutate the passed in props dict
        self._props = {**props}

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    def _with_prop(self, key: str, value: Any) -> "UITable":
        """
        Create a new UITable with the passed in prop added to the existing props

        Args:
            key: str: The key to add to the props
            value: Any: The value to add with the associated key

        Returns:
            UITable: A new UITable with the passed in prop added to the existing props
        """
        logger.debug("_with_prop(%s, %s)", key, value)
        return UITable(self._table, {**self._props, key: value})

    def _with_appendable_prop(self, key: str, value: Any) -> "UITable":
        """
        Create a new UITable with the passed in prop added to the existing prop
        list (if it exists) or a new list with the passed in value

        Args:
            key: str: The key to add to the props
            value: Any: The value to add with the associated key

        Returns:
            UITable: A new UITable with the passed in prop added to the existing props
        """
        logger.debug("_with_appendable_prop(%s, %s)", key, value)
        existing = self._props.get(key, [])

        if not isinstance(existing, list):
            raise ValueError(f"Expected {key} to be a list")

        value = value if isinstance(value, list) else [value]

        return UITable(self._table, {**self._props, key: existing + value})

    def _with_dict_prop(self, prop_name: str, value: dict) -> "UITable":
        """
        Create a new UITable with the passed in prop in a dictionary.
        This will override any existing prop with the same key within
        the dict stored at prop_name.


        Args:
            prop_name: str: The key to add to the props
            value: Any: The value to add with the associated key

        Returns:
            UITable: A new UITable with the passed in prop added to the existing props
        """
        logger.debug("_with_dict_prop(%s, %s)", prop_name, value)
        existing = self._props.get(prop_name, {})
        new = {**existing, **value}
        return UITable(self._table, {**self._props, prop_name: new})

    def render(self, context: RenderContext) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_camel_case({**self._props, "table": self._table})

    def aggregations(
        self,
        operations: dict[ColumnName, list[AggregationOperation]],
        operation_order: list[AggregationOperation] | None = None,
        default_operation: AggregationOperation = "Skip",
        group_by: list[ColumnName] | None = None,
        show_on_top: bool = False,
    ) -> "UITable":
        """
        Set the totals table to display below the main table.

        Args:
            operations: dict[ColumnName, list[AggregationOperation]]:
                The operations to apply to the columns of the table.
            operation_order: list[AggregationOperation] | None:
                The order in which to display the operations.
            default_operation: AggregationOperation:
                The default operation to apply to columns that do not have an operation specified.
            group_by: list[ColumnName] | None:
                The columns to group by.
            show_on_top: bool:
                Whether to show the totals table above the main table.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def always_fetch_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to always fetch from the server.
        These will not be affected by the users current viewport/horizontal scrolling.
        Useful if you have a column with key value data that you want to always include
        in the data sent for row click operations.

        Args:
            columns: str | list[str]: The columns to always fetch from the server.
                May be a single column name.

        Returns:
            UITable: A new UITable
        """
        return self._with_appendable_prop("always_fetch_columns", columns)

    def back_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to show at the back of the table.
        These will not be moveable in the UI.

        Args:
            columns: str | list[str]: The columns to show at the back of the table.
                May be a single column name.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def can_search(self, mode: SearchMode) -> "UITable":
        """
        Set the search bar to explicitly be accessible or inaccessible, or use the system default.

        Args:
            mode: SearchMode: Set the search bar to explicitly be accessible or inaccessible,
                or use the system default.

        Returns:
            UITable: A new UITable
        """
        if mode == "SHOW":
            return self._with_prop("can_search", True)
        elif mode == "HIDE":
            return self._with_prop("can_search", False)
        elif mode == "DEFAULT":
            new = self._with_prop("can_search", None)
            # pop current can_search value if it exists
            new._props.pop("can_search", None)
            return new

        raise ValueError(f"Invalid search mode: {mode}")

    def column_group(
        self, name: str, children: list[str], color: str | None
    ) -> "UITable":
        """
        Create a group for columns in the table.

        Args:
            name: str: The group name. Must be a valid column name and not a duplicate of another column or group.
            children: list[str]: The children in the group. May contain column names or other group names.
                Each item may only be specified as a child once.
            color: str | None: The hex color string or Deephaven color name.

        Returns:
            UITable: A new UITable
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
            column: ColumnName: The column name
            where: QuickFilterExpression | None: The filter to apply to the expression.
              Uses quick filter format (e.g. `>10`).
            color: Color | None: The text color. Accepts hex color strings or Deephaven color names.
            background_color: The background color. Accepts hex color strings or Deephaven color names.

        Returns:
            UITable: A new UITable
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
            column: ColumnName: The column name
            where: QuickFilterExpression | None: The filter to apply to the expression.
              Uses quick filter format (e.g. `>10`).
            color: Color | None: The text color. Accepts hex color strings or Deephaven color names.
            background_color: The background color. Accepts hex color strings or Deephaven color names.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def context_menu(
        self,
        items: ContextMenuAction
        | list[ContextMenuAction]
        | Callable[[CellIndex, RowData], ContextMenuAction | list[ContextMenuAction]],
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
            items: ContextMenuAction | list[ContextMenuAction] |
                Callable[[CellIndex, RowData], ContextMenuAction | list[ContextMenuAction]]:
                The items to add to the context menu.
                May be a single `ContextMenuAction`, a list of `ContextMenuAction` objects,
                or a callback function that takes the cell index and row data and returns either a single
                `ContextMenuAction` or a list of `ContextMenuAction` objects.
            mode: ContextMenuMode: Which specific context menu(s) to add the menu item(s) to.
                Can be one or more modes.
                Using `None` will add menu items in all cases.
                `CELL`: Triggered from a cell.
                `ROW_HEADER`: Triggered from a row header.
                `COLUMN_HEADER`: Triggered from a column header.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def data_bar(
        self,
        col: str,
        value_col: str = None,
        min: float | str = None,
        max: float | str = None,
        axis: DataBarAxis | None = None,
        positive_color: Color | list[Color] = None,
        negative_color: Color | list[Color] = None,
        value_placement: DataBarValuePlacement | None = None,
        direction: DataBarDirection | None = None,
        opacity: float = None,
        marker_col: str = None,
        marker_color: Color = None,
    ) -> "UITable":
        """
        Applies data bar formatting to the specified column.

        Args:
            col: str: Column to generate data bars in
            value_col: str: Column containing the values to generate data bars from
            min: float | str: Minimum value for data bar scaling or column to get value from
            max: float | str: Maximum value for data bar scaling or column to get value from
            axis: DataBarAxis | None: Orientation of data bar relative to cell
            positive_color: Color | list[Color]: Color for positive bars. Use list of colors to form a gradient
            negative_color: Color | list[Color]: Color for negative bars. Use list of colors to form a gradient
            value_placement: DataBarValuePlacement | None: Orientation of values relative to data bar
            direction: DataBarDirection | None: Orientation of data bar relative to horizontal axis
            opacity: float: Opacity of data bar. Accepts values from 0 to 1
            marker_col: str: Column containing the values to generate markers from
            marker_color: Color: Color for markers

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def format(self, column: ColumnName, format: str) -> "UITable":
        """
        Specify the formatting to display a column in.

        Args:
            column: str: The column name
            format: str: The format to display the column in. Valid format depends on column type

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def freeze_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to freeze to the front of the table.
        These will always be visible and not affected by horizontal scrolling.

        Args:
            columns: str | list[str]: The columns to freeze to the front of the table.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def front_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to show at the front of the table. These will not be moveable in the UI.

        Args:
            columns: str | list[str]: The columns to show at the front of the table.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def hide_columns(self, columns: str | list[str]) -> "UITable":
        """
        Set the columns to hide by default in the table. The user can still resize the columns to view them.

        Args:
            columns: str | list[str]: The columns to hide from the table. May be a single column name.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def on_row_press(
        self, callback: Callable[[RowIndex, RowDataMap], None]
    ) -> "UITable":
        """
        Add a callback for when a press on a row is released (e.g. a row is clicked).

        Args:
            callback: Callable[[RowIndex, RowDataMap], None]: The callback function to run when a row is clicked.
                The first parameter is the row index, and the second is the row data provided in a dictionary where the
                column names are the keys.

        Returns:
            UITable: A new UITable
        """
        raise NotImplementedError()

    def on_row_double_press(
        self, callback: Callable[[RowIndex, RowDataMap], None]
    ) -> "UITable":
        """
        Add a callback for when a row is double clicked.

        Args:
            callback: Callable[[RowIndex, RowDataMap], None]: The callback function to run when a row is double clicked.
              The first parameter is the row index, and the second is the row data provided in a dictionary where the
              column names are the keys.

        Returns:
            UITable: A new UITable
        """
        return self._with_prop("on_row_double_press", callback)

    def quick_filter(
        self, filter: dict[ColumnName, QuickFilterExpression]
    ) -> "UITable":
        """
        Add a quick filter for the UI to apply to the table.

        Args:
            filter: dict[ColumnName, QuickFilterExpression]: The quick filter to apply to the table.

        Returns:
            UITable: A new UITable
        """
        return self._with_dict_prop("filters", filter)

    def selection_mode(self, mode: SelectionMode) -> "UITable":
        """
        Set the selection mode for the table.

        Args:
            mode: SelectionMode: The selection mode to use. Must be one of `"ROW"`, `"COLUMN"`, or `"CELL"`
            `"ROW"` selects the entire row of the cell you click on.
            `"COLUMN"` selects the entire column of the cell you click on.
            `"CELL"` selects only the cells you click on.

        Returns:
            UITable: A new UITable
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
            UITable: A new UITable
        """
        direction_list: Sequence[TableSortDirection] = []
        if direction:
            direction_list = direction if isinstance(direction, list) else [direction]
            # map deephaven sort direction to frontend sort direction
            direction_list = [
                remap_sort_direction(direction) for direction in direction_list
            ]

        by_list = by if isinstance(by, list) else [by]

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
