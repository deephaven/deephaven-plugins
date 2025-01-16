import unittest

from ..BaseTest import BaseTestCase


class IndicatorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col
        import deephaven.pandas as dhpd

        self.source = new_table(
            [
                int_col("value", [1, 2, 3]),
                int_col("reference", [2, 2, 2]),
                string_col("text", ["A", "B", "C"]),
            ]
        )

        self.pandas_source = dhpd.to_pandas(self.source)

    def test_basic_indicator(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(self.source, value="value").to_dict(self.exporter)

        expected_data = [
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            }
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}, "margin": {"t": 60}}

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/value"]}, "table": 0}
        ]

        self.assert_chart_equals(
            chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_complex_indicator(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(
            self.source,
            value="value",
            reference="reference",
            text="text",
            number=False,
            gauge="angular",
            axis=False,
            prefix="prefix",
            suffix="suffix",
            increasing_text="increasing",
            decreasing_text="decreasing",
            number_format="$#,##0.00",
            title="title",
        ).to_dict(self.exporter)

        expected_data = [
            {
                "delta": {
                    "decreasing": {"symbol": "decreasing"},
                    "increasing": {"symbol": "increasing"},
                    "prefix": "prefix",
                    "reference": -2147483648,
                    "suffix": "suffix",
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT$#,##0.00",
                },
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "gauge": {"axis": {"visible": False}, "shape": "angular"},
                "mode": "delta+gauge",
                "number": {
                    "prefix": "prefix",
                    "suffix": "suffix",
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT$#,##0.00",
                },
                "title": {"text": "None"},
                "type": "indicator",
                "value": -2147483648,
            }
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
            "title": {"text": "title"},
        }

        expected_mappings = [
            {
                "data_columns": {
                    "reference": ["/plotly/data/0/delta/reference"],
                    "text": ["/plotly/data/0/title/text"],
                    "value": ["/plotly/data/0/value"],
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

    def test_by_indicators(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(
            self.source,
            value="value",
            by="text",
            by_vars=("increasing_color", "decreasing_color", "gauge_color"),
            increasing_color_sequence=["salmon", "green", "chocolate"],
            increasing_color_map={"B": "salmon"},
            decreasing_color_sequence=["blue", "purple", "red"],
            decreasing_color_map={"B": "bisque"},
            gauge_color_sequence=["pink", "yellow", "orange"],
            gauge_color_map={"B": "chartreuse"},
        ).to_dict(self.exporter)

        expected_data = [
            {
                "delta": {
                    "decreasing": {"color": "red", "symbol": "▼"},
                    "increasing": {"color": "chocolate", "symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 0.45], "y": [0.0, 0.425]},
                "gauge": {"bar": {"color": "orange"}},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"color": "blue", "symbol": "▼"},
                    "increasing": {"color": "salmon", "symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 0.45], "y": [0.575, 1.0]},
                "gauge": {"bar": {"color": "pink"}},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"color": "bisque", "symbol": "▼"},
                    "increasing": {"color": "salmon", "symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.55, 1.0], "y": [0.575, 1.0]},
                "gauge": {"bar": {"color": "chartreuse"}},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}, "margin": {"t": 60}}

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/2/value"]}, "table": 0},
        ]

        self.assert_chart_equals(
            chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_color_indicators(self):
        import src.deephaven.plot.express as dx

        chart = dx.indicator(
            self.source,
            value="value",
            increasing_color="text",
            decreasing_color="text",
            gauge_color="text",
            increasing_color_sequence=["salmon", "green", "chocolate"],
            increasing_color_map={"B": "salmon"},
            decreasing_color_sequence=["blue", "purple", "red"],
            decreasing_color_map={"B": "bisque"},
            gauge_color_sequence=["pink", "yellow", "orange"],
            gauge_color_map={"B": "chartreuse"},
        ).to_dict(self.exporter)

        chart_by = dx.indicator(
            self.source,
            value="value",
            by="text",
            by_vars=("increasing_color", "decreasing_color", "gauge_color"),
            increasing_color_sequence=["salmon", "green", "chocolate"],
            increasing_color_map={"B": "salmon"},
            decreasing_color_sequence=["blue", "purple", "red"],
            decreasing_color_map={"B": "bisque"},
            gauge_color_sequence=["pink", "yellow", "orange"],
            gauge_color_map={"B": "chartreuse"},
        ).to_dict(self.exporter)

        self.assert_chart_equals(chart, chart_by)

    def test_square_indicators(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(self.source, value="value", by="text").to_dict(
            self.exporter
        )

        expected_data = [
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 0.45], "y": [0.0, 0.425]},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 0.45], "y": [0.575, 1.0]},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.55, 1.0], "y": [0.575, 1.0]},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}, "margin": {"t": 60}}

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/2/value"]}, "table": 0},
        ]

        self.assert_chart_equals(
            chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_row_indicators(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(self.source, value="value", by="text", rows=1).to_dict(
            self.exporter
        )

        expected_data = [
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 0.28888888888888886], "y": [0.0, 1.0]},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {
                    "x": [0.3555555555555555, 0.6444444444444444],
                    "y": [0.0, 1.0],
                },
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {
                    "x": [0.711111111111111, 0.9999999999999999],
                    "y": [0.0, 1.0],
                },
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}, "margin": {"t": 60}}

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/2/value"]}, "table": 0},
        ]

        self.assert_chart_equals(
            chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )

    def test_column_indicators(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(self.source, value="value", by="text", cols=1).to_dict(
            self.exporter
        )

        expected_data = [
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {"x": [0.0, 1.0], "y": [0.0, 0.26666666666666666]},
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {
                    "x": [0.0, 1.0],
                    "y": [0.36666666666666664, 0.6333333333333333],
                },
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00",
                },
                "domain": {
                    "x": [0.0, 1.0],
                    "y": [0.7333333333333333, 0.9999999999999999],
                },
                "mode": "number",
                "number": {"valueformat": "DEEPHAVEN_JAVA_FORMAT#,##0.00"},
                "type": "indicator",
                "value": NULL_INT,
            },
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}, "margin": {"t": 60}}

        expected_mappings = [
            {"data_columns": {"value": ["/plotly/data/0/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/1/value"]}, "table": 0},
            {"data_columns": {"value": ["/plotly/data/2/value"]}, "table": 0},
        ]

        self.assert_chart_equals(
            chart,
            expected_data=expected_data,
            expected_layout=expected_layout,
            expected_mappings=expected_mappings,
            expected_is_user_set_template=False,
            expected_is_user_set_color=False,
        )


if __name__ == "__main__":
    unittest.main()
