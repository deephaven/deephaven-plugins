from unittest.mock import Mock
from .BaseTest import BaseTestCase


def make_render_context(
    on_change=lambda x: x(), on_queue=lambda x: x()
) -> "deephaven.ui._internal.RenderContext":
    from deephaven.ui._internal.RenderContext import RenderContext

    return RenderContext(on_change, on_queue)


class RenderTestCase(BaseTestCase):
    def test_empty_render(self):
        on_change = Mock(side_effect=lambda x: x())
        rc = make_render_context(on_change)
        self.assertEqual(rc._hook_index, -2)
        self.assertEqual(rc._state, {})
        self.assertEqual(rc._children_context, {})
        on_change.assert_not_called()

    def test_hook_index(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock(side_effect=lambda x: x())
        rc = make_render_context(on_change)

        # Set up the hooks used with initial render (3 hooks)
        with rc.open():
            self.assertEqual(rc.next_hook_index(), 0)
            self.assertEqual(rc.next_hook_index(), 1)
            self.assertEqual(rc.next_hook_index(), 2)

        # Verify it's the same on the next render
        with rc.open():
            self.assertEqual(rc.next_hook_index(), 0)
            self.assertEqual(rc.next_hook_index(), 1)
            self.assertEqual(rc.next_hook_index(), 2)

        # Check that an error is thrown if we don't use enough hooks
        with self.assertRaises(Exception):
            with rc.open():
                self.assertEqual(rc.next_hook_index(), 0)
                self.assertEqual(rc.next_hook_index(), 1)

        # Check that an error is thrown if we use too many hooks
        with self.assertRaises(Exception):
            with rc.open():
                self.assertEqual(rc.next_hook_index(), 0)
                self.assertEqual(rc.next_hook_index(), 1)
                self.assertEqual(rc.next_hook_index(), 2)
                self.assertEqual(rc.next_hook_index(), 3)

    def test_state(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock(side_effect=lambda x: x())
        rc = make_render_context(on_change)

        with rc.open():
            self.assertEqual(rc.has_state(0), False)
            self.assertRaises(KeyError, rc.get_state, 0)
            self.assertRaises(KeyError, rc.set_state, 0, 2)
            self.assertEqual(on_change.call_count, 0)

            rc.init_state(0, 2)
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 2)
            self.assertRaises(KeyError, rc.init_state, 0, 3)
            self.assertEqual(on_change.call_count, 0)

    def test_context(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock(side_effect=lambda x: x())
        rc = make_render_context(on_change)

        child_context0 = rc.get_child_context(0)
        child_context1 = rc.get_child_context(1)

        self.assertEqual(on_change.call_count, 0)

        with rc.open():
            # Check that setting the initial state does not trigger a change event
            rc.init_state(0, 0)
            self.assertEqual(on_change.call_count, 0)

            # Check that changing state triggers a change event
            rc.set_state(0, 1)
            self.assertEqual(on_change.call_count, 1)
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 1)
            self.assertEqual(on_change.call_count, 1)

        with child_context0.open():
            self.assertEqual(child_context0.has_state(0), False)
            self.assertRaises(KeyError, child_context0.get_state, 0)
            child_context0.init_state(0, 2)
            self.assertEqual(child_context0.has_state(0), True)
            self.assertEqual(child_context0.get_state(0), 2)
            # The initial setting of the child context state shouldn't trigger a change, so we should still be at 1
            self.assertEqual(on_change.call_count, 1)
            child_context0.set_state(0, 20)
            self.assertEqual(child_context0.get_state(0), 20)
            # Now it should have been triggered after calling it again
            self.assertEqual(on_change.call_count, 2)

        with child_context1.open():
            self.assertEqual(child_context1.has_state(0), False)
            self.assertRaises(KeyError, child_context1.get_state, 0)
            child_context1.init_state(0, 3)
            with rc.open():
                # This "assert" on rc is deliberate, making sure that changing another context doesn't affect a parent
                self.assertEqual(rc.get_state(0), 1)
            with child_context0.open():
                # This "assert" on child_context0 is deliberate, making sure that changing another context doesn't
                # affect a sibling
                self.assertEqual(child_context0.get_state(0), 20)
            self.assertEqual(child_context1.get_state(0), 3)
            # Shouldn't have triggered a change
            self.assertEqual(on_change.call_count, 2)
