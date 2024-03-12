from typing import Any, Dict, Literal, Union, List, Tuple, Callable, TypedDict
from deephaven import SortDirection


class CellData(TypedDict):
    """
    Data for one cell. Returned with click handlers.
    """

    type: str
    """
    Type of the cell data
    """

    text: str
    """
    Text of the cell data
    """

    value: Any
    """
    Raw value of the cell data
    """


class RowDataValue(CellData):
    """
    Data for value of one column in a row. Returned with row press handlers.
    """

    isExpandable: bool
    """
    Whether this row is expandable.
    """

    isGrouped: bool
    """
    Whether this row is grouped.
    """


ColumnIndex = int
"""
Index of a column in a table.
"""

RowIndex = int
"""
Index of a row in a table.
"""

CellIndex = Tuple[ColumnIndex, RowIndex]
"""
Index of a cell in a table.
"""

GridIndex = Tuple[Union[ColumnIndex, None], Union[RowIndex, None]]
"""
Index of a spot on the grid. A value of None indicates a header row or column.
"""


ColumnName = str
RowDataMap = Dict[str, Any]
RowPressCallback = Callable[[RowIndex, RowDataMap], None]
CellPressCallback = Callable[[CellIndex, CellData], None]
ColumnPressCallback = Callable[[ColumnName], None]
AggregationOperation = Literal[
    "COUNT",
    "COUNT_DISTINCT",
    "DISTINCT",
    "MIN",
    "MAX",
    "SUM",
    "ABS_SUM",
    "VAR",
    "AVG",
    "STD",
    "FIRST",
    "LAST",
    "UNIQUE",
    "SKIP",
]
DeephavenColor = Literal["salmon", "lemonchiffon"]
HexColor = str
Color = Union[DeephavenColor, HexColor]
ContextMenuAction = Dict[str, Any]
ContextMenuModeOption = Literal["CELL", "ROW_HEADER", "COLUMN_HEADER"]
ContextMenuMode = Union[ContextMenuModeOption, List[ContextMenuModeOption], None]
DataBarAxis = Literal["PROPORTIONAL", "MIDDLE", "DIRECTIONAL"]
DataBarDirection = Literal["LTR", "RTL"]
DataBarValuePlacement = Literal["BESIDE", "OVERLAP", "HIDE"]
# TODO: Fill in the list of Deephaven Colors we allow
LockType = Literal["shared", "exclusive"]
QuickFilterExpression = str
RowData = Dict[ColumnName, Any]
ColumnData = List[Any]
TableData = Dict[ColumnName, ColumnData]
SearchMode = Literal["SHOW", "HIDE", "DEFAULT"]
SelectionMode = Literal["CELL", "ROW", "COLUMN"]
Sentinel = Any
TransformedData = Any
StringSortDirection = Literal["ASC", "DESC"]
TableSortDirection = Union[StringSortDirection, SortDirection]
# Stringable is a type that is naturally convertible to a string
Stringable = Union[str, int, float, bool]
Key = Stringable
Dependencies = Union[Tuple[Any], List[Any]]
