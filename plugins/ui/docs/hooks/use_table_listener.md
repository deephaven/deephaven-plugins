# use_table_listener

`use_table_listener` lets you listen to a table for updates. This is useful when you want to listen to a table and perform an action when the table updates.

## Example

```python
from deephaven import time_table, ui
from deephaven.table import Table

_source = time_table("PT1s").update("X = i")


@ui.component
def ui_table_monitor(t: Table):
    def listener_function(update, is_replay):
        print(f"Table updated: {update}, is_replay: {is_replay}")

    ui.use_table_listener(t, listener_function, [])
    return t


table_monitor = ui_table_monitor(_source)
```

## UI recommendations

1. **Use table data hooks instead when possible**: `use_table_listener` is an advanced feature, requiring understanding of how the [table listeners](https://deephaven.io/core/docs/how-to-guides/table-listeners-python/) work, and limitations of running code while the Update Graph is running. Most usages of this are more appropriate to implement with [the table data hooks](./overview.md#data-hooks).

## Display the last updated row

Here's an example that listens to table updates and will display the last update as a header above the table. This is a simple example to demonstrate how to use `use_table_listener` to listen to table updates and update state in your component.

```python
from deephaven import time_table, ui
from deephaven.table import Table


@ui.component
def ui_show_last_changed(t: Table):
    last_change, set_last_change = ui.use_state("No changes yet.")

    def listener_function(update, is_replay):
        set_last_change(f"{update.added()['X'][0]} was added")

    ui.use_table_listener(t, listener_function, [])
    return [ui.heading(f"Last change: {last_change}"), t]


_source = time_table("PT5s").update("X = i")
show_last_changed = ui_show_last_changed(_source)
```

## Display a toast

Here's an example that listens to table updates and will display a toast message when the table updates. This is a simple example to demonstrate how to use `use_table_listener` to listen to table updates and display a toast message. Note you must use a [render queue](./use_render_queue.md) to trigger the toast, as the listener is not fired on the render thread.

```python
from deephaven import time_table
from deephaven import ui

_source = time_table("PT5S").update("X = i").tail(5)


@ui.component
def toast_table(t):
    render_queue = ui.use_render_queue()

    def listener_function(update, is_replay):
        data_added = update.added()["X"][0]
        render_queue(lambda: ui.toast(f"added {data_added}", timeout=5000))

    ui.use_table_listener(t, listener_function, [t])
    return t


my_toast_table = toast_table(_source)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_table_listener
```
