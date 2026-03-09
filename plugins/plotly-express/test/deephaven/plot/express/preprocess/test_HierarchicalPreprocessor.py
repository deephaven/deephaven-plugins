import unittest

from ..BaseTest import BaseTestCase
import pandas.testing as tm


class HierarchicalPreprocessorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                string_col("names", ["A", "B", "C"]),
                string_col("parents", ["J", "J", "K"]),
                string_col("grandparents", ["L", "L", "L"]),
                int_col("values", [2, 2, 2]),
                int_col("colors", [2, 4, 6]),
            ]
        )

    def test_hierarchical_preprocessor(self):
        from deephaven.plot.express.preprocess.HierarchicalPreprocessor import (
            HierarchicalPreprocessor,
        )
        from deephaven.plot.express.types import (
            HierarchicalTransforms,
        )

        import deephaven.pandas as dhpd
        import pandas as pd

        args = {
            "values": "values",
        }

        path = ["grandparents", "parents", "names"]

        transforms = HierarchicalTransforms()
        transforms.add("colors")
        hierarchical_preprocessor = HierarchicalPreprocessor(
            args, transforms, path, None, "ColorMask"
        )

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
                "Ids": ["L/J/A", "L/J/B", "L/K/C", "L/J", "L/K", "L"],
                "ColorMask": [True, True, True, True, True, True],
                "Parents": ["L/J", "L/J", "L/K", "L", "L", ""],
                "values": [2, 2, 2, 4, 2, 6],
                "colors": [2.0, 4.0, 6.0, 3.0, 6.0, 4.0],
                "ChildCount": [1, 1, 1, 2, 1, 2],
                "Names": ["A", "B", "C", "J", "K", "L"],
            }
        )
        expected_df["Ids"] = expected_df["Ids"].astype("string")
        expected_df["Parents"] = expected_df["Parents"].astype("string")
        expected_df["values"] = expected_df["values"].astype("Int64")
        expected_df["colors"] = expected_df["colors"].astype("Float64")
        expected_df["Names"] = expected_df["Names"].astype("string")
        expected_df["ColorMask"] = expected_df["ColorMask"].astype("boolean")
        expected_df["ChildCount"] = expected_df["ChildCount"].astype("Int64")

        new_df = new_df.reindex(sorted(new_df.columns), axis=1)
        expected_df = expected_df.reindex(sorted(expected_df.columns), axis=1)

        tm.assert_frame_equal(expected_df, new_df)

    def test_hierarchical_preprocessor_color_mask(self):
        from deephaven.plot.express.preprocess.HierarchicalPreprocessor import (
            HierarchicalPreprocessor,
        )
        from deephaven.plot.express.types import (
            HierarchicalTransforms,
        )

        import deephaven.pandas as dhpd
        import pandas as pd

        args = {
            "values": "values",
        }

        path = ["grandparents", "parents", "names"]

        transforms = HierarchicalTransforms()
        hierarchical_preprocessor = HierarchicalPreprocessor(
            args, transforms, path, "names", "ColorMask"
        )

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
                "Ids": ["L/J/A", "L/J/B", "L/K/C", "L/J", "L/K", "L"],
                "ColorMask": [True, True, True, False, True, False],
                "colors": [2, 4, 6, 4, 6, 6],
                "Parents": ["L/J", "L/J", "L/K", "L", "L", ""],
                "values": [2, 2, 2, 4, 2, 6],
                "ChildCount": [1, 1, 1, 2, 1, 2],
                "Names": ["A", "B", "C", "J", "K", "L"],
            }
        )
        expected_df["Ids"] = expected_df["Ids"].astype("string")
        expected_df["values"] = expected_df["values"].astype("Int64")
        expected_df["colors"] = expected_df["colors"].astype("Int32")
        expected_df["Names"] = expected_df["Names"].astype("string")
        expected_df["Parents"] = expected_df["Parents"].astype("string")
        expected_df["ColorMask"] = expected_df["ColorMask"].astype("boolean")
        expected_df["ChildCount"] = expected_df["ChildCount"].astype("Int64")

        new_df = new_df.reindex(sorted(new_df.columns), axis=1)
        expected_df = expected_df.reindex(sorted(expected_df.columns), axis=1)

        tm.assert_frame_equal(expected_df, new_df)


if __name__ == "__main__":
    unittest.main()
