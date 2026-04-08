from deephaven import empty_table
from deephaven.ag_grid import AgGrid

ag_random = AgGrid(empty_table(100).update(["X=i", "Y=i*i", "Sin=Math.sin(i)"]))

from deephaven import agg
from deephaven.ag_grid import AgGrid

source = empty_table(100).update(
    [
        "Group = i % 5",
        "Subgroup = i % 3",
        "Value = i * 10",
    ]
)

agg_list = [agg.avg(cols="AvgValue=Value"), agg.std(cols="StdValue=Value")]
by_list = ["Group", "Subgroup"]

rollup = source.rollup(aggs=agg_list, by=by_list)
ag_rollup = AgGrid(rollup)

from deephaven import new_table
from deephaven.column import string_col
from deephaven.ag_grid import AgGrid

foo_bar_table = new_table(
    [
        string_col("Foo_Bar", ["Foo"]),
        string_col("FooBar", ["Bar"]),
    ]
)

ag_foo_bar = AgGrid(foo_bar_table)

# Table for testing advanced filters
from deephaven import empty_table
from deephaven.ag_grid import AgGrid

filter_test_table = empty_table(100).update(
    [
        "Name = i % 2 == 0 ? `Alice` : `Bob`",
        "Age = 20 + (i % 50)",
        "Score = (i % 100)",
        "Active = i % 3 == 0",
    ]
)

ag_filter_test = AgGrid(filter_test_table)
