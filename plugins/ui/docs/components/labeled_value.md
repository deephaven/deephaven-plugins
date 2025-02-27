# Labeled Value

A labeled value displays a non-editable value with a label.

## Example

```python
from deephaven import ui


my_labeled_value_basic = ui.labeled_value(label="File name", value="Budget.xls")
```

## Value

A labeled value accepts numbers, strings, and lists of strings in the `value` prop.

```python
from deephaven import ui


@ui.component
def ui_labeled_value_examples():
    return [
        ui.labeled_value(label="File name", value="Budget.xls"),
        ui.labeled_value(label="Number of expenses in Budget file", value=123),
        ui.labeled_value(
            label="Pizza toppings", value=["Pizza", "Pineapple", "Mushroom", "Garlic"]
        ),
    ]


my_labeled_value_values_examples = ui_labeled_value_examples()
```

## Numbers

When passing a number into a labeled value, the `format_options` prop dictates how the value is displayed. There are 3 styles supported by this parameter: Percentage, Currency, and Units.

Note that this prop is compatible with the optional parameter of [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat).

```python
from deephaven import ui


@ui.component
def ui_labeled_value_numbers_example():
    return [
        ui.labeled_value(
            label="Percent completed",
            value=0.89,
            format_options={"style": "percent"},
        ),
        ui.labeled_value(
            label="Withdrawal amount",
            value=2350.50,
            format_options={"style": "currency", "currency": "USD"},
        ),
        ui.labeled_value(
            label="Height of Burj Khalifa",
            value=32600,
            format_options={"style": "unit", "unit": "inch"},
        ),
    ]


my_labeled_value_numbers_example = ui_labeled_value_numbers_example()
```

An object with a `start` and `end` property can be passed to the `value` prop in order to format a numeric range.

```python
from deephaven import ui

my_number_range = ui.labeled_value(
    label="Price range",
    value={"start": 150, "end": 400},
    format_options={"style": "currency", "currency": "USD", "minimumFractionDigits": 0},
)
```

## Label position

By default, the label is positioned above the labeled value, but it can be moved to the side using the `label_position` prop.

```python
from deephaven import ui


my_labeled_value_label_position_example = ui.labeled_value(
    label="File name", value="Onboarding.pdf", label_position="side", label_align="end"
)
```

## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the labeled value to provide additional information.

```python
from deephaven import ui


my_labeled_value_contextual_help_example = ui.labeled_value(
    label="File name",
    value="Onboarding.pdf",
    contextual_help=ui.contextual_help(
        heading="Info about the onboarding document", content="Sample content"
    ),
)
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.labeled_value
```
