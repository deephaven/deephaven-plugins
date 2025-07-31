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
