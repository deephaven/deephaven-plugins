import unittest

from ..BaseTest import BaseTestCase


class IndicatorTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                int_col("value", [1, 2, 3]),
                int_col("reference", [2, 2, 2]),
                string_col("text", ["A", "B", "C"]),
                string_col("single", ["A", "A", "A"]),
            ]
        )

    def test_basic_indicator(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.indicator(self.source, value="value").to_dict(self.exporter)

        expected_data = [
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "mode": "number",
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
                    "reference": NULL_INT,
                    "suffix": "suffix",
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT=$#,##0.00",
                },
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "gauge": {"axis": {"visible": False}, "shape": "angular"},
                "mode": "delta+gauge",
                "number": {
                    "prefix": "prefix",
                    "suffix": "suffix",
                    "valueformat": "DEEPHAVEN_JAVA_FORMAT=$#,##0.00",
                },
                "title": {"text": "None"},
                "type": "indicator",
                "value": NULL_INT,
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
            reference="reference",
            gauge="angular",
            by="text",
            by_vars=("increasing_color", "decreasing_color", "gauge_color"),
            increasing_color_sequence=["salmon", "green", "chocolate"],
            increasing_color_map={"B": "salmon"},
            decreasing_color_sequence=["blue", "purple", "red"],
            decreasing_color_map={"B": "bisque"},
            gauge_color_sequence=["pink", "yellow", "orange"],
            gauge_color_map={"B": "chartreuse"},
        ).to_dict(self.exporter)

        chart["plotly"]["layout"].pop("template")

        expected_data = [
            {
                "delta": {
                    "decreasing": {"color": "red", "symbol": "▼"},
                    "increasing": {"color": "chocolate", "symbol": "▲"},
                    "reference": NULL_INT,
                },
                "domain": {"x": [0.0, 0.45], "y": [0.0, 0.425]},
                "gauge": {
                    "axis": {"visible": True},
                    "bar": {"color": "orange"},
                    "shape": "angular",
                },
                "mode": "number+delta+gauge",
                "type": "indicator",
                "title": {"text": "C"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"color": "blue", "symbol": "▼"},
                    "increasing": {"color": "salmon", "symbol": "▲"},
                    "reference": NULL_INT,
                },
                "domain": {"x": [0.0, 0.45], "y": [0.575, 1.0]},
                "gauge": {
                    "axis": {"visible": True},
                    "bar": {"color": "pink"},
                    "shape": "angular",
                },
                "mode": "number+delta+gauge",
                "type": "indicator",
                "title": {"text": "A"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"color": "bisque", "symbol": "▼"},
                    "increasing": {"color": "salmon", "symbol": "▲"},
                    "reference": NULL_INT,
                },
                "domain": {"x": [0.55, 1.0], "y": [0.575, 1.0]},
                "gauge": {
                    "axis": {"visible": True},
                    "bar": {"color": "chartreuse"},
                    "shape": "angular",
                },
                "mode": "number+delta+gauge",
                "type": "indicator",
                "title": {"text": "B"},
                "value": NULL_INT,
            },
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}, "margin": {"t": 60}}

        expected_mappings = [
            {
                "data_columns": {
                    "reference": ["/plotly/data/0/delta/reference"],
                    "value": ["/plotly/data/0/value"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "reference": ["/plotly/data/1/delta/reference"],
                    "value": ["/plotly/data/1/value"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "reference": ["/plotly/data/2/delta/reference"],
                    "value": ["/plotly/data/2/value"],
                },
                "table": 0,
            },
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
        from deephaven.constants import NULL_INT

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
                },
                "domain": {"x": [0.0, 0.45], "y": [0.0, 0.425]},
                "mode": "number",
                "type": "indicator",
                "title": {"text": "C"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {"x": [0.0, 0.45], "y": [0.575, 1.0]},
                "mode": "number",
                "type": "indicator",
                "title": {"text": "A"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {"x": [0.55, 1.0], "y": [0.575, 1.0]},
                "mode": "number",
                "type": "indicator",
                "title": {"text": "B"},
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
                },
                "domain": {"x": [0.0, 0.28888888888888886], "y": [0.0, 1.0]},
                "mode": "number",
                "type": "indicator",
                "title": {"text": "A"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {
                    "x": [0.3555555555555555, 0.6444444444444444],
                    "y": [0.0, 1.0],
                },
                "mode": "number",
                "type": "indicator",
                "title": {"text": "B"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {
                    "x": [0.711111111111111, 1.0],
                    "y": [0.0, 1.0],
                },
                "mode": "number",
                "type": "indicator",
                "title": {"text": "C"},
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
                },
                "domain": {"x": [0.0, 1.0], "y": [0.0, 0.26666666666666666]},
                "mode": "number",
                "type": "indicator",
                "title": {"text": "C"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {
                    "x": [0.0, 1.0],
                    "y": [0.36666666666666664, 0.6333333333333333],
                },
                "mode": "number",
                "type": "indicator",
                "title": {"text": "B"},
                "value": NULL_INT,
            },
            {
                "delta": {
                    "decreasing": {"symbol": "▼"},
                    "increasing": {"symbol": "▲"},
                },
                "domain": {
                    "x": [0.0, 1.0],
                    "y": [0.7333333333333333, 1.0],
                },
                "mode": "number",
                "type": "indicator",
                "title": {"text": "A"},
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

    def test_title(self):
        import src.deephaven.plot.express as dx

        chart = dx.indicator(self.source, value="value", title="title!").to_dict(
            self.exporter
        )

        self.assertEqual(chart["plotly"]["data"][0]["title"]["text"], "title!")
        self.assertEqual(chart["plotly"]["layout"].get("title"), None)

        chart = dx.indicator(self.source, value="value", by="single").to_dict(
            self.exporter
        )

        self.assertEqual(chart["plotly"]["data"][0]["title"]["text"], "A")
        self.assertEqual(chart["plotly"]["layout"].get("title"), None)

        chart = dx.indicator(self.source, value="value", by="text").to_dict(
            self.exporter
        )

        self.assertEqual(chart["plotly"]["data"][0]["title"]["text"], "C")
        self.assertEqual(chart["plotly"]["data"][1]["title"]["text"], "A")
        self.assertEqual(chart["plotly"]["data"][2]["title"]["text"], "B")
        self.assertEqual(chart["plotly"]["layout"].get("title"), None)

        chart = dx.indicator(self.source, value="value", by=["text", "single"]).to_dict(
            self.exporter
        )

        self.assertEqual(chart["plotly"]["data"][0]["title"]["text"], "A, C")
        self.assertEqual(chart["plotly"]["data"][1]["title"]["text"], "A, A")
        self.assertEqual(chart["plotly"]["data"][2]["title"]["text"], "A, B")
        self.assertEqual(chart["plotly"]["layout"].get("title"), None)

        chart = dx.indicator(
            self.source,
            value="value",
            by="single",
            title="title!",
        ).to_dict(self.exporter)

        self.assertEqual(chart["plotly"]["data"][0]["title"]["text"], "A")
        self.assertEqual(chart["plotly"]["layout"]["title"]["text"], "title!")

        chart = dx.indicator(
            self.source, value="value", by="text", text="single", title="title!"
        ).to_dict(self.exporter)

        # text is filled on the client side
        self.assertEqual(chart["plotly"]["data"][0].get("text"), None)
        self.assertEqual(chart["plotly"]["data"][1].get("text"), None)
        self.assertEqual(chart["plotly"]["data"][2].get("text"), None)
        self.assertEqual(chart["plotly"]["layout"]["title"]["text"], "title!")

        expected_mappings = [
            {
                "data_columns": {
                    "single": ["/plotly/data/0/title/text"],
                    "value": ["/plotly/data/0/value"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "single": ["/plotly/data/1/title/text"],
                    "value": ["/plotly/data/1/value"],
                },
                "table": 0,
            },
            {
                "data_columns": {
                    "single": ["/plotly/data/2/title/text"],
                    "value": ["/plotly/data/2/value"],
                },
                "table": 0,
            },
        ]

        self.assertEqual(chart["deephaven"]["mappings"], expected_mappings)

        chart = dx.indicator(
            self.source, value="value", text="single", title="title!"
        ).to_dict(self.exporter)

        # text is filled on the client side
        self.assertEqual(chart["plotly"]["data"][0].get("text"), None)
        self.assertEqual(chart["plotly"]["layout"]["title"]["text"], "title!")

        expected_mappings = [
            {
                "data_columns": {
                    "single": ["/plotly/data/0/title/text"],
                    "value": ["/plotly/data/0/value"],
                },
                "table": 0,
            }
        ]

        self.assertEqual(chart["deephaven"]["mappings"], expected_mappings)

        chart = dx.indicator(
            self.source, value="value", by="single", text=False
        ).to_dict(self.exporter)

        self.assertEqual(chart["plotly"]["data"][0].get("title"), None)
        self.assertEqual(chart["plotly"]["layout"].get("title"), None)

        chart = dx.indicator(
            self.source, value="value", by="single", text=False, title="title!"
        ).to_dict(self.exporter)

        self.assertEqual(chart["plotly"]["data"][0]["title"]["text"], "title!")
        self.assertEqual(chart["plotly"]["layout"].get("title"), None)

        chart = dx.indicator(
            self.source, value="value", by="text", text=False, title="title!"
        ).to_dict(self.exporter)

        self.assertEqual(chart["plotly"]["data"][0].get("title"), None)
        self.assertEqual(chart["plotly"]["data"][1].get("title"), None)
        self.assertEqual(chart["plotly"]["data"][2].get("title"), None)
        self.assertEqual(chart["plotly"]["layout"]["title"]["text"], "title!")


if __name__ == "__main__":
    unittest.main()
