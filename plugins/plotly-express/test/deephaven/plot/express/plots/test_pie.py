import unittest

from ..BaseTest import BaseTestCase, PLOTLY_NULL_INT


class PieTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col
        import deephaven.pandas as dhpd

        self.source = new_table(
            [
                string_col("names", ["A", "B", "C", "D", "E", "F", "G", "H", "I"]),
                int_col("values", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("colors", [2, 2, 2, 3, 3, 3, 4, 4, 4]),
            ]
        )

        self.pandas_source = dhpd.to_pandas(self.source)

    def test_basic_pie(self):
        import src.deephaven.plot.express as dx

        chart = dx.pie(self.source, names="names", values="values").to_dict(
            self.exporter
        )

        expected_data = [
            {
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "hovertemplate": "names=%{label}<br>values=%{value}<extra></extra>",
                "labels": ["None"],
                "legendgroup": "",
                "name": "",
                "showlegend": True,
                "type": "pie",
                "values": PLOTLY_NULL_INT,
            }
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}}

        expected_mappings = [
            {
                "data_columns": {
                    "names": ["/plotly/data/0/labels"],
                    "values": ["/plotly/data/0/values"],
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

    def test_pie_colors(self):
        import src.deephaven.plot.express as dx

        chart = dx.pie(
            self.source, names="names", values="values", color="colors"
        ).to_dict(self.exporter)

        expected_data = [
            {
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "hovertemplate": "names=%{label}<br>values=%{value}<extra></extra>",
                "labels": ["None"],
                "legendgroup": "",
                "marker": {"colors": []},
                "name": "",
                "showlegend": True,
                "type": "pie",
                "values": PLOTLY_NULL_INT,
            }
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}}

        expected_mappings = [
            {
                "data_columns": {
                    "color": ["/plotly/data/0/marker/colors"],
                    "names": ["/plotly/data/0/labels"],
                    "values": ["/plotly/data/0/values"],
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


if __name__ == "__main__":
    unittest.main()
