from deephaven.column import int_col
from deephaven import new_table
import deephaven.plot.express as dx
from deephaven import ui

express_source = new_table(
    [
        int_col("Values", [1, 3, 5]),
        int_col("Values2", [2, 4, 6]),
    ]
)

# Test that the image is generated correctly
line_plot = dx.line(express_source, x="Values", y="Values2")
line_plot_bytes = line_plot.to_image(template="ggplot2")
line_plot_img = ui.image(src=line_plot_bytes, height=250, width=350)
