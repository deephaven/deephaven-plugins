from deephaven.column import int_col, string_col, double_col
from deephaven import new_table, merge, time_table
import deephaven.plot.express as dx
import plotly.express as px


# Test a basic deephaven plot
express_source = new_table(
    [
        string_col("Categories", ["A", "B", "C"]),
        int_col("Values", [1, 3, 5]),
        double_col("Price", [1.0, 3.0, 5.0]),
        double_col("Reference", [3.0, 3.0, 3.0]),
        int_col("Values2", [2, 4, 6]),
    ]
)
express_fig = dx.bar(table=express_source, x="Categories", y="Values")

# Test a basic plotly chart
plotly_fig = px.scatter(x=[0, 1, 2, 3, 4], y=[0, 1, 4, 9, 16])

# Test the histogram function
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

# Test ticking tables
ticking_head = time_table("PT1S").view(
    ["Categories = `A`", "Values = 10", "Values2 = 20"]
)

ticking_source = merge([express_source, ticking_head]).head(3)

ticking_fig = dx.bar(ticking_source, x="Categories", y="Values")

# Test partitioned tables

partitioned_source = express_source.partition_by("Categories")

partitioned_fig = dx.bar(partitioned_source, x="Values", y="Values2", by="Categories")
