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
- [`use_callback`](use_callback.md) lets you cache a function definition before passing to an effect or child component, preventing unnecessary rendering. It's like `use_memo` but specifically for functions.

### Data hooks

_Data_ hooks let you use data from within a Deephaven table in your component.

- [`use_table_data`](use_table_data.md) lets you use the full table contents.
- [`use_column_data`](use_column_data.md) lets you use the column data of one column.
- [`use_cell_data`](use_cell_data.md) lets you use the cell data of one cell.

## Create custom hooks

You can create your own hooks to reuse stateful logic between components. A custom hook is a JavaScript function whose name starts with `use` and that may call other hooks. For example, let's say you want to create a custom hook that checks whether a table cell is odd. You can create a custom hook called `use_is_cell_odd`:

```python
from deephaven import time_table, ui


def use_is_cell_odd(table):
    cell_value = ui.use_cell_data(table, 0)
    return cell_value % 2 == 1


@ui.component
def ui_table_odd_cell(table):
    is_odd = use_is_cell_odd(table)
    return ui.view(f"Is the cell odd? {is_odd}")


_table = time_table("PT1s").update("x=i").view("x").tail(1)
table_odd_cell = ui_table_odd_cell(_table)
```

Notice at the end of our custom hook, we check if the cell value is odd and return the result. We then use this custom hook in our component to display whether the cell is odd.
