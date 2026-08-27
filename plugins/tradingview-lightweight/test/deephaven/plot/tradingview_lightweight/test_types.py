"""Tests for _types module (BusinessDay factory function)."""

from __future__ import annotations

import json
import os
import sys
import unittest
from unittest.mock import MagicMock

# Add src to path for namespace package resolution
sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

# Mock deephaven.plugin before any plugin imports trigger it
sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight._types import BusinessDay, business_day


class TestBusinessDay(unittest.TestCase):
    """Tests for the business_day() factory function."""

    def test_returns_correct_dict(self):
        result = business_day(2024, 1, 15)
        self.assertEqual(result, {"year": 2024, "month": 1, "day": 15})

    def test_all_fields_present(self):
        result = business_day(2019, 6, 1)
        self.assertIn("year", result)
        self.assertIn("month", result)
        self.assertIn("day", result)

    def test_values_stored_correctly(self):
        result = business_day(2020, 12, 31)
        self.assertEqual(result["year"], 2020)
        self.assertEqual(result["month"], 12)
        self.assertEqual(result["day"], 31)

    def test_is_dict(self):
        """TypedDict instances must be plain dicts (JSON-serializable)."""
        result = business_day(2024, 3, 8)
        # Must serialize without error
        serialized = json.dumps(result)
        self.assertIn('"year": 2024', serialized)
        self.assertIn('"month": 3', serialized)
        self.assertIn('"day": 8', serialized)

    def test_importable_from_package(self):
        """business_day and BusinessDay must be importable from top-level package."""
        from deephaven.plot.tradingview_lightweight import (
            BusinessDay,
            business_day,
        )

        self.assertIsNotNone(business_day)
        self.assertIsNotNone(BusinessDay)


if __name__ == "__main__":
    unittest.main()
