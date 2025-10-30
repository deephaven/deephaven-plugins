# Update Tables in State

As your `deephaven.ui` components become more complex, you may want to set a Deephaven [table](../describing/ui_with_tables.md) as state for your component. This will allow you to create UIs where the underlying table changes in response to user events. However, it is important to keep in mind the [liveness scope](/core/docs/conceptual/liveness-scope-concept/) of a table when you set it in state.

For example, this component allows a user to reset a table by setting it in state:

```python
from deephaven import ui, time_table


@ui.component
def ui_resetable_table():
    table, set_table = ui.use_state(lambda: time_table("PT1s"))
    handle_press = ui.use_callback(lambda: set_table(time_table("PT1s")), [])
    return [
        ui.action_button(
            "Reset",
            on_press=handle_press,
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

Clicking the "Reset" button displays a LivenessStateException error:

![Reset table error](../_assets/update-tables-in-state-1.png)

The error states that "this manager or referent is no longer live". This is a liveness error. It means that the component is trying to use a table that has not been kept alive. There are several ways to fix this error.

## The `use_liveness_scope` hook

The first way to fix this error is the [`use_liveness_scope`](../hooks/use_liveness_scope.md) hook. This hook allows you to manage the liveness of a table to prevent it being garbage collected before your component is done using it. With this change, we can reset the table:

```python
from deephaven import ui, time_table


@ui.component
def ui_resetable_table():
    table, set_table = ui.use_state(lambda: time_table("PT1s"))
    handle_press = ui.use_liveness_scope(lambda _: set_table(time_table("PT1s")), [])
    return [
        ui.action_button(
            "Reset",
            on_press=handle_press,
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

## Refactor to avoid liveness scope

In this case, the code can be refactored to remove the need for a liveness scope. Because the table is created inside the component, it can be removed from the state. You can then use the [`use_memo`](../hooks/use_memo.md) hook to derive the table from changes to the state.

```python
from deephaven import ui, time_table


@ui.component
def ui_resetable_table():
    iteration, set_iteration = ui.use_state(0)
    table = ui.use_memo(lambda: time_table("PT1s"), [iteration])
    return [
        ui.action_button(
            "Reset",
            on_press=lambda: set_iteration(iteration + 1),
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

## When to use liveness scope

You should use liveness scope any time you need to manage the liveness of an object. When a table is created outside a component's function, you may need to manage its liveness. Additionally, if you are using multi-thread processing to update your component, you may need to manage the liveness of the table.

```python
from deephaven import ui, new_table
from deephaven.column import string_col


def create_rgb_table():
    return new_table(
        [
            string_col("Colors", ["Red", "Green", "Blue"]),
        ]
    )


def create_cmyk_table():
    return new_table(
        [
            string_col("Colors", ["Cyan", "Magenta", "Yellow", "Black"]),
        ]
    )


@ui.component
def color_picker(rgb, cmyk):
    table, set_table = ui.use_state(lambda: rgb)
    handle_rgb = ui.use_liveness_scope(lambda _: set_table(rgb), [rgb])
    handle_cmyk = ui.use_liveness_scope(lambda _: set_table(cmyk), [cmyk])
    return [
        ui.action_button(
            "Set RGB",
            on_press=handle_rgb,
        ),
        ui.action_button(
            "Set CMYK",
            on_press=handle_cmyk,
        ),
        table,
    ]


color_picker_example = color_picker(create_rgb_table(), create_cmyk_table())
```

## Multithreading

You may want to set a table in state after doing work in another thread. In this example, the table is set directly in the background thread.

```python
from deephaven import ui, time_table
import threading


@ui.component
def ui_resetable_table():
    table, set_table = ui.use_state(lambda: time_table("PT1s"))

    def do_work():
        set_table(time_table("PT1s"))

    def start_background_thread():
        threading.Thread(target=do_work).start()

    return [
        ui.action_button(
            "Reset",
            on_press=start_background_thread,
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

Pressing the reset button prints an error: "Attempt to setRefreshing(true) but Table was constructed with a static-only UpdateGraph." To solve this. the table must be set on the render thread, which is done using the [`use_render_queue`](../hooks/use_render_queue.md) hook.

```python
from deephaven import ui, time_table
import threading


@ui.component
def ui_resetable_table():
    render_queue = ui.use_render_queue()
    table, set_table = ui.use_state(lambda: time_table("PT1s"))

    def do_work():
        render_queue(lambda: set_table(time_table("PT1s")))

    def start_background_thread():
        threading.Thread(target=do_work).start()

    return [
        ui.action_button(
            "Reset",
            on_press=start_background_thread,
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

Now pressing the reset button causes the component to fail with a "LivenessStateException". Use the `use_liveness_scope` hook to manage the liveness of the table.

```python
from deephaven import ui, time_table
import threading


@ui.component
def ui_resetable_table():
    render_queue = ui.use_render_queue()
    table, set_table = ui.use_state(lambda: time_table("PT1s"))
    reset_table = ui.use_liveness_scope(lambda: set_table(time_table("PT1s")), [])

    def do_work():
        render_queue(reset_table)

    def start_background_thread():
        threading.Thread(target=do_work).start()

    return [
        ui.action_button(
            "Reset",
            on_press=start_background_thread,
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```
