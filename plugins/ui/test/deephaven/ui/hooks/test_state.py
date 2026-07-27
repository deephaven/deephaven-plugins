from operator import itemgetter
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseStateTestCase(BaseTestCase):
    def test_state(self):
        from deephaven.ui.hooks import use_state

        def _test_state(value1: int = 1, value2: int = 2):
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

    def test_state_setter_is_stable(self):
        from deephaven.ui.hooks import use_state

        def _test_state():
            _, set_value1 = use_state(1)
            _, set_value2 = use_state(2)
            return set_value1, set_value2

        render_result = render_hook(_test_state)
        result, rerender = itemgetter("result", "rerender")(render_result)
        first_set1, first_set2 = result

        # The setter instances must be stable across renders so that they
        # serialize to a stable callable id for the client (otherwise the client
        # would receive a new prop, e.g. onChange, on every render).
        rerender()
        second_set1, second_set2 = itemgetter("result")(render_result)
        self.assertIs(first_set1, second_set1)
        self.assertIs(first_set2, second_set2)

        # Setting state and re-rendering should still return the same setters
        first_set1(3)
        rerender()
        third_set1, third_set2 = itemgetter("result")(render_result)
        self.assertIs(first_set1, third_set1)
        self.assertIs(first_set2, third_set2)
