import inspect
import sys
import unittest

from deephaven.table import Table

from deephaven import sample_data


class SampleDataTestCase(unittest.TestCase):
    # Moved from deephaven-plugin-plotly-express
    PLOTLY_EXPRESS_GENERATORS = [
        sample_data.iris,
        sample_data.jobs,
        sample_data.marketing,
        sample_data.stocks,
        sample_data.tips,
        sample_data.election,
        sample_data.wind,
        sample_data.gapminder,
        sample_data.fish_market,
        sample_data.outages,
        sample_data.flights,
    ]
    # Moved from deephaven-plugin-tradingview-lightweight
    TRADINGVIEW_GENERATORS = [
        sample_data.ohlc,
        sample_data.stock_trades,
        sample_data.volume,
        sample_data.yields,
        sample_data.options_chain,
        sample_data.values,
        sample_data.large_prices,
    ]
    GENERATORS = PLOTLY_EXPRESS_GENERATORS + TRADINGVIEW_GENERATORS

    def test_all_exports_generators(self):
        exported = [getattr(sample_data, name) for name in sample_data.__all__]
        for generator in self.GENERATORS:
            with self.subTest(generator=generator.__name__):
                self.assertIn(generator, exported)

    def test_tradingview_signature_and_docstring(self):
        for generator in self.TRADINGVIEW_GENERATORS:
            with self.subTest(generator=generator.__name__):
                params = list(inspect.signature(generator).parameters.values())
                self.assertEqual([p.name for p in params], ["ticking"])
                self.assertIs(params[0].default, True)
                self.assertIn("Returns:", inspect.getdoc(generator) or "")

    def test_static_tables(self):
        for generator in self.GENERATORS:
            with self.subTest(generator=generator.__name__):
                table = generator(ticking=False)
                self.assertIsInstance(table, Table)
                self.assertFalse(table.is_refreshing)
                self.assertGreater(table.size, 0)

    def test_ticking_tables(self):
        for generator in self.GENERATORS:
            with self.subTest(generator=generator.__name__):
                table = generator(ticking=True)
                self.assertIsInstance(table, Table)
                self.assertTrue(table.is_refreshing)

    def test_static_tables_are_deterministic(self):
        from deephaven.pandas import to_pandas

        for generator in [sample_data.iris, sample_data.stocks, sample_data.ohlc]:
            with self.subTest(generator=generator.__name__):
                first = to_pandas(generator(ticking=False))
                second = to_pandas(generator(ticking=False))
                self.assertTrue(first.equals(second))

    def test_vendored_datasets(self):
        from deephaven.sample_data._generators import _read_csv

        expected_rows = {
            "iris": 150,
            "tips": 244,
            "election": 58,
            "wind": 128,
            "gapminder": 1704,
        }
        for name, rows in expected_rows.items():
            with self.subTest(name=name):
                self.assertEqual(len(_read_csv(name)), rows)

    def test_does_not_import_plotly(self):
        self.assertNotIn("plotly", sys.modules)

    def test_map_centers(self):
        self.assertEqual(set(sample_data.OUTAGE_CENTER), {"lat", "lon"})
        self.assertEqual(set(sample_data.FLIGHT_CENTER), {"lat", "lon"})


if __name__ == "__main__":
    unittest.main()
