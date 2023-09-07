import unittest

from ..BaseTest import BaseTestCase


class TimePreprocessorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import datetime_col, string_col
        from deephaven.time import to_j_instant

        start = to_j_instant("2021-07-04T08:00:00 ET")
        end = to_j_instant("2021-07-04T09:00:00 ET")

        self.source = new_table([
            datetime_col("Start", [start]),
            datetime_col("End", [end]),
            string_col("Category", ["A"]),
        ])

    def test_time_preprocessor(self):
        from src.deephaven.plot.express.preprocess.TimePreprocessor import TimePreprocessor
        import deephaven.pandas as dhpd
        import pandas as pd

        args = {
            "x_start": "Start",
            "x_end": "End",
            "y": "Category",
            "table": self.source
        }
        time_preprocessor = TimePreprocessor(args)

        new_table_gen = time_preprocessor.preprocess_partitioned_tables([self.source])
        new_table, _ = next(new_table_gen)

        expected_df = pd.DataFrame({
            'Start': ['2021-07-04 12:00:00'],
            'End': ['2021-07-04 13:00:00'],
            'Category': ['A'],
            'x_diff': [3600000.0]
        })
        expected_df['Start'] = pd.to_datetime(expected_df['Start'])
        expected_df['End'] = pd.to_datetime(expected_df['End'])
        expected_df['x_diff'] = expected_df['x_diff'].astype('Float64')

        new_df = dhpd.to_pandas(new_table)

        self.assertTrue(expected_df.equals(new_df))


if __name__ == '__main__':
    unittest.main()
