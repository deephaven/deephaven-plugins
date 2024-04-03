from deephaven.column import int_col, string_col
from deephaven import new_table
import deephaven.plot.express as dx
import plotly.express as px

express_source = new_table(
    [
        string_col("Categories", ["A", "B", "C"]),
        int_col("Values", [1, 3, 5]),
    ]
)
express_fig = dx.bar(table=express_source, x="Categories", y="Values")

plotly_fig = px.scatter(x=[0, 1, 2, 3, 4], y=[0, 1, 4, 9, 16])
