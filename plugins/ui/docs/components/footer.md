# Footer

A footer for a document or section.

## Example

```python
from deephaven import ui

my_footer = ui.footer("© All rights reserved.")
```

## Content

The footer component represents a footer that inherits styling from its parent container. It accepts any renderable node, not just strings.

## Slots

`ui.footer` is intended to be used in container components with layouts that provide a slot for `ui.footer` (and other supported elements). These components handle the layout and styling of such elements for you. See [`ui.dialog`](./dialog.md#content) and [`ui.contextual_help`](./contextual_help#example) for more detailed examples.

```python
from deephaven import ui


my_footer_order_example = ui.dialog(
    ui.heading("Customer Support Request"),
    ui.content(
        "We have received your support request and are currently reviewing it. Our team will get back to you soon."
    ),
    ui.footer(
        "Ticket ID: #123456 | Status: In Progress | Support email: support@deephaven.io"
    ),
)
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.footer
```
