"""Internal type aliases."""

from __future__ import annotations

from typing import Any, TypedDict, Union

try:
    from deephaven.table import Table, PartitionedTable

    TableLike = Union[Table, PartitionedTable]
except ImportError:
    TableLike = Any


class BusinessDay(TypedDict):
    """A date specified as a business day with year, month, and day components.

    Used as a ``time`` value in series data for TradingView Lightweight Charts.
    BusinessDay keys are used instead of UNIX timestamps to chart data that
    excludes non-trading days (weekends, holidays) — the chart renders them
    with equal bar spacing regardless of calendar gaps.

    Example::

        from deephaven.plot.tradingview_lightweight import business_day
        row = {"time": business_day(2024, 1, 15), "value": 150.25}

    See: https://tradingview.github.io/lightweight-charts/docs/api#businessday
    """

    year: int
    month: int
    day: int


def business_day(year: int, month: int, day: int) -> BusinessDay:
    """Create a BusinessDay dict for use as a ``time`` value in series data.

    Args:
        year: Four-digit year (e.g. 2024).
        month: Month number, 1-12.
        day: Day of month, 1-31.

    Returns:
        A dict ``{"year": year, "month": month, "day": day}`` suitable for
        use as the ``time`` field in TradingView Lightweight Charts data rows.

    Example::

        from deephaven.plot.tradingview_lightweight import business_day

        data = [
            {"time": business_day(2024, 1, 15), "value": 150.25},
            {"time": business_day(2024, 1, 16), "value": 152.10},
            {"time": business_day(2024, 1, 17), "value": 149.80},
        ]
    """
    return BusinessDay(year=year, month=month, day=day)
