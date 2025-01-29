# Footer

A footer for a document or section.

## Example

```python
from deephaven import ui

my_footer = ui.footer("© All rights reserved.")
```

## Content

The footer component represents a footer that inherits styling from its parent container.

## Slots

When using certain container elements such as `ui.dialog` and `ui.illustrated_message`, their pre-defined layouts provide a slot for `ui.footer` (and other supported semantic elements), and handles the layout and styling of semantic elements for you.

```python
from deephaven import ui

my_footer_order_example = ui.flex(
    ui.illustrated_message(
        ui.content("2 (Content)"),
        ui.footer("3 (Footer)"),
        ui.heading("1 (Heading)"),
        ui.icon("vsCheck"),
    ),
    height="100%",
    justify_content="center",
    align_items="center",
)
```

This does not apply to general purpose containers such as `ui.view` and `ui.flex`, which do not provide slots for semantic elements.

```python
from deephaven import ui

my_footer_order_example = ui.flex(
    ui.view(
        ui.content("2 (Content)"),
        ui.footer("3 (Footer)"),
        ui.heading("1 (Heading)"),
        ui.icon("vsCheck"),
    ),
    height="100%",
    justify_content="center",
    align_items="center",
)
```

## Children

`ui.footer`, like `ui.heading` and `ui.content`, accepts any renderable node, not just strings, allowing complex workflows to be modelled around them.

```python
from deephaven import ui

my_fod = ui.dialog(
    ui.footer(
        ui.checkbox("I want to receive updates for exclusive offers in my area."),
    ),
    ui.heading(
        ui.flex(ui.icon("mail"), "Register for newsletter"),
    ),
    ui.content(
        ui.form(
            ui.text_field(name="firstname", label="First Name"),
            ui.text_field(name="lastname", label="Last Name"),
            ui.text_field(name="address", label="Address"),
        ),
    ),
    ui.button_group(
        ui.button("Cancel", variant="primary", style="outline"),
        ui.button("Register", variant="accent"),
    ),
    width="100%",
)
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.footer
```
