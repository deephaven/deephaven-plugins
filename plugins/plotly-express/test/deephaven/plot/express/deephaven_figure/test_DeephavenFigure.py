import unittest

from deephaven.liveness_scope import is_liveness_referent

from ..BaseTest import BaseTestCase


class DeephavenFigureTestCase(BaseTestCase):
    def test_adding_table(self):
        from deephaven import new_table
        from deephaven.column import int_col
        import src.deephaven.plot.express as dx
        from deephaven.execution_context import get_exec_ctx
        from deephaven.liveness_scope import liveness_scope

        static_source = new_table([int_col("X", [1, 2, 3])])

        for _ in range(2):
            with liveness_scope():
                filtered = static_source.where("X = 1")
                figure = dx.DeephavenFigure()
                # if the static memoized table `filtered` is added to the figure's liveness scope
                # when it shouldn't be, this will raise an exception on second iteration
                figure.add_figure_to_graph(
                    get_exec_ctx(), {}, filtered, None, lambda: None
                )
                del figure
