import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class LineTestCase(BaseTestCase):
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

    def test_basic_line(self):
        import src.deephaven.plot.express as dx

        chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        expected_data = [
            {
                "hovertemplate": "X=%{x}<br>Y=%{y}<extra></extra>",
                "legendgroup": "",
                "line": {"color": "#636efa", "dash": "solid", "shape": "linear"},
                "marker": {"symbol": "circle"},
                "mode": "lines",
                "name": "",
                "showlegend": False,
                "x": PLOTLY_NULL_INT,
                "xaxis": "x",
                "y": PLOTLY_NULL_INT,
                "yaxis": "y",
                "type": "scattergl",
            }
        ]

        expected_layout = {
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

    def test_line_calendar(self):
        import src.deephaven.plot.express as dx

        chart = dx.line(self.source, x="X", y="Y", calendar="TestCalendar").to_dict(
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
