import unittest
import warnings

from .BaseTest import BaseTestCase


LEGACY_NAMES = [
    "iris",
    "jobs",
    "marketing",
    "stocks",
    "tips",
    "election",
    "wind",
    "gapminder",
    "fish_market",
    "outages",
    "flights",
    "OUTAGE_CENTER",
    "FLIGHT_CENTER",
]


class DataDeprecationTestCase(BaseTestCase):
    def test_data_forwards_with_warning(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx

        self.assertEqual(
            sorted(dx.data.__all__), sorted([*LEGACY_NAMES, "data_generators"])
        )
        for name in LEGACY_NAMES:
            with self.subTest(name=name):
                with self.assertWarns(DeprecationWarning) as cm:
                    value = getattr(dx.data, name)
                self.assertIs(value, getattr(sample_data, name))
                self.assertIn("deephaven.sample_data", str(cm.warning))

    def test_from_import_warns(self):
        from deephaven import sample_data

        with self.assertWarns(DeprecationWarning):
            from deephaven.plot.express.data import iris
        self.assertIs(iris, sample_data.iris)

    def test_data_generators_forwards_with_warning(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx

        with self.assertWarns(DeprecationWarning):
            stocks = dx.data.data_generators.stocks
        self.assertIs(stocks, sample_data.stocks)

        with self.assertWarns(DeprecationWarning):
            from deephaven.plot.express.data.data_generators import SECOND
        self.assertEqual(SECOND, 1_000_000_000)

    def test_top_level_data_generators_alias(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx
        from deephaven.plot.express import data_generators

        self.assertIs(data_generators, dx.data.data_generators)
        with self.assertWarns(DeprecationWarning):
            iris = dx.data_generators.iris
        self.assertIs(iris, sample_data.iris)

    def test_wildcard_imports(self):
        from deephaven import sample_data

        data_namespace: dict = {}
        with self.assertWarns(DeprecationWarning):
            exec("from deephaven.plot.express.data import *", data_namespace)
        for name in LEGACY_NAMES:
            self.assertIs(data_namespace[name], getattr(sample_data, name))
        self.assertIn("data_generators", data_namespace)

        generators_namespace: dict = {}
        with self.assertWarns(DeprecationWarning):
            exec(
                "from deephaven.plot.express.data.data_generators import *",
                generators_namespace,
            )
        self.assertIs(generators_namespace["stocks"], sample_data.stocks)
        self.assertEqual(generators_namespace["SECOND"], 1_000_000_000)

    def test_warning_points_to_valid_replacement(self):
        from deephaven.plot import express as dx

        def message(name: str) -> str:
            with self.assertWarns(DeprecationWarning) as cm:
                getattr(dx.data.data_generators, name)
            return str(cm.warning)

        self.assertIn("Use deephaven.sample_data.stocks", message("stocks"))
        self.assertIn("Use deephaven.table.Table", message("Table"))
        self.assertIn("Import pandas directly", message("pd"))
        second = message("SECOND")
        self.assertNotIn("deephaven.sample_data.SECOND", second)
        self.assertIn("no public replacement", second)

    def test_module_access_does_not_warn(self):
        from deephaven.plot import express as dx

        with warnings.catch_warnings():
            warnings.simplefilter("error", DeprecationWarning)
            self.assertIn("iris", dir(dx.data))
            self.assertIn("stocks", dir(dx.data.data_generators))

    def test_newer_sample_data_not_exposed(self):
        from deephaven.plot import express as dx

        self.assertNotIn("ohlc", dir(dx.data))
        with self.assertRaises(AttributeError):
            dx.data.ohlc

    def test_unknown_attribute_raises(self):
        from deephaven.plot import express as dx

        with self.assertRaises(AttributeError):
            dx.data.not_a_dataset
        with self.assertRaises(AttributeError):
            dx.data.data_generators.not_a_dataset


if __name__ == "__main__":
    unittest.main()
