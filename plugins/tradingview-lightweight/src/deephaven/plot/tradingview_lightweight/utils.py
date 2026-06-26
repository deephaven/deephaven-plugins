"""Utility functions for the TradingView Lightweight Charts plugin.

These mirror the top-level utility functions in the JavaScript library.
"""

from __future__ import annotations

from typing import Any


def is_business_day(time: Any) -> bool:
    """Return True if *time* is a BusinessDay dict.

    A BusinessDay is a dict with integer keys ``year``, ``month``, and ``day``.
    This mirrors the JS ``isBusinessDay()`` type guard.

    Args:
        time: A time value -- either a BusinessDay dict, a numeric UTC timestamp,
            or an ISO date string.

    Returns:
        ``True`` if *time* is a ``dict`` containing ``year``, ``month``, and
        ``day`` integer keys; ``False`` otherwise.

    Example::

        from deephaven.plot.tradingview_lightweight import is_business_day

        is_business_day({"year": 2024, "month": 3, "day": 15})  # True
        is_business_day(1710460800)                              # False
        is_business_day("2024-03-15")                           # False
    """
    # Explicitly exclude bool: in Python, bool is a subclass of int
    return (
        isinstance(time, dict)
        and isinstance(time.get("year"), int)
        and not isinstance(time.get("year"), bool)
        and isinstance(time.get("month"), int)
        and not isinstance(time.get("month"), bool)
        and isinstance(time.get("day"), int)
        and not isinstance(time.get("day"), bool)
    )


def is_utc_timestamp(time: Any) -> bool:
    """Return True if *time* is a numeric UTC timestamp.

    A UTCTimestamp is a Unix epoch timestamp (seconds since 1970-01-01 UTC)
    expressed as an ``int`` or ``float``. This mirrors the JS ``isUTCTimestamp()``
    type guard.

    Args:
        time: A time value -- either a BusinessDay dict, a numeric UTC timestamp,
            or an ISO date string.

    Returns:
        ``True`` if *time* is an ``int`` or ``float`` (but not a ``bool``);
        ``False`` otherwise.

    Example::

        from deephaven.plot.tradingview_lightweight import is_utc_timestamp

        is_utc_timestamp(1710460800)                              # True
        is_utc_timestamp(1710460800.5)                           # True
        is_utc_timestamp({"year": 2024, "month": 3, "day": 15}) # False
        is_utc_timestamp("2024-03-15")                           # False
    """
    # Explicitly exclude bool: in Python, bool is a subclass of int
    return isinstance(time, (int, float)) and not isinstance(time, bool)
