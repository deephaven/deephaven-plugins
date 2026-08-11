import json
import unittest
from unittest.mock import MagicMock
from .BaseTest import BaseTestCase

from deephaven.ag_grid import AgGrid, AgGridMessageStream
from deephaven import new_table
from deephaven.column import string_col, double_col


class Test(BaseTestCase):
    def make_table(self):
        return new_table(
            [
                double_col("Doubles", [3.1, 5.45, -1.0]),
                string_col("Strings", ["Creating", "New", "Tables"]),
            ]
        )

    # Trivial test just to check if plugin runs for now
    def test(self):
        result = AgGrid(self.make_table())

    def test_default_column_defs(self):
        grid = AgGrid(self.make_table())
        self.assertEqual(grid.column_defs, {})

    def test_column_defs(self):
        column_defs = {"Strings": {"filterParams": {"caseSensitive": True}}}
        grid = AgGrid(self.make_table(), column_defs=column_defs)
        self.assertEqual(grid.column_defs, column_defs)

    def test_start_sends_empty_options(self):
        table = self.make_table()
        grid = AgGrid(table)
        connection = MagicMock()
        AgGridMessageStream(grid, connection).start()
        payload, references = connection.on_data.call_args[0]
        self.assertEqual(json.loads(payload.decode()), {})
        self.assertEqual(references, [table])

    def test_start_sends_column_defs(self):
        table = self.make_table()
        column_defs = {"Strings": {"filterParams": {"caseSensitive": True}}}
        grid = AgGrid(table, column_defs=column_defs)
        connection = MagicMock()
        AgGridMessageStream(grid, connection).start()
        payload, references = connection.on_data.call_args[0]
        self.assertEqual(json.loads(payload.decode()), {"columnDefs": column_defs})
        self.assertEqual(references, [table])


if __name__ == "__main__":
    unittest.main()
