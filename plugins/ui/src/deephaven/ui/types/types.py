import sys
from typing import (
    Any,
    Dict,
    Iterable,
    Literal,
    Union,
    List,
    Tuple,
    Callable,
    Sequence,
)

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict, NotRequired
else:
    from typing import TypedDict, NotRequired

import datetime
import pandas
import numpy

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


class ContextMenuActionParams(TypedDict):
    """
    Parameters given to a context menu action
    """

    value: Any
    """
    Value of the cell.
    """

    text_value: str
    """
    Rendered text for the cell.
    """

    column_name: str
    """
    Name of the column.
    """

    is_column_header: bool
    """
    Whether the context menu was opened on a column header.
    """

    is_row_header: bool
    """
    Whether the context menu was opened on a row header.
    """


ContextMenuAction = Callable[[ContextMenuActionParams], None]
"""
The action to execute when the context menu item is clicked.
"""


class ContextMenuItemBase(TypedDict):
    """
    Base props that context menu items and submenu items share.
    """

    title: str
    """
    Title to display for the action.
    """

    icon: NotRequired[str]
    """
    The name of the icon to display next to the action.
    The name must be a valid name for ui.icon.
    """

    description: NotRequired[str]
    """
    Description for the action. Will be used as a tooltip for the action.
    """


class ContextMenuActionItem(ContextMenuItemBase):
    """
    An item that appears in a context menu and performs an action when clicked.
    """

    action: ContextMenuAction
    """
    Action to run when the menu item is clicked.
    """


class ContextMenuSubmenuItem(ContextMenuItemBase):
    """
    An item that contains a submenu for a context menu.
    """

    actions: List["ResolvableContextMenuItem"]
    """
    A list of actions that will form the submenu for the item.
    """


ContextMenuItem = Union[ContextMenuActionItem, ContextMenuSubmenuItem]
"""
An item that can appear in a context menu.
May contain an action item or a submenu item.
"""

ResolvableContextMenuItem = Union[
    ContextMenuItem,
    Callable[
        [ContextMenuActionParams], Union[ContextMenuItem, List[ContextMenuItem], None]
    ],
]
"""
A context menu item or a function that returns a list of context menu items or None.
This can be used to dynamically generate context menu items based on the cell the menu is opened on.
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

ColumnName = str
RowDataMap = Dict[str, Any]
RowPressCallback = Callable[[RowDataMap], None]
CellPressCallback = Callable[[CellData], None]
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
