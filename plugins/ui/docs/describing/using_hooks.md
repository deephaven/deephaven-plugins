# Using Hooks

Hooks are functions that isolate reusable parts of a component. Built in `deephaven.ui` hooks allow you to manage state, cache values, synchronize with external systems, and much more. You can either use the built-in hooks or combine them to build your own.

## Built-in Hooks

`Deephaven.ui` has a large number of built-in hooks to help with the development of components. The full documenation for these can be found in the `Hooks` section of the documentation.

### Use State Hook

Call `use_state` at the top level of your component to declare a state variable.

```python
from deephaven import ui


@ui.component
def ui_counter():
    count, set_count = ui.use_state(0)
    return ui.button(f"Pressed {count} times", on_press=lambda: set_count(count + 1))


counter = ui_counter()
```

The `use_state` hook takes an optional parameter that is the initial state. It initializes to `None` if this is omitted. The hook returns two values: a state variable and a `set` function that lets you update the state and trigger a re-render.

See the [use_state](../hooks/use_state.md) documentation for more detailed information.

### Use Memo Hook

Call `use_memo` to cache the result of a calculation, function, or operation. This is useful when you have a value that is expensive to compute and you want to avoid re-computing it on every render.

```python
from deephaven import ui


@ui.component
def ui_todo_list(todos: list[str], filter: str):
    filtered_todos = ui.use_memo(
        lambda: [todo for todo in todos if filter in todo], [todos, filter]
    )

    return [
        ui.text(f"Showing {len(filtered_todos)} of {len(todos)} todos"),
        *[ui.checkbox(todo) for todo in filtered_todos],
    ]


result = ui_todo_list(["Do grocery shopping", "Walk the dog", "Do laundry"], "Do")
```

TODO explain more

See the [use_memo](../hooks/use_memo.md) documentation for more detailed information.

### Use Callback Hook

Call `use_callback` to memoizes a callback function. This prevents unecessary re-renders when the dependencies of the callback have not changed.

TODO short example

## Rules for Hooks

## Building Your Own Hooks
