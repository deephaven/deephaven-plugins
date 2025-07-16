from deephaven import empty_table
from deephaven.ag_grid import AgGrid

ag_random = AgGrid(empty_table(100).update(["X=i", "Y=i*i", "Sin=Math.sin(i)"]))
