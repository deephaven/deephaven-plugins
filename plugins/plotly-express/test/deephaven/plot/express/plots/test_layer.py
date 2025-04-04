import unittest

from ..BaseTest import BaseTestCase


class LayerTestCase(BaseTestCase):
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
            ]
        )

    def test_same_layered(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.area(self.source, x="X", y="Y")
        layered = dx.layer(chart, chart).to_dict(self.exporter)

        plotly, deephaven = layered["plotly"], layered["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "fillpattern": {"shape": ""},
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"color": "#636efa", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "stackgroup": "1",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scatter",
            },
            {
                "fillpattern": {"shape": ""},
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"color": "#636efa", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "stackgroup": "1",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scatter",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "title": {"text": "X"},
                "side": "bottom",
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "title": {"text": "Y"},
                "side": "left",
            },
            "legend": {"tracegroupgap": 0},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
            },
            {
                "table": 0,
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_different_layered(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.area(self.source, x="X", y="Y")
        chart2 = dx.area(self.source, x="X2", y="Y2")
        layered = dx.layer(chart, chart2).to_dict(self.exporter)

        plotly, deephaven = layered["plotly"], layered["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "fillpattern": {"shape": ""},
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"color": "#636efa", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "stackgroup": "1",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scatter",
            },
            {
                "fillpattern": {"shape": ""},
                "hovertemplate": "X2=%{x}<br>Y2=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"color": "#636efa", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "stackgroup": "1",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scatter",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "title": {"text": "X2"},
                "side": "bottom",
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "title": {"text": "Y2"},
                "side": "left",
            },
            "legend": {"tracegroupgap": 0},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
            },
            {
                "table": 0,
                "data_columns": {
                    "X2": ["/plotly/data/1/x"],
                    "Y2": ["/plotly/data/1/y"],
                },
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)


if __name__ == "__main__":
    unittest.main()
