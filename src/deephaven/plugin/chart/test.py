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

test = scatter(source, x="Ints", y="Floats", color="Strings", color_discrete_sequence=["red", "blue"])


# add new data to the existing figure
new = new_table([
   string_col("Strings", ["String 7", "String 8"]),
   int_col("Ints", [7, 9]),
   float_col("Floats", [9.9, 5.1])
])

test2 = test.add_data(new)