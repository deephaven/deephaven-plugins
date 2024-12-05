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

The `use_memo` hook takes two parameters: a `callable` that returns a value and a list of dependencies. The value is computed once and then stored in the memoized value. The memoized value is returned on subsequent renders until the dependencies change.

See the [use_memo](../hooks/use_memo.md) documentation for more detailed information.

### Use Effect Hook

Call `use_effect` to synchronize a component with an external system. An effect runs when it is mounted or a dependency changes. An optional cleanup function runs when dependencies change or the component is unmounted.

```python
from deephaven import ui


@ui.component
def ui_effect_example():
    def handle_mount():
        # effect prints "Mounted" once when component is first rendered
        print("Mounted")
        # cleanup function prints "Unmounted" when component is closed
        return lambda: print("Unmounted")

    # Passing in an empty list for dependencies will run the effect only once when the component is mounted, and cleanup when the component is unmounted
    ui.use_effect(handle_mount, [])

    return ui.text("Effect Example")


effect_example = ui_effect_example()
```

The `use_effect` hook takes two parameters: a callable and a list of dependencies. The callable may return a function for cleanup.

See the [use_effect](../hooks/use_effect.md) documentation for more detailed information.

### Use Callback Hook

Call `use_callback` to memoizes a callback function. This prevents unnecessary re-renders when the dependencies of the callback have not changed.

```python
from deephaven import ui
import time


@ui.component
def ui_server():
    theme, set_theme = ui.use_state("red")

    create_server = ui.use_callback(lambda: {"host": "localhost"}, [])

    def connect():
        server = create_server()
        print(f"Connecting to {server}")
        time.sleep(0.5)

    ui.use_effect(connect, [create_server])

    return ui.view(
        ui.picker(
            "red",
            "orange",
            "yellow",
            label="Theme",
            selected_key=theme,
            on_change=set_theme,
        ),
        padding="size-100",
        background_color=theme,
    )


my_server = ui_server()
```

The `use_callback` hook takes two parameters: a callable and a list of dependencies. It returns a memoized callback. The memoized callback is returned on subsequent renders until the dependencies change.

See the [use_callback](../hooks/use_callback.md) documentation for more detailed information.

## Rules for Hooks

TODO

## Building Your Own Hooks

TODO
