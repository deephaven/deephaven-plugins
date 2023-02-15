# you'll need the json plugin installed to see the json output here
from deephaven import new_table
from deephaven.column import string_col, int_col, float_col
from deephaven.plugin.graph import scatter


# create the deephaven table and draw a scatter with it
source = new_table([
   string_col("Strings", ["String 4", "String 5", "String 6", "String 4", "String 6"]),
   int_col("Ints", [7, 8, 9, 10, 6]),
   float_col("Floats", [9.9, 8.8, 7.7, 5, 10])
])

fig = scatter(source,
              x="Ints",
              y=["Ints2", "Floats"],
              color_discrete_sequence=["red", "blue"],
              opacity=0.5,
              title="Test",
              template="ggplot2",
              range_x=[0,10],
              range_y=[0,100]
)