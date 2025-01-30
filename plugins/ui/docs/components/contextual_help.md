# Contextual Help

Contextual help can be used to show extra information about the state of a component.

## Example

For the contextual help component, both the `heading` and `content` props are required, while the `footer` prop is optional.

```python
from deephaven import ui


my_contextual_help_basic = ui.contextual_help(
    heading="Need Help",
    content="If you are having issues accessing your account, contact our customer support team for help.",
    variant="info",
    footer=ui.link("Download support logs"),
)
```

## Placement

The contextual help component supports different placement options for when the popover's positioning needs to be customized.

```python
from deephaven import ui


@ui.component
def ui_contextual_help_placement_examples():
    return [
        ui.contextual_help(
            heading="Need Help",
            content="If you are having issues accessing your account, contact our customer support team for help.",
            variant="info",
        ),
        ui.contextual_help(
            heading="Need Help",
            content="If you are having issues accessing your account, contact our customer support team for help.",
            variant="info",
            placement="top start",
        ),
        ui.contextual_help(
            heading="Need Help",
            content="If you are having issues accessing your account, contact our customer support team for help.",
            variant="info",
            placement="end",
        ),
    ]


my_contextual_help_placement_examples = ui_contextual_help_placement_examples()
```

## Events

The `on_open_change` prop is triggered when the popover opens or closes.

```python
from deephaven import ui


@ui.component
def ui_contextual_help_events_example():
    is_open, set_is_open = ui.use_state(False)
    return [
        ui.flex(
            ui.contextual_help(
                heading="Permission required",
                content="Your admin must grant you permission before you can create a segment.",
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
            heading="Permission required",
            content="Your admin must grant you permission before you can create a segment.",
            variant="info",
        ),
        ui.contextual_help(
            heading="What is a segment?",
            content="Segments identify who your visitors are, what devices and services they use, where they navigated from, and much more.",
            variant="help",
        ),
    ]


my_contextual_help_variant_examples = ui_contextual_help_variant_examples()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.contextual_help
```
