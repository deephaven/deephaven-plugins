# Render Cycle Optimization Plan: Selective Re-rendering

## Implementation Status

**Completed:**
- Phase 1: Dirty tracking infrastructure (committed as b42007a6)
- Phase 2: Cache rendered output  
- Phase 3: Selective re-rendering

**Key Implementation Notes:**
- Caching optimization only applies to `FunctionElement` (components with `@ui.component`), not to `BaseElement`. This is because `BaseElement` props are determined at construction time, not by hooks/state.
- When a component is clean but has dirty descendants, we re-render children WITHOUT opening the parent's context. This preserves the parent's effects (they don't run again).
- Effects with no dependencies will NOT run every render if the component is clean - they only run when the component is dirty. This is a behavior change from before but is more efficient.

## Current Architecture Summary

**Key Components:**

- `ElementMessageStream` ([ElementMessageStream.py](../plugins/ui/src/deephaven/ui/object_types/ElementMessageStream.py)) - Orchestrates rendering and client communication
- `Renderer` ([Renderer.py](../plugins/ui/src/deephaven/ui/renderer/Renderer.py)) - Recursively renders the component tree from root to leaves
- `RenderContext` ([RenderContext.py](../plugins/ui/src/deephaven/ui/_internal/RenderContext.py)) - Maintains state for each component, with parent-child hierarchy
- `FunctionElement` ([FunctionElement.py](../plugins/ui/src/deephaven/ui/elements/FunctionElement.py)) - Wraps user component functions decorated with `@ui.component`

**Current Flow:**

1. State change via `use_state` setter → calls `context.queue_render()`
2. `queue_render()` → calls `_on_queue_render` callback (shared across all contexts)
3. `_on_queue_render` → eventually calls `ElementMessageStream._queue_render()`
4. `_queue_render()` → re-renders entire tree from root via `self._renderer.render(self._element)`

**Root Cause:** All `RenderContext` instances share the same `_on_change` and `_on_queue_render` callbacks that point to the root stream. When _any_ context's state changes, it triggers a full tree re-render.

---

## Proposed Solution: Component-Level Dirty Tracking

### Phase 1: Track Dirty State Per Context

**Goal:** Each `RenderContext` tracks whether it (or any descendant) needs re-rendering.

#### 1.1 Add dirty flags to `RenderContext`

```python
# In RenderContext.__init__
self._is_dirty: bool = False
self._has_dirty_descendant: bool = False
self._parent_context: Optional[RenderContext] = None
```

#### 1.2 Modify child context creation

```python
def get_child_context(self, key: ContextKey) -> "RenderContext":
    if key not in self._children_context:
        child_context = RenderContext(
            self._on_change,
            self._on_queue_render,
            parent=self,  # NEW: track parent
        )
        self._children_context[key] = child_context
    self._collected_contexts.append(key)
    return self._children_context[key]
```

#### 1.3 Mark dirty on state change

```python
def set_state(self, key: StateKey, value: T | UpdaterFunction[T]) -> None:
    if key not in self._state:
        raise KeyError(f"Key {key} not initialized")

    self._mark_dirty()  # NEW: mark this context as dirty

    def update_state():
        if callable(value):
            old_value = self._state[key].value
            new_value = _value_or_call(partial(value, old_value))
        else:
            new_value = _value_or_call(value)
        self._state[key] = new_value

    self._on_change(update_state)


def _mark_dirty(self) -> None:
    """Mark this context as dirty and propagate to ancestors."""
    self._is_dirty = True
    parent = self._parent_context
    while parent is not None:
        if parent._has_dirty_descendant:
            break  # Already marked, ancestors are too
        parent._has_dirty_descendant = True
        parent = parent._parent_context
```

---

### Phase 2: Cache Rendered Output

**Goal:** Store the last rendered output for each component to reuse when not dirty.

#### 2.1 Add render cache to `RenderContext`

```python
# In RenderContext
self._cached_rendered_node: Optional[RenderedNode] = None
```

The cache stores the last `RenderedNode` returned by this component. When the component (and its descendants) are clean, we can return this cached value directly without re-executing the component function.

---

### Phase 3: Modify Renderer for Selective Re-rendering

**Goal:** Skip re-rendering components that haven't changed.

#### 3.1 Update `_render_element` to check dirty state

```python
def _render_element(element: Element, context: RenderContext) -> RenderedNode:
    """Render an Element, potentially reusing cached output."""

    # Check if we can skip rendering
    if context._cached_rendered_node is not None:
        if not context._is_dirty and not context._has_dirty_descendant:
            # Component and descendants are clean, reuse cache
            return context._cached_rendered_node

        if not context._is_dirty and context._has_dirty_descendant:
            # This component is clean but has dirty descendants
            # Re-render children only, not this component's function
            return _render_children_only(context._cached_rendered_node, context)

    # Full re-render needed
    with context.open():
        props = element.render(context)
        props = _render_dict_in_open_context(props, context)

        # Clear dirty flags after successful render
        context._is_dirty = False
        context._has_dirty_descendant = False

    rendered = RenderedNode(element.name, props)
    context._cached_rendered_node = rendered
    return rendered
```

#### 3.2 Add helper for children-only re-rendering

```python
def _render_children_only(context: RenderContext) -> RenderedNode:
    """Re-render only the children of a component, reusing the parent's cached props.

    IMPORTANT: We do NOT open the parent context here. This preserves the parent's
    effects - they won't be re-run. We just iterate over cached props and render
    any child Elements (which will open their own contexts).
    """
    cached_node = context._cached_rendered_node
    cached_props = context._cached_props  # Pre-rendered props with Elements

    # Render children without opening parent context
    rendered_props = _render_props_without_opening_context(cached_props, context)

    # Clear the dirty descendant flag
    context._has_dirty_descendant = False

    rendered = RenderedNode(cached_node.name, rendered_props)
    context._cached_rendered_node = rendered
    return rendered
```

---

### Phase 4: Handle Edge Cases

#### 4.1 Dirty propagation semantics

When a component's state changes:

1. That component is marked dirty
2. When that component re-renders, **all of its children re-render** (because calling the component function creates new child Element instances)

When a component is **clean** but has a **dirty descendant**:

1. The component's function is NOT re-called (use `_render_children_only`)
2. We traverse into the cached output to find and re-render only the dirty descendants

This matches the behavior described in Phase 3 - the key insight is that `_render_children_only` traverses into cached children without re-calling the parent's function.

**Future optimization (not in this change):** Props-based memoization could skip re-rendering a child component even when its parent re-renders, if the child's props haven't changed (similar to `React.memo()`). This would require shallow comparison of props passed to child components.

#### 4.2 Key-based reconciliation

Ensure components with different keys don't reuse each other's state (already handled by `get_child_context(key)`).

#### 4.3 Effect behavior with selective re-rendering

**Important behavior change:** When a component is clean (not dirty) but has dirty descendants:
- The component's function is NOT re-called
- The component's effects do NOT run (including effects with no dependencies)
- Only the dirty descendant's effects run

This means effects with no dependencies will only run when the component itself is dirty (has a state change), not on every render cycle. This is more efficient but is a change from the original behavior.

If an effect must truly run every render, the component should ensure it has state that changes, or the effect should be moved to a child component that re-renders more frequently.

---

### Phase 5: Document Generation Optimization

#### 5.1 Granular document patches

Currently, the full document is diffed. With cached nodes, we can potentially generate more targeted patches.

The existing `generate_patch` using JSON Patch (RFC 6902) should work well since unchanged subtrees will produce identical JSON, resulting in minimal patches.

---

## Implementation Order

| Step | Task                                                         | Effort | Risk   |
| ---- | ------------------------------------------------------------ | ------ | ------ |
| 1    | Add `_is_dirty` and `_has_dirty_descendant` to RenderContext | Low    | Low    |
| 2    | Add `_parent_context` tracking                               | Low    | Low    |
| 3    | Implement `_mark_dirty()` propagation                        | Low    | Low    |
| 4    | Add `_cached_rendered_node` storage                          | Low    | Low    |
| 5    | Modify `_render_element` for conditional re-render           | Medium | Medium |
| 6    | Add `_render_children_only` helper                           | Medium | Medium |
| 7    | Update tests for new behavior                                | Medium | Low    |
| 8    | Performance benchmarking                                     | Medium | Low    |

**Future work (not in this change):**

- Props-based memoization (skip child re-render if props unchanged, like `React.memo()`)

---

## Alternative Approaches Considered

### A. Fiber-like architecture

React Fiber allows interruptible rendering and prioritization. This would be a major rewrite and is likely overkill for the Python server-side rendering model where we're not blocking a UI thread.

### B. Virtual DOM diffing at component boundaries

Only diff the output of changed components. This is essentially what we're proposing but at the `RenderedNode` level rather than DOM level.

### C. Observables/signals (like SolidJS)

Fine-grained reactivity where only the exact expressions that depend on changed state re-run. This would require a fundamental change to how `use_state` works and is not backwards compatible.

---

## Risks & Mitigations

| Risk                                         | Impact              | Mitigation                                                          |
| -------------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| Stale renders if dirty tracking is incorrect | High - incorrect UI | Comprehensive test coverage; fallback to full re-render on mismatch |
| Memory increase from caching                 | Medium              | Cache only the rendered node per component; clear on unmount        |
| Complexity increase                          | Medium              | Clear documentation; maintain full re-render as debug mode          |

---

## Testing Strategy

1. **Unit tests**: Verify dirty flag propagation in `RenderContext`
2. **Integration tests**: Verify only expected components re-render
3. **Regression tests**: All existing tests must pass
4. **Performance tests**: Measure render time with large component trees where only leaf state changes

---

## Success Metrics

- **Render count reduction**: Measure number of component function invocations per state change
- **Time to patch**: Measure time from state change to document patch sent
- **Benchmark**: Create a test with 100+ components, change leaf state, verify <10% components re-render
