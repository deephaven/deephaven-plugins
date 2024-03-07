from deephaven.column import int_col, string_col
from deephaven import new_table
import deephaven.plot.express as dx

express_source = new_table(
    [
        string_col("Categories", ["A", "B", "C"]),
        int_col("Values", [1, 3, 5]),
    ]
)
express_fig = dx.bar(table=express_source, x="Categories", y="Values")

123asdf