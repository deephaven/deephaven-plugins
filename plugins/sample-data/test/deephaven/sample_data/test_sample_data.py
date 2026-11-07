import unittest

from deephaven.table import Table

from deephaven import sample_data


class SampleDataTestCase(unittest.TestCase):
    GENERATORS = [
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

        for generator in [sample_data.iris, sample_data.stocks]:
            with self.subTest(generator=generator.__name__):
                first = to_pandas(generator(ticking=False))
                second = to_pandas(generator(ticking=False))
                self.assertTrue(first.equals(second))

    def test_map_centers(self):
        self.assertEqual(set(sample_data.OUTAGE_CENTER), {"lat", "lon"})
        self.assertEqual(set(sample_data.FLIGHT_CENTER), {"lat", "lon"})


if __name__ == "__main__":
    unittest.main()
