from __future__ import annotations

import sys
from typing import Union

from deephaven.calendar import calendar

from typing import Any, Literal

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict
else:
    from typing import TypedDict


BusinessCalendar = Any
Calendar = Union[bool, str, BusinessCalendar]
Timezone = str
Day = str
Days = list[Day]
Date = str


class TimeRange(TypedDict):
    open: str
    close: str


class Holiday(TypedDict):
    date: Date
    businessPeriods: list[TimeRange]


Holidays = list[Holiday]
TimeRanges = list[TimeRange]


class FigureCalendarDict(TypedDict):
    timeZone: Timezone | None
    businessDays: Days
    holidays: Holidays
    businessPeriods: TimeRanges


DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]


def unpack_time_range(time_range: Any) -> TimeRange:
    """
    Unpack a time range from a Deephaven Java object to a Python dictionary

    Args:
        time_range: The time range to unpack

    Returns:
        The unpacked time range
    """
    start = str(time_range.start())
    end = str(time_range.end())
    return {"open": start, "close": end}


def unpack_calendar_day(day: Any) -> TimeRanges:
    """
    Unpack a calendar day from a Deephaven Java object to a Python dictionary

    Args:
        day: The calendar day to unpack

    Returns:
        The unpacked calendar day
    """
    time_ranges = list(day.businessTimeRanges().toArray())
    return [unpack_time_range(time_range) for time_range in time_ranges]


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
        for date, time_range in j_holidays.items():
            new_holiday = {
                "date": date,
                "businessPeriods": unpack_calendar_day(time_range),
            }
            new_holidays.append(new_holiday)
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

    def __dict__(self) -> FigureCalendarDict | None:
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
        }
