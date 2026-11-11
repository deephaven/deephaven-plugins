import unittest
import warnings

from .BaseTest import BaseTestCase

# Datasets that only need Deephaven, provided by the deephaven-sample-data package
SAMPLE_DATA_NAMES = [
    "jobs",
    "marketing",
    "stocks",
    "fish_market",
    "outages",
    "flights",
    "OUTAGE_CENTER",
    "FLIGHT_CENTER",
]


class DataTestCase(BaseTestCase):
    def test_reexports_sample_data_without_warning(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx

        with warnings.catch_warnings():
            warnings.simplefilter("error", DeprecationWarning)
            for name in SAMPLE_DATA_NAMES:
                with self.subTest(name=name):
                    self.assertIs(getattr(dx.data, name), getattr(sample_data, name))
                    self.assertIs(
                        getattr(dx.data.data_generators, name),
                        getattr(sample_data, name),
                    )

    def test_plotly_datasets_stay_in_plotly_express(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx

        for name in ["iris", "tips", "election", "wind", "gapminder"]:
            with self.subTest(name=name):
                self.assertTrue(callable(getattr(dx.data, name)))
                self.assertFalse(hasattr(sample_data, name))

    def test_plotly_datasets(self):
        from deephaven.plot import express as dx

        for generator in [dx.data.iris, dx.data.tips, dx.data.election, dx.data.wind]:
            with self.subTest(generator=generator.__name__):
                self.assertTrue(generator(ticking=True).is_refreshing)
                self.assertFalse(generator(ticking=False).is_refreshing)

    def test_map_center_constants(self):
        from deephaven.plot import express as dx

        generators = dx.data.data_generators
        self.assertEqual(generators.OUTAGE_LAT, generators.OUTAGE_CENTER["lat"])
        self.assertEqual(generators.FLIGHT_LON, generators.FLIGHT_CENTER["lon"])


if __name__ == "__main__":
    unittest.main()
