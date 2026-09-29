from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal, Any, Union
import logging
from deephaven.table import Table, RollupTable, TreeTable
from ..elements import Element, resolve
from ..elements.UriElement import UriElement
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
    TableLike,
)
from .._internal import dict_to_react_props

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

SortDirection = Literal["ASC", "DESC"]


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
class TableSort:
    """
    A sort configuration for a table.

    Args:
        column: The column to sort.
        direction: The sort direction. One of "ASC" or "DESC".
        is_abs: Whether to sort by absolute value.
    Returns:
        The TableSort configuration.
    """

    column: ColumnName
    direction: SortDirection = "ASC"
    is_abs: bool = False


TableSortLike = Union[ColumnName, TableSort]


@dataclass
class TableFormat:
    """
    A formatting rule for a table.

    Args:
        cols: The columns to format. If None, the format will apply to the entire row.
            Required when using mode=TableDatabar()
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
    color: Color | TableHeatmap | None = None
    background_color: Color | TableHeatmap | None = None
    alignment: Literal["left", "center", "right"] | None = None
    value: str | None = None
    mode: TableDatabar | None = None


@dataclass
class TableHeatmap:
    """
    A heatmap configuration for a table.

    Args:
        min: Minimum value for the heatmap range. Defaults to the column minimum.
        max: Maximum value for the heatmap range. Defaults to the column maximum.
        mid: Midpoint data value for diverging color scales.
            Defaults to None (sequential scale, no midpoint).
        gradient: Color scale for the gradient. Accepts:
            A string for a predefined scale
            A list of colors
            A list of (position, color) tuples for explicit stops
            Defaults to a sequential gradient (or diverging if mid is set).
    Returns:
        The TableHeatmap configuration.
    """

    type: str = field(default="heatmap", init=False)
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    mid: float | None = None
    gradient: str | list[Color] | list[tuple[float, Color]] | None = None


@dataclass
class TableDatabar:
    """
    A databar configuration for a table.

    Args:
        value_column: Name of the column to use as the value for the databar.
            If not provided, the databar will use the column value.

            This can be useful if you want to display a databar with
            a log scale, but display the actual value in the cell.
            In this case, the value_column would be the log of the actual value.
        min: Minimum value for the databar. Defaults to the minimum value in the column.

            If a column name is provided, the minimum value will be the value in that column.
            If a constant is provided, the minimum value will be that constant.
        max: Maximum value for the databar. Defaults to the maximum value in the column.

            If a column name is provided, the maximum value will be the value in that column.
            If a constant is provided, the maximum value will be that constant.
        axis: Whether the databar 0 value should be proportional to the min and max values,
            in the middle of the cell, or on one side of the databar based on direction.
        direction: The direction of the databar.
        value_placement: Placement of the value relative to the databar.
        color: The color of the databar. Can be a single color string,
            a list of color strings for a gradient, or a dictionary with
            "positive" and/or "negative" keys mapping to a color or gradient.
        opacity: The opacity of the databar.
        markers: List of marker lines to display on the databar.
    Returns:
        The TableDatabar.
    """

    type: str = field(default="dataBar", init=False)
    value_column: ColumnName | None = None
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    axis: Literal["proportional", "middle", "directional"] | None = None
    direction: Literal["LTR", "RTL"] | None = None
    value_placement: Literal["beside", "overlap", "hide"] | None = None
    color: Color | list[Color] | dict[str, Color | list[Color]] | None = None
    opacity: float | None = None
    markers: list[dict[str, Any]] | None = None


def _validate_table_format(
    format_: list[TableFormat] | TableFormat,
    table: TableLike | UriElement | str,
) -> None:
    """Validate format rules for the table.

    Args:
        format_: A formatting rule or list of formatting rules to validate.
        table: The table the format rules will be applied to. Used to validate
            that rules are compatible with the table type.

    Raises:
        ValueError: If a format rule has a mode but no cols.
        ValueError: If a format rule has a heatmap but no cols.
        ValueError: If a heatmap gradient has fewer than 2 colors.
        ValueError: If a format rule uses if_ on a rollup or tree table.
    """
    format_list = format_ if isinstance(format_, list) else [format_]
    is_hierarchical = isinstance(table, (RollupTable, TreeTable))
    for f in format_list:
        if f.mode is not None and f.cols is None:
            raise ValueError("TableFormat with mode requires cols to be specified.")

        if is_hierarchical and f.if_ is not None:
            raise ValueError(
                "TableFormat if_ is not supported on rollup or tree tables."
            )

        if isinstance(f.color, TableHeatmap):
            if f.cols is None:
                raise ValueError(
                    "TableFormat with TableHeatmap requires cols to be specified."
                )
            if isinstance(f.color.gradient, list) and len(f.color.gradient) < 2:
                raise ValueError("TableHeatmap gradient must have at least 2 colors.")

        if isinstance(f.background_color, TableHeatmap):
            if f.cols is None:
                raise ValueError(
                    "TableFormat with TableHeatmap requires cols to be specified."
                )
            if (
                isinstance(f.background_color.gradient, list)
                and len(f.background_color.gradient) < 2
            ):
                raise ValueError("TableHeatmap gradient must have at least 2 colors.")


_MAX_SELECTED_ROWS = 10_000
"""Maximum rows a context menu selection may snapshot before it is rejected."""


def _snapshot_selection(filtered: Table) -> Table:
    """Snapshot a resolved selection, rejecting selections that are too large.

    Args:
        filtered: The resolved (still live) selection to snapshot.

    Returns:
        A static snapshot of *filtered*.

    Raises:
        ValueError: If the selection exceeds ``_MAX_SELECTED_ROWS`` rows.
    """
    size = filtered.size
    if size > _MAX_SELECTED_ROWS:
        raise ValueError(
            f"ui.table selection of {size} rows exceeds the maximum of "
            f"{_MAX_SELECTED_ROWS}. Narrow the selection before running this action."
        )
    return filtered.snapshot()


def _resolve_selection(
    selected_ranges: list[dict],
    tbl: Table,
) -> Table:
    """Resolve a list of selected row ranges into a static snapshot Table.

    Args:
        selected_ranges: List of range dicts with ``start_row`` and ``end_row`` keys
            (model-index positions in the sorted/filtered view).
        tbl: The source Table to slice from.

    Returns:
        A static snapshot Table containing the selected rows.  An empty table
        with the same schema is returned when ``selected_ranges`` is empty.

    Raises:
        ValueError: If the selection exceeds ``_MAX_SELECTED_ROWS`` rows.
    """
    from deephaven import merge

    # Column bounds are ignored; a cell selection spans the full row per IrisGrid convention.
    slices = [
        tbl.slice(r["start_row"], r["end_row"] + 1)
        for r in selected_ranges
        if r.get("start_row") is not None and r.get("end_row") is not None
    ]
    combined = (
        merge(slices) if len(slices) > 1 else slices[0] if slices else tbl.slice(0, 0)
    )
    return _snapshot_selection(combined)


def _resolve_keyed_selection(
    selected_keys: dict,
    tbl: Table,
) -> Table:
    """Resolve a key-based selection into a static snapshot Table.

    Mirrors IrisGrid's ``createFilteredByKeysTable``: an empty non-inverted
    selection matches no rows, while an empty inverted selection matches all rows.

    Args:
        selected_keys: Dict with ``key_columns``, ``key_values`` and ``inverted``.
            ``key_values`` holds one list of values per selected row, ordered to
            match ``key_columns``.
        tbl: The source Table to filter, in the sort/filter state the user sees.

    Returns:
        A static snapshot Table containing the selected rows.

    Raises:
        ValueError: If the selection exceeds ``_MAX_SELECTED_ROWS`` rows.
    """
    from deephaven import new_table
    from deephaven.column import InputColumn

    key_columns = selected_keys.get("key_columns") or []
    key_values = selected_keys.get("key_values") or []
    inverted = bool(selected_keys.get("inverted"))

    if not key_columns or not key_values:
        return _snapshot_selection(tbl if inverted else tbl.slice(0, 0))

    # Build the filter columns with the source table's own dtypes. Letting
    # new_table infer from the JSON values produces a mismatched (often PyObject)
    # column type, which where_in rejects.
    source_types = {c.name: c.data_type for c in tbl.columns}
    key_table = new_table(
        [
            InputColumn(
                name=name,
                data_type=source_types[name],
                input_data=[row[i] for row in key_values],
            )
            for i, name in enumerate(key_columns)
            if name in source_types
        ]
    )
    filtered = (
        tbl.where_not_in(key_table, key_columns)
        if inverted
        else tbl.where_in(key_table, key_columns)
    )
    return _snapshot_selection(filtered)


class _ContextMenuData(dict):
    """Callback data whose ``selected_rows`` Table is resolved on first access.

    Resolving a selection slices/filters and snapshots the table, and is subject to
    ``_MAX_SELECTED_ROWS``. Most callbacks never look at the selection, so doing that
    work eagerly would both waste time and reject large selections for actions that
    do not care about them.

    Note ``keys()``, ``items()`` and iteration only include ``selected_rows`` once it
    has been accessed, since listing it would force the resolution this class exists
    to avoid.
    """

    def __init__(self, data: dict, resolver: Any) -> None:
        super().__init__(data)
        self._resolver = resolver

    def _resolve_selected_rows(self) -> Table:
        if not super().__contains__("selected_rows"):
            super().__setitem__("selected_rows", self._resolver())
        return super().__getitem__("selected_rows")

    def __getitem__(self, key: str) -> Any:
        if key == "selected_rows":
            return self._resolve_selected_rows()
        return super().__getitem__(key)

    def get(self, key: str, default: Any = None) -> Any:
        if key == "selected_rows":
            return self._resolve_selected_rows()
        return super().get(key, default)

    def __contains__(self, key: object) -> bool:
        return key == "selected_rows" or super().__contains__(key)


def _add_selected_rows(data: dict, tbl: Table) -> dict:
    """Enrich a context menu callback data dict with a ``selected_rows`` Table.

    Pops the internal ``_table``, ``_visible_columns``, ``selected_ranges`` and
    ``selected_keys`` entries from *data* and exposes the selection as
    ``data["selected_rows"]``, resolved lazily on first access.

    Keyed tables (created with ``with_keys``) send ``selected_keys`` and are matched
    by value; all other tables send ``selected_ranges`` and are matched by position.

    Args:
        data: Raw callback params dict received from the JS callable invocation.
        tbl: The Python-side source Table (used as fallback when no ``_table``
            reference was injected by JS).

    Returns:
        A copy of *data* with ``selected_rows`` available and internal keys removed.
    """
    data = dict(data)
    # Use the model table injected by JS (sorted/filtered) when available.
    model_tbl = data.pop("_table", tbl)
    visible_columns = data.pop("_visible_columns", None)
    selected_keys = data.pop("selected_keys", None)
    selected_ranges = data.pop("selected_ranges", [])

    def resolve() -> Table:
        # A rollup or tree applied in the UI replaces the model table with a
        # hierarchical one, whose rows are aggregates rather than source rows.
        if not isinstance(model_tbl, Table):
            raise ValueError(
                "ui.table context menu selection is not supported for rollup or "
                "tree tables."
            )
        # The client sends a marker instead of the keys when there are too many to
        # serialize. Raise only here, so actions that ignore the selection still run.
        if selected_keys and selected_keys.get("too_large"):
            raise ValueError(
                f"ui.table selection of {selected_keys.get('count')} rows is too "
                "large to send to the server. Narrow the selection before running "
                "this action."
            )
        selected_rows = (
            _resolve_keyed_selection(selected_keys, model_tbl)
            if selected_keys
            else _resolve_selection(selected_ranges, model_tbl)
        )
        # Apply column order/visibility to match what the user sees.
        return selected_rows.view(visible_columns) if visible_columns else selected_rows

    return _ContextMenuData(data, resolve)


def _wrap_context_menu_item(
    item: ResolvableContextMenuItem,
    tbl: Table,
) -> Any:
    """Wrap a context menu item so its callbacks receive ``selected_rows`` instead of raw ``selected_ranges``.

    Handles all three item shapes:

    * **Dynamic generator** (callable) - wrapped so the generator receives an
      enriched data dict and its returned items are recursively wrapped.
    * **Action item** (dict with ``"action"`` key) - the action callable is
      wrapped to receive the enriched data dict.
    * **Submenu item** (dict with ``"actions"`` key) - each nested item is
      recursively wrapped.

    Args:
        item: A ``ResolvableContextMenuItem`` - either a callable generator or
            an action/submenu dict.
        tbl: The source Table passed to :func:`_add_selected_rows`.

    Returns:
        A wrapped version of *item* with the same shape.
    """
    if callable(item) and not isinstance(item, dict):

        def wrapped_generator(data: Any, _item: Any = item) -> Any:
            result = _item(_add_selected_rows(data, tbl))
            if isinstance(result, list):
                return [_wrap_context_menu_item(r, tbl) for r in result]
            return _wrap_context_menu_item(result, tbl) if result is not None else None

        return wrapped_generator
    elif isinstance(item, dict):
        wrapped = dict(item)
        if "action" in wrapped and callable(wrapped["action"]):
            wrapped["action"] = lambda data, _a=wrapped["action"]: _a(
                _add_selected_rows(data, tbl)
            )
        if "actions" in wrapped and isinstance(wrapped["actions"], list):
            wrapped["actions"] = [
                _wrap_context_menu_item(a, tbl) for a in wrapped["actions"]
            ]
        return wrapped
    return item


def _normalize_table_sorts(
    sorts: TableSortLike | list[TableSortLike],
) -> list[dict[str, Any]]:
    """Normalize table sorts into the dehydrated sort shape used by iris-grid."""

    sort_list = sorts if isinstance(sorts, list) else [sorts]
    normalized: list[dict[str, Any]] = []
    for sort in sort_list:
        if isinstance(sort, str):
            sort = TableSort(column=sort)
        elif not isinstance(sort, TableSort):
            raise ValueError(
                "Table sorts must be a column name, TableSort, or list of column "
                f"names and TableSort instances. Received {type(sort).__name__}."
            )

        direction = sort.direction.upper()
        if direction not in ("ASC", "DESC"):
            raise ValueError(
                f"Invalid sort direction: {sort.direction}. Expected 'ASC' or 'DESC'."
            )
        normalized.append(
            {
                "column": sort.column,
                "direction": direction,
                "isAbs": sort.is_abs,
            }
        )

    return normalized


class table(Element):
    """
    Customization to how a table is displayed, how it behaves, and listen to UI events.

    Args:
        table: The table to wrap. May be a UriElement or URI string.
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
        sorts: The sorts to apply to the table.
            These are UI-controlled sorts (similar to reverse) rather than engine-transformed table data.
            User changes to the sort state are persisted and restored on reload.
            Accepts a column name, TableSort, or list containing column names and TableSort instances.
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
        table: TableLike | UriElement | str,
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
        sorts: TableSortLike | list[TableSortLike] | None = None,
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
        # Keep this as the first line to prevent local vars from being captured as props
        props = locals()

        if on_selection_change is not None and always_fetch_columns is None:
            raise ValueError(
                "ui.table on_selection_change requires always_fetch_columns to be set"
            )

        if format_ is not None:
            _validate_table_format(format_, table)

        if sorts is not None:
            props["sorts"] = _normalize_table_sorts(sorts)

        props["table"] = resolve(table) if isinstance(table, str) else table

        tbl = props["table"]
        if isinstance(tbl, Table):
            # Wrap context menu items so user callbacks receive `selected_rows` (a
            # snapshot Table) instead of the raw `selected_ranges` indices from JS.
            # Only possible for plain Table - RollupTable/TreeTable lack slice support.
            if context_menu is not None:
                items = (
                    context_menu if isinstance(context_menu, list) else [context_menu]
                )
                props["context_menu"] = [_wrap_context_menu_item(i, tbl) for i in items]
            if context_header_menu is not None:
                items = (
                    context_header_menu
                    if isinstance(context_header_menu, list)
                    else [context_header_menu]
                )
                props["context_header_menu"] = [
                    _wrap_context_menu_item(i, tbl) for i in items
                ]

        del props["self"]
        self._props = props
        self._key = props.get("key")

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    @property
    def key(self) -> str | None:
        return self._key

    def render(self) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_react_props(self._props)
