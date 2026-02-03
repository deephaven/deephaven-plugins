import unittest

from ..BaseTest import BaseTestCase
import pandas.testing as tm


class AttachedPreprocessorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                string_col("names", ["A", "B", "C"]),
                int_col("values", [1, 2, 3]),
                string_col("colors", ["X", "Y", "Z"]),
            ]
        )

    def test_attached_preprocessor(self):
        from deephaven.plot.express.preprocess.AttachedPreprocessor import (
            AttachedPreprocessor,
        )
        from deephaven.plot.express.types import (
            AttachedTransforms,
        )

        import deephaven.pandas as dhpd
        import pandas as pd

        args = {
            "values": "values",
        }

        transforms = AttachedTransforms()
        transforms.add(
            "colors",
            "colors",
            {"Z": "blue"},
            ["salmon", "lemonchiffon"],
            "color",
        )
        attached_preprocessor = AttachedPreprocessor(args, transforms, "true")

        new_table_gen = attached_preprocessor.preprocess_partitioned_tables(
            [self.source]
        )
        new_table, _ = next(new_table_gen)

        # drop colors_manager column because it is not meaningful since it's an object
        new_df = dhpd.to_pandas(new_table.drop_columns(["colors_manager"]))

        expected_df = pd.DataFrame(
            {
                "names": ["A", "B", "C"],
                "values": [1, 2, 3],
                "colors": ["salmon", "lemonchiffon", "blue"],
            }
        )
        expected_df["names"] = expected_df["names"].astype("string")
        expected_df["values"] = expected_df["values"].astype("Int32")
        expected_df["colors"] = expected_df["colors"].astype("string")

        tm.assert_frame_equal(expected_df, new_df)


if __name__ == "__main__":
    unittest.main()
