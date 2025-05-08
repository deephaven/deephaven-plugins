import unittest

from ..BaseTest import BaseTestCase


class TimelineTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import datetime_col, string_col
        from deephaven.time import to_j_instant

        start = to_j_instant("2021-07-04T08:00:00 ET")
        end = to_j_instant("2021-07-04T09:00:00 ET")

        self.source = new_table(
            [
                datetime_col(
                    "Start",
                    [start, start, start, start, start, start, start, start, start],
                ),
                datetime_col("End", [end, end, end, end, end, end, end, end, end]),
                string_col("Category", ["A", "B", "C", "D", "E", "F", "G", "H", "I"]),
            ]
        )

    def test_basic_timeline(self):
        import src.deephaven.plot.express as dx

        chart = dx.timeline(
            self.source, x_start="Start", x_end="End", y="Category"
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "base": ["2000-01-01T00:00:00.000000000"],
                "hovertemplate": "Start=%{base}<br>Category=%{y}<br>x_diff=%{x}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "orientation": "h",
                "showlegend": False,
                "textposition": "auto",
                "x": {"bdata": "AA==", "dtype": "i1"},
                "xaxis": "x",
                "y": ["None"],
                "yaxis": "y",
                "type": "bar",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "barmode": "overlay",
            "legend": {"tracegroupgap": 0},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "type": "date"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "title": {"text": "Category"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "Start": ["/plotly/data/0/base"],
                    "Category": ["/plotly/data/0/y"],
                    "x_diff": ["/plotly/data/0/x"],
                },
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)


if __name__ == "__main__":
    unittest.main()
