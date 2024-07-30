# Text Area

TextAreas are multiline text inputs, ideal for cases where users have a sizable amount of text to enter. They are available in multiple styles for various purposes, allowing for all customizations that are available to text fields.

## Example

```python
from deephaven import ui

ta = ui.text_area(
    label="Description", on_change=lambda value: print(f"Text changed to {value}")
)
```

## UI Recommendations

Recommendations for creating clear and effective text areas:

1. Text area labels should be clear and concise. No more than 4 words or 20 characters is recommended.
2. Avoid using punctuation at the end of labels or placeholder text. 
3. Placeholder text should give users a clear indication of what needs to be typed in the text area, it should not be a replacement for a label.

Consider using [`text_field`](./text_field.md) for cases wher concise, single-line input is required. In cases where the input is numeric, consider using [`number_field`](./number_field.md) 


## Value

A Text area's value is empty by default, but an initial, uncontrolled, value can be set using the `defaultValue` prop, or, a controlled value can be set via the `value` prop.

```python
from deephaven import ui


@ui.component
def text_area_value_prop():
    return [
        ui.text_area(label="Sample (Uncontrolled)", defaultValue="Value 1"),
        ui.text_area(label="Sample (controlled)", value="Value 2"),
    ]


text_area_value_example = text_area_value_prop()
```

## Labeling

To provide a visual label for the text area, the `label` prop should be used. In order to indicate that the text area is mandatory, use the `isRequired` prop. 

```python
from deephaven import ui


@ui.component
def text_area_is_required_prop():
    return [
        ui.text_area(label="Address"),
        ui.text_area(label="Address", isRequired=True),
    ]


text_area_is_required_example = text_area_is_required_prop()
```

By setting `isRequired` to True, the `necessityIndicator` is set to "icon" by default, but this can be changed. Also, the `necessityIndicator` can be used indepdendently to indicate that the text area is optional.

When the `necessityIndicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def text_area_necessity_indicator_prop():
    return [
        ui.text_area(label="Address", isRequired=True, necessityIndicator="label"),
        ui.text_area(label="Address", necessityIndicator="label"),
    ]


text_area_necessity_indicator_example = text_area_necessity_indicator_prop()
```

## Events

A Text area's value is empty by default, but an initial, uncontrolled, value can be set using the `defaultValue` prop, or, a controlled value can be set via the `value` prop.

```python
from deephaven import ui


def ex_on_change(new_value):
    print(f"Text changed to {new_value}")


text_area_on_change_example = ui.text_area(label="Your text", on_change=ex_on_change)
```

## HTML Forms

Text area's can support a `name` prop for integration with HTML form, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


text_area_name_example = ui.text_area(label="Comment", name="comment")
```

## Disabled State

Text area's can be disabled to prevent user interaction using the `isDisabled` prop. This is useful when the text area should be visible, but not avaialable for input.

```python
from deephaven import ui


text_area__is_disabled_example = ui.text_area(label="Sample", isDisabled=True)
```

```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.text_area
```
