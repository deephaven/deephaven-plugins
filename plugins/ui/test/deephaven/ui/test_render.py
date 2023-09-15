from unittest.mock import Mock
from .BaseTest import BaseTestCase


class RenderTestCase(BaseTestCase):
    def test_empty_render(self):
        from deephaven.ui._internal.context import RenderContext

        rc = RenderContext()
        self.assertEqual(rc._hook_index, -1)
        self.assertEqual(rc._state, {})
        self.assertEqual(rc._children_context, {})
        self.assertEqual(rc._on_change(), None)

    def test_hook_index(self):
        from deephaven.ui._internal.context import RenderContext

        rc = RenderContext()

        # Set up the hooks used with initial render (3 hooks)
        rc.start_render()
        self.assertEqual(rc.next_hook_index(), 0)
        self.assertEqual(rc.next_hook_index(), 1)
        self.assertEqual(rc.next_hook_index(), 2)
        rc.finish_render()

        # Verify it's the same on the next render
        rc.start_render()
        self.assertEqual(rc.next_hook_index(), 0)
        self.assertEqual(rc.next_hook_index(), 1)
        self.assertEqual(rc.next_hook_index(), 2)
        rc.finish_render()

        # Check that an error is thrown if we don't use enough hooks
        rc.start_render()
        self.assertEqual(rc.next_hook_index(), 0)
        self.assertEqual(rc.next_hook_index(), 1)
        with self.assertRaises(Exception):
            rc.finish_render()

        # Check that an error is thrown if we use too many hooks
        rc.start_render()
        self.assertEqual(rc.next_hook_index(), 0)
        self.assertEqual(rc.next_hook_index(), 1)
        self.assertEqual(rc.next_hook_index(), 2)
        self.assertEqual(rc.next_hook_index(), 3)
        with self.assertRaises(Exception):
            rc.finish_render()

    def test_state(self):
        from deephaven.ui._internal.context import RenderContext

        rc = RenderContext()

        on_change = Mock()
        rc.set_on_change(on_change)

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
        from deephaven.ui._internal.context import RenderContext

        rc = RenderContext()

        on_change = Mock()
        rc.set_on_change(on_change)

        child_context0 = rc.get_child_context(0)
        child_context1 = rc.get_child_context(1)

        self.assertEqual(on_change.call_count, 0)

        # Check that setting state triggers a change event
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
