from typing import Any, Dict, Literal, Union, List, Tuple, Optional, Callable, TypedDict
from deephaven import SortDirection

RowIndex = Optional[int]
RowDataMap = Dict[str, Any]
RowPressCallback = Callable[[RowIndex, RowDataMap], None]
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
CellIndex = Tuple[RowIndex, ColumnIndex]
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
RowIndex = Optional[int]
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

PlacementOptions = Literal[
    "auto",
    "auto-start",
    "auto-end",
    "top",
    "top-start",
    "top-end",
    "bottom",
    "bottom-start",
    "bottom-end",
    "right",
    "right-start",
    "right-end",
    "left",
    "left-start",
    "left-end",
]


class TooltipOptions(TypedDict):
    placement: Optional[PlacementOptions]
