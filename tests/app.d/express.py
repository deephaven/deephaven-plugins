from deephaven.column import int_col, string_col
from deephaven import new_table, empty_table
import deephaven.plot.express as dx
import plotly.express as px
from deephaven.calendar import calendar

express_source = new_table(
    [
        string_col("Categories", ["A", "B", "C"]),
        int_col("Values", [1, 3, 5]),
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

name = "USNYSE_EXAMPLE"
nyse_cal = calendar(name)

# checks a full holiday on the 28th, a partial holiday on the 29th, a weekend, and regular business days
source = empty_table(3000).update(
    [
        "Timestamp = '2024-11-27T9:27:00 ET' + i * 3 * MINUTE",
        "Price = randomDouble(100.0, 200.0)",
    ]
)

line_calendar = dx.line(source, x="Timestamp", y="Price", calendar=nyse_cal)
