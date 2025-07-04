import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class BarTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table(
            [
                int_col("X", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("X2", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Y", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Y2", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("size", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("text", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("hover_name", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("category", [1, 2, 1, 2, 1, 2, 1, 2, 1]),
            ]
        )

    def test_basic_bar_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG

        chart = dx.bar(self.source, x="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>count=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "textposition": "auto",
                "type": "bar",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": [NULL_LONG],
                "yaxis": "y",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "barmode": "relative",
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "count"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "count": ["/plotly/data/0/y"],
                },
                "table": 0,
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_bar_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG

        chart = dx.bar(self.source, y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "count=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "orientation": "h",
                "showlegend": False,
                "textposition": "auto",
                "type": "bar",
                "x": [NULL_LONG],
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "barmode": "relative",
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "count"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "data_columns": {
                    "Y": ["/plotly/data/0/y"],
                    "count": ["/plotly/data/0/x"],
                },
                "table": 0,
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_bar_x_y(self):
        import src.deephaven.plot.express as dx

        chart = dx.bar(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "textposition": "auto",
                "type": "bar",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "barmode": "relative",
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)
