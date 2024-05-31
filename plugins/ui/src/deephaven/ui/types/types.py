import datetime
import pandas
import numpy
from typing import (
    Any,
    Dict,
    Iterable,
    Literal,
    Union,
    List,
    Tuple,
    Callable,
    TypedDict,
    Sequence,
)
from deephaven import SortDirection
from deephaven.dtypes import DType


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


class SliderChange(TypedDict):
    """
    Data for a range slider change event.
    """

    start: float
    """
    Minimum value of the range slider.
    """

    end: float
    """
    Maximum value of the range slider.
    """


SliderChangeCallable = Callable[[SliderChange], None]


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
SelectionArea = Literal["CELL", "ROW", "COLUMN"]
SelectionMode = Literal["SINGLE", "MULTIPLE"]
Sentinel = Any
TransformedData = Any
ActionMenuDirection = Literal["bottom", "top", "left", "right", "start", "end"]
StringSortDirection = Literal["ASC", "DESC"]
TableSortDirection = Union[StringSortDirection, SortDirection]
# Stringable is a type that is naturally convertible to a string
Stringable = Union[str, int, float, bool]
Key = Stringable
ActionKey = Key
SelectedKeys = Literal["all"]
LocalDate = DType
Instant = DType
ZonedDateTime = DType
JavaDate = Union[LocalDate, Instant, ZonedDateTime]
LocalDateConvertible = Union[
    None,
    LocalDate,
    str,
    datetime.date,
    datetime.datetime,
    numpy.datetime64,
    pandas.Timestamp,
]
InstantConvertible = Union[
    None, Instant, int, str, datetime.datetime, numpy.datetime64, pandas.Timestamp  # type: ignore
]
ZonedDateTimeConvertible = Union[
    None, ZonedDateTime, str, datetime.datetime, numpy.datetime64, pandas.Timestamp  # type: ignore
]
Date = Union[
    Instant,
    LocalDate,
    ZonedDateTime,
    LocalDateConvertible,
    InstantConvertible,
    ZonedDateTimeConvertible,
]
Granularity = Literal["DAY", "HOUR", "MINUTE", "SECOND"]
ListViewDensity = Literal["COMPACT", "NORMAL", "SPACIOUS"]
ActionGroupDensity = Literal["compact", "regular"]
Dependencies = Union[Tuple[Any], List[Any]]
Selection = Sequence[Key]
