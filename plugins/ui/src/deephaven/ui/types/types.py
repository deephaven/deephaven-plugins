from typing import Any, Dict, Literal, Union, List
from deephaven import SortDirection

RowIndex = Union[int, None]
RowDataMap = Dict[str, Any]
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
ColumnIndex = Union[int, None]
CellIndex = [RowIndex, ColumnIndex]
DeephavenColor = Literal["salmon", "lemonchiffon"]
HexColor = str
Color = Union[DeephavenColor, HexColor]
# A ColumnIndex of None indicates a header row
ColumnName = str
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
# A RowIndex of None indicates a header column
RowIndex = Union[int, None]
ColumnData = List[Any]
TableData = Dict[ColumnName, ColumnData]
SearchMode = Literal["SHOW", "HIDE", "DEFAULT"]
SelectionMode = Literal["CELL", "ROW", "COLUMN"]
Sentinel = Any
TransformedData = Any
TableSortDirection = Union[Literal["ASC", "DESC"], SortDirection]
