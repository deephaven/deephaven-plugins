# use_render_queue

`use_render_queue` lets you use the render queue in your component. Whenever work is done in a component, it must be performed on the render thread. If you create a new thread to perform some work on the background and then want to update a component, you should queue that work on the render thread. Some actions (like [toasts](../components/toast.md)) will raise an error if they are not triggered from the render thread.

## Example

This example listens to table updates and displays a toast message when the table updates. The [`toast` function](../components/toast.md) must be triggered on the render thread, whereas the listener is not fired on the render thread. Therefore, you must use the render queue to trigger the toast.

```python order=my_toast_table,_source
from deephaven import time_table
from deephaven import ui

_source = time_table("PT5S").update("X = i").tail(5)


@ui.component
def toast_table(t):
    render_queue = ui.use_render_queue()

    def listener_function(update, is_replay):
        data_added = update.added()["X"][0]
        render_queue(lambda: ui.toast(f"added {data_added}", timeout=5000))

    ui.use_table_listener(t, listener_function, [])
    return t


my_toast_table = toast_table(_source)
```

## UI recommendations

1. **Use the render queue to trigger toasts**: When you need to trigger a toast from a background thread, use the render queue to ensure the toast is triggered on the render thread. Otherwise, an exception will be raised.
2. **Use the render queue to batch UI updates from a background thread**: By default, setter functions from the [`use_state`](./use_state.md) hook are already fired on the render thread. However, if you have multiple updates to make to the UI from a background thread, you can use the render queue to batch them together.

## Batch updates

Setter functions from the [`use_state`](./use_state.md) hook are always fired on the render thread, so if you call a series of updates from a callback on the render thread, they will be batched together. Consider the following, which will increment states `a` and `b` in the callback from pressing on "Update values":

```python
from deephaven import ui
import time


@ui.component
def ui_batch_example():
    a, set_a = ui.use_state(0)
    b, set_b = ui.use_state(0)

    ui.toast(
        f"Values are {a} and {b}",
        variant="negative" if a != b else "neutral",
        timeout=5000,
    )

    def do_work():
        set_a(lambda new_a: new_a + 1)
        # Introduce a bit of delay between updates
        time.sleep(0.1)
        set_b(lambda new_b: new_b + 1)

    return ui.button("Update values", on_press=do_work)


batch_example = ui_batch_example()
```

Because `do_work` is called from the render thread (in response to the `on_press` ), `set_a` and `set_b` will queue their updates on the render thread and they will be batched together. This means that the toast will only show once, with the updated values of `a` and `b` and they will always be the same value when the component re-renders.

If we instead put `do_work` in a background thread, the updates are not guaranteed to be batched together:

```python
from deephaven import ui
import threading
import time


@ui.component
def ui_batch_example():
    a, set_a = ui.use_state(0)
    b, set_b = ui.use_state(0)

    ui.toast(
        f"Values are {a} and {b}",
        variant="negative" if a != b else "neutral",
        timeout=5000,
    )

    def do_work():
        set_a(lambda new_a: new_a + 1)
        # Introduce a bit of delay between updates
        time.sleep(0.1)
        set_b(lambda new_b: new_b + 1)

    def start_background_thread():
        threading.Thread(target=do_work).start()

    return ui.button("Update values", on_press=start_background_thread)


batch_example = ui_batch_example()
```

When running the above example, _two_ toasts appear with each button press: a red one where `a != b` (as `a` gets updated first), then a neutral one where `a == b` (as `b` gets updated second). Use the `use_render_queue` hook to ensure the updates are always batched together when working with a background thread:

```python
from deephaven import ui
import threading
import time


@ui.component
def ui_batch_example():
    render_queue = ui.use_render_queue()
    a, set_a = ui.use_state(0)
    b, set_b = ui.use_state(0)

    ui.toast(
        f"Values are {a} and {b}",
        variant="negative" if a != b else "neutral",
        timeout=5000,
    )

    def do_work():
        def update_state():
            set_a(lambda new_a: new_a + 1)
            # Introduce a bit of delay between updates
            time.sleep(0.1)
            set_b(lambda new_b: new_b + 1)

        render_queue(update_state)

    def start_background_thread():
        threading.Thread(target=do_work).start()

    return ui.button("Update values", on_press=start_background_thread)


batch_example = ui_batch_example()
```

Now when we run this example and press the button, we'll see only one toast with the updated values of `a` and `b`, and they will always be the same value when the component re-renders (since the updates are batched together on the render thread).

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_render_queue
```
