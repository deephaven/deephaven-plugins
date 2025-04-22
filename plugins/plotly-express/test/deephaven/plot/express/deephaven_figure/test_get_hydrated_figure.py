from ..BaseTest import BaseTestCase


class FigureCalendarTestCase(BaseTestCase):
    def test_get_hydrated_figure(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col
        import deephaven.plot.express as dx

        source = new_table(
            [
                int_col("X", [1, 2]),
                int_col("Y", [3, 4]),
            ]
        )

        line_plot = dx.line(source, x="X", y="Y")

        line_fig = line_plot.get_hydrated_figure(template="ggplot2")

        expected_x = (1, 2)
        expected_y = (3, 4)
        # colors should have been removed from the trace itself
        expected_color = None
        expected_colorway = ("#F8766D", "#A3A500", "#00BF7D", "#00B0F6", "#E76BF3")

        data = line_fig.data[0]
        x = data["x"]
        y = data["y"]
        color_marker = data["marker"]["color"]
        color_line = data["line"]["color"]
        colorway = line_fig.layout.template.layout.colorway

        self.assertEqual(x, expected_x)
        self.assertEqual(y, expected_y)
        self.assertEqual(color_marker, expected_color)
        self.assertEqual(color_line, expected_color)
        self.assertEqual(colorway, expected_colorway)

    def test_get_hydrated_figure_single_replacement(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col
        import deephaven.plot.express as dx

        indicator_source = new_table(
            [
                int_col("Z", [10]),
            ]
        )

        indicator_plot = dx.indicator(indicator_source, value="Z")

        indicator_fig = indicator_plot.get_hydrated_figure()

        expected_value = 10

        value = indicator_fig.data[0]["value"]

        self.assertEqual(value, expected_value)
