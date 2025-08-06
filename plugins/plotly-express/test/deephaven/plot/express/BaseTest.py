from __future__ import annotations

import unittest
from unittest.mock import patch

import pandas as pd
from deephaven.plot.express import DeephavenFigure
from typing import List

# Deephaven's NULL_INT and NULL_DOUBLE, converted with Plotly's base64 API
# https://github.com/plotly/plotly.py/pull/4470
PLOTLY_NULL_INT = {"dtype": "i4", "bdata": "AAAAgA=="}
PLOTLY_NULL_DOUBLE = {"dtype": "f8", "bdata": "////////7/8="}


def remap_types(
    df: pd.DataFrame,
) -> None:
    """
    Remap the types of the columns to the correct types

    Args:
        df: The dataframe to remap the types of
    """
    for col in df.columns:
        if df[col].dtype == "int64":
            df[col] = df[col].astype("Int64")
        elif df[col].dtype == "float64":
            df[col] = df[col].astype("Float64")


DEFAULT_PLOTLY_TRACE = {
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
}

DEFAULT_PLOTLY_DATA = [DEFAULT_PLOTLY_TRACE]

DEFAULT_PLOTLY_LAYOUT = {
    "legend": {"tracegroupgap": 0},
    "margin": {},
    "xaxis": {"anchor": "y", "domain": [0.0, 1.0], "title": {"text": "x"}},
    "yaxis": {"anchor": "x", "domain": [0.0, 1.0], "title": {"text": "y"}},
}


class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.setup_exporter_mock()

    @classmethod
    @patch("deephaven.plugin.object_type.Exporter")
    @patch("deephaven.plugin.object_type.Reference")
    def setup_exporter_mock(cls, MockExporter, MockReference):
        cls.exporter = MockExporter()
        cls.reference = MockReference()

        cls.reference.id = 0
        cls.exporter.reference.return_value = MockReference()

    def assert_chart_equals(
        self,
        chart: DeephavenFigure | dict,
        matching_chart: DeephavenFigure | dict = None,
        expected_data: List[dict] = None,
        expected_layout: dict = None,
        expected_mappings: List[dict] = None,
        expected_is_user_set_template: bool = None,
        expected_is_user_set_color: bool = None,
        expected_calendar: dict = None,
        expected_filter_columns: dict = None,
        pop_template: bool = True,
    ) -> None:
        """
        Verify that the chart is as expected
        If matching_chart is provided, the different charts are compared
        The "expected" parameters take precedence over the values extracted from matching_chart
        All "expected" parameters are optional to only match part of the chart if desired

        Args:
            chart: The chart to verify
            matching_chart: A second chart to verify against
            expected_data: The expected data
            expected_layout: The expected layout
            expected_mappings: The expected mappings
            expected_is_user_set_template: The expected is_user_set_template
            expected_is_user_set_color: The expected is_user_set_color
            expected_calendar: The expected calendar
            expected_filter_columns: The expected filter columns
            pop_template: Whether to pop the template from the chart.
                Pops from both the chart and the expected values, if provided.
        """
        chart = chart.to_dict(self.exporter) if not isinstance(chart, dict) else chart
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        if matching_chart:
            matching_chart = (
                matching_chart.to_dict(self.exporter)
                if not isinstance(matching_chart, dict)
                else matching_chart
            )
            matching_plotly, matching_deephaven = (
                matching_chart["plotly"],
                matching_chart["deephaven"],
            )
            expected_data = expected_data or matching_plotly["data"]
            expected_layout = expected_layout or matching_plotly["layout"]
            expected_mappings = expected_mappings or matching_deephaven["mappings"]
            expected_is_user_set_template = (
                expected_is_user_set_template
                if expected_is_user_set_template is not None
                else matching_deephaven["is_user_set_template"]
            )
            expected_is_user_set_color = (
                expected_is_user_set_color
                if expected_is_user_set_color is not None
                else matching_deephaven["is_user_set_color"]
            )
            # calendar is optional
            expected_calendar = expected_calendar or matching_deephaven.get("calendar")

        if pop_template:
            plotly["layout"].pop("template", None)
            if expected_layout:
                expected_layout.pop("template", None)

        asserted = False
        if expected_data:
            self.assertEqual(plotly["data"], expected_data)
            asserted = True
        if expected_layout:
            self.assertEqual(plotly["layout"], expected_layout)
            asserted = True
        if expected_mappings:
            self.assertEqual(deephaven["mappings"], expected_mappings)
            asserted = True
        if expected_is_user_set_template is not None:
            self.assertEqual(
                deephaven["is_user_set_template"], expected_is_user_set_template
            )
            asserted = True
        if expected_is_user_set_color is not None:
            self.assertEqual(deephaven["is_user_set_color"], expected_is_user_set_color)
            asserted = True

        if expected_calendar is not None:
            self.assert_calendar_equal(deephaven["calendar"], expected_calendar)
            asserted = True

        if expected_filter_columns is not None:
            # use assertCountEqual since filter columns can be in any order
            self.assertCountEqual(deephaven["filterColumns"], expected_filter_columns)

        if not asserted:
            raise ValueError("No comparisons were made in assert_chart_equals")

    def assert_calendar_equal(self, calendar: dict, expected_calendar: dict) -> None:
        """
        Assert that the calendar dictionary is as expected.
        Lists are not required to be in the same order but must have the same elements.

        Args:
            calendar: The calendar dictionary to verify
            expected_calendar: The expected calendar dictionary
        """
        for key, value in expected_calendar.items():
            if isinstance(value, list):
                # lists may not be in the same order which is fine for creating rangebreaks
                self.assertCountEqual(calendar[key], value)
            else:
                self.assertEqual(calendar[key], value)


if __name__ == "__main__":
    unittest.main()
