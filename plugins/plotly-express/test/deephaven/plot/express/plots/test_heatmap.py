import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_DOUBLE


class HeatmapTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table(
            [
                int_col("X", [1, 2, 3, 4, 5]),
                int_col("Y", [1, 2, 3, 4, 5]),
                int_col("Z", [1, 2, 3, 4, 5]),
            ]
        )

    def test_basic_heatmap(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG

        chart = dx.density_heatmap(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "coloraxis": "coloraxis",
                "hovertemplate": "X=%{x}<br>Y=%{y}<br>count=%{z}<extra></extra>",
                "opacity": 1.0,
                "x": PLOTLY_NULL_DOUBLE,
                "y": PLOTLY_NULL_DOUBLE,
                "z": [NULL_LONG],
                "type": "heatmap",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "coloraxis": {
                "colorbar": {"title": {"text": "count"}},
                "colorscale": [
                    [0.0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1.0, "#f0f921"],
                ],
            },
            "xaxis": {"anchor": "y", "side": "bottom", "title": {"text": "X"}},
            "yaxis": {"anchor": "x", "side": "left", "title": {"text": "Y"}},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "Y": ["/plotly/data/0/y"],
                    "count": ["/plotly/data/0/z"],
                },
                "table": 0,
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_heatmap_relabel_z(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG

        chart = dx.density_heatmap(
            self.source,
            x="X",
            y="Y",
            z="Z",
            labels={"X": "Column X", "Y": "Column Y", "Z": "Column Z"},
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "coloraxis": "coloraxis",
                "hovertemplate": "Column X=%{x}<br>Column Y=%{y}<br>count of Column Z=%{z}<extra></extra>",
                "opacity": 1.0,
                "x": PLOTLY_NULL_DOUBLE,
                "y": PLOTLY_NULL_DOUBLE,
                "z": [NULL_LONG],
                "type": "heatmap",
            }
        ]
        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "coloraxis": {
                "colorbar": {"title": {"text": "count of Column Z"}},
                "colorscale": [
                    [0.0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1.0, "#f0f921"],
                ],
            },
            "xaxis": {"anchor": "y", "side": "bottom", "title": {"text": "Column X"}},
            "yaxis": {"anchor": "x", "side": "left", "title": {"text": "Column Y"}},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "Y": ["/plotly/data/0/y"],
                    "count": ["/plotly/data/0/z"],
                },
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_heatmap_relabel_agg_z(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG

        chart = dx.density_heatmap(
            self.source,
            x="X",
            y="Y",
            z="Z",
            labels={"X": "Column X", "Y": "Column Y", "count of Z": "count"},
        ).to_dict(self.exporter)

        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "coloraxis": "coloraxis",
                "hovertemplate": "Column X=%{x}<br>Column Y=%{y}<br>count=%{z}<extra></extra>",
                "opacity": 1.0,
                "x": PLOTLY_NULL_DOUBLE,
                "y": PLOTLY_NULL_DOUBLE,
                "z": [NULL_LONG],
                "type": "heatmap",
            }
        ]
        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "coloraxis": {
                "colorbar": {"title": {"text": "count"}},
                "colorscale": [
                    [0.0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1.0, "#f0f921"],
                ],
            },
            "xaxis": {"anchor": "y", "side": "bottom", "title": {"text": "Column X"}},
            "yaxis": {"anchor": "x", "side": "left", "title": {"text": "Column Y"}},
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "Y": ["/plotly/data/0/y"],
                    "count": ["/plotly/data/0/z"],
                },
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_full_heatmap(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_LONG

        chart = dx.density_heatmap(
            self.source,
            x="X",
            y="Y",
            z="Z",
            labels={
                "X": "Column X",
                "Y": "Column Y",
                "Z": "Column Z",
                "sum of Column Z": "sum",
            },
            color_continuous_scale="Magma",
            range_color=[0, 10],
            color_continuous_midpoint=5,
            opacity=0.5,
            log_x=True,
            log_y=False,
            range_x=[0, 1],
            range_y=[0, 10],
            range_bins_x=[5, 10],
            range_bins_y=[5, 10],
            empty_bin_default=0,
            histfunc="sum",
            nbinsx=2,
            nbinsy=2,
            title="Test Title",
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "coloraxis": "coloraxis",
                "hovertemplate": "Column X=%{x}<br>Column Y=%{y}<br>sum=%{z}<extra></extra>",
                "opacity": 0.5,
                "type": "heatmap",
                "x": PLOTLY_NULL_DOUBLE,
                "y": PLOTLY_NULL_DOUBLE,
                "z": [NULL_LONG],
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "coloraxis": {
                "cmax": 10,
                "cmid": 5,
                "cmin": 0,
                "colorbar": {"title": {"text": "sum"}},
                "colorscale": [
                    [0.0, "#000004"],
                    [0.1111111111111111, "#180f3d"],
                    [0.2222222222222222, "#440f76"],
                    [0.3333333333333333, "#721f81"],
                    [0.4444444444444444, "#9e2f7f"],
                    [0.5555555555555556, "#cd4071"],
                    [0.6666666666666666, "#f1605d"],
                    [0.7777777777777778, "#fd9668"],
                    [0.8888888888888888, "#feca8d"],
                    [1.0, "#fcfdbf"],
                ],
            },
            "title": {"text": "Test Title"},
            "xaxis": {
                "anchor": "y",
                "range": [0, 1],
                "side": "bottom",
                "title": {"text": "Column X"},
                "type": "log",
            },
            "yaxis": {
                "anchor": "x",
                "range": [0, 10],
                "side": "left",
                "title": {"text": "Column Y"},
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                "data_columns": {
                    "X": ["/plotly/data/0/x"],
                    "Y": ["/plotly/data/0/y"],
                    "sum": ["/plotly/data/0/z"],
                },
                "table": 0,
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)


if __name__ == "__main__":
    unittest.main()
