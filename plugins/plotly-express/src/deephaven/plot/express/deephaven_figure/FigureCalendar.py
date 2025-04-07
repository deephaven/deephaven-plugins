from __future__ import annotations

import sys
from typing import Union, List, Any, Literal

from deephaven.calendar import calendar
import jpy

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict
else:
    from typing import TypedDict

BusinessCalendar = Any
Calendar = Union[bool, str, BusinessCalendar]
Timezone = str
Day = str
Days = List[Day]
Date = str

_JDateTimeUtils = jpy.get_type("io.deephaven.time.DateTimeUtils")


class TimeRange(TypedDict):
    """
    A time range with an open and close time

    Attributes:
        open: The open time
        close: The close time
    """

    open: str
    close: str


class Holiday(TypedDict):
    """
    A holiday with a date and business periods

    Attributes:
        date: The date of the holiday
        businessPeriods: The business periods for the holiday
    """

    date: Date
    businessPeriods: list[TimeRange]


Holidays = List[Holiday]
TimeRanges = List[TimeRange]


class FigureCalendarDict(TypedDict):
    """
    A dictionary representation of a FigureCalendar

    Attributes:
        timeZone: The timezone for the calendar
        businessDays: The business days for the calendar
        holidays: The holidays for the calendar
        businessPeriods: The business periods for the calendar
    """

    timeZone: Timezone | None
    businessDays: Days
    holidays: Holidays
    businessPeriods: TimeRanges
    name: str


DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]


def unpack_time_range(time_range: Any, timezone: Timezone | None = None) -> TimeRange:
    """
    Unpack a time range from a Deephaven Java object to a Python dictionary

    Args:
        time_range: The time range to unpack
        timezone: The timezone to convert to local time

    Returns:
        The unpacked time range
    """
    start = time_range.start()
    end = time_range.end()
    if timezone:
        timezone = _JDateTimeUtils.timeZone(timezone)
        start = _JDateTimeUtils.toLocalTime(start, timezone)
        end = _JDateTimeUtils.toLocalTime(end, timezone)
    start = str(start)
    end = str(end)
    return {"open": start, "close": end}


def unpack_calendar_day(day: Any, timezone: Timezone | None) -> TimeRanges:
    """
    Unpack a calendar day from a Deephaven Java object to a Python dictionary

    Args:
        day: The calendar day to unpack
        timezone: The timezone to convert to local time

    Returns:
        The unpacked calendar day
    """
    time_ranges = list(day.businessTimeRanges().toArray())
    return [unpack_time_range(time_range, timezone) for time_range in time_ranges]


class FigureCalendar:
    """
    A class to represent a FigureCalendar.
    This wraps a Deephaven BusinessCalendar object to convert the data to the required format for the frontend

    Attributes:
        chart_calendar: The BusinessCalendar to use for the chart
    """

    def __init__(
        self,
        chart_calendar: Calendar,
    ):
        if isinstance(chart_calendar, str):
            # use the named calendar
            chart_calendar = calendar(chart_calendar)

        if chart_calendar is True:
            # use the default calendar
            chart_calendar = calendar()

        # at this point the calendar is expected to be a BusinessCalendar or False
        self._calendar: BusinessCalendar | Literal[False] = chart_calendar

    @property
    def timezone(self) -> Timezone | None:
        """
        Get the timezone for the calendar

        Returns:
            The timezone for the calendar
        """
        if not self._calendar:
            return None

        return str(self._calendar.timeZone())

    @property
    def business_days(self) -> Days:
        """
        Get the business days for the calendar

        Returns:
            The business days for the calendar
        """
        if not self._calendar:
            return []

        return [day for day in DAYS if day not in self.weekend_days]

    @property
    def holidays(self) -> Holidays:
        """
        Get the holidays for the calendar

        Returns:
            The holidays for the calendar
        """
        if not self._calendar:
            return []

        holiday_keys = list(self._calendar.holidays().keySet().toArray())
        j_holidays = {
            str(key): self._calendar.holidays().get(key) for key in holiday_keys
        }

        new_holidays = []
        timezone = self.timezone
        for date, time_range in j_holidays.items():
            new_holiday = {
                "date": date,
                "businessPeriods": unpack_calendar_day(time_range, timezone),
            }
            new_holidays.append(new_holiday)
        new_holidays.sort(key=lambda x: x["date"])
        return new_holidays

    @property
    def business_periods(self) -> TimeRanges:
        """
        Get the business periods for the calendar

        Returns:
            A list of time ranges

        """
        if not self._calendar:
            return []

        business_time_ranges = list(
            self._calendar.standardBusinessDay().businessTimeRanges().toArray()
        )
        return [unpack_time_range(time_range) for time_range in business_time_ranges]

    @property
    def weekend_days(self) -> Days:
        """
        Get the weekend days for the calendar
        Returns: list of weekend days
        """
        if not self._calendar:
            return []

        return [str(day) for day in list(self._calendar.weekendDays().toArray())]

    @property
    def name(self) -> str:
        """
        Get the name of the calendar

        Returns:
            The name of the calendar
        """
        if not self._calendar:
            return "FigureCalendar"

        return str(self._calendar.name())

    def to_dict(self) -> FigureCalendarDict | None:
        """
        Convert the FigureCalendar to a dictionary

        Returns:
            The dictionary representation of the FigureCalendar
        """
        if not self._calendar:
            return None

        return {
            "timeZone": self.timezone,
            "businessDays": self.business_days,
            "holidays": self.holidays,
            "businessPeriods": self.business_periods,
            "name": self.name,
        }
