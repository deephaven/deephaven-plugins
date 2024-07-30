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

1. Text area should include a label, since without a label, the text area is ambiguous and not accessible.
2. Text area labels and placeholder text should follow sentence casing. 
3. Identify the minority of text area's in a form (optional or required) and either mark fields as is_required, or use the necessity_indicator to mark as optional, based on whichever occurs less.
4. A text area should not be made quiet if it has a fixed height, given that the field underline may be too far from the text to be considered part of the component.
5. Use help text to provide clear and concise instructions on input format, content, and requirements; the help text should not restate the same information as the label, or prompt a user to interact with the text area.
6. Avoid using placeholeder text given that it is redundant with help text and is inaccessible. Use help text to convey requirements or to show any formatting hints.
7. Dynamically switch between help text and error messages based on input, ensuring both convey essential input requirements.
8. Write actionable error messages that direct users towards resolving input errors. 

Consider using [`text_field`](./text_field.md) for cases wher concise, single-line input is required. In cases where the input is numeric, consider using [`number_field`](./number_field.md) 


## Value

A text area's value is empty by default, but an initial, uncontrolled, value can be set using the `default_value` prop, or, a controlled value can be set via the `value` prop.

```python
from deephaven import ui


@ui.component
def text_area_value_prop():
    return [
        ui.text_area(label="Sample (Uncontrolled)", default_value="Value 1"),
        ui.text_area(label="Sample (controlled)", value="Value 2"),
    ]


text_area_value_example = text_area_value_prop()
```

## Labeling

To provide a visual label for the text area, the `label` prop should be used. In order to indicate that the text area is mandatory, use the `is_required` prop. 

```python
from deephaven import ui


@ui.component
def text_area_is_required_prop():
    return [
        ui.text_area(label="Address"),
        ui.text_area(label="Address", is_required=True),
    ]


text_area_is_required_example = text_area_is_required_prop()
```

By setting `is_required` to True, the `necessity_indicator` is set to "icon" by default, but this can be changed. Also, the `necessity_indicator` can be used indepdendently to indicate that the text area is optional.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def text_area_necessity_indicator_prop():
    return [
        ui.text_area(label="Address", is_required=True, necessity_indicator="label"),
        ui.text_area(label="Address", necessity_indicator="label"),
    ]


text_area_necessity_indicator_example = text_area_necessity_indicator_prop()
```

## Events

A Text area's can have an `on_change`, which is triggered whenever the value in the text area is edited.

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
## Quiet State

Text area's can be made to be "quiet" using the `is_quiet` prop. This can be useful when the text area should be more subdued.

```python
from deephaven import ui


text_area_is_quiet_example = ui.text_area(label="Sample", is_quiet=True)
```

## Disabled State

Text area's can be disabled to prevent user interaction using the `is_disabled` prop. This is useful when the text area should be visible, but not available for input.

```python
from deephaven import ui


text_area_is_disabled_example = ui.text_area(label="Sample", is_disabled=True)
```

## Read only

Text area's can be made read only to prevent user interaction using the `is_read_only` prop. This is different then setting the `is_disabled` prop, since the text area remains focusable, and the contents fo the teext area remain visible.

```python
from deephaven import ui


text_area_is_read_only_example = ui.text_area(label="Sample", is_read_only=True)
```

## Label alignment and position

By default, the position of a text area's label is above the text area, but it can be changed to the side using the `label_position` prop. 

When positioned on the side, the `label_align` can be set to "start", refering to the left most edge of the text area, or to the "end, referring to the right most edge.

While labels can be placed either on top or on the side of the text area, top labels are the default recommendation because they work better with longer copy, localization, and responsive layouts, while side labels, are more useful in cases when vertical space is limited.

```python
from deephaven import ui


@ui.component
def text_area_label_position_alignment_props():
    return [
        ui.text_area(label="Test Label", label_position="side"),
        ui.text_area(label="Test Label", label_position="side", label_align="start"),
        ui.text_area(label="Test Label", label_position="side", label_align="end"),
    ]


text_area_label_position_alignment_example = text_area_label_position_alignment_props()
```

## Help text

A text area can have both a `description` and an `error_message`. The description remains visible at all times, except when the `validation_state` is set to "invalid" and an error message is present. Use the error message to offer specific guidance on how to correct the input.

```python
from deephaven import ui


@ui.component
def text_area_help_text_props():
    return [
        ui.text_area(
            label="Comment",
            default_value="Awesome!",
            validation_state="valid",
            description="Enter a comment.",
        ),
        ui.text_area(
            label="Comment",
            validation_state="invalid",
            error_message="Empty input is not allowed.",
        ),
    ]


text_area_help_text_example = text_area_help_text_props()
```

## Contextual Help

A `ui.contextual_help` can be placed next to the label, using the `contextual_help` prop, in order ot provide additional info about the text area.

```python
from deephaven import ui


text_area_contextual_help_example = ui.text_area(
    label="Comment", contextual_help=ui.contextual_help(ui.heading("Content tips"))
)
```

## Custom width

The width of a text area can be adjusted by the `width` prop, and a max width for the content can be enforced using the `max_width` prop.

```python
from deephaven import ui


@ui.component
def text_area_width_props():
    return [
        ui.text_area(label="Sample Label", width="size-3600"),
        ui.text_area(label="Sample Label", width="size-3600", max_width="100%"),
    ]


text_area_width_example = text_area_width_props()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.text_area
```
