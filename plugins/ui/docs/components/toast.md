# Toast

Toasts display brief, temporary notifications of actions, errors, or other events in an application.

## Example

```python
from deephaven import ui

btn = ui.button(
    "Show toast",
    on_press=lambda: ui.toast_queue.positive("Toast is done!"),
    variant="primary",
)
```

## Content

Toasts are triggered using one of the methods of `ui.toast_queue`.

Toasts are shown according to the order they are added, with the most recent toast appearing at the bottom of the stack. Please use Toasts sparingly.

```python
from deephaven import ui

toasts = ui.button_group(
    ui.button(
        "Show neutral toast",
        on_press=lambda: ui.toast_queue.neutral("Toast available"),
        variant="secondary",
    ),
    ui.button(
        "Show positive toast",
        on_press=lambda: ui.toast_queue.positive("Toast is done!"),
        variant="primary",
    ),
    ui.button(
        "Show negative toast",
        on_press=lambda: ui.toast_queue.negative("Toast is burned!"),
        variant="negative",
    ),
    ui.button(
        "Show info toast",
        on_press=lambda: ui.toast_queue.info("Toasting..."),
        variant="accent",
        style="outline",
    ),
)
```

## Events

Toasts can include an optional action by specifying the `action_label` and `on_action` options when queueing a toast. In addition, the on_close event is triggered when the toast is dismissed. The `should_close_on_action` option automatically closes the toast when an action is performed.

```python
from deephaven import ui


btn = ui.button(
    "Show toast",
    on_press=lambda: ui.toast_queue.positive(
        "An update is available",
        action_label="Update",
        on_action=lambda: print("Updating!"),
        should_close_on_action=True,
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
    on_press=lambda: ui.toast_queue.positive("Toast is done!", timeout=5000),
    variant="primary",
)
```

## Programmatic dismissal

Toasts may be programmatically dismissed if they become irrelevant before the user manually closes them. Each method of `toast_queue` returns a function which may be used to close a toast.

```python
from deephaven import ui

# TODO
@ui.component
def close_example():
    close, set_close = use_state(None)

    def handle_press():
        if close is None:
            toast_close = ui.toast_queue.positive(
                "Unable to save", on_close=lambda: set_close(None)
            )
            set_close(lambda: toast_close())
        else:
            close()

    return ui.button(
        "Toggle toast",
        on_press=handle_press,
        variant="primary",
    )


my_close_example = close_example()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.toast
```
