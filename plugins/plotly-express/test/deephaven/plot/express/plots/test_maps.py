import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class MapTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table(
            [
                int_col("lat", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("lon", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("z", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            ]
        )

    def test_basic_scatter_geo(self):
        import src.deephaven.plot.express as dx

        chart = dx.scatter_geo(self.source, lat="lat", lon="lon").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "featureidkey": "id",
                "geo": "geo",
                "hovertemplate": "lat=%{lat}<br>lon=%{lon}<extra></extra>",
                "lat": PLOTLY_NULL_INT,
                "legendgroup": "",
                "lon": PLOTLY_NULL_INT,
                "marker": {"color": "#636efa", "symbol": "circle"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "type": "scattergeo",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "geo": {"domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]}, "fitbounds": False},
            "legend": {"tracegroupgap": 0},
        }

        self.assertEqual(plotly["layout"], expected_layout)

    def test_basic_scatter_map(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.scatter_map(self.source, lat="lat", lon="lon").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "lat=%{lat}<br>lon=%{lon}<extra></extra>",
                "lat": PLOTLY_NULL_INT,
                "legendgroup": "",
                "lon": PLOTLY_NULL_INT,
                "marker": {"color": "#636efa"},
                "mode": "markers",
                "name": "",
                "showlegend": False,
                "subplot": "map",
                "type": "scattermap",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "map": {
                "center": {"lat": NULL_INT, "lon": NULL_INT},
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "style": "open-street-map",
                "zoom": 8,
            },
            "mapbox": {
                "center": {"lat": -2147483648.0, "lon": -2147483648.0},
                "style": "open-street-map",
                "zoom": 8,
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

    def test_basic_line_geo(self):
        import src.deephaven.plot.express as dx

        chart = dx.line_geo(self.source, lat="lat", lon="lon").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "featureidkey": "id",
                "geo": "geo",
                "hovertemplate": "lat=%{lat}<br>lon=%{lon}<extra></extra>",
                "lat": PLOTLY_NULL_INT,
                "legendgroup": "",
                "line": {"color": "#636efa", "dash": "solid"},
                "lon": PLOTLY_NULL_INT,
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "showlegend": False,
                "type": "scattergeo",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "geo": {"domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]}, "fitbounds": False},
            "legend": {"tracegroupgap": 0},
        }

        self.assertEqual(plotly["layout"], expected_layout)

    def test_basic_line_map(self):
        import src.deephaven.plot.express as dx

        chart = dx.line_map(self.source, lat="lat", lon="lon").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "hovertemplate": "lat=%{lat}<br>lon=%{lon}<extra></extra>",
                "lat": PLOTLY_NULL_INT,
                "legendgroup": "",
                "line": {"color": "#636efa"},
                "lon": PLOTLY_NULL_INT,
                "mode": "lines",
                "name": "",
                "showlegend": False,
                "subplot": "map",
                "type": "scattermap",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "map": {
                "center": {"lat": -2147483648.0, "lon": -2147483648.0},
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "style": "open-street-map",
                "zoom": 8,
            },
            "mapbox": {
                "center": {"lat": -2147483648.0, "lon": -2147483648.0},
                "style": "open-street-map",
                "zoom": 8,
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)

    def test_basic_density_map(self):
        import src.deephaven.plot.express as dx

        chart = dx.density_map(self.source, lat="lat", lon="lon", z="z").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "coloraxis": "coloraxis",
                "hovertemplate": "lat=%{lat}<br>lon=%{lon}<br>z=%{z}<extra></extra>",
                "lat": PLOTLY_NULL_INT,
                "lon": PLOTLY_NULL_INT,
                "name": "",
                "radius": 30,
                "subplot": "map",
                "z": PLOTLY_NULL_INT,
                "type": "densitymap",
            }
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            "coloraxis": {
                "colorbar": {"title": {"text": "z"}},
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
            "legend": {"tracegroupgap": 0},
            "map": {
                "center": {"lat": -2147483648.0, "lon": -2147483648.0},
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "style": "open-street-map",
                "zoom": 8,
            },
            "mapbox": {
                "center": {"lat": -2147483648.0, "lon": -2147483648.0},
                "style": "open-street-map",
                "zoom": 8,
            },
        }

        self.assertEqual(plotly["layout"], expected_layout)


if __name__ == "__main__":
    unittest.main()
