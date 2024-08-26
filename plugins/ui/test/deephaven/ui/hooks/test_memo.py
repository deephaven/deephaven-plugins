from ..BaseTest import BaseTestCase
from .render_utils import render_hook
from operator import itemgetter
from typing import Any, Callable
from unittest.mock import Mock


class UseMemoTestCase(BaseTestCase):
    def test_ref(self):
        from deephaven.ui.hooks import use_ref

        def _test_ref(value: Any = None):
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

        def _test_memo(fn: Callable[[], Any] = lambda: "foo", a: Any = 1, b: Any = 2):
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

        def _test_memo_set(fn: Callable[[], Any] = lambda: "foo"):
            # passing in a set for dependencies should raise a TypeError
            return use_memo(fn, {})  # type: ignore

        # passing in a non-list/tuple for dependencies should raise a TypeError
        self.assertRaises(TypeError, render_hook, _test_memo_set)
