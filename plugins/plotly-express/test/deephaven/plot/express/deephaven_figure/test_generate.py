from __future__ import annotations

import unittest
from unittest.mock import patch

from ..BaseTest import BaseTestCase


class GenerateTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                string_col("Group", ["A", "B", "C"]),
                int_col("X", [1, 2, 3]),
                int_col("Y", [4, 5, 6]),
            ]
        )

    def test_px_called_once_for_identical_partitions(self):
        """Partitions with identical px args share one px call but get their own traces"""
        import plotly.express as px
        import src.deephaven.plot.express as dx

        with patch.object(px, "line", side_effect=px.line) as line:
            chart = dx.line(self.source, x="X", y="Y", by="Group")

        self.assertEqual(line.call_count, 1)
        traces = chart.to_dict(exporter=self.exporter)["plotly"]["data"]
        self.assertEqual(sorted(trace["name"] for trace in traces), ["A", "B", "C"])

    def test_px_cache_returns_independent_figures(self):
        """A cache hit is a new figure, so changes to one don't leak into the next"""
        import plotly.express as px
        from src.deephaven.plot.express.deephaven_figure.generate import (
            generate_figure,
        )

        px_cache = {}

        def generate():
            return generate_figure(
                draw=px.line,
                call_args={"table": self.source, "x": "X", "y": "Y"},
                px_cache=px_cache,
            ).get_plotly_fig()

        first = generate()
        first.update_traces(name="changed")
        second = generate()

        self.assertEqual(len(px_cache), 1)
        self.assertNotEqual(second.data[0].name, "changed")
        self.assertEqual(second.layout.template, first.layout.template)

    def test_construct_min_dataframe_returns_copy(self):
        """The cached placeholder dataframe can't be changed through a returned copy"""
        from src.deephaven.plot.express.deephaven_figure.generate import (
            construct_min_dataframe,
        )

        first = construct_min_dataframe(self.source, ["X", "Y"])
        first["X"] = 99
        second = construct_min_dataframe(self.source, ["X", "Y"])

        self.assertEqual(list(second.columns), ["X", "Y"])
        self.assertNotEqual(second["X"].iloc[0], 99)


if __name__ == "__main__":
    unittest.main()
