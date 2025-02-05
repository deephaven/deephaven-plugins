from __future__ import annotations
import unittest

from ..BaseTest import BaseTestCase


class DeephavenFigureTestCase(BaseTestCase):
    def test_adding_table(self):
        from deephaven import new_table, time_table
        from deephaven.table import Table, PartitionedTable
        from deephaven.column import int_col
        import src.deephaven.plot.express as dx
        from deephaven.execution_context import get_exec_ctx
        from deephaven.liveness_scope import liveness_scope

        def test_liveness_scope(
            table: Table | PartitionedTable,
            where: str | None = None,
        ) -> None:
            for _ in range(2):
                with liveness_scope():
                    filtered = table
                    if where:
                        filtered = table.where(where)
                    figure = dx.DeephavenFigure()
                    # if the static memoized table `filtered` is added to the figure's liveness scope
                    # when it shouldn't be, this will raise an exception on second iteration in the case
                    # of a static table
                    figure.add_figure_to_graph(
                        get_exec_ctx(), {}, filtered, None, lambda: None
                    )
                    del figure

        static_source = new_table([int_col("X", [1, 2, 3])])

        test_liveness_scope(static_source, "X = 1")

        ticking_source = time_table("PT1S")

        test_liveness_scope(ticking_source)

        partitioned_source = static_source.partition_by("X")

        test_liveness_scope(partitioned_source)


if __name__ == "__main__":
    unittest.main()
