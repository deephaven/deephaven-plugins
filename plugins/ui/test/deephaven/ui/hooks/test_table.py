from __future__ import annotations
from operator import itemgetter
import sys
import threading
from queue import Queue
from typing import Any, Callable, Union
from unittest.mock import patch
from ..BaseTest import BaseTestCase
from .render_utils import render_hook
from deephaven.ui.hooks import (
    use_cell_data,
    use_column_data,
    use_row_data,
    use_row_list,
    use_table_data,
    use_table_listener,
)
from deephaven import new_table
from deephaven.column import int_col
from deephaven import DynamicTableWriter
from deephaven.table_listener import TableUpdate
import deephaven.dtypes as dht
import pandas as pd

# Get modules from sys.modules for patching (needed for Python 3.10 compatibility)
use_cell_data_module = sys.modules["deephaven.ui.hooks.use_cell_data"]
use_column_data_module = sys.modules["deephaven.ui.hooks.use_column_data"]
use_row_data_module = sys.modules["deephaven.ui.hooks.use_row_data"]
use_row_list_module = sys.modules["deephaven.ui.hooks.use_row_list"]

LISTENER_TIMEOUT = 2.0
QUEUE_TIMEOUT = 1.0


class NotifyQueue(Queue):
    """
    A queue that notifies a function when an item is put on it
    """

    def __init__(self):
        super().__init__()
        self._notify_fn = None

    def put(
        self, item: object, block: bool = True, timeout: Union[float, None] = None
    ) -> None:
        """
        Put an item on the queue and notify the function

        Args:
            item: The item to put on the queue
            block: True if the call should block until the item is put on the queue
            timeout: The time to wait for the item to be put on the queue

        Returns:
            None
        """
        super().put(item)
        if self._notify_fn:
            self._notify_fn(self)

    def call_after_put(self, fn: Callable[["NotifyQueue"], None]) -> None:
        """
        Register a function to be called after an item is put on the queue

        Args:
            fn: The function to call after an item is put on the queue
        """
        self._notify_fn = fn

    def unregister_notify(self) -> None:
        """
        Unregister the notify function
        """
        self._notify_fn = None


class UseTableTestCase(BaseTestCase):
    def verify_table_updated(self, table_writer, table, update):
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
        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        self.verify_table_updated(table_writer, table, (1, "Testing"))

    def test_table_data(self):
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
        empty = new_table([])

        def _test_table_data(t=empty):
            return use_table_data(t)

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = {}

        self.assertEqual(result, expected)

    def test_ticking_table_data(self):
        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        # a ticking table with no data should return the sentinel value
        def _test_table_data(t=table):
            return use_table_data(t)

        render_result = render_hook(_test_table_data)

        result, _ = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

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

    def verify_queue_has_size(self, queue: NotifyQueue, size: int):
        """
        Verify that the queue has the expected size in a multi-threaded context

        Args:
            queue: The queue to check
            size: The expected size of the quexue

        Returns:
            None
        """
        event = threading.Event()

        def check_size(q):
            if q.qsize() == size:
                event.set()

        # call after each put in case the queue is not at the correct size yet
        queue.call_after_put(check_size)

        # call now in case the queue is (or was) already at the correct size
        check_size(queue)

        if not event.wait(timeout=QUEUE_TIMEOUT):
            assert False, f"queue did not reach size {size}"

        queue.unregister_notify()

    def test_swapping_table_data(self):
        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [2, 4, 6]),
            ]
        )

        def _test_table_data(t=table):
            result = use_table_data(t, sentinel="sentinel")
            return result

        queue = NotifyQueue()

        render_result = render_hook(_test_table_data, queue=queue)

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
        # the queue should have two items eventually, one for each set_state in _set_new_data in use_table_data
        # this check is needed because the set_state calls come from the listener, which is called in a separate thread
        # so the queue might not have the correct size immediately
        self.verify_queue_has_size(queue, 2)
        result = rerender(dynamic_table)

        expected = {"Numbers": [1], "Words": ["Testing"]}
        self.assertEqual(result, expected)

    def test_none_table_data(self):
        def _test_table_data(t=None):
            return use_table_data(t)

        render_result = render_hook(_test_table_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        expected = None

        self.assertEqual(result, expected)

    def test_column_data(self):
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
        empty = new_table([])

        def _test_column_data(t=empty):
            return use_column_data(t)

        self.assertRaises(IndexError, render_hook, _test_column_data)

    def test_ticking_column_data(self):
        column_definitions = {"Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        # a ticking table with no data should return the sentinel value
        def _test_column_data(t=table):
            return use_column_data(t)

        render_result = render_hook(_test_column_data)

        result, _ = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

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

    def test_none_column_data(self):
        def _test_column_data(t=None):
            return use_column_data(t)

        render_result = render_hook(_test_column_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

    def test_row_data(self):
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
        empty = new_table([])

        def _test_row_data(t=empty):
            return use_row_data(t)

        self.assertRaises(IndexError, render_hook, _test_row_data)

    def test_ticking_row_data(self):
        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        # a ticking table with no data should return the sentinel value
        def _test_row_data(t=table):
            return use_row_data(t)

        render_result = render_hook(_test_row_data)

        result, _ = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

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

    def test_none_row_data(self):
        def _test_row_data(t=None):
            return use_row_data(t)

        render_result = render_hook(_test_row_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

    def test_row_list(self):
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
        empty = new_table([])

        def _test_row_list(t=empty):
            return use_row_list(t)

        self.assertRaises(IndexError, render_hook, _test_row_list)

    def test_ticking_row_list(self):
        column_definitions = {"Numbers": dht.int32, "Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        # a ticking table with no data should return the sentinel value
        def _test_row_list(t=table):
            return use_row_list(t)

        render_result = render_hook(_test_row_list)

        result, _ = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

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

    def test_none_row_list(self):
        def _use_row_list(t=None):
            return use_row_list(t)

        render_result = render_hook(_use_row_list)

        result, rerender = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

    def test_cell_data(self):
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
        empty = new_table([])

        def _use_cell_data(t=empty):
            return use_cell_data(t)

        self.assertRaises(IndexError, render_hook, _use_cell_data)

    def test_ticking_cell_data(self):
        column_definitions = {"Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        # a ticking table with no data should return the sentinel value
        def _test_cell_data(t=table):
            return use_cell_data(t)

        render_result = render_hook(_test_cell_data)

        result, _ = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

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

    def test_none_cell_data(self):
        def _test_cell_data(t=None):
            return use_cell_data(t)

        render_result = render_hook(_test_cell_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        self.assertEqual(result, None)

    def test_ticking_cell_data_with_none(self):

        column_definitions = {"Words": dht.string}

        table_writer = DynamicTableWriter(column_definitions)
        table = table_writer.table

        # a ticking table with no data should return the sentinel value
        def _test_cell_data(t=table):
            return use_cell_data(t, sentinel="sentinel")

        render_result = render_hook(_test_cell_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        # the initial render should return the sentinel value
        self.assertEqual(result, "sentinel")

        self.verify_table_updated(table_writer, table, (None,))

        render_result = render_hook(_test_cell_data)

        result, rerender = itemgetter("result", "rerender")(render_result)

        self.assertTrue(pd.isna(result))


class UseTableFilteringTestCase(BaseTestCase):
    """Tests to verify hooks properly filter tables before listening"""

    def test_cell_data_filters_to_one_row_one_column(self):
        """use_cell_data should filter the table to 1 row and 1 column"""
        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [4, 5, 6]),
                int_col("Z", [7, 8, 9]),
            ]
        )

        captured_table = None

        original_use_table_data = use_table_data

        def mock_use_table_data(t, sentinel=None, transformer=None):
            nonlocal captured_table
            captured_table = t
            return original_use_table_data(t, sentinel, transformer)

        with patch.object(use_cell_data_module, "use_table_data", mock_use_table_data):

            def _test_cell_data(t=table):
                return use_cell_data(t)

            render_hook(_test_cell_data)

        self.assertIsNotNone(captured_table)
        self.assertEqual(captured_table.size, 1, "Table should have 1 row")
        self.assertEqual(len(captured_table.columns), 1, "Table should have 1 column")
        self.assertEqual(
            captured_table.column_names[0], "X", "Should keep first column"
        )

    def test_row_data_filters_to_one_row_all_columns(self):
        """use_row_data should filter to 1 row but keep all columns"""
        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [4, 5, 6]),
                int_col("Z", [7, 8, 9]),
            ]
        )

        captured_table = None

        original_use_table_data = use_table_data

        def mock_use_table_data(t, sentinel=None, transformer=None):
            nonlocal captured_table
            captured_table = t
            return original_use_table_data(t, sentinel, transformer)

        with patch.object(use_row_data_module, "use_table_data", mock_use_table_data):

            def _test_row_data(t=table):
                return use_row_data(t)

            render_hook(_test_row_data)

        self.assertIsNotNone(captured_table)
        self.assertEqual(captured_table.size, 1, "Table should have 1 row")
        self.assertEqual(
            len(captured_table.columns), 3, "Table should keep all 3 columns"
        )

    def test_row_list_filters_to_one_row_all_columns(self):
        """use_row_list should filter to 1 row but keep all columns"""
        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [4, 5, 6]),
                int_col("Z", [7, 8, 9]),
            ]
        )

        captured_table = None

        original_use_table_data = use_table_data

        def mock_use_table_data(t, sentinel=None, transformer=None):
            nonlocal captured_table
            captured_table = t
            return original_use_table_data(t, sentinel, transformer)

        with patch.object(use_row_list_module, "use_table_data", mock_use_table_data):

            def _test_row_list(t=table):
                return use_row_list(t)

            render_hook(_test_row_list)

        self.assertIsNotNone(captured_table)
        self.assertEqual(captured_table.size, 1, "Table should have 1 row")
        self.assertEqual(
            len(captured_table.columns), 3, "Table should keep all 3 columns"
        )

    def test_column_data_filters_to_one_column_all_rows(self):
        """use_column_data should filter to 1 column but keep all rows"""
        table = new_table(
            [
                int_col("X", [1, 2, 3]),
                int_col("Y", [4, 5, 6]),
                int_col("Z", [7, 8, 9]),
            ]
        )

        captured_table = None

        original_use_table_data = use_table_data

        def mock_use_table_data(t, sentinel=None, transformer=None):
            nonlocal captured_table
            captured_table = t
            return original_use_table_data(t, sentinel, transformer)

        with patch.object(
            use_column_data_module, "use_table_data", mock_use_table_data
        ):

            def _test_column_data(t=table):
                return use_column_data(t)

            render_hook(_test_column_data)

        self.assertIsNotNone(captured_table)
        self.assertEqual(captured_table.size, 3, "Table should keep all 3 rows")
        self.assertEqual(len(captured_table.columns), 1, "Table should have 1 column")
        self.assertEqual(
            captured_table.column_names[0], "X", "Should keep first column"
        )

    def test_cell_data_with_single_cell_table(self):
        """use_cell_data with a 1x1 table should not change dimensions"""
        table = new_table([int_col("X", [42])])

        captured_table = None

        original_use_table_data = use_table_data

        def mock_use_table_data(t, sentinel=None, transformer=None):
            nonlocal captured_table
            captured_table = t
            return original_use_table_data(t, sentinel, transformer)

        with patch.object(use_cell_data_module, "use_table_data", mock_use_table_data):

            def _test_cell_data(t=table):
                return use_cell_data(t)

            render_hook(_test_cell_data)

        self.assertIsNotNone(captured_table)
        self.assertEqual(captured_table.size, 1)
        self.assertEqual(len(captured_table.columns), 1)
