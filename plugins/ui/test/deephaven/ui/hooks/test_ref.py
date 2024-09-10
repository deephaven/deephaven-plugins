from ..BaseTest import BaseTestCase
from .render_utils import render_hook
from operator import itemgetter
from typing import Any


class UseRefTestCase(BaseTestCase):
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
