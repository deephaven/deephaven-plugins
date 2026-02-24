"""
Tests for component memoization (memo parameter on @ui.component).

The memo parameter on @ui.component allows components to skip re-rendering when their props haven't
changed, similar to React.memo().
"""

from __future__ import annotations
from unittest.mock import Mock
from typing import Any, Callable, List, Union
from deephaven.ui.renderer.Renderer import Renderer
from deephaven.ui.renderer.RenderedNode import RenderedNode
from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from deephaven import ui
from .BaseTest import BaseTestCase

run_on_change: OnChangeCallable = lambda x: x()


class MemoTestCase(BaseTestCase):
    """Tests for component memoization (memo parameter on @ui.component)."""

    def _find_node(self, root: RenderedNode, name: str) -> RenderedNode:
        """Helper to find a node by name in the rendered tree."""
        if root.name == name:
            return root
        children: Union[Any, List[Any]] = (
            root.props.get("children", []) if root.props is not None else []
        )
        if not isinstance(children, list):
            children = [children]
        for child in children:
            if isinstance(child, RenderedNode):
                try:
                    return self._find_node(child, name)
                except ValueError:
                    pass
        raise ValueError(f"Could not find node with name {name}")

    def _find_action_button(self, root: RenderedNode) -> RenderedNode:
        return self._find_node(root, "deephaven.ui.components.ActionButton")

    def test_memo_skips_rerender_with_same_props(self):
        """Test that memo=True skips re-render when props are unchanged."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        parent_render_count = [0]
        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            parent_render_count[0] += 1
            parent_state, set_parent_state = ui.use_state(0)
            # Pass same value to child regardless of parent state
            return ui.flex(
                ui.action_button(
                    str(parent_state),
                    on_press=lambda _: set_parent_state(parent_state + 1),
                ),
                memoized_child(value=42),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 1)
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render (change parent state)
        button = self._find_action_button(result)
        button.props["onPress"](None)

        # Re-render
        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 2)  # Parent re-rendered
        self.assertEqual(child_render_count[0], 1)  # Child SKIPPED (memoized)

    def test_memo_rerenders_when_props_change(self):
        """Test that memo=True re-renders when props change."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            value, set_value = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    f"Increment: {value}",
                    on_press=lambda _: set_value(value + 1),
                ),
                memoized_child(value=value),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Change the prop value by clicking the button
        button = self._find_action_button(result)
        button.props["onPress"](None)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 2)  # Child re-rendered (props changed)

    def test_memo_rerenders_when_own_state_changes(self):
        """Test that memo=True re-renders when the memoized component's own state changes."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child(value: int):
            child_render_count[0] += 1
            internal_state, set_internal_state = ui.use_state(0)
            return ui.action_button(
                f"Value: {value}, Internal: {internal_state}",
                on_press=lambda _: set_internal_state(internal_state + 1),
            )

        @ui.component
        def parent():
            # Always pass the same props
            return memoized_child(value=42)

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Change state within memoized component
        button = self._find_action_button(result)
        button.props["onPress"](None)

        result = renderer.render(parent())
        # Child should re-render because its own state changed (context is dirty)
        self.assertEqual(child_render_count[0], 2)

    def test_memo_rerenders_when_both_props_and_state_change(self):
        """Test that memo=True re-renders when both props and internal state change."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]
        button_ref = [None]
        parent_setter_ref = [None]

        @ui.component(memo=True)
        def memoized_child(value: int):
            child_render_count[0] += 1
            internal_state, set_internal_state = ui.use_state(0)
            btn = ui.action_button(
                f"Value: {value}, Internal: {internal_state}",
                on_press=lambda _: set_internal_state(internal_state + 1),
            )
            button_ref[0] = btn
            return btn

        @ui.component
        def parent():
            prop_value, set_prop_value = ui.use_state(0)
            parent_setter_ref[0] = set_prop_value
            return memoized_child(value=prop_value)

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Change both props (via parent) and internal state
        button = self._find_action_button(result)
        button.props["onPress"](None)  # Change internal state
        parent_setter_ref[0](1)  # Change props

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 2)  # Re-rendered due to both changes

    def test_memo_no_rerender_when_nothing_changes(self):
        """Test that memo=True doesn't re-render when nothing changes (forced parent re-render)."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        parent_render_count = [0]
        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child():
            child_render_count[0] += 1
            return ui.text("Static content")

        @ui.component
        def parent():
            parent_render_count[0] += 1
            counter, set_counter = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    f"Count: {counter}",
                    on_press=lambda _: set_counter(counter + 1),
                ),
                memoized_child(),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 1)
        self.assertEqual(child_render_count[0], 1)

        # Force several parent re-renders
        for i in range(3):
            button = self._find_action_button(result)
            button.props["onPress"](None)
            result = renderer.render(parent())

        self.assertEqual(parent_render_count[0], 4)  # Parent re-rendered 4 times total
        self.assertEqual(child_render_count[0], 1)  # Child NEVER re-rendered

    def test_memo_with_custom_compare(self):
        """Test that custom compare function controls memoization."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        # Custom compare that only checks 'value', ignores 'on_click'
        def compare_only_value(prev, next):
            return prev.get("value") == next.get("value")

        @ui.component(memo=compare_only_value)
        def child_with_callback(value: int, on_click):
            child_render_count[0] += 1
            return ui.action_button(str(value), on_press=on_click)

        @ui.component
        def parent():
            count, set_count = ui.use_state(0)
            # Create new callback on each render (normally would cause re-render)
            callback = lambda _: set_count(count + 1)
            return ui.flex(
                ui.action_button(
                    f"Parent count: {count}",
                    on_press=lambda _: set_count(count + 1),
                ),
                child_with_callback(value=42, on_click=callback),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render (creates new callback, but custom compare ignores it)
        button = self._find_action_button(result)
        button.props["onPress"](None)

        result = renderer.render(parent())
        # Child SKIPPED because custom compare only checks 'value' which is still 42
        self.assertEqual(child_render_count[0], 1)

    def test_memo_custom_compare_deep_equality(self):
        """Test custom compare with deep equality for object props."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        # Custom compare that does deep equality on lists
        def deep_equal_items(prev, next):
            prev_items = prev.get("children", [[]])[0]  # positional arg
            next_items = next.get("children", [[]])[0]
            return prev_items == next_items  # List equality compares contents

        @ui.component(memo=deep_equal_items)
        def child_with_list(items: list):
            child_render_count[0] += 1
            return ui.text(str(items))

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            # Creates new list object each render, but with same contents
            items = [1, 2, 3]
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                child_with_list(items),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render - new list object but same contents
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        # SKIPPED because custom compare does deep equality
        self.assertEqual(child_render_count[0], 1)

    def test_memo_custom_compare_always_rerender(self):
        """Test custom compare that always returns False (always re-renders)."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        # Custom compare that always returns False - props are never "equal"
        def always_different(prev, next):
            return False

        @ui.component(memo=always_different)
        def always_rerender_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                always_rerender_child(value=42),  # Same props every time
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        # Re-rendered because custom compare returns False
        self.assertEqual(child_render_count[0], 2)

    def test_memo_custom_compare_always_skip(self):
        """Test custom compare that always returns True (never re-renders)."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        # Custom compare that always returns True - props are always "equal"
        def always_equal(prev, next):
            return True

        @ui.component(memo=always_equal)
        def never_rerender_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                never_rerender_child(value=state),  # Props actually change!
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render - props change but custom compare says they're equal
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        # SKIPPED even though props changed, because custom compare returns True
        self.assertEqual(child_render_count[0], 1)

    def test_memo_custom_compare_selective_props(self):
        """Test custom compare that checks only specific props."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        # Only re-render if 'important_value' changes, ignore 'metadata' and 'callback'
        def compare_important_only(prev, next):
            return prev.get("important_value") == next.get("important_value")

        @ui.component(memo=compare_important_only)
        def selective_child(important_value: int, metadata: dict, callback):
            child_render_count[0] += 1
            return ui.action_button(f"Important: {important_value}", on_press=callback)

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            # metadata changes each render, but important_value stays the same
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                selective_child(
                    important_value=42,
                    metadata={"render_count": state},  # Changes each time
                    callback=lambda _: None,  # New function each time
                ),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger multiple re-renders - metadata and callback change, important_value doesn't
        for _ in range(3):
            button = self._find_action_button(result)
            button.props["onPress"](None)
            result = renderer.render(parent())

        # Child never re-rendered because important_value stayed at 42
        self.assertEqual(child_render_count[0], 1)

    def test_memo_custom_compare_with_threshold(self):
        """Test custom compare that only re-renders on significant changes."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]
        parent_set_value = [None]

        # Only re-render if value changes by more than 5
        def significant_change_only(prev, next):
            prev_val = prev.get("children", [[0]])[0]  # positional arg
            next_val = next.get("children", [[0]])[0]
            return abs(next_val - prev_val) <= 5

        @ui.component(memo=significant_change_only)
        def threshold_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            value, set_value = ui.use_state(0)
            parent_set_value[0] = set_value
            return ui.flex(
                threshold_child(value),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Small change (within threshold) - should skip
        parent_set_value[0](3)
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Another small change - should skip
        parent_set_value[0](5)
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Big change (exceeds threshold) - should re-render
        parent_set_value[0](15)
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 2)

    def test_memo_with_object_props_same_reference(self):
        """Test memoization behavior with object props (same reference)."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def child_with_list(items: list):
            child_render_count[0] += 1
            return ui.text(str(len(items)))

        # Same list object each time (defined outside component)
        shared_list = [1, 2, 3]

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                child_with_list(items=shared_list),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)  # SKIPPED (same list reference)

    def test_memo_with_object_props_new_reference(self):
        """Test that memoization re-renders with new object references."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def child_with_list(items: list):
            child_render_count[0] += 1
            return ui.text(str(len(items)))

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            # Creates new list object each render
            items = [1, 2, 3]
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                child_with_list(items=items),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        self.assertEqual(child_render_count[0], 2)  # Re-rendered (new list reference)

    def test_memo_nested_components(self):
        """Test memoization with nested components."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_count = [0]
        parent_count = [0]
        child_count = [0]

        @ui.component(memo=True)
        def memoized_child(value: int):
            child_count[0] += 1
            return ui.text(f"Child: {value}")

        @ui.component(memo=True)
        def memoized_parent(value: int):
            parent_count[0] += 1
            return ui.flex(
                ui.text(f"Parent: {value}"),
                memoized_child(value=value),
            )

        @ui.component
        def grandparent():
            grandparent_count[0] += 1
            gp_state, set_gp_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    str(gp_state), on_press=lambda _: set_gp_state(gp_state + 1)
                ),
                memoized_parent(value=42),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 1)
        self.assertEqual(parent_count[0], 1)
        self.assertEqual(child_count[0], 1)

        # Trigger grandparent re-render with same props to children
        button = self._find_action_button(result)
        button.props["onPress"](None)

        result = renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 2)  # Grandparent re-rendered
        self.assertEqual(parent_count[0], 1)  # Parent SKIPPED (props unchanged)
        self.assertEqual(child_count[0], 1)  # Child SKIPPED (parent didn't re-render)

    def test_memo_nested_with_internal_state(self):
        """Test memoization with nested components where inner has state."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_count = [0]
        parent_count = [0]
        child_state_setter = [None]

        @ui.component(memo=True)
        def memoized_parent(value: int):
            parent_count[0] += 1
            child_state, set_child_state = ui.use_state("initial")
            child_state_setter[0] = set_child_state
            return ui.text(f"{value}: {child_state}")

        @ui.component
        def grandparent():
            grandparent_count[0] += 1
            gp_state, set_gp_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    str(gp_state), on_press=lambda _: set_gp_state(gp_state + 1)
                ),
                memoized_parent(value=42),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 1)
        self.assertEqual(parent_count[0], 1)

        # Change state within memoized component (dirty tracking should work)
        child_state_setter[0]("updated")
        result = renderer.render(grandparent())
        # grandparent component function should not re-run because it's own state didn't change
        self.assertEqual(
            grandparent_count[0], 1
        )  # Grandparent re-rendered (root element)
        # parent_count should be 2 because its own context is dirty (state changed)
        self.assertEqual(parent_count[0], 2)  # Parent re-rendered (own state dirty)

        # Now trigger grandparent re-render with same props to memoized_parent
        button = self._find_action_button(result)
        button.props["onPress"](None)

        result = renderer.render(grandparent())
        self.assertEqual(
            grandparent_count[0], 2
        )  # Grandparent re-rendered (state changed)
        self.assertEqual(
            parent_count[0], 2
        )  # Parent SKIPPED (props unchanged, not dirty)

    def test_memo_with_multiple_props(self):
        """Test memoization with multiple props."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child(a: int, b: str, c: bool):
            child_render_count[0] += 1
            return ui.text(f"{a}-{b}-{c}")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                memoized_child(a=1, b="hello", c=True),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render with same props
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)  # SKIPPED (all props same)

    def test_memo_with_one_prop_changed(self):
        """Test memoization re-renders when one of multiple props changes."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child(a: int, b: str, c: bool):
            child_render_count[0] += 1
            return ui.text(f"{a}-{b}-{c}")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            # Only 'a' changes with state
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                memoized_child(a=state, b="hello", c=True),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render - prop 'a' changes
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        self.assertEqual(child_render_count[0], 2)  # Re-rendered (prop 'a' changed)

    def test_memo_with_children_prop(self):
        """Test memoization with children passed as positional args."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        wrapper_render_count = [0]

        @ui.component(memo=True)
        def memoized_wrapper(child_element):
            wrapper_render_count[0] += 1
            return ui.view(child_element)

        # Create a stable child element
        stable_child = ui.text("Static child")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                memoized_wrapper(stable_child),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(wrapper_render_count[0], 1)

        # Trigger parent re-render
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        # Should re-render because children are passed as positional args and new list is created each time
        # This is how React.memo works with children - it does a shallow compare which sees a new list of children each time
        self.assertEqual(wrapper_render_count[0], 2)

    def test_memo_with_none_props(self):
        """Test memoization handles None props correctly."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component(memo=True)
        def memoized_child(value):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                memoized_child(value=None),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render with same None prop
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)  # SKIPPED (None == None)

    def test_non_memoized_always_rerenders(self):
        """Test that non-memoized components always re-render with parent."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        parent_render_count = [0]
        child_render_count = [0]

        @ui.component
        def non_memoized_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            parent_render_count[0] += 1
            parent_state, set_parent_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    str(parent_state),
                    on_press=lambda _: set_parent_state(parent_state + 1),
                ),
                non_memoized_child(value=42),  # Same props each time
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 1)
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render
        button = self._find_action_button(result)
        button.props["onPress"](None)

        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 2)
        # Non-memoized child should re-render even with same props
        self.assertEqual(child_render_count[0], 2)

    def test_memo_component_with_parentheses_no_args(self):
        """Test that @ui.component() (with empty parens) still works without memoization."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.component()
        def non_memoized_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(str(state), on_press=lambda _: set_state(state + 1)),
                non_memoized_child(value=42),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render
        button = self._find_action_button(result)
        button.props["onPress"](None)

        renderer.render(parent())
        # Should re-render because component is not memoized
        self.assertEqual(child_render_count[0], 2)

    def test_memo_child_with_internal_state(self):
        """Test that a memoized component's child with internal state renders correctly when state changes."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        memoized_render_count = [0]
        stateful_child_render_count = [0]

        @ui.component
        def stateful_child():
            """A non-memoized child component with internal state."""
            stateful_child_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"Child count: {count}",
                on_press=lambda _: set_count(count + 1),
            )

        @ui.component(memo=True)
        def memoized_parent(prop_value: int):
            """A memoized parent that renders a stateful child."""
            memoized_render_count[0] += 1
            return ui.flex(
                ui.text(f"Prop: {prop_value}"),
                stateful_child(),
            )

        @ui.component
        def root():
            """Root component that renders the memoized parent with same props."""
            return memoized_parent(prop_value=42)

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(root())
        self.assertEqual(memoized_render_count[0], 1)
        self.assertEqual(stateful_child_render_count[0], 1)

        # Find the child's button and click it to change internal state
        button = self._find_action_button(result)
        self.assertEqual(button.props["children"], "Child count: 0")

        # Click the button to update child's internal state
        button.props["onPress"](None)

        # Re-render
        result = renderer.render(root())

        # The memoized parent should NOT re-render (props unchanged)
        # But the stateful child SHOULD re-render (its state changed)
        self.assertEqual(memoized_render_count[0], 1)  # Memoized parent skipped
        self.assertEqual(stateful_child_render_count[0], 2)  # Child re-rendered

        # Verify the child's state was actually updated in the rendered output
        button = self._find_action_button(result)
        self.assertEqual(button.props["children"], "Child count: 1")

    def _find_action_buttons(self, root: RenderedNode) -> list[RenderedNode]:
        """Helper to find all action buttons in the rendered tree."""
        buttons = []
        if root.name == "deephaven.ui.components.ActionButton":
            buttons.append(root)
        children = root.props.get("children", []) if root.props is not None else []
        if not isinstance(children, list):
            children = [children]
        for child in children:
            if isinstance(child, RenderedNode):
                buttons.extend(self._find_action_buttons(child))
        return buttons

    def test_selective_rerender_scenario1_grandparent_state_no_prop_change(self):
        """
        Scenario 1: Grandparent state changes but does NOT affect MemoizedParent's props.

        Expected:
        - Grandparent: re-renders (state changed)
        - MemoizedParent: skipped (props unchanged)
        - ChildA: skipped (parent skipped, own state unchanged)
        - UnmemoizedParent: re-renders (not memoized)
        - ChildB: re-renders (parent re-rendered)
        """
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_render_count = [0]
        memoized_parent_render_count = [0]
        unmemoized_parent_render_count = [0]
        child_a_render_count = [0]
        child_b_render_count = [0]

        @ui.component
        def child_a():
            child_a_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"ChildA: {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component
        def child_b():
            child_b_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"ChildB: {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component(memo=True)
        def memoized_parent(prop_value: int):
            memoized_parent_render_count[0] += 1
            return ui.flex(ui.text(f"MemoizedParent prop: {prop_value}"), child_a())

        @ui.component
        def unmemoized_parent(prop_value: int):
            unmemoized_parent_render_count[0] += 1
            return ui.flex(ui.text(f"UnmemoizedParent prop: {prop_value}"), child_b())

        @ui.component
        def grandparent():
            grandparent_render_count[0] += 1
            gp_state, set_gp_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    f"Grandparent: {gp_state}",
                    on_press=lambda _: set_gp_state(gp_state + 1),
                ),
                memoized_parent(prop_value=42),  # Always same prop
                unmemoized_parent(prop_value=gp_state),  # Prop changes with state
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(grandparent())
        self.assertEqual(grandparent_render_count[0], 1)
        self.assertEqual(memoized_parent_render_count[0], 1)
        self.assertEqual(unmemoized_parent_render_count[0], 1)
        self.assertEqual(child_a_render_count[0], 1)
        self.assertEqual(child_b_render_count[0], 1)

        # Find grandparent's button and click it
        buttons = self._find_action_buttons(result)
        gp_button = next(b for b in buttons if "Grandparent:" in b.props["children"])
        gp_button.props["onPress"](None)

        # Re-render
        result = renderer.render(grandparent())

        # Grandparent re-rendered (state changed)
        self.assertEqual(grandparent_render_count[0], 2)
        # MemoizedParent skipped (props unchanged: prop_value=42)
        self.assertEqual(memoized_parent_render_count[0], 1)
        # ChildA skipped (parent skipped, own state unchanged)
        self.assertEqual(child_a_render_count[0], 1)
        # UnmemoizedParent re-rendered (not memoized, parent re-rendered)
        self.assertEqual(unmemoized_parent_render_count[0], 2)
        # ChildB re-rendered (parent re-rendered)
        self.assertEqual(child_b_render_count[0], 2)

    def test_selective_rerender_scenario2_grandparent_state_with_prop_change(self):
        """
        Scenario 2: Grandparent state changes AND affects MemoizedParent's props.

        Expected:
        - Grandparent: re-renders (state changed)
        - MemoizedParent: re-renders (props changed)
        - ChildA: re-renders (parent re-rendered)
        - UnmemoizedParent: re-renders (not memoized)
        - ChildB: re-renders (parent re-rendered)
        """
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_render_count = [0]
        memoized_parent_render_count = [0]
        unmemoized_parent_render_count = [0]
        child_a_render_count = [0]
        child_b_render_count = [0]

        @ui.component
        def child_a():
            child_a_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"ChildA: {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component
        def child_b():
            child_b_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"ChildB: {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component(memo=True)
        def memoized_parent(prop_value: int):
            memoized_parent_render_count[0] += 1
            return ui.flex(ui.text(f"MemoizedParent prop: {prop_value}"), child_a())

        @ui.component
        def unmemoized_parent(prop_value: int):
            unmemoized_parent_render_count[0] += 1
            return ui.flex(ui.text(f"UnmemoizedParent prop: {prop_value}"), child_b())

        @ui.component
        def grandparent():
            grandparent_render_count[0] += 1
            gp_state, set_gp_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    f"Grandparent: {gp_state}",
                    on_press=lambda _: set_gp_state(gp_state + 1),
                ),
                memoized_parent(prop_value=gp_state),  # Prop changes with state
                unmemoized_parent(prop_value=gp_state),  # Prop changes with state
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(grandparent())
        self.assertEqual(grandparent_render_count[0], 1)
        self.assertEqual(memoized_parent_render_count[0], 1)
        self.assertEqual(unmemoized_parent_render_count[0], 1)
        self.assertEqual(child_a_render_count[0], 1)
        self.assertEqual(child_b_render_count[0], 1)

        # Find grandparent's button and click it
        buttons = self._find_action_buttons(result)
        gp_button = next(b for b in buttons if "Grandparent:" in b.props["children"])
        gp_button.props["onPress"](None)

        # Re-render
        result = renderer.render(grandparent())

        # All components should re-render
        self.assertEqual(grandparent_render_count[0], 2)
        self.assertEqual(memoized_parent_render_count[0], 2)  # Props changed
        self.assertEqual(child_a_render_count[0], 2)
        self.assertEqual(unmemoized_parent_render_count[0], 2)
        self.assertEqual(child_b_render_count[0], 2)

    def test_selective_rerender_scenario3_child_state_change_only(self):
        """
        Scenario 3: Child state changes (within memoized parent).

        Expected:
        - Grandparent: NOT re-rendered (state unchanged)
        - MemoizedParent: NOT re-rendered (props unchanged)
        - ChildA: re-renders (its own state changed)
        - UnmemoizedParent: NOT re-rendered (parent unchanged)
        - ChildB: NOT re-rendered (state unchanged)
        """
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_render_count = [0]
        memoized_parent_render_count = [0]
        unmemoized_parent_render_count = [0]
        child_a_render_count = [0]
        child_b_render_count = [0]

        @ui.component
        def child_a():
            child_a_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"ChildA: {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component
        def child_b():
            child_b_render_count[0] += 1
            count, set_count = ui.use_state(0)
            return ui.action_button(
                f"ChildB: {count}", on_press=lambda _: set_count(count + 1)
            )

        @ui.component(memo=True)
        def memoized_parent(prop_value: int):
            memoized_parent_render_count[0] += 1
            return ui.flex(ui.text(f"MemoizedParent prop: {prop_value}"), child_a())

        @ui.component
        def unmemoized_parent(prop_value: int):
            unmemoized_parent_render_count[0] += 1
            return ui.flex(ui.text(f"UnmemoizedParent prop: {prop_value}"), child_b())

        @ui.component
        def grandparent():
            grandparent_render_count[0] += 1
            gp_state, set_gp_state = ui.use_state(0)
            return ui.flex(
                ui.action_button(
                    f"Grandparent: {gp_state}",
                    on_press=lambda _: set_gp_state(gp_state + 1),
                ),
                memoized_parent(prop_value=42),  # Always same prop
                unmemoized_parent(prop_value=42),  # Always same prop
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(grandparent())
        self.assertEqual(grandparent_render_count[0], 1)
        self.assertEqual(memoized_parent_render_count[0], 1)
        self.assertEqual(unmemoized_parent_render_count[0], 1)
        self.assertEqual(child_a_render_count[0], 1)
        self.assertEqual(child_b_render_count[0], 1)

        # Find ChildA's button and click it to change its internal state
        buttons = self._find_action_buttons(result)
        child_a_button = next(b for b in buttons if "ChildA:" in b.props["children"])
        self.assertEqual(child_a_button.props["children"], "ChildA: 0")
        child_a_button.props["onPress"](None)

        # Re-render
        result = renderer.render(grandparent())

        # Grandparent should NOT re-render (state unchanged)
        self.assertEqual(grandparent_render_count[0], 1)
        # MemoizedParent should NOT re-render (props unchanged)
        self.assertEqual(memoized_parent_render_count[0], 1)
        # ChildA SHOULD re-render (its state changed)
        self.assertEqual(child_a_render_count[0], 2)
        # UnmemoizedParent should NOT re-render
        self.assertEqual(unmemoized_parent_render_count[0], 1)
        # ChildB should NOT re-render
        self.assertEqual(child_b_render_count[0], 1)

        # Verify ChildA's state was actually updated in the rendered output
        buttons = self._find_action_buttons(result)
        child_a_button = next(b for b in buttons if "ChildA:" in b.props["children"])
        self.assertEqual(child_a_button.props["children"], "ChildA: 1")


if __name__ == "__main__":
    import unittest

    unittest.main()
