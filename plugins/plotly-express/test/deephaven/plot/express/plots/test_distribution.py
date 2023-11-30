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
                "line": {"color": "rgba(255,255,255,0)"},
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


if __name__ == "__main__":
    unittest.main()
