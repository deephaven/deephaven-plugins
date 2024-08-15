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

        @ui.component
        def ui_counter():
            count, set_count = ui.use_state(0)

            def make_effect(effect_name: str):
                def cleanup():
                    called_funcs.append((f"counter-{effect_name}-cleanup"))

                def effect():
                    called_funcs.append((f"counter-{effect_name}-effect"))
                    return cleanup

                return effect

            ui.use_effect(make_effect("no_deps"))
            ui.use_effect(make_effect("empty_deps"), [])
            ui.use_effect(make_effect("count_deps"), [count])

            return ui.action_button(
                f"Count is {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component
        def ui_parent():
            is_shown, set_is_shown = ui.use_state(True)

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

        # Press the counter button
        count_btn.props["onPress"](None)

        print(f" called: {called_funcs}")
        print(f"xxx on_change {on_change.call_args_list}")
        print(f"xxx on_queue {on_queue.call_args_list}")

        new_result = renderer.render(ui_parent())

        # Check that the rendered tree is correct
        assert new_result.props != None
        self.assertEqual(len(new_result.props["children"]), 2)
        count_btn = find_action_button(new_result)
        assert count_btn.props != None
        self.assertEqual(count_btn.props["children"], "Count is 1")

        # Toggle the visibility of the child component
        toggle_btn = find_toggle_button(new_result)
        assert toggle_btn.props != None
        toggle_btn.props["onChange"](False)

        # Re-render
        new_result = renderer.render(ui_parent())

        # Counter button should no longer be in the tree
        self.assertRaises(ValueError, lambda: find_action_button(new_result))

        # Toggle the visibility of the child component
        toggle_btn = find_toggle_button(new_result)
        assert toggle_btn.props != None
        toggle_btn.props["onChange"](True)

        # Re-render
        new_result = renderer.render(ui_parent())

        # Counter button should be back in the tree, and back at count 0
        count_btn = find_action_button(new_result)
        assert count_btn.props != None
        self.assertEqual(count_btn.props["children"], "Count is 0")
