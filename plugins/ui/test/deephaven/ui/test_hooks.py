import unittest
from operator import itemgetter
from time import sleep
from typing import Callable
from unittest.mock import Mock
from .BaseTest import BaseTestCase


def render_hook(fn: Callable):
    """
    Render a hook function and return the context, result, and a rerender function for updating it

    Args:
      fn: Callable:
        The function to render. Pass in a function with a hook call within it.
        Re-render will call the same function but with the new args passed in.
    """
    from deephaven.ui._internal.RenderContext import RenderContext
    from deephaven.ui._internal.shared import get_context, set_context

    context = RenderContext()

    return_dict = {"context": context, "result": None, "rerender": None}

    def _rerender(*args, **kwargs):
        set_context(context)
        with context:
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

    def test_table_listener(self):
        from deephaven.ui.hooks import use_table_listener
        from deephaven import time_table, new_table
        from deephaven.replay import TableReplayer
        from deephaven.time import to_j_instant
        from deephaven.column import datetime_col
        from deephaven.table_listener import TableUpdate

        start_time = to_j_instant("2020-01-01T20:20:20.000000000 UTC")
        end_time = to_j_instant("2020-01-01T20:20:20.000000002 UTC")

        times = new_table(
            [datetime_col("Time", [to_j_instant("2020-01-01T20:20:20.000000001 UTC")])]
        )

        replayer = TableReplayer(start_time, end_time)
        replayed_table = replayer.add_table(times, "Time")

        updated = False

        def listener(update: TableUpdate, is_replay: bool) -> None:
            nonlocal updated
            updated = True

        def _test_table_listener(
            replayed_table_val=replayed_table, listener_val=listener
        ):
            use_table_listener(replayed_table_val, listener_val)

        render_hook(_test_table_listener)

        replayer.start()

        # Slight delay to make sure the listener has time to run
        sleep(1)

        self.assertEqual(updated, True)


if __name__ == "__main__":
    unittest.main()
