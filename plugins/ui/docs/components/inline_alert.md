# Inline Alert

Inline alerts display non-modal messages related to objects in a view, often used for form validation to aggregate feedback for multiple fields.

## Example

For the inline alert component, both the `heading` and `content` props are required. 

```python
from deephaven import ui


my_inline_alert_basic = ui.inline_alert(
    heading="Payment Information",
    content="Enter your billing address, shipping address, and payment method to complete your purchase.",
)
```


## Variant

The `variant` prop can set a variant to give inline alerts a semantic meaning.

```python
from deephaven import ui


@ui.component
def ui_inline_alert_variant_examples():
    return [
        ui.inline_alert(
            heading="Accepted Payment Methods",
            content="Only major credit cards are accepted for payment. Direct debit is currently unavailable.",
            variant="info",
        ),
        ui.inline_alert(
            heading="Purchase completed",
            content="You'll get a confirmation email with your order details shortly.",
            variant="positive",
        ),
        ui.inline_alert(
            heading="Payment Information",
            content="Enter your billing address, shipping address, and payment method to complete your purchase.",
            variant="notice",
        ),
        ui.inline_alert(
            heading="Payment Information",
            content="Enter your billing address, shipping address, and payment method to complete your purchase.",
            variant="negative",
        ),
    ]


my_inline_alert_variant_examples = ui_inline_alert_variant_examples()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.inline_alert
```
