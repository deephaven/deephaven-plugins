import unittest

from ..BaseTest import BaseTestCase


class ScatterTestCase(BaseTestCase):
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

    def test_basic_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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
                "table": 0,
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_list_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y=["Y", "Y2"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "markers",
                "name": "Y",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y2",
                "marker": {"color": "#EF553B", "symbol": "circle"},
                "mode": "markers",
                "name": "Y2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
            },
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y", by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "category=1<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "markers",
                "name": "1",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "category=2<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B", "symbol": "circle"},
                "mode": "markers",
                "name": "2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_none_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(
            self.source, x="X", y="Y", by="category", by_vars=None
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "category=1<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "1",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "category=2<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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

    def test_list_by_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y=["Y", "Y2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "category=1<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "markers",
                "name": "1",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "category=2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B", "symbol": "circle"},
                "mode": "markers",
                "name": "2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
            },
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_variable_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y=["Y", "Y2"], by="variable").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "markers",
                "name": "Y",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y2",
                "marker": {"color": "#EF553B", "symbol": "circle"},
                "mode": "markers",
                "name": "Y2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
            },
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_variable_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(
            self.source, x="X", y=["Y", "Y2"], by=["variable", "category"]
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "category=1<br>variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "1, Y",
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "markers",
                "name": "1, Y",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "category=2<br>variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "2, Y",
                "marker": {"color": "#EF553B", "symbol": "circle"},
                "mode": "markers",
                "name": "2, Y",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "category=1<br>variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "1, Y2",
                "marker": {"color": "#00CC96", "symbol": "circle"},
                "mode": "markers",
                "name": "1, Y2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "hovertemplate": "category=2<br>variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "2, Y2",
                "marker": {"color": "#AB63FA", "symbol": "circle"},
                "mode": "markers",
                "name": "2, Y2",
                "showlegend": True,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
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
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
            },
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
            },
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/2/x"],
                    "value": ["/plotly/data/2/y"],
                },
            },
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/3/x"],
                    "value": ["/plotly/data/3/y"],
                },
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_marginal_scatter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT, NULL_LONG, NULL_DOUBLE

        chart = dx.scatter(
            self.source, x="X", y="Y", marginal_x="rug", marginal_y="histogram"
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
                "type": "scattergl",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "X=%{x}<extra></extra>",
                "jitter": 0,
                "legendgroup": "",
                "line": {"color": "rgba(255,255,255,0)"},
                "marker": {"color": "#636efa", "symbol": "line-ns-open"},
                "name": "",
                "offsetgroup": "",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": False,
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x2",
                "y0": " ",
                "yaxis": "y2",
                "type": "box",
            },
            {
                "alignmentgroup": "True",
                "hovertemplate": "Y=%{y}<br>count=%{x}<extra></extra>",
                "legendgroup": "",
                "marker": {
                    "color": "#636efa",
                    "opacity": 0.5,
                    "pattern": {"shape": ""},
                },
                "name": "",
                "offsetgroup": "",
                "orientation": "h",
                "showlegend": False,
                "textposition": "auto",
                "x": [NULL_LONG],
                "xaxis": "x3",
                "y": [NULL_DOUBLE],
                "yaxis": "y3",
                "type": "bar",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "bargap": 0,
            "barmode": "overlay",
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 0.745],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 0.74],
                "side": "left",
                "title": {"text": "Y"},
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 0.745],
                "matches": "x",
                "showgrid": False,
                "showline": False,
                "showticklabels": False,
                "ticks": "",
            },
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.75, 1.0],
                "showgrid": False,
                "showline": False,
                "showticklabels": False,
                "ticks": "",
            },
            "xaxis3": {
                "anchor": "y3",
                "domain": [0.75, 1.0],
                "showgrid": False,
                "showline": False,
                "showticklabels": False,
                "ticks": "",
            },
            "yaxis3": {
                "anchor": "x3",
                "domain": [0.0, 0.74],
                "matches": "y",
                "showgrid": False,
                "showline": False,
                "showticklabels": False,
                "ticks": "",
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
            },
            {"table": 0, "data_columns": {"X": ["/plotly/data/1/x"]}},
            {
                "table": 0,
                "data_columns": {
                    "count": ["/plotly/data/2/y"],
                    "Y": ["/plotly/data/2/x"],
                },
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)


if __name__ == "__main__":
    unittest.main()
