import unittest
from unittest.mock import patch

import pandas as pd
from deephaven.plot.express import DeephavenFigure
from deephaven_server import Server
from typing import List


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
        chart: DeephavenFigure,
        matching_chart: DeephavenFigure = None,
        expected_data: List[dict] = None,
        expected_layout: dict = None,
        expected_mappings: List[dict] = None,
        expected_is_user_set_template: bool = None,
        expected_is_user_set_color: bool = None,
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
            pop_template: Whether to pop the template from the chart.
                Pops from both the chart and the expected values, if provided.
        """
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        if matching_chart:
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

        if pop_template:
            plotly["layout"].pop("template", None)
            expected_layout.pop("template", None)

        if expected_data:
            self.assertEqual(plotly["data"], expected_data)
        if expected_layout:
            self.assertEqual(plotly["layout"], expected_layout)
        if expected_mappings:
            self.assertEqual(deephaven["mappings"], expected_mappings)
        if expected_is_user_set_template is not None:
            self.assertEqual(
                deephaven["is_user_set_template"], expected_is_user_set_template
            )
        if expected_is_user_set_color is not None:
            self.assertEqual(deephaven["is_user_set_color"], expected_is_user_set_color)


if __name__ == "__main__":
    unittest.main()
