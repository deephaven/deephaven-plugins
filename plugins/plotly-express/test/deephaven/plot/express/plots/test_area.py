import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class AreaTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col
        import deephaven.pandas as dhpd

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

        self.pandas_source = dhpd.to_pandas(self.source)

    def test_basic_area(self):
        import src.deephaven.plot.express as dx

        chart = dx.area(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

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
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
                "type": "scatter",
            }
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
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_area_step(self):
        import src.deephaven.plot.express as dx

        chart = dx.area(self.source, x="X", y="Y", line_shape="hvh").to_dict(
            self.exporter
        )
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        expected_data = [
            {
                "fillpattern": {"shape": ""},
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"color": "#636efa", "shape": "hvh"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "orientation": "v",
                "showlegend": False,
                "stackgroup": "1",
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
                "type": "scatter",
            }
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
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)

    def test_area_pandas(self):
        import src.deephaven.plot.express as dx

        chart = dx.area(self.pandas_source, x="X", y="Y").to_dict(self.exporter)

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
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
                "type": "scatter",
            }
        ]

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

        expected_mappings = [
            {
                "table": 0,
                "data_columns": {"X": ["/plotly/data/0/x"], "Y": ["/plotly/data/0/y"]},
            }
        ]

        self.assert_chart_equals(
            chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_area_table_pandas_same(self):
        import src.deephaven.plot.express as dx

        chart_pandas = dx.area(self.pandas_source, x="X", y="Y")
        chart_table = dx.area(self.source, x="X", y="Y")

        self.assert_chart_equals(chart_pandas, chart_table)

    def test_area_calendar(self):
        import src.deephaven.plot.express as dx

        chart = dx.area(self.source, x="X", y="Y", calendar="TestCalendar").to_dict(
            self.exporter
        )

        expected_calendar = {
            "timeZone": "America/New_York",
            "businessDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
            "holidays": [
                {"date": "2024-01-01", "businessPeriods": []},
                {
                    "date": "2024-04-01",
                    "businessPeriods": [
                        {
                            "open": "08:00",
                            "close": "12:00",
                        }
                    ],
                },
            ],
            "businessPeriods": [{"open": "08:00", "close": "12:00"}],
        }

        self.assert_calendar_equal(chart["deephaven"]["calendar"], expected_calendar)


if __name__ == "__main__":
    unittest.main()
