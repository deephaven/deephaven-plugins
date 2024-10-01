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

