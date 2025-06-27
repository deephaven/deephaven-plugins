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


# Color values for the DH color palette exposed to end users in spectrum components
# https://github.com/deephaven/web-client-ui/blob/main/packages/components/src/theme/colorUtils.ts
DeephavenColor = Literal[
    "gray-50",
    "gray-75",
    "gray-100",
    "gray-200",
    "gray-300",
    "gray-400",
    "gray-500",
    "gray-600",
    "gray-700",
    "gray-800",
    "gray-900",
    "red-100",
    "red-200",
    "red-300",
    "red-400",
    "red-500",
    "red-600",
    "red-700",
    "red-800",
    "red-900",
    "red-1000",
    "red-1100",
    "red-1200",
    "red-1300",
    "red-1400",
    "orange-100",
    "orange-200",
    "orange-300",
    "orange-400",
    "orange-500",
    "orange-600",
    "orange-700",
    "orange-800",
    "orange-900",
    "orange-1000",
    "orange-1100",
    "orange-1200",
    "orange-1300",
    "orange-1400",
    "yellow-100",
    "yellow-200",
    "yellow-300",
    "yellow-400",
    "yellow-500",
    "yellow-600",
    "yellow-700",
    "yellow-800",
    "yellow-900",
    "yellow-1000",
    "yellow-1100",
    "yellow-1200",
    "yellow-1300",
    "yellow-1400",
    "chartreuse-100",
    "chartreuse-200",
    "chartreuse-300",
    "chartreuse-400",
    "chartreuse-500",
    "chartreuse-600",
    "chartreuse-700",
    "chartreuse-800",
    "chartreuse-900",
    "chartreuse-1000",
    "chartreuse-1100",
    "chartreuse-1200",
    "chartreuse-1300",
    "chartreuse-1400",
    "celery-100",
    "celery-200",
    "celery-300",
    "celery-400",
    "celery-500",
    "celery-600",
    "celery-700",
    "celery-800",
    "celery-900",
    "celery-1000",
    "celery-1100",
    "celery-1200",
    "celery-1300",
    "celery-1400",
    "green-100",
    "green-200",
    "green-300",
    "green-400",
    "green-500",
    "green-600",
    "green-700",
    "green-800",
    "green-900",
    "green-1000",
    "green-1100",
    "green-1200",
    "green-1300",
    "green-1400",
    "seafoam-100",
    "seafoam-200",
    "seafoam-300",
    "seafoam-400",
    "seafoam-500",
    "seafoam-600",
    "seafoam-700",
    "seafoam-800",
    "seafoam-900",
    "seafoam-1000",
    "seafoam-1100",
    "seafoam-1200",
    "seafoam-1300",
    "seafoam-1400",
    "cyan-100",
    "cyan-200",
    "cyan-300",
    "cyan-400",
    "cyan-500",
    "cyan-600",
    "cyan-700",
    "cyan-800",
    "cyan-900",
    "cyan-1000",
    "cyan-1100",
    "cyan-1200",
    "cyan-1300",
    "cyan-1400",
    "blue-100",
    "blue-200",
    "blue-300",
    "blue-400",
    "blue-500",
    "blue-600",
    "blue-700",
    "blue-800",
    "blue-900",
    "blue-1000",
    "blue-1100",
    "blue-1200",
    "blue-1300",
    "blue-1400",
    "indigo-100",
    "indigo-200",
    "indigo-300",
    "indigo-400",
    "indigo-500",
    "indigo-600",
    "indigo-700",
    "indigo-800",
    "indigo-900",
    "indigo-1000",
    "indigo-1100",
    "indigo-1200",
    "indigo-1300",
    "indigo-1400",
    "purple-100",
    "purple-200",
    "purple-300",
    "purple-400",
    "purple-500",
    "purple-600",
    "purple-700",
    "purple-800",
    "purple-900",
    "purple-1000",
    "purple-1100",
    "purple-1200",
    "purple-1300",
    "purple-1400",
    "fuchsia-100",
    "fuchsia-200",
    "fuchsia-300",
    "fuchsia-400",
    "fuchsia-500",
    "fuchsia-600",
    "fuchsia-700",
    "fuchsia-800",
    "fuchsia-900",
    "fuchsia-1000",
    "fuchsia-1100",
    "fuchsia-1200",
    "fuchsia-1300",
    "fuchsia-1400",
    "magenta-100",
    "magenta-200",
    "magenta-300",
    "magenta-400",
    "magenta-500",
    "magenta-600",
    "magenta-700",
    "magenta-800",
    "magenta-900",
    "magenta-1000",
    "magenta-1100",
    "magenta-1200",
    "magenta-1300",
    "magenta-1400",
    "negative",
    "notice",
    "positive",
    "info",
    # Additional DH ColorValues:
    "accent",
    "accent-100",
    "accent-200",
    "accent-300",
    "accent-400",
    "accent-500",
    "accent-600",
    "accent-700",
    "accent-800",
    "accent-900",
    "accent-1000",
    "accent-1100",
    "accent-1200",
    "accent-1300",
    "accent-1400",
    "bg",
    "content-bg",
    "subdued-content-bg",
    "surface-bg",
    "fg",
]
CSSColor = str
Color = Union[DeephavenColor, CSSColor]

# TODO #601: Use list of available icons once created
Icon = str


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


class ColumnGroup(TypedDict):
    """
    Group of columns in a table.
    Groups are displayed in the table header.
    Groups may be nested.
    """

    name: str
    """
    Name of the column group.
    Must follow column naming rules and be unique within the column and group names.
    """

    children: List[str]
    """
    List of child columns or groups in the group.
    Names are other columns or groups.
    """

    color: Color
    """
    Color for the group header.
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
RowDataMap = Dict[ColumnName, RowDataValue]
RowPressCallback = Callable[[RowDataMap], None]
CellPressCallback = Callable[[CellData], None]
ColumnPressCallback = Callable[[ColumnName], None]
SelectionChangeCallback = Callable[[List[RowDataMap]], None]
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
ContextMenuModeOption = Literal["CELL", "ROW_HEADER", "COLUMN_HEADER"]
ContextMenuMode = Union[ContextMenuModeOption, List[ContextMenuModeOption], None]
# TODO: Fill in the list of Deephaven Colors we allow
LockType = Literal["shared", "exclusive"]
QuickFilterExpression = str
RowData = Dict[ColumnName, Any]
ColumnData = List[Any]
TableData = Dict[ColumnName, ColumnData]
SelectionArea = Literal["CELL", "ROW", "COLUMN"]
SelectionMode = Literal["SINGLE", "MULTIPLE"]
SelectionStyle = Literal["checkbox", "highlight"]
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
BreadcrumbsSize = Literal["S", "M", "L"]
DividerSize = Literal["S", "M", "L"]
ListViewOverflowMode = Literal["truncate", "wrap"]
ActionGroupDensity = Literal["compact", "regular"]
TabDensity = Literal["compact", "regular"]
InlineAlertVariant = Literal["neutral", "info", "positive", "notice", "negative"]
LinkVariant = Literal["primary", "secondary", "over_background"]
AvatarSize = Literal[
    "avatar-size-50",
    "avatar-size-75",
    "avatar-size-100",
    "avatar-size-200",
    "avatar-size-300",
    "avatar-size-400",
    "avatar-size-500",
    "avatar-size-600",
    "avatar-size-700",
]
BadgeVariant = Literal[
    "neutral",
    "info",
    "positive",
    "negative",
    "indigo",
    "yellow",
    "magenta",
    "fuchsia",
    "purple",
    "seafoam",
]
Dependencies = Union[Tuple[Any], List[Any]]
Selection = Sequence[Key]
LocalTime = DType
JavaTime = Union[LocalTime, Instant, ZonedDateTime]
LocalTimeConvertible = Union[
    None,
    LocalTime,
    int,
    str,
    datetime.time,
    datetime.datetime,
    numpy.datetime64,
    pandas.Timestamp,
]
Time = Union[
    LocalTime,
    Instant,
    ZonedDateTime,
    LocalTimeConvertible,
    InstantConvertible,
    ZonedDateTimeConvertible,
]
TimeGranularity = Literal["HOUR", "MINUTE", "SECOND"]
JavaDateFormat = str


class DateFormatOptions(TypedDict):
    """
    Options for formatting dates.
    """

    date_format: JavaDateFormat
    """
    A string that follows the GWT Java DateTimeFormat syntax.
    """


class DateRange(TypedDict):
    """
    Range of date values for a date range picker.
    """

    start: Date
    """
    Start value for the date range.
    """

    end: Date
    """
    End value for the date range.
    """


class NumberRange(TypedDict):
    """
    Range of number values.
    """

    start: float
    """
    Start value for the number range.
    """

    end: float
    """
    End value for the number range.
    """


ToastVariant = Literal["positive", "negative", "neutral", "info"]


_DISABLE_NULLISH_CONSTRUCTORS = False


class UndefinedType:
    """
    Placeholder for undefined values.
    """

    def __init__(self) -> None:
        if _DISABLE_NULLISH_CONSTRUCTORS:
            raise NotImplementedError

    def __bool__(self) -> bool:
        return False

    def __copy__(self) -> "UndefinedType":
        return self

    def __deepcopy__(self, _: Any) -> "UndefinedType":
        return self

    def __eq__(self, other: object) -> bool:
        return isinstance(other, UndefinedType) or other is None


Undefined = UndefinedType()
_DISABLE_NULLISH_CONSTRUCTORS = True
