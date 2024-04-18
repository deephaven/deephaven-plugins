import threading
import unittest
from operator import itemgetter
from queue import Queue
from typing import Callable
from unittest.mock import Mock
from .BaseTest import BaseTestCase

LISTENER_TIMEOUT = 2.0


def render_hook(fn: Callable):
    """
    Render a hook function and return the context, result, and a rerender function for updating it

    Args:
      fn: Callable:
        The function to render. Pass in a function with a hook call within it.
        Re-render will call the same function but with the new args passed in.
    """
    from deephaven.ui._internal.RenderContext import RenderContext

    queue = Queue()

    context = RenderContext(lambda x: queue.put(x), lambda x: queue.put(x))

    return_dict = {"context": context, "result": None, "rerender": None}

    def _rerender(*args, **kwargs):
        while not queue.empty():
            item = queue.get()
            item()
        with context.open():
            new_result = fn(*args, **kwargs)
            return_dict["result"] = new_result
        return new_result

    return_dict["rerender"] = _rerender

    _rerender()

    return return_dict


class HooksTest(BaseTestCase):
    def test_state(self):
        from deephaven.ui.hooks import use_state

        def _test_state(value1=1, value2=2):
            value1, set_value1 = use_state(value1)
            value2, set_value2 = use_state(value2)
            return value1, set_value1, value2, set_value2

        # Initial render
        render_result = render_hook(_test_state)

        result, rerender = itemgetter("result", "rerender")(render_result)
        val1, set_val1, val2, set_val2 = result

        self.assertEqual(val1, 1)
        self.assertEqual(val2, 2)

        # Rerender with new values, but should retain existing state
        rerender(value1=3, value2=4)
        result = itemgetter("result")(render_result)
        val1, set_val1, val2, set_val2 = result
        self.assertEqual(val1, 1)
        self.assertEqual(val2, 2)

        # Set to a new value
        set_val1(3)
        rerender()
        result = itemgetter("result")(render_result)
        val1, set_val1, val2, set_val2 = result
        self.assertEqual(val1, 3)
        self.assertEqual(val2, 2)

        # Set other state to a new value
        set_val2(4)
        rerender()
        result = itemgetter("result")(render_result)
        val1, set_val1, val2, set_val2 = result
        self.assertEqual(val1, 3)
        self.assertEqual(val2, 4)

    def test_ref(self):
        from deephaven.ui.hooks import use_ref

        def _test_ref(value=None):
            ref = use_ref(value)
            return ref

        # Initial render doesn't set anything
        render_result = render_hook(_test_ref)
        result, rerender = itemgetter("result", "rerender")(render_result)
        self.assertEqual(result.current, None)

        # Doesn't update the value on second call to use_ref
        result = rerender(1)
        self.assertEqual(result.current, None)

        # Set the current value, and it should be returned
        result.current = 2
        result = rerender(3)
        self.assertEqual(result.current, 2)

    def test_memo(self):
        from deephaven.ui.hooks import use_memo

        def _test_memo(fn=lambda: "foo", a=1, b=2):
            return use_memo(fn, [a, b])

        # Initial render
        render_result = render_hook(_test_memo)
        result, rerender = itemgetter("result", "rerender")(render_result)
        self.assertEqual(result, "foo")

        # Rerender with new function but same deps
        # Should not re-run the function
        mock = Mock(return_value="bar")
        result = rerender(mock)
        self.assertEqual(result, "foo")
        self.assertEqual(mock.call_count, 0)

        # Rerender with new deps
        # Should re-run the function
        result = rerender(mock, 3, 4)
        self.assertEqual(result, "bar")
        self.assertEqual(mock.call_count, 1)

        # Rerender with the same new deps
        # Should not re-run the function
        result = rerender(mock, 3, 4)
        self.assertEqual(result, "bar")
        self.assertEqual(mock.call_count, 1)

        # Rerender with new deps and new function
        mock = Mock(return_value="biz")
        result = rerender(mock, b=4)
        self.assertEqual(result, "biz")
        self.assertEqual(mock.call_count, 1)

        def _test_memo_set(fn=lambda: "foo"):
            return use_memo(fn, {})

        # passing in a non-list/tuple for dependencies should raise a TypeError
        self.assertRaises(TypeError, render_hook, _test_memo_set)

    def verify_table_updated(self, table_writer, table, update):
        from deephaven.ui.hooks import use_table_listener
        from deephaven.table_listener import TableUpdate

        event = threading.Event()

        def listener(update: TableUpdate, is_replay: bool) -> None:
            nonlocal event
            event.set()

        def _test_table_listener(replayed_table_val=table, listener_val=listener):
            use_table_listener(replayed_table_val, listener_val, [])

        render_hook(_test_table_listener)

        table_writer.write_row(*update)

        if not event.wait(timeout=LISTENER_TIMEOUT):
            assert False, "listener was not called"

    def verify_table_replayed(self, table):
        from deephaven.ui.hooks import use_table_listener
        from deephaven.table_listener import TableUpdate

        event = threading.Event()

        def listener(update: TableUpdate, is_replay: bool) -> None:
            nonlocal event
            event.set()

        def _test_table_listener(replay_table=table, listener_val=listener):
            use_table_listener(replay_table, listener_val, [], do_replay=True)

        render_hook(_test_table_listener)

        if not event.wait(timeout=LISTENER_TIMEOUT):
            assert False, "listener was not called"

    def test_table_listener(self):
        from deephaven import DynamicTableWriter, new_table
        from deephaven.column import int_col
        import deephaven.dtypes as dht

        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        self.verify_table_updated(table_writer, table, (1, "Testing"))

        static_table = new_table(
            [
                int_col("Numbers", [1]),
            ]
        )

        self.verify_table_replayed(static_table)

    def test_table_data(self):
        from deephaven.ui.hooks import use_table_data
        from deephaven import new_table
        from deephaven.column import int_col

        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [2, 4, 6]),
            ]
        )

        def _test_table_data(t=table):
            return use_table_data(t)

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = {"X": [1, 2, 3], "Y": [2, 4, 6]}

        self.assertEqual(result, expected)

    def test_empty_table_data(self):
        from deephaven.ui.hooks import use_table_data
        from deephaven import new_table

        empty = new_table([])

        def _test_table_data(t=empty):
            return use_table_data(t)

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = {}

        self.assertEqual(result, expected)

    def test_ticking_table_data(self):
        from deephaven.ui.hooks import use_table_data
        from deephaven import DynamicTableWriter
        import deephaven.dtypes as dht

        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        def _test_table_data(t=table):
            return use_table_data(t, sentinel="sentinel")

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        # the initial render should return the sentinel value since the table is empty
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, table, (1, "Testing"))

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = {"Numbers": [1], "Words": ["Testing"]}

        self.assertEqual(result, expected)

    def test_swapping_table_data(self):
        from deephaven.ui.hooks import use_table_data
        from deephaven import new_table
        from deephaven.column import int_col
        from deephaven import DynamicTableWriter
        import deephaven.dtypes as dht

        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [2, 4, 6]),
            ]
        )

        def _test_table_data(t=table):
            result = use_table_data(t, sentinel="sentinel")
            return result

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        dynamic_table = table_writer.table

        # Need two rerenders because the first one will call set_data, which queues state updates
        # that are resolved at the start of the second rerender
        # The second rerender will then have the expected state values and return the expected result
        rerender(dynamic_table)
        result = rerender(dynamic_table)

        # the initial render should return the sentinel value since the table is empty
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, dynamic_table, (1, "Testing"))

        rerender(dynamic_table)
        result = rerender(dynamic_table)

        expected = {"Numbers": [1], "Words": ["Testing"]}

        self.assertEqual(result, expected)

    def test_column_data(self):
        from deephaven.ui.hooks import use_column_data
        from deephaven import new_table
        from deephaven.column import int_col

        table = new_table(
            [
                int_col("X", [1, 2, 3]),
            ]
        )

        def _test_column_data(t=table):
            return use_column_data(t)

        render_result = render_hook(_test_column_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = [1, 2, 3]

        self.assertEqual(result, expected)

    def test_empty_column_data(self):
        from deephaven.ui.hooks import use_column_data
        from deephaven import new_table

        empty = new_table([])

        def _test_column_data(t=empty):
            return use_column_data(t)

        self.assertRaises(IndexError, render_hook, _test_column_data)

    def test_ticking_column_data(self):
        from deephaven.ui.hooks import use_column_data
        from deephaven import DynamicTableWriter
        import deephaven.dtypes as dht

        column_definitions = {"Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        def _test_column_data(t=table):
            return use_column_data(t, sentinel="sentinel")

        render_result = render_hook(_test_column_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        # the initial render should return the sentinel value
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, table, ("Testing",))

        render_result = render_hook(_test_column_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = ["Testing"]

        self.assertEqual(result, expected)

    def test_row_data(self):
        from deephaven.ui.hooks import use_row_data
        from deephaven import new_table
        from deephaven.column import int_col

        table = new_table(
            [
                int_col("X", [1]),
                int_col("Y", [2]),
            ]
        )

        def _test_row_data(t=table):
            return use_row_data(t)

        render_result = render_hook(_test_row_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = {"X": 1, "Y": 2}

        self.assertEqual(result, expected)

    def test_empty_row_data(self):
        from deephaven.ui.hooks import use_row_data
        from deephaven import new_table

        empty = new_table([])

        def _test_row_data(t=empty):
            return use_row_data(t)

        self.assertRaises(IndexError, render_hook, _test_row_data)

    def test_ticking_row_data(self):
        from deephaven.ui.hooks import use_row_data
        from deephaven import DynamicTableWriter
        import deephaven.dtypes as dht

        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        def _test_row_data(t=table):
            return use_row_data(t, sentinel="sentinel")

        render_result = render_hook(_test_row_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        # the initial render should return the sentinel value
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, table, (1, "Testing"))

        render_result = render_hook(_test_row_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = {"Numbers": 1, "Words": "Testing"}

        self.assertEqual(result, expected)

    def test_row_list(self):
        from deephaven.ui.hooks import use_row_list
        from deephaven import new_table
        from deephaven.column import int_col

        table = new_table(
            [
                int_col("X", [1]),
                int_col("Y", [2]),
            ]
        )

        def _use_row_list(t=table):
            return use_row_list(t)

        render_result = render_hook(_use_row_list)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = [1, 2]

        self.assertEqual(result, expected)

    def test_empty_row_list(self):
        from deephaven.ui.hooks import use_row_list
        from deephaven import new_table

        empty = new_table([])

        def _test_row_list(t=empty):
            return use_row_list(t)

        self.assertRaises(IndexError, render_hook, _test_row_list)

    def test_ticking_row_list(self):
        from deephaven.ui.hooks import use_row_list
        from deephaven import DynamicTableWriter
        import deephaven.dtypes as dht

        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        def _test_row_list(t=table):
            return use_row_list(t, sentinel="sentinel")

        render_result = render_hook(_test_row_list)

        result, rerender = itemgetter("result", "rerender")(render_result)

        # the initial render should return the sentinel value
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, table, (1, "Testing"))

        render_result = render_hook(_test_row_list)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = [1, "Testing"]

        self.assertEqual(result, expected)

    def test_cell_data(self):
        from deephaven.ui.hooks import use_cell_data
        from deephaven import new_table
        from deephaven.column import int_col

        table = new_table(
            [
                int_col("X", [1]),
            ]
        )

        def _test_cell_data(t=table):
            return use_cell_data(t)

        render_result = render_hook(_test_cell_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = 1

        self.assertEqual(result, expected)

    def test_empty_cell_data(self):
        from deephaven.ui.hooks import use_cell_data
        from deephaven import new_table

        empty = new_table([])

        def _use_cell_data(t=empty):
            return use_cell_data(t)

        self.assertRaises(IndexError, render_hook, _use_cell_data)

    def test_ticking_cell_data(self):
        from deephaven.ui.hooks import use_cell_data
        from deephaven import DynamicTableWriter
        import deephaven.dtypes as dht

        column_definitions = {"Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        def _test_cell_data(t=table):
            return use_cell_data(t, sentinel="sentinel")

        render_result = render_hook(_test_cell_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        # the initial render should return the sentinel value
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, table, ("Testing",))

        render_result = render_hook(_test_cell_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = "Testing"

        self.assertEqual(result, expected)

    def test_execution_context(self):
        from deephaven.ui.hooks import use_execution_context, use_state, use_memo
        from deephaven import empty_table

        def _test_execution_context():
            with_exec_ctx = use_execution_context()

            def table_func():
                # This would fail if not using an execution context
                empty_table(0).update("X=1")

            def thread_func():
                with_exec_ctx(table_func)

            def start_thread():
                thread = threading.Thread(target=thread_func)
                thread.start()
                thread.join()

            use_memo(start_thread, [])

        render_hook(_test_execution_context)

    def test_execution_context_custom(self):
        from deephaven.ui.hooks import use_execution_context, use_memo
        from deephaven import empty_table
        from deephaven.execution_context import make_user_exec_ctx

        def _test_execution_context():
            with_exec_ctx = use_execution_context(make_user_exec_ctx())

            def table_func():
                # This would fail if not using an execution context
                empty_table(0).update("X=1")

            def thread_func():
                with_exec_ctx(table_func)

            def start_thread():
                thread = threading.Thread(target=thread_func)
                thread.start()

            use_memo(start_thread, [])

        render_hook(_test_execution_context)

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


if __name__ == "__main__":
    unittest.main()
