# Inline Alert

Inline alerts display non-modal messages related to objects in a view, often used for form validation to aggregate feedback for multiple fields.

## Example

```python
from deephaven import ui


my_inline_alert_basic = ui.inline_alert(
    ui.heading("Payment Information"),
    ui.content(
        "Enter your billing address, shipping address, and payment method to complete your purchase."
    ),
)
```

## UI Recommendations

Consider using [`ui.heading`](./heading.md) if you want to create different types of headings.


## Content

The inline alerts contain a title and body using the `ui.heading` and `ui.content`.


```python
from deephaven import ui


my_inline_alert_content_example = ui.inline_alert(
    ui.heading("Payment Information"),
    ui.content(
        "Enter your billing address, shipping address, and payment method to complete your purchase."
    ),
)
```


## Variant

A variant can be set using the `variant` prop to give inline alerts a semantic meaning.

```python
from deephaven import ui


@ui.component
def ui_inline_alert_variant_examples():
    return [
        ui.inline_alert(
            ui.heading("Accepted Payment Methods"),
            ui.content(
                "Only major credit cards are accepted for payment. Direct debit is currently unavailable."
            ),
            variant="info",
        ),
        ui.inline_alert(
            ui.heading("Purchase completed"),
            ui.content(
                "You'll get a confirmation email with your order details shortly."
            ),
            variant="positive",
        ),
        ui.inline_alert(
            ui.heading("Payment Information"),
            ui.content(
                "Enter your billing address, shipping address, and payment method to complete your purchase."
            ),
            variant="notice",
        ),
        ui.inline_alert(
            ui.heading("Payment Information"),
            ui.content(
                "Enter your billing address, shipping address, and payment method to complete your purchase."
            ),
            variant="negative",
        ),
    ]


my_inline_alert_variant_examples = ui_inline_alert_variant_examples()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.inline_alert
```




