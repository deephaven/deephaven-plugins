from typing import Callable
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseLivenessTestCase(BaseTestCase):
    def test_liveness_use_state_interactions(self):
        from deephaven.ui.hooks import use_state, use_liveness_scope
        from deephaven import new_table, dtypes as dht
        from deephaven.table import Table
        from deephaven.column import int_col
        from deephaven.stream import blink_to_append_only
        from deephaven.stream.table_publisher import table_publisher
        from deephaven.update_graph import exclusive_lock
        from deephaven.liveness_scope import liveness_scope

        # create a table publisher to mutate data outside the component
        cols = {"X": dht.int32}
        table, publisher = table_publisher(name="test table", col_defs=cols)
        table = blink_to_append_only(table).update("Timestamp=now()")

        # tracking for use_state setters to mutate component state, to let us lock and confirm
        replace_a: Callable = lambda: None
        a: Table = None

        def _test_reused_tables():
            """
            Doesn't re-render size
            """
            nonlocal a, replace_a
            a, set_a = use_state(lambda: table.where("X=1"))

            # When "a" changes, recompute table - don't return or otherwise track this table w.r.t. liveness
            replace_a = use_liveness_scope(lambda: set_a(table.where("X=2")), [])

            return a.size

        # initial render, verify value is zero
        rendered = render_hook(_test_reused_tables)
        self.assertEqual(0, rendered["result"])

        # render again, so that we drop the old liveness scope
        result = rendered["rerender"]()
        self.assertEqual(0, result)

        # append a row while we have the same table
        publisher.add(new_table(cols=[int_col("X", [1])]))
        # wait for the row to appear
        with exclusive_lock(a):
            table.await_update(2_000)

        # assert count correctly increased
        result = rendered["rerender"]()
        self.assertEqual(1, result)

        # replace the table with a new instance that must now be retained instead, back to zero
        with liveness_scope():
            replace_a()
        result = rendered["rerender"]()
        self.assertEqual(0, result)

        # add a row to that new table, ensure we see it
        publisher.add(new_table(cols=[int_col("X", [2])]))
        # wait for the row to appear
        with exclusive_lock(a):
            table.await_update(2_000)

        # assert count correctly increased
        result = rendered["rerender"]()
        self.assertEqual(1, result)

    def test_liveness_use_memo_interactions(self):
        from deephaven.ui.hooks import use_memo, use_state
        from deephaven import new_table, dtypes as dht
        from deephaven.column import int_col
        from deephaven.stream.table_publisher import table_publisher
        from deephaven.update_graph import exclusive_lock
        from deephaven.time import dh_now
        from deephaven.liveness_scope import liveness_scope

        # create a table publisher to mutate data outside the component
        cols = {"X": dht.int32}
        table, publisher = table_publisher(name="test table", col_defs=cols)
        table = table.update("Timestamp=now()").with_attributes({"BlinkTable": True})

        # tracking for use_state setters to mutate component state, to let us lock and confirm
        set_a: Callable = lambda v: None
        local_rows = None

        def _test_reused_tables():
            """
            Doesn't re-render size
            """
            nonlocal set_a
            a, set_a = use_state(0)
            # When "a" changes, recompute table - don't return or otherwise track this table w.r.t. liveness
            nonlocal local_rows

            def helper():
                now = dh_now()
                return table.where("Timestamp > now").last_by(by=["X"])

            local_rows = use_memo(helper, [a])

            return local_rows.size

        # initial render, verify value is zero
        rendered = render_hook(_test_reused_tables)
        self.assertEqual(0, rendered["result"])

        # render again, so that we drop the old liveness scope
        result = rendered["rerender"]()
        self.assertEqual(0, result)

        # append a row, "a" stayed the same
        publisher.add(new_table(cols=[int_col("X", [1])]))
        # wait for the row to appear
        with exclusive_lock(local_rows):
            table.await_update(2_000)

        # assert count correctly increased
        result = rendered["rerender"]()
        self.assertEqual(1, result)

        # poke "a", verify the memoized table was replaced, no more rows
        with liveness_scope():
            set_a(1)
        result = rendered["rerender"]()
        self.assertEqual(0, result)
