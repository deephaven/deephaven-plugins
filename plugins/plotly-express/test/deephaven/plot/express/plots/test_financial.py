import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class FinancialTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table(
            [
                int_col("X", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Open", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("High", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Low", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Close", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            ]
        )

    def test_basic_ohlc(self):
        import src.deephaven.plot.express as dx

        chart = dx.ohlc(
            self.source, x="X", open="Open", high="High", low="Low", close="Close"
        ).to_dict(self.exporter)

        expected_data = [
            {
                "close": PLOTLY_NULL_INT,
                "high": PLOTLY_NULL_INT,
                "low": PLOTLY_NULL_INT,
                "open": PLOTLY_NULL_INT,
                "type": "ohlc",
                "x": PLOTLY_NULL_INT,
            }
        ]

        expected_layout = {
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        expected_mappings = [
            {
                "data_columns": {
                    "Close": ["/plotly/data/0/close"],
                    "High": ["/plotly/data/0/high"],
                    "Low": ["/plotly/data/0/low"],
                    "Open": ["/plotly/data/0/open"],
                    "X": ["/plotly/data/0/x"],
                },
                "table": 0,
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

    def test_basic_candlestick(self):
        import src.deephaven.plot.express as dx

        chart = dx.candlestick(
            self.source, x="X", open="Open", high="High", low="Low", close="Close"
        ).to_dict(self.exporter)

        expected_data = [
            {
                "close": PLOTLY_NULL_INT,
                "high": PLOTLY_NULL_INT,
                "low": PLOTLY_NULL_INT,
                "open": PLOTLY_NULL_INT,
                "type": "candlestick",
                "x": PLOTLY_NULL_INT,
            }
        ]

        expected_layout = {
            "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "side": "bottom"},
            "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "side": "left"},
        }

        expected_mappings = [
            {
                "data_columns": {
                    "Close": ["/plotly/data/0/close"],
                    "High": ["/plotly/data/0/high"],
                    "Low": ["/plotly/data/0/low"],
                    "Open": ["/plotly/data/0/open"],
                    "X": ["/plotly/data/0/x"],
                },
                "table": 0,
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

    def test_ohlc_calendar(self):
        import src.deephaven.plot.express as dx

        chart = dx.ohlc(
            self.source,
            x="X",
            open="Open",
            high="High",
            low="Low",
            close="Close",
            calendar="TestCalendar",
        ).to_dict(self.exporter)

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

    def test_candlestick_calendar(self):
        import src.deephaven.plot.express as dx

        chart = dx.candlestick(
            self.source,
            x="X",
            open="Open",
            high="High",
            low="Low",
            close="Close",
            calendar="TestCalendar",
        ).to_dict(self.exporter)

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
