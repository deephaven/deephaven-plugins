from operator import itemgetter
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseFlagTestCase(BaseTestCase):
    def test_flag(self):
        from deephaven.ui.hooks import use_flag

        def _test_flag(value: bool = False):
            flag, set_true, set_false = use_flag(value)
            return flag, set_true, set_false

        # Initial render
        render_result = render_hook(_test_flag)

        result, rerender = itemgetter("result", "rerender")(render_result)
        flag, set_true, set_false = result

        self.assertEqual(flag, False)

        # Rerender with new value, but should retain existing state
        rerender(value=True)
        result = itemgetter("result")(render_result)
        flag, set_true, set_false = result
        self.assertEqual(flag, False)

        # Set to a True
        set_true()
        rerender()
        result = itemgetter("result")(render_result)
        flag, set_true, set_false = result
        self.assertEqual(flag, True)

        # Set to False
        set_false()
        rerender()
        result = itemgetter("result")(render_result)
        flag, set_true, set_false = result
        self.assertEqual(flag, False)
