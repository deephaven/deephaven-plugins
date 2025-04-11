import unittest

from ..BaseTest import BaseTestCase


class HierarchicalPreprocessorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                string_col("names", ["A", "B", "C", "D", "E", "F", "G", "H", "I"]),
                string_col("parents", ["J", "J", "J", "J", "K", "K", "K", "K", "K"]),
                string_col(
                    "grandparents", ["L", "L", "L", "L", "L", "L", "L", "L", "L"]
                ),
                int_col("values", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("colors", [1, 1, 1, 1, 1, 1, 1, 1, 1]),
            ]
        )

    def test_hierarchical_preprocessor(self):
        from src.deephaven.plot.express.preprocess.HierarchicalPreprocessor import (
            HierarchicalPreprocessor,
        )
        from src.deephaven.plot.express.types import (
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
        hierarchical_preprocessor = HierarchicalPreprocessor(args, transforms, path)

        new_table_gen = hierarchical_preprocessor.preprocess_partitioned_tables(
            [self.source]
        )
        new_table, _ = next(new_table_gen)

        # drop the path columns as the values in them are irrelevant and arbitrary
        new_df = dhpd.to_pandas(
            new_table.drop_columns(["grandparents", "parents", "names"])
        )

        expected_df = pd.DataFrame(
            {
                "Ids": ["I/K/L", "I/K", "I"],
                "values": [27, 27, 27],
                "colors": [1.0, 1.0, 1.0],
                "Names": ["L", "K", "I"],
                "Parents": ["I/K", "I", ""],
            }
        )
        expected_df["Ids"] = expected_df["Ids"].astype("string[python]")
        expected_df["values"] = expected_df["values"].astype("Int64")
        expected_df["colors"] = expected_df["colors"].astype("Float64")
        expected_df["Names"] = expected_df["Names"].astype("string[python]")
        expected_df["Parents"] = expected_df["Parents"].astype("string[python]")

        self.assertTrue(expected_df.equals(new_df))


if __name__ == "__main__":
    unittest.main()
