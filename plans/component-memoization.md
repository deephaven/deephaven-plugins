# Component Memoization Plan: Props-Based Re-render Skip

## Overview

This plan describes implementing props-based memoization for `deephaven.ui` components, allowing child components to skip re-rendering when their props haven't changed — even when their parent re-renders. This is similar to React's `React.memo()` functionality.

**Current behavior:** When a parent component re-renders, all children re-render (unless they have dirty descendant optimization, which only helps when state changes are deep in the tree, not when the parent itself re-renders).

**Proposed behavior:** Memoized components compare their props; if unchanged, they return cached output and skip re-rendering.

---

## Option A: Separate `@ui.memo` Decorator

### API Design

```python
@ui.memo
@ui.component
def my_component(value: int, label: str):
    """This component will skip re-rendering if value and label are unchanged."""
    return ui.text(f"{label}: {value}")
```

The `@ui.memo` decorator wraps a component (created by `@ui.component`) to add props comparison.

### Implementation

#### A1. Create `memo.py`

```python
# plugins/ui/src/deephaven/ui/components/memo.py

from __future__ import annotations
import functools
from typing import Any, Callable, Optional
from ..elements import MemoizedFunctionElement, FunctionElement


def memo(
    component_or_compare: Callable[..., Any]
    | Callable[[dict, dict], bool]
    | None = None,
    *,
    compare: Callable[[dict, dict], bool] | None = None,
):
    """
    Memoize a component to skip re-rendering when props are unchanged.

    Can be used in several ways:

    1. Basic usage (shallow comparison):
       @ui.memo
       @ui.component
       def my_component(value):
           return ui.text(str(value))

    2. With custom comparison function:
       @ui.memo(compare=lambda prev, next: prev["value"] == next["value"])
       @ui.component
       def my_component(value, on_click):
           return ui.button(str(value), on_press=on_click)

    Args:
        component_or_compare: Either the component function (when used without parentheses),
                              or a comparison function (deprecated usage).
        compare: Custom comparison function that receives (prev_props, next_props)
                 and returns True if they are equal (should skip re-render).
                 If None, uses shallow equality comparison.

    Returns:
        A memoized component that skips re-rendering when props are unchanged.
    """

    def create_memo_wrapper(component: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(component)
        def memo_wrapper(*args: Any, key: str | None = None, **kwargs: Any):
            # Get the FunctionElement from the component
            element = component(*args, key=key, **kwargs)

            if not isinstance(element, FunctionElement):
                raise TypeError(
                    f"@ui.memo can only be used with @ui.component decorated functions. "
                    f"Got {type(element).__name__} instead."
                )

            # Wrap in MemoizedFunctionElement which tracks props for comparison
            return MemoizedFunctionElement(
                element,
                props={"args": args, "kwargs": kwargs},
                compare=compare,
            )

        return memo_wrapper

    # Handle both @ui.memo and @ui.memo() and @ui.memo(compare=...)
    if component_or_compare is None:
        # Called as @ui.memo() or @ui.memo(compare=...)
        return create_memo_wrapper
    elif callable(component_or_compare) and compare is None:
        # Check if it looks like a comparison function (takes 2 args) or component
        import inspect

        sig = inspect.signature(component_or_compare)
        params = list(sig.parameters.values())

        # Heuristic: comparison functions have exactly 2 positional params
        if len(params) == 2 and all(
            p.default == inspect.Parameter.empty for p in params
        ):
            # Ambiguous - could be compare function or 2-arg component
            # Assume it's used as @ui.memo (without parens) wrapping a component
            pass

        # Called as @ui.memo (without parentheses)
        return create_memo_wrapper(component_or_compare)
    else:
        raise TypeError("Invalid usage of @ui.memo")
```

#### A2. Create `MemoizedFunctionElement`

```python
# Add to plugins/ui/src/deephaven/ui/elements/MemoizedFunctionElement.py

from __future__ import annotations
from typing import Any, Callable, Optional
from .FunctionElement import FunctionElement
from .Element import PropsType
from .._internal import RenderContext


def _shallow_equal(prev: dict, next: dict) -> bool:
    """Check if two prop dictionaries are shallowly equal."""
    if prev.keys() != next.keys():
        return False
    for key in prev:
        if prev[key] is not next[key]:
            return False
    return True


class MemoizedFunctionElement(FunctionElement):
    """
    A FunctionElement wrapper that memoizes based on props comparison.

    When rendered, compares current props with previously-cached props.
    If props are equal (via shallow comparison or custom compare function),
    returns cached output without re-executing the render function.
    """

    def __init__(
        self,
        wrapped_element: FunctionElement,
        props: dict[str, Any],
        compare: Callable[[dict, dict], bool] | None = None,
    ):
        """
        Create a memoized function element.

        Args:
            wrapped_element: The FunctionElement to wrap.
            props: The props passed to this component (args + kwargs).
            compare: Custom comparison function, or None for shallow equality.
        """
        super().__init__(
            wrapped_element.name,
            wrapped_element._render,
            key=wrapped_element.key,
        )
        self._props_for_memo = props
        self._compare = compare or _shallow_equal

    @property
    def props_for_memo(self) -> dict[str, Any]:
        """The props to use for memoization comparison."""
        return self._props_for_memo

    @property
    def compare_fn(self) -> Callable[[dict, dict], bool]:
        """The comparison function for props."""
        return self._compare
```

#### A3. Modify Renderer to check memoized props

Update `_render_element` in `Renderer.py`:

```python
def _render_element(element: Element, context: RenderContext) -> RenderedNode:
    """Render an Element, potentially reusing cached output for clean components."""
    logger.debug("Rendering element %s in context %s", element.name, context)

    is_function_element = isinstance(element, FunctionElement)
    is_memoized = isinstance(element, MemoizedFunctionElement)

    # Check if we can skip rendering this component
    if is_function_element and context._cached_rendered_node is not None:
        # Memoized component: check props comparison
        if is_memoized and context._cached_props_for_memo is not None:
            if element.compare_fn(
                context._cached_props_for_memo, element.props_for_memo
            ):
                # Props are equal - skip re-render entirely
                logger.debug(
                    "Skipping memoized render for %s - props unchanged", element.name
                )
                return context._cached_rendered_node

        # Existing dirty-tracking optimization
        if not context._is_dirty:
            if not context._has_dirty_descendant:
                logger.debug("Skipping render for %s - using cached node", element.name)
                return context._cached_rendered_node
            else:
                logger.debug("Re-rendering children only for %s", element.name)
                return _render_children_only(context)

    # Full re-render needed
    # ... existing code ...

    # After render, cache memoization props if applicable
    if is_memoized:
        context._cached_props_for_memo = element.props_for_memo
```

### Examples

```python
import deephaven.ui as ui

# Example 1: Basic memoization
@ui.memo
@ui.component
def expensive_chart(data: list[float], title: str):
    """Only re-renders when data or title change."""
    # Expensive computation here
    return ui.view(ui.heading(title), ui.text(f"Sum: {sum(data)}"))


# Example 2: Memoize with custom comparison (ignore callback props)
@ui.memo(compare=lambda prev, next: prev["kwargs"]["value"] == next["kwargs"]["value"])
@ui.component
def counter_display(value: int, on_increment):
    """Re-renders only when value changes, ignores callback changes."""
    return ui.flex(
        ui.text(f"Count: {value}"), ui.button("Increment", on_press=on_increment)
    )


# Example 3: Parent that causes child re-renders
@ui.component
def parent():
    count, set_count = ui.use_state(0)
    items, set_items = ui.use_state(["a", "b", "c"])

    # Without @ui.memo, expensive_chart would re-render when count changes
    # With @ui.memo, it only re-renders when items change
    return ui.flex(
        ui.button(f"Count: {count}", on_press=lambda _: set_count(count + 1)),
        expensive_chart(items, "My Chart"),
    )
```

---

## Option B: Parameter on `@ui.component`

### API Design

```python
@ui.component(memo=True)
def my_component(value: int, label: str):
    """This component will skip re-rendering if value and label are unchanged."""
    return ui.text(f"{label}: {value}")


# Or with custom comparison function:
@ui.component(memo=lambda prev, next: prev["value"] == next["value"])
def my_component(value: int, on_click):
    return ui.button(str(value), on_press=on_click)
```

The `memo` parameter accepts:

- `True`: Enable memoization with shallow equality comparison (default behavior)
- A callable `(prev_props, next_props) -> bool`: Custom comparison function that returns `True` if props are equal (should skip re-render)

### Implementation

#### B1. Modify `make_component.py`

```python
# plugins/ui/src/deephaven/ui/components/make_component.py

from __future__ import annotations
import functools
import logging
from typing import Any, Callable, Optional, Union, overload
from .._internal import get_component_qualname
from ..elements import FunctionElement, MemoizedFunctionElement

logger = logging.getLogger(__name__)


def _shallow_equal(prev: dict, next: dict) -> bool:
    """Check if two prop dictionaries are shallowly equal."""
    if prev.keys() != next.keys():
        return False
    for key in prev:
        if prev[key] is not next[key]:
            return False
    return True


# Type alias for comparison functions
CompareFunction = Callable[[dict, dict], bool]


@overload
def make_component(func: Callable[..., Any]) -> Callable[..., FunctionElement]:
    """Basic usage without parentheses."""
    ...


@overload
def make_component(
    func: None = None,
    *,
    memo: Union[bool, CompareFunction] = False,
) -> Callable[[Callable[..., Any]], Callable[..., FunctionElement]]:
    """Usage with parameters."""
    ...


def make_component(
    func: Callable[..., Any] | None = None,
    *,
    memo: bool | CompareFunction = False,
):
    """
    Create a FunctionalElement from the passed in function.

    Args:
        func: The function to create a FunctionalElement from.
              Runs when the component is being rendered.
        memo: Enable memoization to skip re-rendering when props are unchanged.
              - False (default): No memoization, component always re-renders with parent.
              - True: Enable memoization with shallow equality comparison.
              - Callable: Custom comparison function (prev_props, next_props) -> bool
                          that returns True if props are equal (should skip re-render).
    """
    # Determine if memoization is enabled and what comparison function to use
    if memo is False:
        enable_memo = False
        compare_fn = None
    elif memo is True:
        enable_memo = True
        compare_fn = _shallow_equal
    elif callable(memo):
        enable_memo = True
        compare_fn = memo
    else:
        raise TypeError(
            f"memo must be True, False, or a callable, got {type(memo).__name__}"
        )

    def decorator(fn: Callable[..., Any]) -> Callable[..., FunctionElement]:
        @functools.wraps(fn)
        def make_component_node(*args: Any, key: str | None = None, **kwargs: Any):
            component_type = get_component_qualname(fn)

            if enable_memo:
                element = FunctionElement(
                    component_type, lambda: fn(*args, **kwargs), key=key
                )
                return MemoizedFunctionElement(
                    element,
                    props={"args": args, "kwargs": kwargs},
                    compare=compare_fn,
                )
            else:
                return FunctionElement(
                    component_type, lambda: fn(*args, **kwargs), key=key
                )

        return make_component_node

    if func is not None:
        # Called without parentheses: @ui.component
        return decorator(func)
    else:
        # Called with parentheses: @ui.component() or @ui.component(memo=True)
        return decorator
```

### Examples

```python
import deephaven.ui as ui

# Example 1: Basic memoized component (shallow comparison)
@ui.component(memo=True)
def expensive_chart(data: list[float], title: str):
    """Only re-renders when data or title change."""
    return ui.view(ui.heading(title), ui.text(f"Sum: {sum(data)}"))


# Example 2: Memoized component with custom comparison function
@ui.component(
    memo=lambda prev, next: prev["kwargs"]["value"] == next["kwargs"]["value"]
)
def counter_display(value: int, on_increment):
    """Re-renders only when value changes, ignores callback changes."""
    return ui.flex(
        ui.text(f"Count: {value}"), ui.button("Increment", on_press=on_increment)
    )


# Example 3: Mixed usage - non-memoized parent with memoized child
@ui.component
def parent():
    count, set_count = ui.use_state(0)
    items, set_items = ui.use_state(["a", "b", "c"])

    return ui.flex(
        ui.button(f"Count: {count}", on_press=lambda _: set_count(count + 1)),
        expensive_chart(items, "My Chart"),  # Won't re-render when count changes
    )


# Example 4: Using ui.use_callback for stable callback references
@ui.component
def parent_with_callbacks():
    count, set_count = ui.use_state(0)

    # Stable callback reference
    handle_increment = ui.use_callback(lambda _: set_count(count + 1), [count])

    return ui.flex(
        ui.text(f"Parent count: {count}"),
        counter_display(value=count, on_increment=handle_increment),
    )
```

---

## Comparison of Options

| Aspect                      | Option A: `@ui.memo`                           | Option B: `memo=` param                   |
| --------------------------- | ---------------------------------------------- | ----------------------------------------- |
| **Similarity to React**     | Very similar (`React.memo()`)                  | Similar naming, integrated into decorator |
| **Explicitness**            | Clear separation of concerns                   | Single decorator, less visual clutter     |
| **Discoverability**         | Users familiar with React will look for `memo` | `memo` param is intuitive                 |
| **Flexibility**             | Can wrap third-party components                | Only works at definition time             |
| **Code Readability**        | Two decorators can be verbose                  | Single decorator is cleaner               |
| **Backwards Compatibility** | Fully compatible (new API)                     | Fully compatible (optional parameter)     |
| **Custom Comparison**       | `@ui.memo(compare=...)`                        | `@ui.component(memo=compare_fn)`          |
| **Decorator Order**         | Must be `@ui.memo` then `@ui.component`        | N/A                                       |

### Pros & Cons

#### Option A: `@ui.memo`

**Pros:**

- ✅ Familiar to React developers
- ✅ Can potentially wrap existing components (third-party or legacy)
- ✅ Clear semantic: "this component is memoized"
- ✅ Separation of concerns: component definition vs optimization

**Cons:**

- ❌ Two decorators required (more verbose)
- ❌ Easy to get decorator order wrong (`@ui.component` then `@ui.memo` won't work)
- ❌ Slightly more complex implementation (need to wrap FunctionElement)

#### Option B: `memo=` Parameter

**Pros:**

- ✅ Single decorator, cleaner syntax
- ✅ Impossible to get wrong (no decorator ordering)
- ✅ Uses same `memo` terminology as React, making intent clear
- ✅ All component config in one place
- ✅ Single param for both enabling and custom comparison (`memo=True` or `memo=fn`)

**Cons:**

- ❌ Cannot memoize third-party components
- ❌ Slightly less explicit than a separate decorator

---

## Recommendation

**Implement both options**, with Option B (`memo=`) as the primary API and Option A (`@ui.memo`) for advanced use cases.

### Rationale:

1. **Option B is simpler for common cases**: Most users just want to optimize their own components. A single decorator with `memo=True` is cleaner and less error-prone.

2. **Option A enables advanced patterns**: Being able to wrap existing components is valuable for:

   - Optimizing third-party components
   - Applying memoization conditionally
   - Migrating codebases incrementally

3. **Both share implementation**: The `MemoizedFunctionElement` and comparison logic are shared, so supporting both is low additional cost.

### Suggested Default:

For `@ui.component(memo=True)`, use **shallow equality comparison** by default. This matches React's `React.memo()` behavior and works well when:

- Props are primitives (int, str, float, bool)
- Props are the same object references (e.g., from `use_state`, `use_memo`)

For callbacks, recommend using `ui.use_callback()` (if not already available, implement it) to create stable references.

---

## Implementation Plan

### Phase 1: Core Infrastructure

| Task                                            | File                                  | Effort |
| ----------------------------------------------- | ------------------------------------- | ------ |
| Create `MemoizedFunctionElement` class          | `elements/MemoizedFunctionElement.py` | Low    |
| Add `_cached_props_for_memo` to `RenderContext` | `_internal/RenderContext.py`          | Low    |
| Update `_render_element` for memoization check  | `renderer/Renderer.py`                | Medium |
| Implement `_shallow_equal` utility              | `_internal/utils.py`                  | Low    |

### Phase 2: Option B - `memo` Parameter

| Task                                      | File                           | Effort |
| ----------------------------------------- | ------------------------------ | ------ |
| Update `make_component` with `memo` param | `components/make_component.py` | Medium |
| Update type hints and docstrings          | `components/make_component.py` | Low    |
| Export from `__init__.py`                 | `components/__init__.py`       | Low    |

### Phase 3: Option A - `@ui.memo` Decorator

| Task                                        | File                     | Effort |
| ------------------------------------------- | ------------------------ | ------ |
| Create `memo.py` with decorator             | `components/memo.py`     | Medium |
| Export `memo` from `components/__init__.py` | `components/__init__.py` | Low    |

### Phase 4: Testing

| Task                                               | Effort |
| -------------------------------------------------- | ------ |
| Unit tests for `_shallow_equal`                    | Low    |
| Unit tests for memoization skipping re-render      | Medium |
| Unit tests for custom comparison function          | Medium |
| Unit tests showing props change triggers re-render | Medium |
| Integration tests with nested memoized components  | Medium |
| Tests for decorator order error handling           | Low    |

### Phase 5: Performance Benchmarks

| Task                                          | Effort |
| --------------------------------------------- | ------ |
| Benchmark: large list with memoized items     | Medium |
| Benchmark: deep tree with memoized branches   | Medium |
| Compare memoized vs non-memoized render times | Low    |

---

## Unit Tests

### Test File: `test_memoization.py`

```python
from __future__ import annotations
from unittest.mock import Mock
from typing import Any, Callable, List
from deephaven.ui.renderer.Renderer import Renderer
from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from deephaven import ui
from .BaseTest import BaseTestCase

run_on_change: OnChangeCallable = lambda x: x()


class MemoizationTestCase(BaseTestCase):
    """Tests for component memoization (props-based re-render skip)."""

    def test_memo_skips_rerender_with_same_props(self):
        """Test that @ui.memo skips re-render when props are unchanged."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        parent_render_count = [0]
        child_render_count = [0]

        @ui.memo
        @ui.component
        def memoized_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            parent_render_count[0] += 1
            parent_state, set_parent_state = ui.use_state(0)
            # Pass same value to child regardless of parent state
            return ui.flex(
                ui.button(
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
        # Find the button and click it
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        # Re-render
        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 2)  # Parent re-rendered
        self.assertEqual(child_render_count[0], 1)  # Child SKIPPED (memoized)

    def test_memo_rerenders_when_props_change(self):
        """Test that @ui.memo re-renders when props change."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]
        set_value_ref = [None]

        @ui.memo
        @ui.component
        def memoized_child(value: int):
            child_render_count[0] += 1
            return ui.text(f"Value: {value}")

        @ui.component
        def parent():
            value, set_value = ui.use_state(0)
            set_value_ref[0] = set_value
            return memoized_child(value=value)

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Change the prop value
        set_value_ref[0](1)
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 2)  # Child re-rendered (props changed)

    def test_memo_param_skips_rerender(self):
        """Test that @ui.component(memo=True) skips re-render when props are unchanged."""
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
            return ui.flex(
                ui.button(
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

        # Trigger parent re-render
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        # Re-render
        result = renderer.render(parent())
        self.assertEqual(parent_render_count[0], 2)  # Parent re-rendered
        self.assertEqual(child_render_count[0], 1)  # Child SKIPPED (memoized)

    def test_memo_param_with_custom_compare(self):
        """Test that @ui.component(memo=compare_fn) uses custom comparison."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]
        set_callback_ref = [None]

        # Custom compare that only checks 'value', ignores 'on_click'
        def compare_only_value(prev, next):
            return prev["kwargs"]["value"] == next["kwargs"]["value"]

        @ui.component(memo=compare_only_value)
        def child_with_callback(value: int, on_click):
            child_render_count[0] += 1
            return ui.button(str(value), on_press=on_click)

        @ui.component
        def parent():
            count, set_count = ui.use_state(0)
            set_callback_ref[0] = set_count
            # Create new callback on each render (normally would cause re-render)
            callback = lambda _: set_count(count + 1)
            return child_with_callback(value=42, on_click=callback)

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render (creates new callback)
        set_callback_ref[0](1)
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)  # Child SKIPPED (value unchanged)

    def test_memo_with_custom_compare(self):
        """Test that custom compare function controls memoization."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]
        set_callback_ref = [None]

        # Custom compare that only checks 'value', ignores 'on_click'
        def compare_only_value(prev, next):
            return prev["kwargs"]["value"] == next["kwargs"]["value"]

        @ui.memo(compare=compare_only_value)
        @ui.component
        def child_with_callback(value: int, on_click):
            child_render_count[0] += 1
            return ui.button(str(value), on_press=on_click)

        @ui.component
        def parent():
            count, set_count = ui.use_state(0)
            set_callback_ref[0] = set_count
            # Create new callback on each render (normally would cause re-render)
            callback = lambda _: set_count(count + 1)
            return child_with_callback(value=42, on_click=callback)

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)

        # Trigger parent re-render (creates new callback)
        set_callback_ref[0](1)
        renderer.render(parent())
        self.assertEqual(child_render_count[0], 1)  # Child SKIPPED (value unchanged)

        # Now actually change value via parent mechanism
        # This would require changing the prop value, which we're not doing here
        # So child should remain at render count 1

    def test_memo_with_object_props(self):
        """Test memoization behavior with object props (reference equality)."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.memo
        @ui.component
        def child_with_list(items: list):
            child_render_count[0] += 1
            return ui.text(str(len(items)))

        # Same list object each time
        shared_list = [1, 2, 3]

        @ui.component
        def parent_with_shared_list():
            state, set_state = ui.use_state(0)
            return ui.flex(
                ui.button(str(state), on_press=lambda _: set_state(state + 1)),
                child_with_list(items=shared_list),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent_with_shared_list())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        renderer.render(parent_with_shared_list())
        self.assertEqual(child_render_count[0], 1)  # SKIPPED (same list reference)

    def test_memo_with_new_object_props(self):
        """Test that memoization re-renders with new object references."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        child_render_count = [0]

        @ui.memo
        @ui.component
        def child_with_list(items: list):
            child_render_count[0] += 1
            return ui.text(str(len(items)))

        @ui.component
        def parent_with_new_list():
            state, set_state = ui.use_state(0)
            # Creates new list object each render
            items = [1, 2, 3]
            return ui.flex(
                ui.button(str(state), on_press=lambda _: set_state(state + 1)),
                child_with_list(items=items),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        result = renderer.render(parent_with_new_list())
        self.assertEqual(child_render_count[0], 1)

        # Trigger re-render
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        renderer.render(parent_with_new_list())
        self.assertEqual(child_render_count[0], 2)  # Re-rendered (new list reference)

    def test_memo_integration_with_dirty_tracking(self):
        """Test that memoization works correctly with existing dirty tracking."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        grandparent_count = [0]
        parent_count = [0]
        child_count = [0]
        set_child_state_ref = [None]

        @ui.memo
        @ui.component
        def memoized_parent(value: int):
            parent_count[0] += 1
            child_state, set_child_state = ui.use_state("initial")
            set_child_state_ref[0] = set_child_state
            return ui.text(f"{value}: {child_state}")

        @ui.component
        def grandparent():
            grandparent_count[0] += 1
            gp_state, set_gp_state = ui.use_state(0)
            return ui.flex(
                ui.button(str(gp_state), on_press=lambda _: set_gp_state(gp_state + 1)),
                memoized_parent(value=42),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        result = renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 1)
        self.assertEqual(parent_count[0], 1)

        # Change state within memoized component (dirty tracking should work)
        set_child_state_ref[0]("updated")
        renderer.render(grandparent())
        self.assertEqual(
            grandparent_count[0], 1
        )  # Grandparent clean (has dirty descendant)
        self.assertEqual(parent_count[0], 2)  # Parent re-rendered (own state dirty)

        # Now trigger grandparent re-render with same props to memoized_parent
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        result = renderer.render(grandparent())
        self.assertEqual(grandparent_count[0], 2)  # Grandparent re-rendered
        self.assertEqual(parent_count[0], 2)  # Parent SKIPPED (props unchanged)

    def _find_node(self, root, name):
        """Helper to find a node by name in the rendered tree."""
        from deephaven.ui.renderer.RenderedNode import RenderedNode

        if root.name == name:
            return root
        children = root.props.get("children", []) if root.props else []
        if not isinstance(children, list):
            children = [children]
        for child in children:
            if isinstance(child, RenderedNode):
                try:
                    return self._find_node(child, name)
                except ValueError:
                    pass
        raise ValueError(f"Could not find node with name {name}")


class ShallowEqualTestCase(BaseTestCase):
    """Tests for shallow equality comparison function."""

    def test_equal_primitives(self):
        from deephaven.ui._internal.utils import shallow_equal

        self.assertTrue(
            shallow_equal(
                {"a": 1, "b": "hello", "c": True}, {"a": 1, "b": "hello", "c": True}
            )
        )

    def test_different_primitives(self):
        from deephaven.ui._internal.utils import shallow_equal

        self.assertFalse(shallow_equal({"a": 1}, {"a": 2}))

    def test_same_object_reference(self):
        from deephaven.ui._internal.utils import shallow_equal

        obj = [1, 2, 3]
        self.assertTrue(shallow_equal({"items": obj}, {"items": obj}))

    def test_different_object_reference(self):
        from deephaven.ui._internal.utils import shallow_equal

        self.assertFalse(
            shallow_equal(
                {"items": [1, 2, 3]},
                {"items": [1, 2, 3]},  # Same content, different object
            )
        )

    def test_different_keys(self):
        from deephaven.ui._internal.utils import shallow_equal

        self.assertFalse(shallow_equal({"a": 1}, {"a": 1, "b": 2}))

    def test_none_values(self):
        from deephaven.ui._internal.utils import shallow_equal

        self.assertTrue(shallow_equal({"a": None}, {"a": None}))
        self.assertFalse(shallow_equal({"a": None}, {"a": 0}))
```

---

## Performance Benchmarks

### Test File: `test_memoization_benchmarks.py`

```python
from __future__ import annotations
import time
from unittest.mock import Mock
from deephaven.ui.renderer.Renderer import Renderer
from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from deephaven import ui
from .BaseTest import BaseTestCase

run_on_change: OnChangeCallable = lambda x: x()


class MemoizationBenchmarkTestCase(BaseTestCase):
    """Performance benchmarks for component memoization."""

    def test_benchmark_large_list_without_memo(self):
        """Benchmark: re-rendering a large list of non-memoized components."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        render_counts = {}

        @ui.component
        def list_item(item_id: int):
            render_counts[item_id] = render_counts.get(item_id, 0) + 1
            return ui.text(f"Item {item_id}")

        @ui.component
        def list_container():
            state, set_state = ui.use_state(0)
            items = list(range(100))  # 100 items
            return ui.flex(
                ui.button(str(state), on_press=lambda _: set_state(state + 1)),
                *[list_item(i, key=str(i)) for i in items],
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        start = time.perf_counter()
        result = renderer.render(list_container())
        initial_time = time.perf_counter() - start

        # Verify all rendered
        total_renders = sum(render_counts.values())
        self.assertEqual(total_renders, 100)
        render_counts.clear()

        # Trigger re-render
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        start = time.perf_counter()
        renderer.render(list_container())
        rerender_time = time.perf_counter() - start

        # All items re-render (no memoization)
        total_rerenders = sum(render_counts.values())
        self.assertEqual(total_rerenders, 100)

        print(
            f"\n[No Memo] Initial: {initial_time*1000:.2f}ms, Re-render: {rerender_time*1000:.2f}ms"
        )
        print(f"[No Memo] Items re-rendered: {total_rerenders}/100")

    def test_benchmark_large_list_with_memo(self):
        """Benchmark: re-rendering a large list of memoized components."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        render_counts = {}

        @ui.memo
        @ui.component
        def memoized_list_item(item_id: int):
            render_counts[item_id] = render_counts.get(item_id, 0) + 1
            return ui.text(f"Item {item_id}")

        @ui.component
        def list_container():
            state, set_state = ui.use_state(0)
            items = list(range(100))  # 100 items
            return ui.flex(
                ui.button(str(state), on_press=lambda _: set_state(state + 1)),
                *[memoized_list_item(i, key=str(i)) for i in items],
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        start = time.perf_counter()
        result = renderer.render(list_container())
        initial_time = time.perf_counter() - start

        # Verify all rendered
        total_renders = sum(render_counts.values())
        self.assertEqual(total_renders, 100)
        render_counts.clear()

        # Trigger re-render
        button = self._find_node(result, "deephaven.ui.components.Button")
        button.props["onPress"](None)

        start = time.perf_counter()
        renderer.render(list_container())
        rerender_time = time.perf_counter() - start

        # NO items should re-render (memoized, props unchanged)
        total_rerenders = sum(render_counts.values())
        self.assertEqual(total_rerenders, 0)

        print(
            f"\n[With Memo] Initial: {initial_time*1000:.2f}ms, Re-render: {rerender_time*1000:.2f}ms"
        )
        print(f"[With Memo] Items re-rendered: {total_rerenders}/100")

    def test_benchmark_deep_tree_memo(self):
        """Benchmark: memoized components in deep tree with sibling state changes."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        expensive_render_count = [0]
        set_sibling_state_ref = [None]

        @ui.memo
        @ui.component
        def expensive_component(data: list):
            expensive_render_count[0] += 1
            # Simulate expensive computation
            total = sum(data)
            return ui.text(f"Total: {total}")

        @ui.component
        def sibling_with_state():
            state, set_state = ui.use_state(0)
            set_sibling_state_ref[0] = set_state
            return ui.text(f"Sibling: {state}")

        @ui.component
        def parent():
            # Shared data that doesn't change
            shared_data = ui.use_memo(lambda: list(range(1000)), [])
            return ui.flex(
                sibling_with_state(),
                expensive_component(data=shared_data),
            )

        rc = RenderContext(on_change, on_queue)
        renderer = Renderer(rc)

        # Initial render
        renderer.render(parent())
        self.assertEqual(expensive_render_count[0], 1)

        # Change sibling state multiple times
        for i in range(10):
            set_sibling_state_ref[0](i + 1)
            renderer.render(parent())

        # Expensive component should NOT have re-rendered
        self.assertEqual(expensive_render_count[0], 1)
        print(
            f"\n[Deep Tree Memo] Expensive component renders after 10 sibling updates: {expensive_render_count[0]}"
        )

    def test_benchmark_memo_speedup_measurement(self):
        """Measure actual speedup from memoization."""
        on_change = Mock(side_effect=run_on_change)
        on_queue = Mock(side_effect=run_on_change)

        ITERATIONS = 100

        # Test without memo
        @ui.component
        def child_no_memo(value: int):
            return ui.text(f"Value: {value}")

        @ui.component
        def parent_no_memo():
            state, set_state = ui.use_state(0)
            return ui.flex(*[child_no_memo(i, key=str(i)) for i in range(50)])

        rc1 = RenderContext(on_change, on_queue)
        renderer1 = Renderer(rc1)

        # Warm up
        renderer1.render(parent_no_memo())

        start = time.perf_counter()
        for _ in range(ITERATIONS):
            renderer1.render(parent_no_memo())
        no_memo_time = time.perf_counter() - start

        # Test with memo
        @ui.memo
        @ui.component
        def child_with_memo(value: int):
            return ui.text(f"Value: {value}")

        @ui.component
        def parent_with_memo():
            state, set_state = ui.use_state(0)
            return ui.flex(*[child_with_memo(i, key=str(i)) for i in range(50)])

        rc2 = RenderContext(on_change, on_queue)
        renderer2 = Renderer(rc2)

        # Warm up
        renderer2.render(parent_with_memo())

        start = time.perf_counter()
        for _ in range(ITERATIONS):
            renderer2.render(parent_with_memo())
        memo_time = time.perf_counter() - start

        speedup = no_memo_time / memo_time if memo_time > 0 else float("inf")

        print(f"\n[Speedup Benchmark] {ITERATIONS} iterations, 50 children each")
        print(
            f"  Without memo: {no_memo_time*1000:.2f}ms total ({no_memo_time*1000/ITERATIONS:.3f}ms per render)"
        )
        print(
            f"  With memo: {memo_time*1000:.2f}ms total ({memo_time*1000/ITERATIONS:.3f}ms per render)"
        )
        print(f"  Speedup: {speedup:.1f}x faster")

        # Assert meaningful speedup (at least 2x)
        self.assertGreater(
            speedup, 2.0, "Memoization should provide at least 2x speedup"
        )

    def _find_node(self, root, name):
        """Helper to find a node by name in the rendered tree."""
        from deephaven.ui.renderer.RenderedNode import RenderedNode

        if root.name == name:
            return root
        children = root.props.get("children", []) if root.props else []
        if not isinstance(children, list):
            children = [children]
        for child in children:
            if isinstance(child, RenderedNode):
                try:
                    return self._find_node(child, name)
                except ValueError:
                    pass
        raise ValueError(f"Could not find node with name {name}")
```

---

## RenderContext Updates

Add to `RenderContext.__init__`:

```python
self._cached_props_for_memo: Optional[dict[str, Any]] = None
"""
Cached props used for memoization comparison.
Only populated for MemoizedFunctionElement components.
"""
```

---

## Edge Cases to Handle

1. **First render**: No cached props, must always render
2. **Key changes**: New key = new context = no cached props
3. **Component unmount/remount**: Cached props cleared when context is deleted
4. **Mixed memoized/non-memoized siblings**: Each maintains own state
5. **Nested memoized components**: Each level checks independently
6. **Custom compare returning wrong type**: Should raise or coerce to bool

---

## Documentation Updates Needed

1. Add `@ui.memo` to public API docs
2. Add `memo=` parameter to `@ui.component` docs
3. Add "Performance Optimization" guide explaining:
   - When to use memoization
   - How shallow comparison works
   - Best practices (stable references, `use_memo`, `use_callback`)
   - Gotchas (new objects on each render)
