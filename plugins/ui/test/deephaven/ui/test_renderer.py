from __future__ import annotations
from unittest.mock import Mock
from typing import Any, Callable, List, Union
from dataclasses import dataclass
from deephaven.ui import Element
from deephaven.ui.renderer.Renderer import Renderer, _render_child_item
from deephaven.ui.renderer.RenderedNode import RenderedNode
from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from deephaven import ui
from .BaseTest import BaseTestCase

run_on_change: OnChangeCallable = lambda x: x()


class RendererTestCase(BaseTestCase):
    def test_render_children(self):
        def find_node(root: RenderedNode, name: str) -> RenderedNode:
            """
            Recursively find a node by name given the root node
            Looks at the name of the node, then all of it's children to find the node
            """
            if root.name == name:
                return root
            children: Union[Any, List[Any]] = (
                root.props.get("children", []) if root.props != None else []
            )
            children = [children] if not isinstance(children, List) else children

            for child in children:
                try:
                    if isinstance(child, RenderedNode):
                        result = find_node(child, name)
                        return result
                except ValueError:
                    pass
            raise ValueError(f"Could not find node with name {name}")

        def find_toggle_button(root: RenderedNode) -> RenderedNode:
            return find_node(root, "deephaven.ui.components.ToggleButton")

        def find_action_button(root: RenderedNode) -> RenderedNode:
            return find_node(root, "deephaven.ui.components.ActionButton")

        on_change: Callable[[Callable[[], None]], None] = Mock(
            side_effect=run_on_change
        )
        on_queue: Callable[[Callable[[], None]], None] = Mock(side_effect=run_on_change)

        called_funcs: List[str] = []

        def make_effect(name: str):
            def cleanup():
                called_funcs.append((f"{name}_cleanup"))

            def effect():
                called_funcs.append((f"{name}_effect"))
                return cleanup

            return effect

        @ui.component
        def ui_counter():
            count, set_count = ui.use_state(0)

            ui.use_effect(make_effect("counter_no_deps"))
            ui.use_effect(make_effect("counter_empty_deps"), [])
            ui.use_effect(make_effect("counter_with_deps"), [count])

            return ui.action_button(
                f"Count is {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component
        def ui_parent():
            is_shown, set_is_shown = ui.use_state(True)

            ui.use_effect(make_effect("parent_no_deps"))
            ui.use_effect(make_effect("parent_empty_deps"), [])
            ui.use_effect(make_effect("parent_with_deps"), [is_shown])

            return [
                ui.toggle_button(
                    "Show counter", is_selected=is_shown, on_change=set_is_shown
                ),
                ui_counter() if is_shown else None,
            ]

        rc = RenderContext(on_change, on_queue)

        renderer = Renderer(rc)

        result = renderer.render(ui_parent())

        # Check that the rendered tree is correct
        assert result.props != None
        self.assertEqual(len(result.props["children"]), 2)
        toggle_btn = find_toggle_button(result)
        assert toggle_btn.props != None
        self.assertEqual(toggle_btn.props["isSelected"], True)

        count_btn = find_action_button(result)
        assert count_btn.props != None
        self.assertEqual(count_btn.props["children"], "Count is 0")

        # Check that effects were called in the correct order
        self.assertEqual(
            called_funcs,
            [
                "counter_no_deps_effect",
                "counter_empty_deps_effect",
                "counter_with_deps_effect",
                "parent_no_deps_effect",
                "parent_empty_deps_effect",
                "parent_with_deps_effect",
            ],
        )
        called_funcs.clear()

        # Press the counter button
        count_btn.props["onPress"](None)

        # Re-render
        result = renderer.render(ui_parent())

        # Check that the rendered tree is correct
        assert result.props != None
        self.assertEqual(len(result.props["children"]), 2)
        count_btn = find_action_button(result)
        assert count_btn.props != None
        self.assertEqual(count_btn.props["children"], "Count is 1")

        # With selective re-rendering optimization:
        # - Counter is dirty, so counter effects run
        # - Parent is clean (only has dirty descendant), so parent effects DON'T run
        # This is the expected behavior - parent function isn't called, so hooks don't run
        self.assertEqual(
            called_funcs,
            [
                "counter_no_deps_cleanup",
                "counter_with_deps_cleanup",
                "counter_no_deps_effect",
                "counter_with_deps_effect",
            ],
        )
        called_funcs.clear()

        # Toggle the visibility of the child component
        toggle_btn = find_toggle_button(result)
        assert toggle_btn.props != None
        toggle_btn.props["onChange"](False)

        # Re-render
        result = renderer.render(ui_parent())

        # Counter button should no longer be in the tree
        self.assertRaises(ValueError, lambda: find_action_button(result))

        # Cleanup effects on counter should have been called, and parents no dep and with deps effect should be called
        self.assertEqual(
            called_funcs,
            [
                "counter_no_deps_cleanup",
                "counter_empty_deps_cleanup",
                "counter_with_deps_cleanup",
                "parent_no_deps_cleanup",
                "parent_with_deps_cleanup",
                "parent_no_deps_effect",
                "parent_with_deps_effect",
            ],
        )
        called_funcs.clear()

        # Toggle the visibility of the child component
        toggle_btn = find_toggle_button(result)
        assert toggle_btn.props != None
        toggle_btn.props["onChange"](True)

        # Re-render
        result = renderer.render(ui_parent())

        # Counter button should be back in the tree, and back at count 0
        count_btn = find_action_button(result)
        assert count_btn.props != None
        self.assertEqual(count_btn.props["children"], "Count is 0")

        # Effects on counter should have been called, and parents no dep and with deps effect should be called
        self.assertEqual(
            called_funcs,
            [
                "counter_no_deps_effect",
                "counter_empty_deps_effect",
                "counter_with_deps_effect",
                "parent_no_deps_cleanup",
                "parent_with_deps_cleanup",
                "parent_no_deps_effect",
                "parent_with_deps_effect",
            ],
        )
        called_funcs.clear()

        # Unmounting should call all the cleanup methods
        rc.unmount()
        self.assertEqual(
            called_funcs,
            [
                "counter_no_deps_cleanup",
                "counter_empty_deps_cleanup",
                "counter_with_deps_cleanup",
                "parent_no_deps_cleanup",
                "parent_empty_deps_cleanup",
                "parent_with_deps_cleanup",
            ],
        )

    def test_render_child_item(self):
        rc = RenderContext(Mock(), Mock())

        self.assertEqual(
            _render_child_item({"key": "value"}, rc, "key"),
            {"key": "value"},
        )

        self.assertEqual(
            _render_child_item([0, 1, 2], rc, "key"),
            [0, 1, 2],
        )

        @ui.component
        def my_comp():
            return "Hello"

        @dataclass
        class MyDataclass:
            a: str
            b: Element

        nested_dataclass = _render_child_item(
            [MyDataclass("test", my_comp())], rc, "key"
        )[0]

        self.assertEqual(
            nested_dataclass["a"],
            "test",
        )

        self.assertIsInstance(nested_dataclass["b"], RenderedNode)


class SelectiveRenderingTestCase(BaseTestCase):
    """Tests for selective re-rendering optimization."""

    def _get_text_content(self, rendered_node):
        """Helper to get text content from a rendered text node.
        ui.text() passes children as keyword arg which becomes a list/tuple after rendering.
        """
        children = rendered_node.props["children"]
        if isinstance(children, list):
            return children[0] if len(children) == 1 else children
        return children

    def test_clean_component_returns_cached_node(self):
        """Test that a clean component (no state change) returns its cached rendered node."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        render_count = [0]

        @ui.component
        def counter():
            render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.text(f"Count: {count}")

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # First render
        result1 = renderer.render(counter())
        self.assertEqual(render_count[0], 1)
        text_node1 = result1.props["children"]
        self.assertEqual(self._get_text_content(text_node1), "Count: 0")

        # Second render without state change - should return cached
        result2 = renderer.render(counter())
        # Component should NOT re-render since it's clean
        self.assertEqual(render_count[0], 1)
        # Should return the same cached node
        self.assertIs(result2, result1)

    def test_dirty_component_fully_rerenders(self):
        """Test that a dirty component (state changed) fully re-renders."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        render_count = [0]
        set_count_ref = [None]

        @ui.component
        def counter():
            render_count[0] += 1
            count, set_count = ui.use_state(0)
            set_count_ref[0] = set_count
            return ui.text(f"Count: {count}")

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # First render
        result1 = renderer.render(counter())
        self.assertEqual(render_count[0], 1)
        text_node1 = result1.props["children"]
        self.assertEqual(self._get_text_content(text_node1), "Count: 0")

        # Change state
        set_count_ref[0](1)

        # Second render with state change - should fully re-render
        result2 = renderer.render(counter())
        self.assertEqual(render_count[0], 2)
        text_node2 = result2.props["children"]
        self.assertEqual(self._get_text_content(text_node2), "Count: 1")
        # Should be a new node, not the cached one
        self.assertIsNot(result2, result1)

    def test_parent_clean_child_dirty_only_child_rerenders(self):
        """Test that when child state changes, only the child re-renders, not the parent."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        parent_render_count = [0]
        child_render_count = [0]
        set_child_count_ref = [None]

        @ui.component
        def child():
            child_render_count[0] += 1
            count, set_count = ui.use_state(0)
            set_child_count_ref[0] = set_count
            return ui.text(f"Child count: {count}")

        @ui.component
        def parent():
            parent_render_count[0] += 1
            # Return child directly (no wrapper) to simplify the test
            return child()

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # First render
        result1 = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 1)
        self.assertEqual(child_render_count[0], 1)

        # Change child state
        set_child_count_ref[0](1)

        # Second render - parent should NOT re-render, only child should
        result2 = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 1)  # Parent did NOT re-render
        self.assertEqual(child_render_count[0], 2)  # Child DID re-render

        # Navigate to the text content
        # result2 = parent RenderedNode
        # result2.props["children"] = child RenderedNode
        # result2.props["children"].props["children"] = Text RenderedNode
        child_node = result2.props["children"]
        text_node = child_node.props["children"]
        self.assertEqual(self._get_text_content(text_node), "Child count: 1")

    def test_deeply_nested_dirty_child(self):
        """Test selective re-rendering with deeply nested components."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_count = [0]
        parent_count = [0]
        child_count = [0]
        set_child_state_ref = [None]

        @ui.component
        def child():
            child_count[0] += 1
            value, set_value = ui.use_state("initial")
            set_child_state_ref[0] = set_value
            return ui.text(value)

        @ui.component
        def parent_comp():
            parent_count[0] += 1
            return ui.view(child())

        @ui.component
        def grandparent():
            grandparent_count[0] += 1
            return ui.view(parent_comp())

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # First render
        renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 1)
        self.assertEqual(parent_count[0], 1)
        self.assertEqual(child_count[0], 1)

        # Change child state
        set_child_state_ref[0]("updated")

        # Second render - only child should re-render
        renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 1)  # Did NOT re-render
        self.assertEqual(parent_count[0], 1)  # Did NOT re-render
        self.assertEqual(child_count[0], 2)  # DID re-render

    def test_multiple_child_state_updates(self):
        """Test that multiple state changes on a child component all trigger re-renders.

        This reproduces a bug where only the first click/state update triggers a re-render,
        and subsequent updates are ignored.
        """
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        parent_render_count = [0]
        child_a_render_count = [0]
        child_b_render_count = [0]
        set_child_a_count_ref = [None]
        set_child_b_count_ref = [None]

        @ui.component
        def child_with_state(name):
            if name == "A":
                child_a_render_count[0] += 1
            else:
                child_b_render_count[0] += 1

            count, set_count = ui.use_state(0)

            if name == "A":
                set_child_a_count_ref[0] = set_count
            else:
                set_child_b_count_ref[0] = set_count

            return ui.text(f"{name}: {count}")

        @ui.component
        def parent_component():
            parent_render_count[0] += 1
            return ui.flex(
                ui.heading("Parent"),
                child_with_state("A"),
                child_with_state("B"),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # First render
        result = renderer.render(parent_component())
        self.assertEqual(parent_render_count[0], 1)
        self.assertEqual(child_a_render_count[0], 1)
        self.assertEqual(child_b_render_count[0], 1)

        # First click on Child A - should trigger re-render
        set_child_a_count_ref[0](1)
        result = renderer.render(parent_component())
        self.assertEqual(parent_render_count[0], 1)  # Parent did NOT re-render
        self.assertEqual(child_a_render_count[0], 2)  # Child A DID re-render
        self.assertEqual(child_b_render_count[0], 1)  # Child B did NOT re-render

        # Second click on Child A - should ALSO trigger re-render
        set_child_a_count_ref[0](2)
        result = renderer.render(parent_component())
        self.assertEqual(parent_render_count[0], 1)  # Parent did NOT re-render
        self.assertEqual(child_a_render_count[0], 3)  # Child A DID re-render again
        self.assertEqual(child_b_render_count[0], 1)  # Child B did NOT re-render

        # Third click on Child A - should ALSO trigger re-render
        set_child_a_count_ref[0](3)
        result = renderer.render(parent_component())
        self.assertEqual(parent_render_count[0], 1)  # Parent did NOT re-render
        self.assertEqual(child_a_render_count[0], 4)  # Child A DID re-render again
        self.assertEqual(child_b_render_count[0], 1)  # Child B did NOT re-render

        # Now click on Child B - should trigger re-render of Child B
        set_child_b_count_ref[0](1)
        result = renderer.render(parent_component())
        self.assertEqual(parent_render_count[0], 1)  # Parent did NOT re-render
        self.assertEqual(child_a_render_count[0], 4)  # Child A did NOT re-render
        self.assertEqual(child_b_render_count[0], 2)  # Child B DID re-render

    def test_simple_multiple_state_updates(self):
        """Simplified test for multiple state updates on a single dirty component."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        render_count = [0]
        set_count_ref = [None]

        @ui.component
        def counter():
            render_count[0] += 1
            count, set_count = ui.use_state(0)
            set_count_ref[0] = set_count
            return ui.text(f"Count: {count}")

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # First render
        result = renderer.render(counter())
        self.assertEqual(render_count[0], 1)

        # First state update
        set_count_ref[0](1)
        # Check that context is marked dirty
        self.assertTrue(
            rc._is_dirty, "Context should be dirty after first state update"
        )
        result = renderer.render(counter())
        self.assertEqual(render_count[0], 2)
        self.assertFalse(rc._is_dirty, "Context should be clean after render")

        # Second state update
        set_count_ref[0](2)
        # Check that context is marked dirty again
        self.assertTrue(
            rc._is_dirty, "Context should be dirty after second state update"
        )
        result = renderer.render(counter())
        self.assertEqual(render_count[0], 3)
