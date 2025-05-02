# Text Area

Text areas are multiline text inputs, ideal for cases where users have a sizable amount of text to enter. Text areas can be customized in the same ways that text fields can.

## Example

```python
from deephaven import ui

ta = ui.text_area(
    label="Description", on_change=lambda value: print(f"Text changed to {value}")
)
```

![Text Area Basic Example](../_assets/text_area_basic.png)

## UI Recommendations

Recommendations for creating text areas:

1. Text area should include a label, or else, the text area is ambiguous and not accessible.
2. Text area labels and placeholder text should follow sentence casing.
3. A text area should not use `is_quiet` styling if it has a fixed height, given that the field underline may be too far from the text to be considered part of the component.
4. Use help text to provide instructions on input format, content, and requirements; the help text should not restate the same information as the label, or prompt a user to interact with the text area.
5. Dynamically switch between help text and error messages based on input, ensuring both convey essential input requirements.

Consider using [`text_field`](./text_field.md) for cases where concise, single-line input is required.

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

To provide a visual label for the text area, use the `label` prop. To indicate that the text area is mandatory, use the `is_required` prop.

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

The `on_change` property is triggered whenever the value in the text area is edited.

```python
from deephaven import ui


@ui.component
def text_area_on_change_prop():
    value, set_value = ui.use_state("")
    return ui.text_area(label="Your text", value=value, on_change=set_value)


text_area_on_change_example = text_area_on_change_prop()
```

## HTML Forms

Text areas can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


text_area_name_example = ui.form(ui.flex(ui.text_area(label="Comment", name="comment")))
```

## Quiet State

The `is_quiet` prop makes text areas "quiet". This can be useful when the text area and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


text_area_is_quiet_example = ui.text_area(label="Sample", is_quiet=True)
```

## Disabled State

The `is_disabled` prop disables text areas to prevent user interaction. This is useful when the text area should be visible but not available for input.

```python
from deephaven import ui


text_area_is_disabled_example = ui.text_area(label="Sample", is_disabled=True)
```

## Read only

The `is_read_only` prop makes text areas read-only to prevent user interaction. This is different than setting the `is_disabled` prop since the text area remains focusable, and the contents of the text area remain visible.

```python
from deephaven import ui


text_area_is_read_only_example = ui.text_area(label="Sample", is_read_only=True)
```

## Label position

By default, the position of a text area's label is above the text area, but it can be changed to the side using the `label_position` prop.

While labels can be placed either on top or on the side of the text area, top labels are the default recommendation. Top labels work better with longer copy, localization, and responsive layouts. Side labels are more useful when vertical space is limited.

```python
from deephaven import ui


@ui.component
def text_area_label_position_props():
    return [
        ui.text_area(label="Test Label"),
        ui.text_area(label="Test Label", label_position="side", label_align="start"),
    ]


text_area_label_position_example = text_area_label_position_props()
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

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the text area.

```python
from deephaven import ui


text_area_contextual_help_example = ui.text_area(
    label="Comment",
    contextual_help=ui.contextual_help(
        ui.heading("Sample tips"), ui.content("Enter a comment.")
    ),
)
```

## Custom width

The `width` prop adjusts the width of a text area, and the `max_width` prop enforces a maximum width.

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
