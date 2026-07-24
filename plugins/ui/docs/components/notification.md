# Notification

Notifications display messages to the user at the operating system level using the browser's [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API). Unlike toasts, notifications appear outside the browser window, so they can reach the user even when the Deephaven tab is not focused.

## Example

```python
from deephaven import ui

btn = ui.button(
    "Show notification",
    on_press=lambda: ui.notification("Query complete"),
    variant="primary",
)
```

## Permissions

Notifications require the user to grant permission before they can be displayed. The first time `ui.notification` is called, the browser prompts the user to allow notifications. If the user denies permission, or if notifications are not supported (for example, when the page is not served over a secure context such as HTTPS or `localhost`), the message is shown as a [toast](./toast.md) instead.

## Content

Notifications are triggered using the method `ui.notification`. The `title` is required, and an optional `description` provides body text below the title. An `icon` may be provided as a URL to an image.

```python
from deephaven import ui

btn = ui.button(
    "Show notification",
    on_press=lambda: ui.notification(
        "Download complete",
        description="Your file is ready to view.",
        icon="https://github.com/deephaven.png",
    ),
    variant="primary",
)
```

## Events

Notifications support an `on_click` handler that is called when the user clicks the notification, and an `on_close` handler that is called when the notification is dismissed. When `ui.notification` falls back to a toast (for example, when permission is denied), the `on_click` handler is exposed as an action button on the toast so the callback remains reachable.

```python
from deephaven import ui

btn = ui.button(
    "Show notification",
    on_press=lambda: ui.notification(
        "An update is available",
        description="Click to install the latest version.",
        on_click=lambda: print("Clicked!"),
        on_close=lambda: print("Closed"),
    ),
    variant="primary",
)
```

## Replacing notifications

Use the `tag` option to group related notifications. A new notification with the same `tag` as an existing one replaces it instead of stacking, which is useful for updating a notification in place (for example, a progress or status update).

```python
from deephaven import ui


@ui.component
def status_updater():
    def notify(message):
        ui.notification(message, tag="job-status")

    return ui.button_group(
        ui.button("Start", on_press=lambda: notify("Job started")),
        ui.button("Finish", on_press=lambda: notify("Job finished")),
    )


my_status_updater = status_updater()
```

## Silent notifications

Set `silent=True` to display a notification without any accompanying sound or vibration, regardless of the device's settings.

```python
from deephaven import ui

btn = ui.button(
    "Show silent notification",
    on_press=lambda: ui.notification("Saved", silent=True),
    variant="primary",
)
```

## Notification from table example

This example shows how to create a notification from the latest update of a ticking table. Note that the notification must be triggered on the render thread, whereas the table listener may be fired from another thread. Therefore you must use the render queue to trigger the notification.

```python order=my_notification_table,_source
from deephaven import time_table
from deephaven import ui

_source = time_table("PT5S").update("X = i").tail(5)


@ui.component
def notification_table(t):
    render_queue = ui.use_render_queue()

    def listener_function(update, is_replay):
        data_added = update.added()["X"][0]
        render_queue(lambda: ui.notification(f"Added {data_added}"))

    ui.use_table_listener(t, listener_function, [])
    return t


my_notification_table = notification_table(_source)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.notification
```
