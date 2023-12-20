from unittest.mock import Mock
from .BaseTest import BaseTestCase


class RenderTestCase(BaseTestCase):
    def test_empty_render(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock()
        rc = RenderContext(on_change)
        self.assertEqual(rc._hook_index, -1)
        self.assertEqual(rc._state, {})
        self.assertEqual(rc._children_context, {})
        on_change.assert_not_called()

    def test_hook_index(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock(side_effect=lambda x: x())
        rc = RenderContext(on_change)

        # Set up the hooks used with initial render (3 hooks)
        with rc:
            self.assertEqual(rc.next_hook_index(), 0)
            self.assertEqual(rc.next_hook_index(), 1)
            self.assertEqual(rc.next_hook_index(), 2)

        # Verify it's the same on the next render
        with rc:
            self.assertEqual(rc.next_hook_index(), 0)
            self.assertEqual(rc.next_hook_index(), 1)
            self.assertEqual(rc.next_hook_index(), 2)

        # Check that an error is thrown if we don't use enough hooks
        with self.assertRaises(Exception):
            with rc:
                self.assertEqual(rc.next_hook_index(), 0)
                self.assertEqual(rc.next_hook_index(), 1)

        # Check that an error is thrown if we use too many hooks
        with self.assertRaises(Exception):
            with rc:
                self.assertEqual(rc.next_hook_index(), 0)
                self.assertEqual(rc.next_hook_index(), 1)
                self.assertEqual(rc.next_hook_index(), 2)
                self.assertEqual(rc.next_hook_index(), 3)

    def test_state(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock(side_effect=lambda x: x())
        rc = RenderContext(on_change)

        self.assertEqual(rc.has_state(0), False)
        self.assertEqual(rc.get_state(0), None)
        self.assertEqual(rc.get_state(0, 1), None)
        self.assertEqual(rc.get_state(1, 1), 1)
        self.assertEqual(on_change.call_count, 0)

        rc.set_state(0, 2)
        self.assertEqual(rc.has_state(0), True)
        self.assertEqual(rc.get_state(0), 2)
        self.assertEqual(rc.get_state(0, 1), 2)
        self.assertEqual(rc.get_state(1), 1)
        self.assertEqual(rc.get_state(1, 1), 1)
        self.assertEqual(on_change.call_count, 1)

    def test_context(self):
        from deephaven.ui._internal.RenderContext import RenderContext

        on_change = Mock(side_effect=lambda x: x())
        rc = RenderContext(on_change)

        child_context0 = rc.get_child_context(0)
        child_context1 = rc.get_child_context(1)

        self.assertEqual(on_change.call_count, 0)

        # Check that setting the initial state does not trigger a change event
        rc.set_state(0, 0)
        self.assertEqual(on_change.call_count, 0)

        # Check that changing state triggers a change event
        rc.set_state(0, 1)
        self.assertEqual(on_change.call_count, 1)
        self.assertEqual(rc.has_state(0), True)
        self.assertEqual(rc.get_state(0), 1)
        self.assertEqual(on_change.call_count, 1)
        self.assertEqual(child_context0.has_state(0), False)
        self.assertEqual(child_context0.get_state(0), None)
        child_context0.set_state(0, 2)
        self.assertEqual(child_context0.has_state(0), True)
        self.assertEqual(child_context0.get_state(0), 2)
        self.assertEqual(on_change.call_count, 2)
        self.assertEqual(child_context1.has_state(0), False)
        self.assertEqual(child_context1.get_state(0), None)
        child_context1.set_state(0, 3)
        self.assertEqual(rc.get_state(0), 1)
        self.assertEqual(child_context0.get_state(0), 2)
        self.assertEqual(child_context1.get_state(0), 3)
        self.assertEqual(on_change.call_count, 3)
