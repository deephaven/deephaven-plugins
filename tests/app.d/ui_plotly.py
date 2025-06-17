# Test deephaven.ui with Plotly integration
from deephaven import new_table, ui
from deephaven.column import int_col
import deephaven.plot.express as dx
import plotly.express as px
import plotly.graph_objects as go

x = [1, 2, 3, 4, 5]
y = [10, 15, 13, 17, 14]
t = new_table(
    [
        int_col("x", x),
        int_col("y", y),
    ]
)
basic_fig = go.Figure(data=go.Scatter(x=x, y=y, mode="lines+markers"))
px_fig = px.line(x=x, y=y)
dx_fig = dx.line(t, x="x", y="y")


ui_basic_fig = ui.panel(basic_fig)
ui_px_fig = ui.panel(px_fig)
ui_dx_fig = ui.panel(dx_fig)
