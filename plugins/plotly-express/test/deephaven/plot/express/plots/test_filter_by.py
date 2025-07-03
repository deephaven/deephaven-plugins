import unittest
from ..BaseTest import (
    BaseTestCase,
    DEFAULT_PLOTLY_DATA,
    DEFAULT_PLOTLY_LAYOUT,
    DEFAULT_PLOTLY_TRACE,
)


class FilterByTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                int_col("X", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Y", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                string_col("cat_one", ["A", "B", "A", "B", "A", "B", "A", "B", "A"]),
                string_col("cat_two", ["C", "D", "C", "D", "C", "D", "C", "D", "C"]),
            ]
        )

        self.partitioned_source = self.source.partition_by(["cat_one", "cat_two"])

    def test_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        exported_chart = chart.to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA

        expected_layout = DEFAULT_PLOTLY_LAYOUT

        expected_filter_columns = {
            "columns": [
                {"name": "cat_one", "required": False, "type": "java.lang.String"}
            ]
        }

        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=B<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "B",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
        ]

        expected_layout = {
            "legend": {"title": {"side": "top", "text": "cat_one"}, "tracegroupgap": 0},
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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {"title": {"side": "top", "text": "cat_one"}, "tracegroupgap": 0},
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_filters(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by=["cat_one", "cat_two"])

        exported_chart = chart.to_dict(self.exporter)

        # before the filter is applied, the chart should be empty because filters
        # the figure is not generated until the first filter is applied
        expected_data = DEFAULT_PLOTLY_DATA

        expected_layout = DEFAULT_PLOTLY_LAYOUT

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": False, "type": "java.lang.String"},
                {"name": "cat_one", "required": False, "type": "java.lang.String"},
            ]
        }

        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=B<br>cat_two=D<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B, D",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "B, D",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A", "cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_required_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", required_filter_by="cat_one")

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_one", "required": True, "type": "java.lang.String"}
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {"title": {"side": "top", "text": "cat_one"}, "tracegroupgap": 0},
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_required_filters(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(
            self.source, x="X", y="Y", required_filter_by=["cat_one", "cat_two"]
        )

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": True, "type": "java.lang.String"},
                {"name": "cat_one", "required": True, "type": "java.lang.String"},
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A", "cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_mixed_filters(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(
            self.source, x="X", y="Y", filter_by="cat_one", required_filter_by="cat_two"
        )

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": True, "type": "java.lang.String"},
                {"name": "cat_one", "required": False, "type": "java.lang.String"},
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A", "cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", by="cat_one", filter_by="cat_two")

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": False, "type": "java.lang.String"}
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636EFA", "dash": "solid", "shape": "linear"},
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=B<br>cat_two=D<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B, D",
                "line": {"color": "#EF553B", "dash": "solid", "shape": "linear"},
                "marker": {"color": "#EF553B", "symbol": "circle"},
                "mode": "lines",
                "name": "B, D",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=True,
        )

        chart.update_filters({"cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636EFA", "dash": "solid", "shape": "linear"},
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=True,
        )

    def test_required_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(
            self.source, x="X", y="Y", by="cat_one", required_filter_by="cat_two"
        )

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": True, "type": "java.lang.String"}
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA

        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636EFA", "dash": "solid", "shape": "linear"},
                "marker": {"color": "#636EFA", "symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=True,
        )

    def test_partitioned_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", filter_by=True)

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": False, "type": "java.lang.String"},
                {"name": "cat_one", "required": False, "type": "java.lang.String"},
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=B<br>cat_two=D<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B, D",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "B, D",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A", "cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_partitioned_required_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", required_filter_by=True)

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": True, "type": "java.lang.String"},
                {"name": "cat_one", "required": True, "type": "java.lang.String"},
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA

        expected_layout = DEFAULT_PLOTLY_LAYOUT

        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A", "cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_partitioned_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", filter_by="cat_one")

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=B<br>cat_two=D<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B, D",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "B, D",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_partitioned_required_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(
            self.partitioned_source, x="X", y="Y", required_filter_by="cat_one"
        )

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_one", "required": True, "type": "java.lang.String"}
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = DEFAULT_PLOTLY_DATA
        expected_layout = DEFAULT_PLOTLY_LAYOUT
        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_one", "required": True, "type": "java.lang.String"}
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A, C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A, C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            }
        ]

        expected_layout = {
            "legend": {
                "title": {"side": "top", "text": "cat_one, cat_two"},
                "tracegroupgap": 0,
            },
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

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_subplot_same_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart_one = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        chart_two = dx.line(self.source, x="X", y="Y", required_filter_by="cat_one")

        chart = dx.make_subplots(chart_one, chart_two, rows=2)

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "x=%{x}<br>y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "type": "scatter",
                "x": [],
                "xaxis": "x",
                "y": [],
                "yaxis": "y",
            },
            {
                "hovertemplate": "x=%{x}<br>y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "type": "scatter",
                "x": [],
                "xaxis": "x2",
                "y": [],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "xaxis2": {"anchor": "y2", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "yaxis": {"anchor": "x", "domain": [0.0, 0.425], "title": {"text": "y"}},
            "yaxis2": {"anchor": "x2", "domain": [0.575, 1.0], "title": {"text": "y"}},
        }

        expected_mappings = []

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "x=%{x}<br>y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "type": "scatter",
                "x": [],
                "xaxis": "x",
                "y": [],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
            {
                "hovertemplate": "cat_one=B<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "B",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"title": {"side": "top"}, "tracegroupgap": 0},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 0.425], "title": {"text": "y"}},
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
                "table": 0,
            },
            {
                "data_columns": {"X": ["/plotly/data/2/x"], "Y": ["/plotly/data/2/y"]},
                "table": 0,
            },
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"title": {"side": "top"}, "tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 0.425],
                "side": "left",
                "title": {"text": "Y"},
            },
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_subplot_different_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart_one = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        chart_two = dx.line(self.source, x="X", y="Y", required_filter_by="cat_two")

        chart = dx.make_subplots(chart_one, chart_two, rows=2)

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "x=%{x}<br>y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "type": "scatter",
                "x": [],
                "xaxis": "x",
                "y": [],
                "yaxis": "y",
            },
            {
                "hovertemplate": "x=%{x}<br>y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "type": "scatter",
                "x": [],
                "xaxis": "x2",
                "y": [],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "xaxis2": {"anchor": "y2", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "yaxis": {"anchor": "x", "domain": [0.0, 0.425], "title": {"text": "y"}},
            "yaxis2": {"anchor": "x2", "domain": [0.575, 1.0], "title": {"text": "y"}},
        }

        expected_mappings = []

        expected_filter_columns = {
            "columns": [
                {"name": "cat_two", "required": True, "type": "java.lang.String"},
                {"name": "cat_one", "required": False, "type": "java.lang.String"},
            ]
        }

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
            expected_filter_columns=expected_filter_columns,
        )

        chart.update_filters({})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            DEFAULT_PLOTLY_TRACE,
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
            {
                "hovertemplate": "cat_one=B<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "B",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "B",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"title": {"side": "top"}, "tracegroupgap": 0},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 0.425], "title": {"text": "y"}},
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
                "table": 0,
            },
            {
                "data_columns": {"X": ["/plotly/data/2/x"], "Y": ["/plotly/data/2/y"]},
                "table": 0,
            },
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "x=%{x}<br>y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "type": "scatter",
                "x": [],
                "xaxis": "x",
                "y": [],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"title": {"side": "top"}, "tracegroupgap": 0},
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "title": {"text": "x"}},
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {"anchor": "x", "domain": [0.0, 0.425], "title": {"text": "y"}},
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

        expected_mappings = [
            {
                "data_columns": {"X": ["/plotly/data/1/x"], "Y": ["/plotly/data/1/y"]},
                "table": 0,
            }
        ]

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

        chart.update_filters({"cat_one": "A", "cat_two": "C"})

        exported_chart = chart.get_figure().to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "cat_two=C<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "C",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "C",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x",
                "y": [NULL_INT],
                "yaxis": "y",
            },
            {
                "hovertemplate": "cat_one=A<br>X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "A",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "A",
                "showlegend": True,
                "type": "scattergl",
                "x": [NULL_INT],
                "xaxis": "x2",
                "y": [NULL_INT],
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"title": {"side": "top"}, "tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 0.425],
                "side": "left",
                "title": {"text": "Y"},
            },
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
        }

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

        self.assert_chart_equals(
            exported_chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_filter_overlap(self):
        import src.deephaven.plot.express as dx

        self.assertRaises(
            ValueError,
            lambda: dx.line(
                self.source,
                x="X",
                y="Y",
                filter_by="cat_one",
                required_filter_by="cat_one",
            ),
        )
