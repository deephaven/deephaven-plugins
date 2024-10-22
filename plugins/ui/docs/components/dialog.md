# Dialog

Dialogs are windows containing contextual information, tasks, or workflows that appear over the user interface. Depending on the kind of Dialog, further interactions may be blocked until the Dialog is acknowledged.

## Example

```python
from deephaven import ui


@ui.component
def dialog_example():
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


my_dialog_example = dialog_example()
```

## Content

The content can be populated by providing the following components to your `dialog` as children:

- `header` (optional)
- `heading` (title, required)
- `divider` (optional)
- `content` (body, required)
- `button_group` (optional)
- `footer` (optional)

### Examples

TODO

## Events

TODO

### Dismissable dialogs

TODO

## Visual options

### Dialog types

TODO

### Size

TODO

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.dialog
```
