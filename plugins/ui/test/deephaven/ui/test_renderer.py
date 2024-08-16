from __future__ import annotations
from unittest.mock import Mock
from typing import Any, Callable, cast, List, Union
from .BaseTest import BaseTestCase


class RendererTestCase(BaseTestCase):
    def test_render_children(self):
        from deephaven.ui.renderer.Renderer import Renderer
        from deephaven.ui.renderer.RenderedNode import RenderedNode
        from deephaven.ui._internal.RenderContext import RenderContext
        from deephaven import ui

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
            side_effect=lambda x: x()
        )
        on_queue: Callable[[Callable[[], None]], None] = Mock(side_effect=lambda x: x())

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

        # Only the counter with deps effect and no deps effects should have been called
        self.assertEqual(
            called_funcs,
            [
                "counter_no_deps_cleanup",
                "counter_with_deps_cleanup",
                "counter_no_deps_effect",
                "counter_with_deps_effect",
                "parent_no_deps_cleanup",
                "parent_no_deps_effect",
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
