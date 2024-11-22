# Toast

Toasts display brief, temporary notifications of actions, errors, or other events in an application.

## Example

```python
from deephaven import ui

btn = ui.button(
    "Show toast",
    on_press=lambda: ui.toast("Toast is done!"),
    variant="primary",
)
```

## Content

Toasts are triggered using the method `ui.toast`. Toasts use `variant` to specify the following styles: `neutral`, `positive`, `negative`, and `info`. Toast will default to `neutral` if `variant` is omitted.

Toasts are shown according to the order they are added, with the most recent toast appearing at the bottom of the stack. Please use Toasts sparingly.

```python
from deephaven import ui

toasts = ui.button_group(
    ui.button(
        "Show neutral toast",
        on_press=lambda: ui.toast("Toast available", variant="neutral"),
        variant="secondary",
    ),
    ui.button(
        "Show positive toast",
        on_press=lambda: ui.toast("Toast is done!", variant="positive"),
        variant="primary",
    ),
    ui.button(
        "Show negative toast",
        on_press=lambda: ui.toast("Toast is burned!", variant="negative"),
        variant="negative",
    ),
    ui.button(
        "Show info toast",
        on_press=lambda: ui.toast("Toasting...", variant="info"),
        variant="accent",
        style="outline",
    ),
)
```

## Events

Toasts can include an optional action by specifying the `action_label` and `on_action` options when queueing a toast. In addition, the `on_close` event is triggered when the toast is dismissed. The `should_close_on_action` option automatically closes the toast when an action is performed.

```python
from deephaven import ui


btn = ui.button(
    "Show toast",
    on_press=lambda: ui.toast(
        "An update is available",
        action_label="Update",
        on_action=lambda: print("Updating!"),
        should_close_on_action=True,
        on_close=lambda: print("Closed"),
        variant="positive",
    ),
    variant="primary",
)
```

## Auto-dismiss

Toasts support a `timeout` option to automatically hide them after a certain amount of time. For accessibility, toasts have a minimum `timeout` of 5 seconds, and actionable toasts will not auto dismiss. In addition, timers will pause when the user focuses or hovers over a toast.

Be sure only to automatically dismiss toasts when the information is not important, or may be found elsewhere. Some users may require additional time to read a toast message, and screen zoom users may miss toasts entirely.

```python
from deephaven import ui


btn = ui.button(
    "Show toast",
    on_press=lambda: ui.toast("Toast is done!", timeout=5000, variant="positive"),
    variant="primary",
)
```

## Render Queue?

## Toast from table example

This example shows how to create a toast from the latest update of a ticking table. It is recommended to auto dismiss these toasts with a `timeout` and to avoid ticking faster than the value of the `timeout`.

```python
from deephaven.table_listener import listen
from deephaven import time_table
from deephaven import ui

_source = time_table("PT5S").update("X = i").tail(5)


@ui.component
def toast_table(t):
    render_queue = ui.use_render_queue()

    def listener_function(update, is_replay):
        data_added = update.added()["X"][0]
        render_queue(lambda: ui.toast(f"added {data_added}", timeout=5000))

    def listener():
        handle = listen(t, listener_function)

        def stop_listening():
            if handle is not None:
                handle.stop()

        return stop_listening

    ui.use_effect(listener, [t])
    return t


my_toast_table = toast_table(_source)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.toast
```
