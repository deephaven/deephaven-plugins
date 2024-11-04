from operator import itemgetter
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseBooleanTestCase(BaseTestCase):
    def test_boolean(self):
        from deephaven.ui.hooks import use_boolean

        def _test_boolean(initial_value: bool = False):
            value, set_value = use_boolean(initial_value)
            return value, set_value

        # Initial render
        render_result = render_hook(_test_boolean)

        result, rerender = itemgetter("result", "rerender")(render_result)
        value, set_value = result

        self.assertEqual(value, False)

        # Rerender with new value, but should retain existing state
        rerender(initial_value=True)
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, False)

        # Set to a True
        set_value(True)
        rerender()
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, True)

        # Set to False
        set_value(False)
        rerender()
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, False)

        # Set to a True with on
        set_value.on()
        rerender()
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, True)

        # Set to a False with off
        set_value.off()
        rerender()
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, False)

        # Set to a True with toogle
        set_value.toggle()
        rerender()
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, True)

        # Set to a False with toogle
        set_value.toggle()
        rerender()
        result = itemgetter("result")(render_result)
        value, set_value = result
        self.assertEqual(value, False)
