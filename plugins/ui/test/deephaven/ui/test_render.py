from __future__ import annotations
from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from typing import Dict, Any
from unittest.mock import Mock
from .BaseTest import BaseTestCase

run_on_change: OnChangeCallable = lambda x: x()


def make_render_context(
    on_change: OnChangeCallable = run_on_change,
    on_queue: OnChangeCallable = run_on_change,
) -> RenderContext:
    from deephaven.ui._internal.RenderContext import RenderContext

    return RenderContext(on_change, on_queue)


class RenderTestCase(BaseTestCase):
    def test_empty_render(self):
        on_change = Mock(side_effect=run_on_change)
        rc = make_render_context(on_change)
        self.assertEqual(rc._hook_index, -2)
        self.assertEqual(rc._state, {})
        self.assertEqual(rc._children_context, {})
        on_change.assert_not_called()

    def test_hook_index(self):
        on_change = Mock(side_effect=run_on_change)
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
        on_change = Mock(side_effect=run_on_change)
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
        on_change = Mock(side_effect=run_on_change)
        rc = make_render_context(on_change)

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

            child_context0 = rc.get_child_context("0")
            child_context1 = rc.get_child_context("1")

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
                self.assertEqual(child_context1.get_state(0), 3)
                # Shouldn't have triggered a change
                self.assertEqual(on_change.call_count, 2)

        # Check that changing a child context doesn't affect the parent or sibling
        with rc.open():
            # This "assert" on rc is deliberate, making sure that changing another context doesn't affect a parent
            self.assertEqual(rc.get_state(0), 1)
            with child_context0.open():
                # This "assert" on child_context0 is deliberate, making sure that changing another context doesn't
                # affect a sibling
                self.assertEqual(child_context0.get_state(0), 20)


class RenderExportTestCase(BaseTestCase):
    def test_export_empty_context(self):
        rc = make_render_context()

        with rc.open():
            pass

        state = rc.export_state()
        self.assertEqual(state, {})

    def test_export_basic_state(self):
        rc = make_render_context()

        with rc.open():
            rc.init_state(0, 1)
            rc.init_state(1, 2)
            rc.init_state(2, 3)

        state = rc.export_state()
        self.assertEqual(state, {"state": {0: 1, 1: 2, 2: 3}})

    def test_export_nested_state(self):
        rc = make_render_context()

        with rc.open():
            rc.init_state(0, 1)
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context0.init_state(0, 2)
                child_context0.init_state(1, 3)
                child_context1 = child_context0.get_child_context("0")
                with child_context1.open():
                    child_context1.init_state(0, 4)
                    child_context1.init_state(1, 5)

        state = rc.export_state()
        self.assertEqual(
            state,
            {
                "state": {0: 1},
                "children": {
                    "0": {
                        "state": {0: 2, 1: 3},
                        "children": {"0": {"state": {0: 4, 1: 5}}},
                    }
                },
            },
        )

    def test_ignore_empty_state(self):
        rc = make_render_context()

        with rc.open():
            rc.init_state(0, 1)
            rc.init_state(1, 2)
            rc.init_state(2, 3)
            rc.set_state(0, None)
            rc.set_state(1, None)
            rc.set_state(2, None)

            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context1 = child_context0.get_child_context("0")
                with child_context1.open():
                    child_context1.init_state(0, None)

        state = rc.export_state()
        self.assertEqual(state, {})


class RenderImportTestCase(BaseTestCase):
    def test_import_empty_context(self):
        on_change = Mock(side_effect=run_on_change)
        rc = make_render_context(on_change)

        # Empty context should reset the state if there was one
        with rc.open():
            rc.init_state(0, 2)
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 2)

        state: Dict[str, Any] = {}
        rc.import_state(state)
        with rc.open():
            self.assertEqual(rc.has_state(0), False)

    def test_import_basic_state(self):
        rc = make_render_context()
        state = {"state": {0: 3}}
        rc.import_state(state)
        with rc.open():
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 3)

    def test_import_nested_state(self):
        rc = make_render_context()
        state = {
            "state": {0: 1},
            "children": {
                "0": {"state": {0: 2, 1: 3}, "children": {"0": {"state": {0: 4, 1: 5}}}}
            },
        }
        rc.import_state(state)
        with rc.open():
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 1)
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                self.assertEqual(child_context0.has_state(0), True)
                self.assertEqual(child_context0.get_state(0), 2)
                self.assertEqual(child_context0.has_state(1), True)
                self.assertEqual(child_context0.get_state(1), 3)
                child_context1 = child_context0.get_child_context("0")
                with child_context1.open():
                    self.assertEqual(child_context1.has_state(0), True)
                    self.assertEqual(child_context1.get_state(0), 4)
                    self.assertEqual(child_context1.has_state(1), True)
                    self.assertEqual(child_context1.get_state(1), 5)


class RenderUnmountChildrenTestCase(BaseTestCase):
    def test_unmount_children(self):
        rc = make_render_context()

        with rc.open():
            rc.init_state(0, 1)
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context0.init_state(0, 2)
                child_context0.init_state(1, 3)
                child_context1 = child_context0.get_child_context("0")
                with child_context1.open():
                    child_context1.init_state(0, 4)
                    child_context1.init_state(1, 5)

        with rc.open():
            # Children should be unmounted if nothing is rendered while this context is opened
            pass

        state = rc.export_state()
        self.assertEqual(state, {"state": {0: 1}})


class RenderDirtyTrackingTestCase(BaseTestCase):
    def test_initial_dirty_state(self):
        """Test that a new context starts clean (not dirty)."""
        rc = make_render_context()
        self.assertFalse(rc._is_dirty)
        self.assertFalse(rc._has_dirty_descendant)
        self.assertIsNone(rc._parent_context)

    def test_set_state_marks_dirty(self):
        """Test that setting state marks the context as dirty."""
        rc = make_render_context()
        with rc.open():
            rc.init_state(0, "initial")
            self.assertFalse(rc._is_dirty)

            rc.set_state(0, "updated")
            self.assertTrue(rc._is_dirty)

    def test_child_context_has_parent(self):
        """Test that child contexts have their parent set."""
        rc = make_render_context()
        with rc.open():
            child = rc.get_child_context("child")
            self.assertIs(child._parent_context, rc)

    def test_dirty_propagates_to_ancestors(self):
        """Test that marking a child dirty propagates _has_dirty_descendant to ancestors."""
        rc = make_render_context()

        with rc.open():
            rc.init_state(0, "root")
            child = rc.get_child_context("child")
            with child.open():
                child.init_state(0, "child-state")
                grandchild = child.get_child_context("grandchild")
                with grandchild.open():
                    grandchild.init_state(0, "grandchild-state")

        # Initially, none are dirty
        self.assertFalse(rc._is_dirty)
        self.assertFalse(rc._has_dirty_descendant)
        self.assertFalse(child._is_dirty)
        self.assertFalse(child._has_dirty_descendant)
        self.assertFalse(grandchild._is_dirty)
        self.assertFalse(grandchild._has_dirty_descendant)

        # Set state in grandchild
        with rc.open():
            child = rc.get_child_context("child")
            with child.open():
                grandchild = child.get_child_context("grandchild")
                with grandchild.open():
                    grandchild.set_state(0, "new-grandchild-state")

        # Grandchild should be dirty
        self.assertTrue(grandchild._is_dirty)
        self.assertFalse(grandchild._has_dirty_descendant)

        # Child should have dirty descendant but not be dirty itself
        self.assertFalse(child._is_dirty)
        self.assertTrue(child._has_dirty_descendant)

        # Root should have dirty descendant but not be dirty itself
        self.assertFalse(rc._is_dirty)
        self.assertTrue(rc._has_dirty_descendant)

    def test_dirty_propagation_stops_at_already_marked_ancestor(self):
        """Test that dirty propagation stops when it encounters an already marked ancestor."""
        rc = make_render_context()

        with rc.open():
            rc.init_state(0, "root")
            child1 = rc.get_child_context("child1")
            with child1.open():
                child1.init_state(0, "child1-state")
                grandchild1 = child1.get_child_context("grandchild1")
                with grandchild1.open():
                    grandchild1.init_state(0, "grandchild1-state")
            child2 = rc.get_child_context("child2")
            with child2.open():
                child2.init_state(0, "child2-state")

        # Mark grandchild1 dirty - need to also access child2 to keep it alive
        with rc.open():
            child1 = rc.get_child_context("child1")
            with child1.open():
                grandchild1 = child1.get_child_context("grandchild1")
                with grandchild1.open():
                    grandchild1.set_state(0, "new-grandchild1-state")
            # Must access child2 to prevent it from being unmounted
            child2 = rc.get_child_context("child2")
            with child2.open():
                pass

        self.assertTrue(rc._has_dirty_descendant)
        self.assertTrue(child1._has_dirty_descendant)

        # Now mark child2 dirty - propagation should stop at rc since it's already marked
        with rc.open():
            child1 = rc.get_child_context("child1")
            with child1.open():
                grandchild1 = child1.get_child_context("grandchild1")
                with grandchild1.open():
                    pass
            child2 = rc.get_child_context("child2")
            with child2.open():
                child2.set_state(0, "new-child2-state")

        # child2 should be dirty (not just has_dirty_descendant)
        self.assertTrue(child2._is_dirty)
        # rc should still have _has_dirty_descendant (unchanged)
        self.assertTrue(rc._has_dirty_descendant)

    def test_multiple_set_state_calls(self):
        """Test that multiple set_state calls still result in dirty context."""
        rc = make_render_context()
        with rc.open():
            rc.init_state(0, "val0")
            rc.init_state(1, "val1")

        with rc.open():
            rc.set_state(0, "new0")
            self.assertTrue(rc._is_dirty)
            rc.set_state(1, "new1")
            self.assertTrue(rc._is_dirty)

    def test_different_keys_have_separate_state(self):
        """Test that child contexts with different keys have separate state (key-based reconciliation)."""
        rc = make_render_context()

        # Create two child contexts with different keys
        with rc.open():
            child_a = rc.get_child_context("key_a")
            child_b = rc.get_child_context("key_b")
            with child_a.open():
                child_a.init_state(0, "value_a")
            with child_b.open():
                child_b.init_state(0, "value_b")

        # Verify they have separate state
        with rc.open():
            child_a = rc.get_child_context("key_a")
            child_b = rc.get_child_context("key_b")
            with child_a.open():
                self.assertEqual(child_a.get_state(0), "value_a")
            with child_b.open():
                self.assertEqual(child_b.get_state(0), "value_b")

    def test_changed_key_creates_new_context(self):
        """Test that changing a key creates a new context with fresh state.

        When accessing a different key, a new context is created. The old context
        will be unmounted if not accessed in subsequent renders.
        """
        rc = make_render_context()

        # Create initial child context
        with rc.open():
            child = rc.get_child_context("original_key")
            with child.open():
                child.init_state(0, "original_value")

        # Access with original key - should get existing state
        with rc.open():
            child = rc.get_child_context("original_key")
            with child.open():
                self.assertEqual(child.get_state(0), "original_value")

        # Access with new key AND original key - both should work with separate state
        with rc.open():
            original_child = rc.get_child_context("original_key")
            new_child = rc.get_child_context("new_key")
            with original_child.open():
                # Original state should still be there
                self.assertEqual(original_child.get_state(0), "original_value")
            with new_child.open():
                # New context should have no state
                self.assertFalse(new_child.has_state(0))
                new_child.init_state(0, "new_value")

        # Verify both contexts maintain separate state
        with rc.open():
            original_child = rc.get_child_context("original_key")
            new_child = rc.get_child_context("new_key")
            with original_child.open():
                self.assertEqual(original_child.get_state(0), "original_value")
            with new_child.open():
                self.assertEqual(new_child.get_state(0), "new_value")

    def test_unused_key_context_is_unmounted(self):
        """Test that child contexts with keys that are no longer used get unmounted."""
        rc = make_render_context()

        # Create initial child context with key "to_be_unmounted"
        with rc.open():
            child = rc.get_child_context("to_be_unmounted")
            with child.open():
                child.init_state(0, "will_be_lost")

        # Verify the child context exists
        self.assertIn("to_be_unmounted", rc._children_context)

        # Re-render without accessing "to_be_unmounted" key
        with rc.open():
            # Don't access the "to_be_unmounted" child
            pass

        # The child context should have been unmounted
        self.assertNotIn("to_be_unmounted", rc._children_context)
