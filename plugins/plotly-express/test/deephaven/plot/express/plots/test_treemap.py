import unittest

from ..BaseTest import BaseTestCase


class TreemapTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col
        import deephaven.pandas as dhpd

        self.source = new_table(
            [
                string_col("names", ["A", "B", "C", "D", "E", "F", "G", "H", "I"]),
                string_col("parents", ["Z", "Z", "Z", "Z", "Z", "Z", "Z", "Z", "Z"]),
                string_col("categories", ["A", "B", "A", "B", "A", "B", "A", "B", "A"]),
                int_col("values", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("colors", [2, 2, 2, 3, 3, 3, 4, 4, 4]),
            ]
        )

        self.pandas_source = dhpd.to_pandas(self.source)

    def test_basic_treemap(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.treemap(
            self.source, names="names", parents="parents", values="values"
        ).to_dict(self.exporter)

        expected_data = [
            {
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "hovertemplate": "names=%{label}<br>values=%{value}<br>parents=%{parent}<extra></extra>",
                "labels": ["None"],
                "name": "",
                "parents": ["None"],
                "type": "treemap",
                "values": [NULL_INT],
            }
        ]

        expected_layout = {"legend": {"tracegroupgap": 0}}

        expected_mappings = [
            {
                "data_columns": {
                    "names": ["/plotly/data/0/labels"],
                    "parents": ["/plotly/data/0/parents"],
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

    def test_treemap_numeric_colors(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.treemap(
            self.source,
            names="names",
            parents="parents",
            values="values",
            color="colors",
        ).to_dict(self.exporter)

        expected_data = [
            {
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "hovertemplate": "names=%{label}<br>values=%{value}<br>parents=%{parent}<br>colors=%{"
                "color}<extra></extra>",
                "labels": ["None"],
                "name": "",
                "marker": {"coloraxis": "coloraxis", "colors": [NULL_INT]},
                "parents": ["None"],
                "type": "treemap",
                "values": [NULL_INT],
            }
        ]

        expected_layout = {
            "coloraxis": {
                "colorbar": {"title": {"text": "colors"}},
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
        }

        expected_mappings = [
            {
                "data_columns": {
                    "colors": ["/plotly/data/0/marker/colors"],
                    "names": ["/plotly/data/0/labels"],
                    "parents": ["/plotly/data/0/parents"],
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

    def test_treemap_categorical_colors(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.treemap(
            self.source,
            names="names",
            parents="parents",
            values="values",
            color="categories",
        ).to_dict(self.exporter)

        expected_data = [
            {
                "domain": {"x": [0.0, 1.0], "y": [0.0, 1.0]},
                "hovertemplate": "names=%{label}<br>values=%{value}<br>parents=%{parent}<extra></extra>",
                "labels": ["None"],
                "name": "",
                "marker": {"colors": []},
                "parents": ["None"],
                "type": "treemap",
                "values": [NULL_INT],
            }
        ]

        expected_layout = {
            "legend": {"tracegroupgap": 0},
        }

        expected_mappings = [
            {
                "data_columns": {
                    "color": ["/plotly/data/0/marker/colors"],
                    "names": ["/plotly/data/0/labels"],
                    "parents": ["/plotly/data/0/parents"],
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
