from deephaven.column import int_col, string_col, double_col
from deephaven import new_table
import deephaven.plot.express as dx
import plotly.express as px

express_source = new_table(
    [
        string_col("Categories", ["A", "B", "C"]),
        int_col("Values", [1, 3, 5]),
        double_col("Price", [1.0, 3.0, 5.0]),
        double_col("Reference", [3.0, 3.0, 3.0]),
    ]
)
express_fig = dx.bar(table=express_source, x="Categories", y="Values")

plotly_fig = px.scatter(x=[0, 1, 2, 3, 4], y=[0, 1, 4, 9, 16])

hist_source = new_table(
    [
        string_col(
            "Categories",
            ["A", "B", "C", "A", "B", "C", "A", "B", "C", "A", "B", "C", "A", "B", "C"],
        ),
        int_col("Values", [1, 3, 5, 2, 4, 6, 3, 5, 7, 4, 6, 8, 5, 7, 9]),
    ]
)
express_hist_by = dx.histogram(hist_source, x="Values", by="Categories", nbins=4)

express_indicator = dx.indicator(express_source, value="Values", title="Indicator")

express_by_indicator = dx.indicator(
    express_source,
    value="Price",
    reference="Reference",
    title="Indicator",
    by="Categories",
)
