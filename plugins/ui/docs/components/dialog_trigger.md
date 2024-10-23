# Dialog Trigger

Dialog trigger serves as a wrapper around a dialog and its associated trigger, linking the dialog's open state with the trigger's press state. Additionally, it allows you to customize the type and positioning of the dialog.

## Example

```python
from deephaven import ui


my_dialog_trigger_example = ui.dialog_trigger(
    ui.action_button(
        "Disk Status",
    ),
    ui.dialog(
        ui.heading("C://"),
        ui.content("50% disk space remainging"),
    ),
    type="popover",
)
```

## Content

The `dialog_trigger` accepts exactly two children: the element which triggers opening of the `dialog` and the `dialog` itself. The trigger must be the first child passed into the `dialog_trigger` and should be an element that supports press events.

If your `dialog` has buttons within it that should close the Dialog when pressed, you must use controlled mode in order to propagate the close function to the dialog's children. Dialogs that do not contain such interactive elements can simply provide the `dialog` component as is to the `dialog_trigger` as its second child.

The example below demonstrates how to pass the close function to the dialog's buttons.

```python
from deephaven import ui


@ui.component
def close_example():
    is_open, set_open, set_closed = ui.use_flag()
    return ui.dialog_trigger(
        ui.action_button("Check connectivity", on_press=set_open),
        ui.dialog(
            ui.heading("Internet Speed Test"),
            ui.content("Start speed test?"),
            ui.button_group(
                ui.button("Cancel", variant="secondary", on_press=set_closed),
                ui.button("Confirm", variant="accent", on_press=set_closed),
            ),
        ),
        is_open=is_open,
    )


my_close_example = close_example()
```

## Dialog types

By providing a `type` prop, you can specify the type of `dialog` that is rendered by your `dialog_trigger`. Note that pressing the `Esc` key will close the `dialog` regardless of its type.

### Modal

Modal dialogs create an underlay that blocks access to the underlying user interface until the dialog is closed. Sizing options can be found on the `dialog` page. Focus is trapped inside the Modal as per the accessibility guidelines laid out by W3C.

```python
from deephaven import ui


my_modal = ui.dialog_trigger(
    ui.action_button(
        "Trigger Modal",
    ),
    ui.dialog(
        ui.heading("Modal"),
        ui.content("This is a modal."),
    ),
    is_dismissable=True,
    type="modal",
)
```

### Popover

If a dialog without an underlay is needed, consider using a popover dialog.

```python
from deephaven import ui

my_popover = ui.dialog_trigger(
    ui.action_button(
        "Trigger Popover",
    ),
    ui.dialog(
        ui.heading("Popover"),
        ui.content("This is a popover."),
    ),
    type="popover",
)
```

### Tray

Tray dialogs are typically used to portray information on mobile devices or smaller screens.

```python
from deephaven import ui

my_tray = ui.dialog_trigger(
    ui.action_button(
        "Trigger Tray",
    ),
    ui.dialog(
        ui.heading("Tray"),
        ui.content("This is a tray."),
    ),
    type="tray",
)
```

### Fullscreen

Fullscreen dialogs are a fullscreen variant of the modal dialog, only revealing a small portion of the page behind the underlay. Use this variant for more complex workflows that do not fit in the available modal dialog sizes. This variant does not support `is_dismissible`.

```python
from deephaven import ui


@ui.component
def fullscreen_example():
    is_open, set_open, set_closed = ui.use_flag()
    return ui.dialog_trigger(
        ui.action_button("Trigger Fullscreen", on_press=set_open),
        ui.dialog(
            ui.heading("Fullscreen"),
            ui.content(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit\
                amet tristique risus. In sit amet suscipit lorem. Orci varius\
                natoque penatibus et magnis dis parturient montes, nascetur\
                ridiculus mus. In condimentum imperdiet metus non condimentum. Duis\
                eu velit et quam accumsan tempus at id velit. Duis elementum\
                elementum purus, id tempus mauris posuere a. Nunc vestibulum sapien\
                pellentesque lectus commodo ornare."
            ),
            ui.button_group(
                ui.button("Close", variant="accent", on_press=set_closed),
            ),
        ),
        is_open=is_open,
        type="fullscreen",
    )


my_fullscreen_example = fullscreen_example()
```

### Fullscreen takeover

Fullscreen takeover dialogs are similar to the fullscreen variant except that the `dialog` covers the entire screen.

```python
from deephaven import ui


@ui.component
def fullscreen_takeover_example():
    is_open, set_open, set_closed = ui.use_flag()
    return ui.dialog_trigger(
        ui.action_button("Trigger Fullscreen", on_press=set_open),
        ui.dialog(
            ui.heading("Fullscreen"),
            ui.content(
                ui.form(
                    ui.text_field(label="Name"),
                    ui.text_field(label="Email address"),
                    ui.checkbox("Make profile private"),
                )
            ),
            ui.button_group(
                ui.button("Cancel", variant="secondary", on_press=set_closed),
                ui.button(
                    "Confirm", variant="accent", on_press=set_closed, auto_focus=True
                ),
            ),
        ),
        is_open=is_open,
        type="fullscreenTakeover",
    )


my_fullscreen_takeover_example = fullscreen_takeover_example()
```

### Dismissable

If your modal fialog doesn't require the user to make a confirmation, you can set `is_dismissable` on the `dialog_trigger`. This adds a close button that the user can press to dismiss the `dialog`.

```python
from deephaven import ui

my_dialog_example2 = ui.dialog_trigger(
    ui.action_button("Status"),
    ui.dialog(ui.heading("Status"), ui.content("Printer Status: Connected")),
    is_dismissable=True,
)
```

## Dialog placement

Popover dialogs support a variety of placement options since they do not take over the user interface like modal or tray dialogs.

### Placement

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.dialog
```
