# Hooks

_Hooks_ let you use state and other deephaven.ui features in your components. They are a way to reuse stateful logic between components. Hooks are functions that let you "hook into" state and lifecycle features from function components. You can either use the built-in hooks or combine them to build your own.

## Example

```python
from deephaven import ui


@ui.component
def ui_counter():
    count, set_count = ui.use_state(0)
    return ui.button(f"Pressed {count} times", on_press=lambda: set_count(count + 1))


counter = ui_counter()
```

## UI recommendations

1. **Hooks must be used within components or other hooks**: Hooks require a rendering context, and therefore can only be used within component functions or other hooks. They cannot be used in regular Python functions or outside of components.
2. **All hooks start with `use_`**: For example, `use_state` is a hook that lets you add state to your components.
3. **Hooks must be called at the _top_ level**: Do not use hooks inside loops, conditions, or nested functions. This ensures that hooks are called in the same order each time a component renders. If you want to use one in a conditional or a loop, extract that logic to a new component and put it there.

## Built-in hooks

Below are all the built-in hooks that deephaven.ui provides.

### State hooks

_State_ lets a component remember some data between renders. State is a way to preserve data between renders and to trigger a re-render when the data changes. For example, a counter component might use state to keep track of the current count.

To add state to a component, use the [`use_state`](use_state.md) hook.

### Ref hooks

_Refs_ provide a way to hold a value that isn't used for re-rendering. Unlike with state, updating a ref does not re-render your component.

- [`use_ref`](use_ref.md) returns a mutable ref object whose `.current` property is initialized to the passed argument.

### Effect hooks

_Effects_ let you perform side effects in your components. Data fetching, setting up a subscription, and manually synchronizing with an external system are all examples of side effects.

- [`use_effect`](use_effect.md) lets you perform side effects in your components.

### Performance hooks

_Performance_ hooks let you optimize components for performance. They allow you to memoize expensive computations so that you can avoid re-running them on every render, or skip unnecessary re-rendering.

- [`use_memo`](use_memo.md) lets you memoize expensive computations.
- [`use_callback`](use_callback.md) lets you cache a function definition before passing it down to a child component, so that the child component doesn't re-render unnecessarily.

### Data hooks

_Data_ hooks let you use data from within a Deephaven table in your component.

- [`use_table_data`](use_table_data.md) lets you use the full table contents.
- [`use_column_data`](use_column_data.md) lets you use the column data of one column.
- [`use_cell_data`](use_cell_data.md) lets you use the cell data of one cell.

## Create custom hooks
