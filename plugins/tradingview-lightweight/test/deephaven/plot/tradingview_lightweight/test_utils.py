"""Tests for utility functions."""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

# Mock deephaven.plugin before any plugin imports trigger it
from unittest.mock import MagicMock

sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight.utils import (
    is_business_day,
    is_utc_timestamp,
)


class TestIsBusinessDay(unittest.TestCase):
    def test_valid_business_day(self):
        self.assertTrue(is_business_day({"year": 2024, "month": 3, "day": 15}))

    def test_extra_keys_ok(self):
        """Extra keys beyond year/month/day are acceptable."""
        self.assertTrue(
            is_business_day({"year": 2024, "month": 3, "day": 15, "extra": "data"})
        )

    def test_integer_timestamp_is_not_business_day(self):
        self.assertFalse(is_business_day(1710460800))

    def test_float_timestamp_is_not_business_day(self):
        self.assertFalse(is_business_day(1710460800.5))

    def test_iso_string_is_not_business_day(self):
        self.assertFalse(is_business_day("2024-03-15"))

    def test_none_is_not_business_day(self):
        self.assertFalse(is_business_day(None))

    def test_dict_missing_year(self):
        self.assertFalse(is_business_day({"month": 3, "day": 15}))

    def test_dict_missing_month(self):
        self.assertFalse(is_business_day({"year": 2024, "day": 15}))

    def test_dict_missing_day(self):
        self.assertFalse(is_business_day({"year": 2024, "month": 3}))

    def test_dict_string_year(self):
        """Non-integer year should return False."""
        self.assertFalse(is_business_day({"year": "2024", "month": 3, "day": 15}))

    def test_bool_values_rejected(self):
        """bool is a subclass of int but should not be accepted."""
        self.assertFalse(is_business_day({"year": True, "month": False, "day": True}))

    def test_empty_dict(self):
        self.assertFalse(is_business_day({}))

    def test_list_is_not_business_day(self):
        self.assertFalse(is_business_day([2024, 3, 15]))


class TestIsUtcTimestamp(unittest.TestCase):
    def test_integer_is_utc_timestamp(self):
        self.assertTrue(is_utc_timestamp(1710460800))

    def test_float_is_utc_timestamp(self):
        self.assertTrue(is_utc_timestamp(1710460800.5))

    def test_zero_is_utc_timestamp(self):
        self.assertTrue(is_utc_timestamp(0))

    def test_negative_is_utc_timestamp(self):
        """Negative timestamps (before epoch) are valid."""
        self.assertTrue(is_utc_timestamp(-86400))

    def test_bool_is_not_utc_timestamp(self):
        """bool is a subclass of int in Python; must be excluded."""
        self.assertFalse(is_utc_timestamp(True))
        self.assertFalse(is_utc_timestamp(False))

    def test_business_day_dict_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp({"year": 2024, "month": 3, "day": 15}))

    def test_iso_string_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp("2024-03-15"))

    def test_none_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp(None))

    def test_list_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp([1710460800]))


class TestUtilsExported(unittest.TestCase):
    """Verify utility functions are importable from the top-level package."""

    def test_is_business_day_exported(self):
        from deephaven.plot import tradingview_lightweight as tvl

        self.assertTrue(callable(tvl.is_business_day))

    def test_is_utc_timestamp_exported(self):
        from deephaven.plot import tradingview_lightweight as tvl

        self.assertTrue(callable(tvl.is_utc_timestamp))


if __name__ == "__main__":
    unittest.main()
