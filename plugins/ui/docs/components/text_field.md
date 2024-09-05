# Text Field

Text fields are single-line text inputs, ideal for cases where users have a smaller amount of text to enter.

## Example

```python
from deephaven import ui


my_text_field_basic = ui.text_field(
    label="Description", on_change=lambda value: print(f"Text changed to {value}")
)
```

## UI Recommendations

Recommendations for creating text fields:

1. Every text field should have a [label](#labeling) specified. Without one, the text field is ambiguous. In the rare case that context is sufficient, the label is unnecessary; you must still include an aria-label via the `aria_label` prop.
2. Text field labels and help text should follow sentence casing.
3. A text field should not use `is_quiet` styling if it has a fixed height, given that the field underline may be too far from the text to be considered part of the component.
4. Use help text to provide instructions on input format, content, and requirements; the help text should not restate the same information as the label, or prompt a user to interact with the text field.
5. Dynamically switch between help text and error messages based on input, ensuring both convey essential input requirements.

Consider using [`text_area`](./text_area.md) for cases where multiline input is required.


## Value

A text field's value is empty by default, but an initial, uncontrolled, value can be set using the `default_value` prop, or, a controlled value can be set via the `value` prop.

```python
from deephaven import ui


@ui.component
def ui_text_field_value_examples():
    value, set_value = ui.use_state("sample_account@email.com")
    return [
        ui.text_field(
            label="Email (Uncontrolled)", default_value="sample_account@email.com"
        ),
        ui.text_field(label="Email (controlled)", value=value, on_change=set_value),
    ]


my_text_field_value_examples = ui_text_field_value_examples()
```

## HTML Forms

Text field's can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_text_field_name_example = ui.form(
    ui.text_field(label="Email", name="email", type="email")
)
```

## Labeling

To provide a visual label for the text field, use the `label` prop. To indicate that the text area is mandatory, use the `is_required` prop.

```python
from deephaven import ui


@ui.component
def ui_text_field_is_required_examples():
    return [
        ui.text_field(label="Address"),
        ui.text_field(label="Address", is_required=True),
    ]


my_text_field_is_required_example = ui_text_field_is_required_examples()
```

By setting `is_required` to True, the `necessity_indicator` is set to "icon" by default, but this can be changed. Also, the `necessity_indicator` can be used indepdendently to indicate that the text field is optional.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def ui_text_field_necessity_indicator_examples():
    return [
        ui.text_field(label="Address", is_required=True, necessity_indicator="label"),
        ui.text_field(label="Address", necessity_indicator="label"),
    ]


my_text_field_necessity_indicator_examples = (
    ui_text_field_necessity_indicator_examples()
)
```


## Events

The `on_change` property is triggered whenever the value in the text field is edited.

```python
from deephaven import ui


@ui.component
def ui_text_field_on_change_example():
    value, set_value = ui.use_state("")
    return [
        ui.text_field(label="Your text", value=value, on_change=set_value),
        ui.text(f"Text has been changed to: {value}"),
    ]


my_text_field_on_change_example = ui_text_field_on_change_example()
```


## Quiet State

The `is_quiet` prop makes text fields "quiet". This can be useful when the text area and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_text_field_is_quiet_example = ui.text_field(label="Email", is_quiet=True)
```


## Disabled State

The `is_disabled` prop disables text fields to prevent user interaction. This is useful when the text field should be visible but not available for input.

```python
from deephaven import ui


my_text_field_is_disabled_example = ui.text_field(label="Email", is_disabled=True)
```


## Read only

The `is_read_only` prop makes text fields read-only to prevent user interaction. This is different than setting the `is_disabled` prop since the text field remains focusable, and the contents of the text field remain visible.

```python
from deephaven import ui


my_text_field_is_read_only_example = ui.text_field(
    label="Email", default_value="sample@email.com", is_read_only=True
)
```


## Label position

By default, the position of a text field's label is above the text field, but it can be changed to the side using the `label_position` prop.

While labels can be placed either on top or on the side of the text field, top labels are the default recommendation. Top labels work better with longer copy, localization, and responsive layouts. Side labels are more useful when vertical space is limited.

```python
from deephaven import ui


@ui.component
def ui_text_field_label_position_examples():
    return [
        ui.text_field(label="Sample Label"),
        ui.text_field(label="Sample Label", label_position="side", label_align="start"),
    ]


my_text_field_label_position_examples = ui_text_field_label_position_examples()
```


## Help text

A text field can have both a `description` and an `error_message`. The description remains visible at all times, except when the `validation_state` is set to "invalid" and an error message is present. Use the error message to offer specific guidance on how to correct the input.

```python
from deephaven import ui


@ui.component
def ui_text_field_help_text_examples():
    return [
        ui.text_field(
            label="Comment",
            default_value="Awesome!",
            validation_state="valid",
            description="Enter a comment.",
        ),
        ui.text_field(
            label="Comment",
            validation_state="invalid",
            error_message="Empty input is not allowed.",
        ),
    ]


my_text_field_help_text_examples = ui_text_field_help_text_examples()
```


## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the text field.

```python
from deephaven import ui


my_text_field_contextual_help_example = ui.text_field(
    label="Email",
    contextual_help=ui.contextual_help(
        ui.heading("Information about emails"),
        ui.content(
            "Electronic mail, commonly shortened to 'email', is a method that uses electronic devices to deliver messages across networks"
        ),
    ),
)
```


## Custom width

The `width` prop adjusts the width of a text field, and the `max_width` prop enforces a maximum width.

```python
from deephaven import ui


@ui.component
def ui_text_field_width_examples():
    return [
        ui.text_field(label="Email", width="size-3600"),
        ui.text_field(label="Email", width="size-3600", max_width="100%"),
    ]


my_text_field_width_examples = ui_text_field_width_examples()
```


## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.ui.text_field
```






