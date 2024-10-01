import unittest

from ..BaseTest import BaseTestCase


class DistributionTestCase(BaseTestCase):
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

    def test_basic_histogram_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG, NULL_DOUBLE

        chart = dx.histogram(self.source, x="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "hovertemplate": "X=%{x}<br>count=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "offsetgroup": "",
                "orientation": "v",
                "showlegend": False,
                "textposition": "auto",
                "x": [NULL_DOUBLE],
                "xaxis": "x",
                "y": [NULL_LONG],
                "yaxis": "y",
                "type": "bar",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "bargap": 0,
            "barmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
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
                "table": 0,
                "data_columns": {
                    "count": ["/plotly/data/0/x"],
                    "X": ["/plotly/data/0/y"],
                },
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_histogram_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG, NULL_DOUBLE

        chart = dx.histogram(self.source, y="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "hovertemplate": "count=%{x}<br>X=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "offsetgroup": "",
                "orientation": "h",
                "showlegend": False,
                "textposition": "auto",
                "x": [NULL_LONG],
                "xaxis": "x",
                "y": [NULL_DOUBLE],
                "yaxis": "y",
                "type": "bar",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "bargap": 0,
            "barmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
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
                "title": {"text": "X"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "count": ["/plotly/data/0/y"],
                },
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_marginal_histogram_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG, NULL_DOUBLE, NULL_INT

        chart = dx.histogram(self.source, x="X", marginal="violin").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "hovertemplate": "X=%{x}<br>count=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "offsetgroup": "",
                "orientation": "v",
                "showlegend": False,
                "textposition": "auto",
                "x": [NULL_DOUBLE],
                "xaxis": "x",
                "y": [NULL_LONG],
                "yaxis": "y",
                "type": "bar",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "X=%{x}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "offsetgroup": "",
                "orientation": "h",
                "scalegroup": "True",
                "showlegend": False,
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x2",
                "y0": " ",
                "yaxis": "y2",
                "type": "violin",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "bargap": 0,
            "barmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 0.74],
                "side": "left",
                "title": {"text": "count"},
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
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
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "count": ["/plotly/data/0/x"],
                    "X": ["/plotly/data/0/y"],
                },
            },
            {"table": 0, "data_columns": {"X": ["/plotly/data/1/x"]}},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_marginal_histogram_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG, NULL_DOUBLE, NULL_INT

        chart = dx.histogram(self.source, x="X", marginal="box").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "hovertemplate": "X=%{x}<br>count=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "pattern": {"shape": ""}},
                "name": "",
                "offsetgroup": "",
                "orientation": "v",
                "showlegend": False,
                "textposition": "auto",
                "x": [NULL_DOUBLE],
                "xaxis": "x",
                "y": [NULL_LONG],
                "yaxis": "y",
                "type": "bar",
            },
            {
                "alignmentgroup": "True",
                "hovertemplate": "X=%{x}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "notched": False,
                "offsetgroup": "",
                "orientation": "h",
                "showlegend": False,
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x2",
                "y0": " ",
                "yaxis": "y2",
                "type": "box",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "bargap": 0,
            "barmode": "group",
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 0.74],
                "side": "left",
                "title": {"text": "count"},
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
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
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "count": ["/plotly/data/0/x"],
                    "X": ["/plotly/data/0/y"],
                },
            },
            {"table": 0, "data_columns": {"X": ["/plotly/data/1/x"]}},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_violin_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "X=%{x}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "offsetgroup": "",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": False,
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
                "type": "violin",
            }
        ]
        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [{"table": 0, "data_columns": {"X": ["/plotly/data/0/x"]}}]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_violin_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, y="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "X=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "offsetgroup": "",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": False,
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
                "type": "violin",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "violinmode": "group",
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "X"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [{"table": 0, "data_columns": {"X": ["/plotly/data/0/y"]}}]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_violin_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "offsetgroup": "",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": False,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "violinmode": "group",
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

    def test_list_violin_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x=["X", "Y"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=X<br>value=%{x}<extra></extra>",
                "legendgroup": "X",
                "marker": {"color": "#636EFA"},
                "name": "X",
                "offsetgroup": "variable0",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=Y<br>value=%{x}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#EF553B"},
                "name": "Y",
                "offsetgroup": "variable1",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_violin_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, y=["X", "Y"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=X<br>value=%{y}<extra></extra>",
                "legendgroup": "X",
                "marker": {"color": "#636EFA"},
                "name": "X",
                "offsetgroup": "variable0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=Y<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#EF553B"},
                "name": "Y",
                "offsetgroup": "variable1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_violin_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x=["X", "X2"], y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=X<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "X",
                "marker": {"color": "#636EFA"},
                "name": "X",
                "offsetgroup": "variable0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=X2<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "X2",
                "marker": {"color": "#EF553B"},
                "name": "X2",
                "offsetgroup": "variable1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
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
                    "value": ["/plotly/data/0/x"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "Y": ["/plotly/data/1/y"],
                    "value": ["/plotly/data/1/x"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

        chart = dx.violin(self.source, x="X", y=["Y", "Y2"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#636EFA"},
                "name": "Y",
                "offsetgroup": "variable0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y2",
                "marker": {"color": "#EF553B"},
                "name": "Y2",
                "offsetgroup": "variable1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
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
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_violin_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x="X", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>X=%{x}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>X=%{x}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"X": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"X": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_violin_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, y="Y", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"Y": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"Y": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_violin_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x="X", y="Y", by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
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
            },
            {
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_violin_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x=["X", "X2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>value=%{x}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>value=%{x}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "h",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_violin_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, y=["Y", "Y2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>value=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>value=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_violin_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x=["X", "X2"], y="Y", by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
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
                    "value": ["/plotly/data/0/x"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "Y": ["/plotly/data/1/y"],
                    "value": ["/plotly/data/1/x"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x="X", y=["Y", "Y2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
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
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_basic_box_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "X=%{x}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "notched": False,
                "offsetgroup": "",
                "orientation": "h",
                "showlegend": False,
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
                "type": "box",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [{"table": 0, "data_columns": {"X": ["/plotly/data/0/x"]}}]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_box_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, y="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "X=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "notched": False,
                "offsetgroup": "",
                "orientation": "v",
                "showlegend": False,
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
                "type": "box",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "X"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [{"table": 0, "data_columns": {"X": ["/plotly/data/0/y"]}}]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_box_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "notched": False,
                "offsetgroup": "",
                "orientation": "v",
                "showlegend": False,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
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

    def test_list_box_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x=["X", "Y"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=X<br>value=%{x}<extra></extra>",
                "legendgroup": "X",
                "marker": {"color": "#636EFA"},
                "name": "X",
                "notched": False,
                "offsetgroup": "variable0",
                "orientation": "h",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=Y<br>value=%{x}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#EF553B"},
                "name": "Y",
                "notched": False,
                "offsetgroup": "variable1",
                "orientation": "h",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_box_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, y=["X", "Y"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=X<br>value=%{y}<extra></extra>",
                "legendgroup": "X",
                "marker": {"color": "#636EFA"},
                "name": "X",
                "notched": False,
                "offsetgroup": "variable0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=Y<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#EF553B"},
                "name": "Y",
                "notched": False,
                "offsetgroup": "variable1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_box_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x=["X", "X2"], y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=X<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "X",
                "marker": {"color": "#636EFA"},
                "name": "X",
                "notched": False,
                "offsetgroup": "variable0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=X2<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "X2",
                "marker": {"color": "#EF553B"},
                "name": "X2",
                "notched": False,
                "offsetgroup": "variable1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
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
                    "value": ["/plotly/data/0/x"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "Y": ["/plotly/data/1/y"],
                    "value": ["/plotly/data/1/x"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

        chart = dx.box(self.source, x="X", y=["Y", "Y2"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#636EFA"},
                "name": "Y",
                "notched": False,
                "offsetgroup": "variable0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y2",
                "marker": {"color": "#EF553B"},
                "name": "Y2",
                "notched": False,
                "offsetgroup": "variable1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
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
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_box_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x="X", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=1<br>X=%{x}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "notched": False,
                "offsetgroup": "category0",
                "orientation": "h",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=2<br>X=%{x}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "notched": False,
                "offsetgroup": "category1",
                "orientation": "h",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"X": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"X": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_box_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, y="Y", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=1<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "notched": False,
                "offsetgroup": "category0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=2<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "notched": False,
                "offsetgroup": "category1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"Y": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"Y": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_box_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x="X", y="Y", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=1<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "notched": False,
                "offsetgroup": "category0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=2<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "notched": False,
                "offsetgroup": "category1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
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
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            },
            {
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_box_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x=["X", "X2"], by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=1<br>value=%{x}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "notched": False,
                "offsetgroup": "category0",
                "orientation": "h",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=2<br>value=%{x}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "notched": False,
                "offsetgroup": "category1",
                "orientation": "h",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_box_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, y="Y", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=1<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "notched": False,
                "offsetgroup": "category0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=2<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "notched": False,
                "offsetgroup": "category1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"Y": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"Y": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_box_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, x=["X", "X2"], y="Y", by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=1<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "notched": False,
                "offsetgroup": "category0",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "category=2<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "notched": False,
                "offsetgroup": "category1",
                "orientation": "v",
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
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
                    "value": ["/plotly/data/0/x"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "Y": ["/plotly/data/1/y"],
                    "value": ["/plotly/data/1/x"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.violin(self.source, x="X", y=["Y", "Y2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
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
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_basic_strip_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "X=%{x}<extra></extra>",
                "legendgroup": "",
                "line": {"width": 0},
                "marker": {"color": "#636efa"},
                "name": "",
                "offsetgroup": "",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": False,
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
                "type": "box",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [{"table": 0, "data_columns": {"X": ["/plotly/data/0/x"]}}]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_strip_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.box(self.source, y="X").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "outliers",
                "hovertemplate": "X=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa"},
                "name": "",
                "notched": False,
                "offsetgroup": "",
                "orientation": "v",
                "showlegend": False,
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
                "type": "box",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "X"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [{"table": 0, "data_columns": {"X": ["/plotly/data/0/y"]}}]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_basic_strip_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"width": 0},
                "marker": {"color": "#636efa"},
                "name": "",
                "offsetgroup": "",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": False,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "showlegend": False,
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

    def test_list_strip_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x=["X", "Y"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "variable=X<br>value=%{x}<extra></extra>",
                "legendgroup": "X",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "X",
                "offsetgroup": "variable0",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "variable=Y<br>value=%{x}<extra></extra>",
                "legendgroup": "Y",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "Y",
                "offsetgroup": "variable1",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_strip_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, y=["X", "Y"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "variable=X<br>value=%{y}<extra></extra>",
                "legendgroup": "X",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "X",
                "offsetgroup": "variable0",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "variable=Y<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "Y",
                "offsetgroup": "variable1",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "value"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_strip_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x=["X", "X2"], y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "variable=X<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "X",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "X",
                "offsetgroup": "variable0",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "variable=X2<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "X2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "X2",
                "offsetgroup": "variable1",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
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
                    "value": ["/plotly/data/0/x"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "Y": ["/plotly/data/1/y"],
                    "value": ["/plotly/data/1/x"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

        chart = dx.violin(self.source, x="X", y=["Y", "Y2"]).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=Y<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y",
                "marker": {"color": "#636EFA"},
                "name": "Y",
                "offsetgroup": "variable0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "variable=Y2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "Y2",
                "marker": {"color": "#EF553B"},
                "name": "Y2",
                "offsetgroup": "variable1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
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
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_strip_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x="X", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=1<br>X=%{x}<extra></extra>",
                "legendgroup": "1",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=2<br>X=%{x}<extra></extra>",
                "legendgroup": "2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"X": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"X": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_strip_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, y="Y", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=1<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=2<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"Y": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"Y": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_by_strip_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x="X", y="Y", by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=1<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=2<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
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
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            },
            {
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_strip_x(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x=["X", "X2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=1<br>value=%{x}<extra></extra>",
                "legendgroup": "1",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=2<br>value=%{x}<extra></extra>",
                "legendgroup": "2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "h",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/x"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/x"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_strip_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, y="Y", by="category").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=1<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=2<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {"data_columns": {"Y": ["/plotly/data/0/y"]}, "table": 0},
            {"data_columns": {"Y": ["/plotly/data/1/y"]}, "table": 0},
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

    def test_list_by_strip_x_y(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.strip(self.source, x=["X", "X2"], y="Y", by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=1<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "1",
                "line": {"width": 0},
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "boxpoints": "all",
                "fillcolor": "rgba(255,255,255,0)",
                "hoveron": "points",
                "hovertemplate": "category=2<br>value=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "2",
                "line": {"width": 0},
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "pointpos": 0,
                "showlegend": True,
                "type": "box",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "boxmode": "group",
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "value"},
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
                    "value": ["/plotly/data/0/x"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "Y": ["/plotly/data/1/y"],
                    "value": ["/plotly/data/1/x"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)

        chart = dx.violin(self.source, x="X", y=["Y", "Y2"], by="category").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=1<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "1",
                "marker": {"color": "#636EFA"},
                "name": "1",
                "offsetgroup": "category0",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
            {
                "alignmentgroup": "True",
                "box": {"visible": False},
                "hovertemplate": "category=2<br>X=%{x}<br>value=%{y}<extra></extra>",
                "legendgroup": "2",
                "marker": {"color": "#EF553B"},
                "name": "2",
                "offsetgroup": "category1",
                "orientation": "v",
                "points": "outliers",
                "scalegroup": "True",
                "showlegend": True,
                "type": "violin",
                "x": [NULL_INT],
                "x0": " ",
                "xaxis": "x",
                "y": [NULL_INT],
                "y0": " ",
                "yaxis": "y",
            },
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "violinmode": "group",
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
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "value": ["/plotly/data/0/y"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "X": ["/plotly/data/1/x"],
                    "value": ["/plotly/data/1/y"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], True)


if __name__ == "__main__":
    unittest.main()
