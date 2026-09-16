"""Smoke tests for the ``tvl.data`` example-data submodule.

These tests only check that the public API surface is present and well-formed
(callable, documented, correct signature). They do NOT invoke the functions —
that requires a live Deephaven server, since the underlying Java backend
must be running to build tables via ``empty_table``/``new_table``.
"""

from __future__ import annotations

import inspect
import os
import sys
import unittest
from unittest.mock import MagicMock

# Wire up src/ on the path and mock the plugin host modules so the package
# __init__ can import without a Deephaven server present.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight import data  # noqa: E402


EXPECTED_FUNCTIONS = [
    "ohlc",
    "stocks",
    "volume",
    "yields",
    "options_chain",
    "values",
    "large_prices",
]


class TestDataSubmodule(unittest.TestCase):
    def test_all_exports_expected_names(self) -> None:
        self.assertEqual(sorted(data.__all__), sorted(EXPECTED_FUNCTIONS))

    def test_each_function_exists_and_is_callable(self) -> None:
        for name in EXPECTED_FUNCTIONS:
            with self.subTest(function=name):
                self.assertTrue(
                    hasattr(data, name),
                    f"data submodule is missing {name!r}",
                )
                fn = getattr(data, name)
                self.assertTrue(callable(fn), f"{name!r} is not callable")

    def test_each_function_has_ticking_signature(self) -> None:
        for name in EXPECTED_FUNCTIONS:
            with self.subTest(function=name):
                sig = inspect.signature(getattr(data, name))
                params = list(sig.parameters.values())
                self.assertEqual(
                    [p.name for p in params],
                    ["ticking"],
                    f"{name!r} should take a single 'ticking' argument",
                )
                self.assertIs(
                    params[0].default,
                    True,
                    f"{name!r} ticking default should be True",
                )

    def test_each_function_has_non_empty_docstring(self) -> None:
        for name in EXPECTED_FUNCTIONS:
            with self.subTest(function=name):
                doc = inspect.getdoc(getattr(data, name))
                self.assertIsNotNone(doc, f"{name!r} has no docstring")
                assert doc is not None  # for type-checkers
                self.assertGreater(len(doc.strip()), 0, f"{name!r} has empty docstring")
                # Google-style docstrings should describe the schema.
                self.assertIn(
                    "Returns:",
                    doc,
                    f"{name!r} docstring is missing a 'Returns:' block",
                )


if __name__ == "__main__":
    unittest.main()
