import unittest
from .BaseTest import BaseTestCase

from deephaven.ag_grid import AgGrid
from deephaven import new_table
from deephaven.column import string_col, double_col


class Test(BaseTestCase):
    # Trivial test just to check if plugin runs for now
    def test(self):
        result = AgGrid(
            new_table(
                [
                    double_col("Doubles", [3.1, 5.45, -1.0]),
                    string_col("Strings", ["Creating", "New", "Tables"]),
                ]
            )
        )

    pass


if __name__ == "__main__":
    unittest.main()
