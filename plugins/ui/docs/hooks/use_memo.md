# use_memo

`use_memo` is a hook to memoize a value. This is useful when you have a value that is expensive to compute, and you want to avoid re-computing it on every render. The value is computed once, and then stored in the memoized value. The memoized value is returned on subsequent renders until the dependencies change.

## Example

```python
from deephaven import ui


@ui.component
def ui_todo_list(todos: list[str], filter: str):
    filtered_todos = ui.use_memo(
        lambda: [todo for todo in todos if filter in todo], [todos, filter]
    )

    return [
        ui.text(f"Showing {len(filtered_todos)} todos"),
        *[ui.checkbox(todo) for todo in filtered_todos],
    ]


result = ui_todo_list(["Buy milk", "Walk the dog", "Do laundry"], "laundry")
```

In the example above, the `filtered_todos` value is computed once, and then stored in the memoized value. The memoized value is returned on subsequent renders until the `todos` or `filter` dependencies change.

## Recommendations

Recommendations for memoizing values:

1. **Use memoization for expensive computations**: If you have a value that is expensive to compute, use `use_memo` to memoize the value between renders.
2. **Use dependencies**: Pass in only the dependencies that the memoized value relies on. If any of the dependencies change, the memoized value is re-computed. If another prop or state value changes, the computation is not re-run.
3. **Do not use for cheap computations**: There is small overhead to memoizing values, so only use `use_memo` for expensive computations. If the value is cheap to compute, it is not worth memoizing.

## Optimizing performance

In the example below, we have a list of todos, a filter string, and a "theme" that can be set. First we demonstrate how slow it is to compute the filtered todos without memoization.

```python
from deephaven import ui


theme_options = ["accent", "positive", "negative"]


@ui.component
def ui_todo_list(todos: list[str], search: str, theme: str):
    def filter_todos():
        import time

        # Simulate delay based on filter length
        time.sleep(min(len(search) + 1, 3))
        return [todo for todo in todos if search in todo]

    filtered_todos = filter_todos()

    return ui.view(
        ui.flex(
            ui.text(f"Showing {len(filtered_todos)} todos"),
            *[ui.checkbox(todo) for todo in filtered_todos],
            direction="column",
        ),
        background_color=theme,
    )


@ui.component
def ui_todo_app(todos: list[str]):
    search, set_search = ui.use_state("")
    theme, set_theme = ui.use_state(theme_options[0])

    return [
        ui.text_field(value=search, on_change=set_search),
        ui.picker(*theme_options, selected_key=theme, on_change=set_theme),
        ui_todo_list(todos, search, theme),
    ]


todo_app = ui_todo_app(["Buy milk", "Walk the dog", "Do laundry"])
```

We are computing the filtered todos on every render, which is slow. We even call it when `theme` is changed, even though that value is not used in the computation. We can optimize this by using `use_memo` to memoize the filtered todos, and only recompute them when one of the dependent values (`todos` and `search`) is updated:

```python
from deephaven import ui

theme_options = ["accent", "positive", "negative"]


@ui.component
def ui_todo_list(todos: list[str], search: str, theme: str):
    def filter_todos():
        import time

        # Simulate delay based on filter length
        time.sleep(min(len(search) + 1, 3))
        return [todo for todo in todos if search in todo]

    filtered_todos = ui.use_memo(filter_todos, [todos, search])

    return ui.view(
        ui.flex(
            ui.text(f"Showing {len(filtered_todos)} todos"),
            *[ui.checkbox(todo) for todo in filtered_todos],
            direction="column",
        ),
        background_color=theme,
    )


@ui.component
def ui_todo_app(todos: list[str]):
    search, set_search = ui.use_state("")
    theme, set_theme = ui.use_state(theme_options[0])

    return [
        ui.text_field(value=search, on_change=set_search),
        ui.picker(*theme_options, selected_key=theme, on_change=set_theme),
        ui_todo_list(todos, search, theme),
    ]


todo_app = ui_todo_app(["Buy milk", "Walk the dog", "Do laundry"])
```

Now switching the theme will always be snappy, and the filtered todos will only be recomputed when the `todos` or `search` dependencies change.

## Memoize each item in a list

`use_memo` is a hook, and like any other hook, can only be called at the top level of a component. Suppose you are listing a number of items, and you want them to be memoized individually. However, you can't use `use_memo` inside a loop:

```python
from deephaven import ui


theme_options = ["accent", "positive", "negative"]


def fib(n):
    import time

    if n <= 1:
        return n
    time.sleep(1)
    return fib(n - 1) + fib(n - 2)


@ui.component
def ui_fibonacci_list(n: int, theme: str):

    return ui.view(
        # ❌ You can't call `use_memo` in a loop like this
        *[ui.view(f"{i}: {ui.use_memo(lambda: fib(i), [i])}") for i in range(n)],
        background_color=theme,
    )


@ui.component
def ui_fibonacci_app():
    n, set_n = ui.use_state(1)
    theme, set_theme = ui.use_state(theme_options[0])

    return [
        ui.slider(value=n, min_value=1, max_value=5, on_change=set_n, label="n"),
        ui.picker(*theme_options, selected_key=theme, on_change=set_theme),
        ui_fibonacci_list(n, theme),
    ]


fibonacci_app = ui_fibonacci_app()
```

Instead, extract each item into it's own component, and memoize the value there:

```python
from deephaven import ui


theme_options = ["accent", "positive", "negative"]


def fib(n):
    import time

    if n <= 1:
        return n
    time.sleep(1)
    return fib(n - 1) + fib(n - 2)


@ui.component
def ui_fibonacci_item(i: int):
    # ✅ Call `use_memo` at the top level of the component
    value = ui.use_memo(lambda: fib(i), [i])
    return ui.view(f"{i}: {value}")


@ui.component
def ui_fibonacci_list(n: int, theme: str):
    return ui.view(*[ui_fibonacci_item(i) for i in range(n)], background_color=theme)


@ui.component
def ui_fibonacci_app():
    n, set_n = ui.use_state(1)
    theme, set_theme = ui.use_state(theme_options[0])

    return [
        ui.slider(value=n, min_value=1, max_value=5, on_change=set_n, label="n"),
        ui.picker(*theme_options, selected_key=theme, on_change=set_theme),
        ui_fibonacci_list(n, theme),
    ]


fibonacci_app = ui_fibonacci_app()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_memo
```
