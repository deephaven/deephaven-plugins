import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class MakeSubplotsTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table(
            [
                int_col("X", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Y", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            ]
        )

    def test_basic_make_subplots(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y")
        charts = dx.make_subplots(chart, chart, rows=2).to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            },
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x2",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
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
            charts,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_make_subplots_shared_axes_all(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y")
        charts = dx.make_subplots(
            chart, chart, rows=2, shared_xaxes="all", shared_yaxes="all"
        ).to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            },
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x2",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
                "matches": "x",
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
                "matches": "x",
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 0.425],
                "side": "left",
                "title": {"text": "Y"},
                "matches": "y",
            },
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
                "matches": "y",
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
            charts,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_make_subplots_shared_xaxes(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y")
        charts = dx.make_subplots(chart, chart, rows=2, shared_xaxes=True).to_dict(
            self.exporter
        )

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            },
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x2",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
                "matches": "x",
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.0, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
                "matches": "x",
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
            charts,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_make_subplots_shared_xaxes_row(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y")
        charts = dx.make_subplots(chart, chart, cols=2, shared_xaxes="rows").to_dict(
            self.exporter
        )

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            },
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x2",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 0.45],
                "side": "bottom",
                "title": {"text": "X"},
                "matches": "x",
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.55, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
                "matches": "x",
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
            },
            "yaxis2": {
                "anchor": "x2",
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
            charts,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_make_subplots_shared_yaxes(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y")
        charts = dx.make_subplots(chart, chart, cols=2, shared_yaxes=True).to_dict(
            self.exporter
        )

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            },
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x2",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "xaxis": {
                "anchor": "y",
                "domain": [0.0, 0.45],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "xaxis2": {
                "anchor": "y2",
                "domain": [0.55, 1.0],
                "side": "bottom",
                "title": {"text": "X"},
            },
            "yaxis": {
                "anchor": "x",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
                "matches": "y",
            },
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.0, 1.0],
                "side": "left",
                "title": {"text": "Y"},
                "matches": "y",
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
            charts,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_make_subplots_shared_yaxes_col(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter(self.source, x="X", y="Y")
        charts = dx.make_subplots(chart, chart, rows=2, shared_yaxes="columns").to_dict(
            self.exporter
        )

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
            },
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergl",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x2",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y2",
            },
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
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
                "matches": "y",
            },
            "yaxis2": {
                "anchor": "x2",
                "domain": [0.575, 1.0],
                "side": "left",
                "title": {"text": "Y"},
                "matches": "y",
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
            charts,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_make_subplots_shared_variables(self):
        import src.deephaven.plot.express as dx

        chart = dx.scatter(self.source, x="X", y="Y")

        row_heights = [0.8, 0.2]
        column_widths = [0.8, 0.2]
        vertical_grid = [[chart], [chart]]
        horizontal_grid = [[chart, chart]]
        specs_grid = [[{"l": 0.1}], [{"r": 0.15}]]

        vertical_chart_one = dx.make_subplots(
            grid=vertical_grid, rows=2, row_heights=row_heights, specs=specs_grid
        )

        vertical_chart_two = dx.make_subplots(
            grid=vertical_grid, rows=2, row_heights=row_heights, specs=specs_grid
        )

        self.assert_chart_equals(vertical_chart_one, vertical_chart_two)

        horizontal_chart_one = dx.make_subplots(
            grid=horizontal_grid, cols=2, column_widths=column_widths
        )

        horizontal_chart_two = dx.make_subplots(
            grid=horizontal_grid, cols=2, column_widths=column_widths
        )

        self.assert_chart_equals(horizontal_chart_one, horizontal_chart_two)


if __name__ == "__main__":
    unittest.main()
