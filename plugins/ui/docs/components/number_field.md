# Number Field

NumberFields allow users to enter a number, and increment or decrement the value using stepper buttons.

## Example

```python
from deephaven import ui


my_number_field = ui.number_field(
    label="Width",
    on_change=lambda value: print(f"Number changed to {value}"),
    default_value=1024,
)
```

## Value

A number field's value is empty by default, but the `default_value` prop can set an initial, uncontrolled value, or a controlled value can be set via the `value` prop.

```python
from deephaven import ui


@ui.component
def ui_number_field_value_examples():
    value, set_value = ui.use_state(5)
    return [
        ui.number_field(label="Hours (Uncontrolled)", default_value=5),
        ui.number_field(
            label="Favorite animal (controlled)", value=value, on_change=set_value
        ),
    ]


my_number_field_value_examples = ui_number_field_value_examples()
```

## HTML Forms

Number fields can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_number_field_name_example = ui.form(
    ui.number_field(
        label="Withdrawal amount",
        name="amount",
        default_value=45,
        format_options={"currency_sign": "standard"},
    )
)
```

## Labeling

To provide a visual label for the text field, use the `label` prop. To indicate that the text field is mandatory, use the `is_required` prop.

```python
from deephaven import ui


@ui.component
def ui_number_field_is_required_examples():
    return [
        ui.number_field(label="Birth year"),
        ui.number_field(label="Birth year", is_required=True),
    ]


my_number_field_is_required_example = ui_number_field_is_required_examples()
```

By setting `is_required` to True, the `necessity_indicator` is set to "icon" by default, but this can be changed. The `necessity_indicator` can also be used independently to indicate that the text field is optional.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def ui_number_field_necessity_indicator_examples():
    return [
        ui.number_field(
            label="Birth year", is_required=True, necessity_indicator="label"
        ),
        ui.number_field(label="Birth year", necessity_indicator="label"),
    ]


my_number_field_necessity_indicator_examples = (
    ui_number_field_necessity_indicator_examples()
)
```

## Events

The `on_change` property is triggered whenever the value in the text field is edited.

```python
from deephaven import ui


@ui.component
def ui_number_field_on_change_example():
    value, set_value = ui.use_state("")
    return [
        ui.number_field(label="Your age", value=value, on_change=set_value),
        ui.text(f"Age has been changed to: {value}"),
    ]


my_number_field_on_change_example = ui_number_field_on_change_example()
```

## Input Types

## Quiet State

The `is_quiet` prop makes number fields "quiet". This can be useful when the input area and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_number_field_is_quiet_example = ui.number_field(label="Age", is_quiet=True)
```

## Disabled State

The `is_disabled` prop disables text fields to prevent user interaction. This is useful when the number field should be visible but not available for input.

```python
from deephaven import ui


my_number_field_is_disabled_example = ui.number_field(label="Age", is_disabled=True)
```

## Read only

The `is_read_only` prop makes number fields read-only to prevent user interaction. This is different than setting the `is_disabled` prop since the number field remains focusable, and the contents of the number field remain visible.

```python
from deephaven import ui


my_number_field_is_read_only_example = ui.number_field(
    label="Age", default_value=25, is_read_only=True
)
```

## Label position

By default, the position of a number field's label is above the number field, but it can be changed to the side using the `label_position` prop.

While labels can be placed either on top or on the side of the number field, top labels are the default recommendation. Top labels work better with longer copy, localization, and responsive layouts. Side labels are more useful when vertical space is limited.

```python
from deephaven import ui


@ui.component
def ui_number_field_label_position_examples():
    return [
        ui.number_field(label="Sample Label"),
        ui.number_field(
            label="Sample Label", label_position="side", label_align="start"
        ),
    ]


my_number_field_label_position_examples = ui_number_field_label_position_examples()
```

## Help text

A number field can have both a `description` and an `error_message`. The description remains visible at all times, except when the `validation_state` is set to "invalid" and an error message is present. Use the error message to offer specific guidance on how to correct the input.

```python
from deephaven import ui


@ui.component
def ui_number_field_help_number_examples():
    return [
        ui.number_field(
            label="Comment",
            default_value="Awesome!",
            validation_state="valid",
            description="Enter a comment.",
        ),
        ui.number_field(
            label="Comment",
            validation_state="invalid",
            error_message="Empty input is not allowed.",
        ),
    ]


my_number_field_help_number_examples = ui_number_field_help_number_examples()
```

## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the number field.

```python
from deephaven import ui


my_number_field_contextual_help_example = ui.number_field(
    label="FPS",
    contextual_help=ui.contextual_help(
        ui.heading("What is FPS"),
        ui.content(
            "Frames Per Second (FPS) is a measure of how many individual frames (images) are displayed in one second of video or animation"
        ),
    ),
)
```

## Custom width

The `width` prop adjusts the width of a number field, and the `max_width` prop enforces a maximum width.

```python
from deephaven import ui


@ui.component
def ui_number_field_width_examples():
    return [
        ui.number_field(label="Birth year", width="size-3600"),
        ui.number_field(label="Birth year", width="size-3600", max_width="100%"),
    ]


my_number_field_width_examples = ui_number_field_width_examples()
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.ui.number_field
```