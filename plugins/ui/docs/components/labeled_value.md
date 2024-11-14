# Labeled Value

A Labeled Value displays a non-editable value with a label. 

## Example

```python
from deephaven import ui


my_labeled_value_basic = ui.labeled_value(label="File name", value="Budget.xls")
```


## Value

A labeled value accepts numbers, dates, times, strings,  and lists of strings in the `value` prop.

```python
from deephaven import ui


@ui.component
def ui_labeled_value_examples():
    return 1


my_labeled_value_values_examples = ui_labeled_value_examples()
```


## Label position

By default, the position of a labeled value's label is above the labeled value, but it can be changed to the side using the `label_position` prop. 

```python
from deephaven import ui


my_labeled_value_label_position_example = ui.labeled_value(
    label="File name", value="Onboarding.pdf", label_position="side", label_align="end"
)
```


## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the labeled value to provide additional information about the labeled value.

```python
from deephaven import ui


my_labeled_value_contextual_help_example = ui.labeled_value(
    label="File name",
    value="Onboarding.pdf",
    contextual_help=ui.contextual_help(
        ui.heading("Info about the onboarding document")
    ),
)
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.labeled_value
```