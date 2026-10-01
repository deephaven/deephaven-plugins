from __future__ import annotations
import importlib
from unittest.mock import Mock, patch
from typing import Any, Callable, Dict, List, Union
from dataclasses import dataclass
from deephaven.ui import Element
from deephaven.ui.renderer.Renderer import Renderer, _render_child_item
from deephaven.ui.renderer.RenderedNode import RenderedNode
from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from deephaven import ui
from .BaseTest import BaseTestCase

# The package exports the Renderer class under the same name as its module
renderer_module = importlib.import_module("deephaven.ui.renderer.Renderer")

run_on_change: OnChangeCallable = lambda x: x()


class _TestRoot:
    """Minimal RootRenderContextProtocol implementation for tests."""

    def __init__(self, on_change_fn, on_queue_fn):
        self._on_change = on_change_fn
        self._on_queue_render_fn = on_queue_fn
        self._url: str = ""

    def on_change(self, update: Callable[[], None]) -> None:
        self._on_change(update)

    def on_queue_render(self, update: Callable[[], None]) -> None:
        self._on_queue_render_fn(update)

    def get_url(self) -> str:
        return self._url

    def set_url(self, url: str) -> None:
        self._url = url


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

        rc = RenderContext(_TestRoot(on_change, on_queue))

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

        # Only the counter effects should run - parent doesn't re-render since only counter's state changed
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
        rc = RenderContext(_TestRoot(Mock(), Mock()))

        self.assertEqual(
            _render_child_item({"key": "value"}, rc, "key", True),
            {"key": "value"},
        )

        self.assertEqual(
            _render_child_item([0, 1, 2], rc, "key", True),
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
            [MyDataclass("test", my_comp())], rc, "key", True
        )[0]

        self.assertEqual(
            nested_dataclass["a"],
            "test",
        )

        self.assertIsInstance(nested_dataclass["b"], RenderedNode)

    def test_render_child_item_not_dirty(self):
        rc = RenderContext(_TestRoot(Mock(), Mock()))

        # Prime context with an initial dirty render so fetch_only can read cache.
        _render_child_item({"key": "value"}, rc, "dict_key", True)

        # Test with is_dirty_render=False for dict
        self.assertEqual(
            _render_child_item({"key": "value"}, rc, "dict_key", False),
            {"key": "value"},
        )

        # Prime context with an initial dirty render so fetch_only can read cache.
        _render_child_item([0, 1, 2], rc, "list_key", True)

        # Test with is_dirty_render=False for list
        self.assertEqual(
            _render_child_item([0, 1, 2], rc, "list_key", False),
            [0, 1, 2],
        )

        @ui.component
        def my_comp():
            return "Hello"

        @dataclass
        class MyDataclass:
            a: str
            b: Element

        # Prime context with an initial dirty render so fetch_only can read cache.
        _render_child_item([MyDataclass("test", my_comp())], rc, "dataclass_key", True)

        nested_dataclass = _render_child_item(
            [MyDataclass("test", my_comp())], rc, "dataclass_key", False
        )[0]

        self.assertEqual(
            nested_dataclass["a"],
            "test",
        )

        self.assertIsInstance(nested_dataclass["b"], RenderedNode)

    def test_component_key(self):
        @ui.component
        def my_comp():
            return "Hello"

        rc = RenderContext(_TestRoot(Mock(), Mock()))
        keyed = _render_child_item(my_comp(key="my-key"), rc, "keyed", True)
        unkeyed = _render_child_item(my_comp(), rc, "unkeyed", True)

        self.assertEqual(keyed.props, {"children": "Hello", "__dhKey": "my-key"})
        self.assertEqual(unkeyed.props, {"children": "Hello"})


class MissingPanelKeyTestCase(BaseTestCase):
    def render_with_warning_mock(self, element: Element, times: int = 1) -> Mock:
        with patch.object(renderer_module.logger, "warning") as warning:
            renderer = Renderer(RenderContext(_TestRoot(Mock(), Mock())))
            for _ in range(times):
                renderer.render(element)
        return warning

    def test_warns_once_for_unkeyed_panels_in_a_list(self):
        @ui.component
        def my_dashboard():
            return ui.stack(ui.panel("a", title="A"), ui.panel("b", title="B"))

        warning = self.render_with_warning_mock(my_dashboard(), times=2)

        warning.assert_called_once()
        self.assertEqual(warning.call_args[0][1], "A, B")

    def test_names_only_the_unkeyed_panels(self):
        @ui.component
        def my_dashboard():
            return [ui.panel("a", title="A", key="a"), ui.panel("b", title="B")]

        warning = self.render_with_warning_mock(my_dashboard())

        warning.assert_called_once()
        self.assertEqual(warning.call_args[0][1], "B")

    def test_does_not_warn_for_keyed_panels(self):
        @ui.component
        def my_dashboard():
            return ui.stack(
                ui.panel("a", title="A", key="a"), ui.panel("b", title="B", key="b")
            )

        self.render_with_warning_mock(my_dashboard()).assert_not_called()

    def test_does_not_warn_for_panels_from_keyed_components(self):
        @ui.component
        def my_panel(title: str):
            return ui.panel(title, title=title)

        @ui.component
        def my_dashboard():
            return ui.stack(*[my_panel(title, key=title) for title in ["A", "B"]])

        self.render_with_warning_mock(my_dashboard()).assert_not_called()

    def test_warns_for_panels_from_unkeyed_components(self):
        @ui.component
        def my_panel(title: str):
            return ui.panel(title, title=title)

        @ui.component
        def my_dashboard():
            return ui.stack(*[my_panel(title) for title in ["A", "B"]])

        self.render_with_warning_mock(my_dashboard()).assert_called_once()

    def test_does_not_warn_for_a_single_panel(self):
        @ui.component
        def my_dashboard():
            return ui.row(ui.panel("a", title="A"), ui.column(ui.panel("b")))

        self.render_with_warning_mock(my_dashboard()).assert_not_called()
