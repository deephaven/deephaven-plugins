from __future__ import annotations
import json
import sys
from deephaven.ui._internal.RenderContext import (
    RenderContext,
    OnChangeCallable,
    RestoredStateMismatchError,
)
from typing import Any, Callable, Dict, List
from unittest.mock import Mock, patch
from .BaseTest import BaseTestCase
from .test_utils_root import TestRoot

run_on_change: OnChangeCallable = lambda x: x()


def make_render_context(
    on_change: OnChangeCallable = run_on_change,
    on_queue: OnChangeCallable = run_on_change,
) -> RenderContext:
    from deephaven.ui._internal.RenderContext import RenderContext

    return RenderContext(TestRoot(on_change, on_queue))


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
            for i in range(3):
                rc.init_state(rc.next_hook_index(), i + 1)

        state = rc.export_state()
        self.assertEqual(state, {"state": {0: 1, 1: 2, 2: 3}, "hooks": 3})

    def test_export_nested_state(self):
        rc = make_render_context()

        with rc.open():
            rc.init_state(rc.next_hook_index(), 1)
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context0.init_state(child_context0.next_hook_index(), 2)
                child_context0.init_state(child_context0.next_hook_index(), 3)
                child_context1 = child_context0.get_child_context("0")
                with child_context1.open():
                    child_context1.init_state(child_context1.next_hook_index(), 4)
                    child_context1.init_state(child_context1.next_hook_index(), 5)

        state = rc.export_state()
        self.assertEqual(
            state,
            {
                "state": {0: 1},
                "hooks": 1,
                "children": {
                    "0": {
                        "state": {0: 2, 1: 3},
                        "hooks": 2,
                        "children": {"0": {"state": {0: 4, 1: 5}, "hooks": 2}},
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
        state = {"state": {0: 3}, "sites": {0: "site"}, "hooks": 1}
        rc.import_state(state)
        with rc.open():
            rc.next_hook_index()
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 3)

    def test_import_nested_state(self):
        rc = make_render_context()
        state = {
            "state": {0: 1},
            "sites": {0: "a"},
            "hooks": 1,
            "children": {
                "0": {
                    "state": {0: 2, 1: 3},
                    "sites": {0: "b", 1: "c"},
                    "hooks": 2,
                    "children": {
                        "0": {
                            "state": {0: 4, 1: 5},
                            "sites": {0: "d", 1: "e"},
                            "hooks": 2,
                        }
                    },
                }
            },
        }
        rc.import_state(state)
        with rc.open():
            rc.next_hook_index()
            self.assertEqual(rc.has_state(0), True)
            self.assertEqual(rc.get_state(0), 1)
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context0.next_hook_index()
                child_context0.next_hook_index()
                self.assertEqual(child_context0.has_state(0), True)
                self.assertEqual(child_context0.get_state(0), 2)
                self.assertEqual(child_context0.has_state(1), True)
                self.assertEqual(child_context0.get_state(1), 3)
                child_context1 = child_context0.get_child_context("0")
                with child_context1.open():
                    child_context1.next_hook_index()
                    child_context1.next_hook_index()
                    self.assertEqual(child_context1.has_state(0), True)
                    self.assertEqual(child_context1.get_state(0), 4)
                    self.assertEqual(child_context1.has_state(1), True)
                    self.assertEqual(child_context1.get_state(1), 5)

    def test_import_unmounts_previous_children(self):
        rc = make_render_context()
        unmount_listener = Mock()
        with rc.open():
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context0.add_unmount_listener(unmount_listener)

        rc.import_state({})
        unmount_listener.assert_called_once()

    def test_import_resets_state_when_a_cleanup_fails(self):
        rc = make_render_context()
        with rc.open():
            rc.init_state(rc.next_hook_index(), "saved")
            child_context0 = rc.get_child_context("0")
            with child_context0.open():
                child_context0.add_unmount_listener(
                    Mock(side_effect=RuntimeError("cleanup failed"))
                )

        with self.assertRaises(RuntimeError):
            rc.import_state({})

        self.assertEqual(rc.export_state(), {})
        # The child already unmounted, so unmounting the parent must not reach it again
        rc.unmount()


class RenderUnmountChildrenTestCase(BaseTestCase):
    def test_unmount_children(self):
        rc = make_render_context()

        with rc.open():
            rc.init_state(rc.next_hook_index(), 1)
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
            rc.next_hook_index()

        state = rc.export_state()
        self.assertEqual(state, {"state": {0: 1}, "hooks": 1})


def render_component(rc: RenderContext, fn: Callable[[], Any]) -> None:
    from deephaven.ui.elements import FunctionElement
    from deephaven.ui.renderer import Renderer

    Renderer(rc).render(FunctionElement("test_component", fn))


def save_and_restore(rc: RenderContext) -> RenderContext:
    """Export the state of `rc` through JSON, as the client does, and import it into a new context."""
    restored = make_render_context()
    restored.import_state(json.loads(json.dumps(rc.export_state())))
    return restored


class RenderRestoreTestCase(BaseTestCase):
    def test_restore_round_trip(self):
        from deephaven.ui.hooks import use_state

        values: List[Any] = []

        def component():
            value, _ = use_state("Americas")
            values.append(value)

        rc = make_render_context()
        render_component(rc, component)
        rc.set_state(0, "Europe")

        render_component(save_and_restore(rc), component)
        self.assertEqual(values[-1], "Europe")

    def test_restore_discards_value_saved_by_another_hook(self):
        from deephaven.ui.hooks import use_state

        swapped = False
        values: List[Any] = []

        def component():
            if swapped:
                b, _ = use_state("b")
                a, _ = use_state("a")
            else:
                a, _ = use_state("a")
                b, _ = use_state("b")
            values.append((a, b))

        rc = make_render_context()
        render_component(rc, component)
        rc.set_state(0, "saved a")
        rc.set_state(1, "saved b")

        swapped = True
        render_component(save_and_restore(rc), component)
        self.assertEqual(values[-1], ("a", "b"))

    def _assert_same_line_swap_discards_values(self):
        from deephaven.ui.hooks import use_state

        swapped = False
        values: List[Any] = []

        def component():
            pair = (use_state("b")[0], use_state("a")[0]) if swapped else (use_state("a")[0], use_state("b")[0])  # fmt: skip
            values.append(pair)

        rc = make_render_context()
        render_component(rc, component)
        rc.set_state(0, "saved a")
        rc.set_state(1, "saved b")

        swapped = True
        render_component(save_and_restore(rc), component)
        self.assertEqual(values[-1], ("b", "a"))

    def test_restore_discards_value_saved_by_another_hook_on_the_same_line(self):
        self._assert_same_line_swap_discards_values()

    def test_restore_discards_value_saved_by_another_hook_on_the_same_line_without_columns(
        self,
    ):
        # Python before 3.11 has no columns and uses the bytecode offset within the line
        # The package re-exports the RenderContext class under the module's name, so patch the module object
        render_context_module = sys.modules[RenderContext.__module__]
        with patch.object(render_context_module, "_HAS_CO_POSITIONS", False):
            self._assert_same_line_swap_discards_values()

    def test_restore_with_different_hook_count(self):
        from deephaven.ui.hooks import use_effect, use_memo, use_state

        regions = ["Americas", "Europe", "Asia"]
        effect_calls: List[Any] = []

        def component():
            for region in regions:
                use_memo(lambda r=region: r.upper(), [region])
            use_state(regions[0])
            use_effect(lambda: effect_calls.append(len(regions)), [])

        rc = make_render_context()
        render_component(rc, component)
        rc.set_state(2 * len(regions), "Europe")
        effect_calls.clear()

        regions.append("Africa")
        restored = save_and_restore(rc)
        # The saved string must not reach the new memo in its slot
        with self.assertRaises(RestoredStateMismatchError):
            render_component(restored, component)
        self.assertEqual(effect_calls, [])

        restored.import_state({})
        render_component(restored, component)
        self.assertEqual(effect_calls, [4])

    def test_restore_with_different_hook_count_in_child(self):
        from deephaven import ui
        from deephaven.ui.hooks import use_memo, use_state

        regions = ["Americas", "Europe"]
        child_values: List[Any] = []
        child_setters: List[Callable[[Any], None]] = []

        @ui.component
        def child():
            for region in regions:
                use_memo(lambda r=region: r.upper(), [region])
            value, set_value = use_state("Americas")
            child_setters.append(set_value)
            child_values.append(value)

        def parent():
            use_state("parent")
            return child()

        rc = make_render_context()
        render_component(rc, parent)
        child_setters[-1]("Europe")

        regions.append("Africa")
        restored = save_and_restore(rc)
        with self.assertRaises(RestoredStateMismatchError):
            render_component(restored, parent)

        restored.import_state({})
        render_component(restored, parent)
        self.assertEqual(child_values[-1], "Americas")

    def test_restore_keeps_old_format_state(self):
        from deephaven.ui.hooks import use_state

        values: List[Any] = []

        def component():
            value, _ = use_state("Americas")
            values.append(value)

        rc = make_render_context()
        rc.import_state({"state": {"0": "Europe"}})
        render_component(rc, component)

        self.assertEqual(values[-1], "Europe")
        # Saving again uses the current format, so the next restore is checked
        self.assertIn("sites", rc.export_state())

    def test_restore_after_the_module_moves(self):
        from deephaven.ui.hooks import use_state

        values: List[Any] = []
        source = "def component():\n    value, _ = use_state('Americas')\n    values.append(value)\n"

        def load_component(path: str) -> Callable[[], None]:
            namespace = {
                "__name__": "user_module",
                "use_state": use_state,
                "values": values,
            }
            exec(compile(source, path, "exec"), namespace)
            return namespace["component"]

        rc = make_render_context()
        render_component(rc, load_component("/old/site-packages/user_module.py"))
        rc.set_state(0, "Europe")

        render_component(
            save_and_restore(rc), load_component("/new/site-packages/user_module.py")
        )
        self.assertEqual(values[-1], "Europe")

    def test_is_library_file(self):
        import inspect
        from deephaven.ui._internal.RenderContext import _is_library_file

        self.assertTrue(_is_library_file(inspect.getfile(RenderContext)))
        self.assertFalse(_is_library_file(__file__))
        self.assertFalse(_is_library_file("<string>"))
