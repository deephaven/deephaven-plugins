import unittest

from ..BaseTest import BaseTestCase


class AttachedPreprocessorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                string_col("names", ["A", "B", "C", "D", "E", "F", "G", "H", "I"]),
                string_col("parents", ["J", "J", "J", "J", "K", "K", "K", "K", "K"]),
                string_col("grandparents", ["L", "L", "L", "L", "L", "L", "L", "L", "L"]),
                int_col("values", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("colors", [2, 2, 2, 3, 3, 3, 4, 4, 4]),
            ]
        )

    def test_time_preprocessor(self):
        from src.deephaven.plot.express.preprocess.HierarchicalPreprocessor import (
            HierarchicalPreprocessor,
        )
        from src.deephaven.plot.express.types.HierarchicalTransforms import (
            HierarchicalTransforms,
        )

        import deephaven.pandas as dhpd
        import pandas as pd

        args = {
            "values": "values",
        }

        path = ["names", "parents", "grandparents"]

        transforms = HierarchicalTransforms()
        transforms.add("colors")
        time_preprocessor = HierarchicalPreprocessor(args, None)

        new_table_gen = time_preprocessor.preprocess_partitioned_tables([self.source])
        new_table, _ = next(new_table_gen)

        expected_df = pd.DataFrame(
            {
                "Start": ["2021-07-04 12:00:00+00:00"],
                "End": ["2021-07-04 13:00:00+00:00"],
                "Category": ["A"],
                "x_diff": [3600000.0],
            }
        )
        expected_df["Start"] = pd.to_datetime(expected_df["Start"])
        expected_df["End"] = pd.to_datetime(expected_df["End"])
        expected_df["Category"] = expected_df["Category"].astype("string")
        expected_df["x_diff"] = expected_df["x_diff"].astype("Float64")

        new_df = dhpd.to_pandas(new_table)

        self.assertTrue(expected_df.equals(new_df))


if __name__ == "__main__":
    unittest.main()
