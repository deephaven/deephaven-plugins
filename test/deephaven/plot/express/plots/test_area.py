import unittest

from ..BaseTest import BaseTestCase


class AreaTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table([
            int_col("X", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            int_col("X2", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            int_col("Y", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            int_col("Y2", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            int_col("size", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            int_col("text", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
            int_col("hover_name", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
        ])

    def test_basic_area(self):
        import src.deephaven.plot.express as dx

        chart = dx.area(self.source, x="X", y="Y").to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify at
        plotly["layout"].pop("template")

        expected_data = [
            {
                'fillpattern': {'shape': ''},
                'hovertemplate': 'X=%{x}<br>Y=%{y}<extra></extra>',
                'legendgroup': '',
                'line': {'color': '#636efa', 'shape': 'linear'},
                'marker': {'symbol': 'circle'},
                'mode': 'lines',
                'name': '',
                'orientation': 'v',
                'showlegend': False,
                'stackgroup': '1',
                'x': [-2147483648],
                'xaxis': 'x',
                'y': [-2147483648],
                'yaxis': 'y',
                'type': 'scatter'}
        ]

        self.assertEqual(plotly["data"], expected_data)

        expected_layout = {
            'xaxis': {
                'anchor': 'y',
                'domain': [0.0, 1.0],
                'title': {'text': 'X'},
                'side': 'bottom'
            },
            'yaxis': {
                'anchor': 'x',
                'domain': [0.0, 1.0],
                'title': {'text': 'Y'},
                'side': 'left'
            },
            'legend': {'tracegroupgap': 0},
            'margin': {'t': 60}}

        self.assertEqual(plotly["layout"], expected_layout)

        expected_mappings = [
            {
                'table': 0,
                'data_columns':
                    {
                        'X': ['/plotly/data/0/x'],
                        'Y': ['/plotly/data/0/y']
                    }
            }
        ]

        self.assertEqual(deephaven["mappings"], expected_mappings)

        self.assertEqual(deephaven["is_user_set_template"], False)
        self.assertEqual(deephaven["is_user_set_color"], False)


if __name__ == '__main__':
    unittest.main()
