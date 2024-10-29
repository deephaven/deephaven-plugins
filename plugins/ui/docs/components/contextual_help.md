# Contextual Help

Contextual help to show extra information about the state of a component, or a total view.

## Example

```python
from deephaven import ui


my_contextual_help_basic = ui.contextual_help(
    ui.heading("Need Help"),
    ui.text(
        "If you are having issues accessing your account, contact our customer support team for help."
    ),
    variant="info",
)
```

## Content


## Placement

The contextual help component supports different placement options for when the positioning of the popover needs to customized.

```python
from deephaven import ui


@ui.component
def ui_contextual_help_placement_examples():
    return [
        ui.contextual_help(
            ui.heading("Need Help"),
            ui.text(
                "If you are having issues accessing your account, contact our customer support team for help."
            ),
            variant="info",
        ),
        ui.contextual_help(
            ui.heading("Need Help"),
            ui.text(
                "If you are having issues accessing your account, contact our customer support team for help."
            ),
            variant="info",
            placement="top start",
        ),
        ui.contextual_help(
            ui.heading("Need Help"),
            ui.text(
                "If you are having issues accessing your account, contact our customer support team for help."
            ),
            variant="info",
            placement="end",
        ),
    ]


my_contextual_help_placement_examples = ui_contextual_help_placement_examples()
```


## Events

The contextual help componenthas an `on_open_change` prop, triggered when the the popover opens or closes.

```python
from deephaven import ui


@ui.component
def ui_contextual_help_events_example():
    is_open, set_is_open = ui.use_state(False)
    return [
        ui.flex(
            ui.contextual_help(
                ui.heading("Permission required"),
                ui.text(
                    "Your admin must grant you permission before you can create a segment."
                ),
                variant="info",
                on_open_change={set_is_open},
            ),
            align_items="center",
        )
    ]


my_contextual_help_events_example = ui_contextual_help_events_example()
```


## Visual Options

The `variant` prop can be set to either "info" or "help", depending on how the contextual help component is meant to help the user.

```python
from deephaven import ui


@ui.component
def ui_contextual_help_variant_examples():
    return [
        ui.contextual_help(
            ui.heading("Permission Required"),
            ui.text(
                "Your admin must grant you permission before you can create a segment."
            ),
            variant="info",
        ),
        ui.contextual_help(
            ui.heading("What is a segment?"),
            ui.text(
                "Segments identify who your visitors are, what devices and services they use, where they navigated from, and much more."
            ),
            variant="help",
        ),
    ]


my_contextual_help_variant_examples = ui_contextual_help_variant_examples()
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.contextual_help
```

