import unittest

import pandas as pd

from ..BaseTest import BaseTestCase, remap_types


class HistPreprocessorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table(
            [
                int_col("X", [0, 4, 0, 4]),
                int_col("Z", [1, 1, 2, 2]),
            ]
        )

        self.partitioned = self.source.partition_by("Z")

    def tables_equal(self, args, expected_df, t=None) -> None:
        """
        Compare the expected dataframe to the actual dataframe generated by the preprocessor

        Args:
            args: The arguments to pass to the preprocessor
            expected_df: The expected dataframe
            t: The table to preprocess, defaults to self.source
            pivot_vars: The pivot vars to use, defaults to None
        """
        from src.deephaven.plot.express.preprocess.HistPreprocessor import (
            HistPreprocessor,
        )
        import deephaven.pandas as dhpd

        if t is None:
            t = self.source

        args_copy = args.copy()

        hist_preprocessor = HistPreprocessor(args_copy, None)

        new_table_gen = hist_preprocessor.preprocess_partitioned_tables([t])
        new_table, _ = next(new_table_gen)

        new_df = dhpd.to_pandas(new_table)

        self.assertTrue(expected_df.equals(new_df))

    def test_basic_hist(self):
        args = {
            "x": "X",
            "table": self.source,
            "nbins": 2,
        }

        expected_df = pd.DataFrame({"X": [1.0, 3.0], "tmpbar0": [2, 2]})
        remap_types(expected_df)

        self.tables_equal(args, expected_df)

    def test_partitioned_hist(self):
        args = {
            "x": "X",
            "table": self.partitioned,
            "nbins": 2,
        }

        expected_df = pd.DataFrame({"X": [1.0, 3.0], "tmpbar0": [1, 1]})
        remap_types(expected_df)

        self.tables_equal(args, expected_df, t=self.partitioned.constituent_tables[0])

        expected_df = pd.DataFrame({"X": [1.0, 3.0], "tmpbar0": [1, 1]})
        remap_types(expected_df)

        self.tables_equal(args, expected_df, t=self.partitioned.constituent_tables[1])


if __name__ == "__main__":
    unittest.main()
