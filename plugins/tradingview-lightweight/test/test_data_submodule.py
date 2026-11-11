"""Tests for the deprecated ``tvl.data`` submodule.

The example datasets moved to ``deephaven.sample_data`` (the
``deephaven-sample-data`` package); ``tvl.data`` forwards to it with a
``DeprecationWarning``. The datasets themselves are tested in that package.
"""

from __future__ import annotations

import os
import sys
import unittest
import warnings
from unittest.mock import MagicMock

# Wire up src/ on the path and mock the plugin host modules so the package
# __init__ can import without a Deephaven server present.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight import data  # noqa: E402


# Legacy tvl.data names mapped to their deephaven.sample_data replacements
RENAMED = {
    "ohlc": "ohlc",
    "stocks": "stock_trades",
    "volume": "volume",
    "yields": "yields",
    "options_chain": "options_chain",
    "values": "values",
    "large_prices": "large_prices",
}


class TestDataSubmodule(unittest.TestCase):
    def test_all_exports_legacy_names(self) -> None:
        self.assertEqual(sorted(data.__all__), sorted(RENAMED))

    def test_forwards_to_sample_data_with_warning(self) -> None:
        from deephaven import sample_data

        for name, new_name in RENAMED.items():
            with self.subTest(name=name):
                with self.assertWarns(DeprecationWarning) as cm:
                    value = getattr(data, name)
                self.assertIs(value, getattr(sample_data, new_name))
                self.assertIn(f"Use deephaven.sample_data.{new_name}", str(cm.warning))

    def test_from_import_warns(self) -> None:
        from deephaven import sample_data

        with self.assertWarns(DeprecationWarning):
            from deephaven.plot.tradingview_lightweight.data import stocks
        self.assertIs(stocks, sample_data.stock_trades)

    def test_wildcard_import(self) -> None:
        from deephaven import sample_data

        namespace: dict = {}
        with self.assertWarns(DeprecationWarning):
            exec("from deephaven.plot.tradingview_lightweight.data import *", namespace)
        for name, new_name in RENAMED.items():
            self.assertIs(namespace[name], getattr(sample_data, new_name))

    def test_other_names_forward_to_source_module(self) -> None:
        with self.assertWarns(DeprecationWarning) as cm:
            second = data.SECOND
        self.assertEqual(second, 1_000_000_000)
        self.assertIn("no public replacement", str(cm.warning))

        with self.assertWarns(DeprecationWarning) as cm:
            data.Table
        self.assertIn("Use deephaven.table.Table", str(cm.warning))

    def test_module_access_does_not_warn(self) -> None:
        with warnings.catch_warnings():
            warnings.simplefilter("error", DeprecationWarning)
            self.assertIn("stocks", dir(data))

    def test_unknown_attribute_raises(self) -> None:
        with self.assertRaises(AttributeError):
            data.not_a_dataset


if __name__ == "__main__":
    unittest.main()
