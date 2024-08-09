# Checkbox

Checkboxes enable users to select multiple items from a list or mark a single item as selected.

## Example

```python
from deephaven import ui

cb = ui.checkbox("Unsubscribe")
```

## UI recommendations

Recommendations for creating checkboxes:

1. Use emphasized checkboxes for forms, settings, or to highlight selected items like cards or table rows. Use non-emphasized checkboxes in application panels with monochrome components to keep the focus on the main content.
2. Use standalone checkboxes when the context is clear without a text label, such as when a checkbox is associated with other controls within a panel.
3. Checkboxes and radio buttons should not be used interchangably. Use checkboxes to allow multiple selections (or none) from a list. Use radio buttons to select only one option from a list of mutually exclusive choices.
4. Checkboxes should be used when selecting (ie. multiple table rows), whereas, switches should be used for activation (ie. on/off states).


## Content

Checkbox's accept a child, which is rendered as the label of the checkbox.

```python
from deephaven import ui

my_checkbox_basic = ui.checkbox("Basic Checkbox")
```

## Value

Checkboxes are not selected by default. Use the `default_selected` prop to set the initial state (uncontrolled) or the `is_selected` prop to control the selected state. 

```python
from deephaven import ui


@ui.component
def ui_checkbox_content_examples():
    selected, set_selected = ui.use_state(False)
    return ui.flex(
        ui.checkbox("Subscribe (uncontrolled)", default_selected=True),
        ui.checkbox(
            "Subscribe (uncontrolled)", is_selected=selected, on_change=set_selected
        ),
        direction="column",
    )


my_checkbox_content_examples = ui_checkbox_content_examples()
```


## Indeterminate state

A Checkbox can be set to an indeterminate state using the `is_indeterminate` prop, which overrides its appearance. The Checkbox remains visually indeterminate until prop is set to false, regardless of user interaction.


```python
from deephaven import ui


my_checkbox_is_indeterminate_example = ui.checkbox(
    "Indeterminate State", is_indeterminate=True
)
```

## HTML Forms

Checkbox's can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_checkbox_name_example = ui.form(
    ui.flex(ui.checkbox("Sample Label", name="Sample Name"))
)
```

## Events

Checkboxes accept an `on_change` prop, which is triggered whenever the Checkbox is clicked

```python
from deephaven import ui


@ui.component
def ui_checkbox_event_example():
    selected, set_selected = ui.use_state(False)
    return ui.flex(
        ui.checkbox("Subscribe", is_selected=selected, on_change=set_selected),
        ui.text_field(value="Subscribed!" if selected else "Not subscribed!"),
        direction="column",
    )


my_checkbox_event_example = ui_checkbox_event_example()
```
## Validation

Checkboxes can indicate a validation state to show if the current value is invalid, via the `is_invalid` prop. Since the invalid state is only shown through a color change, ensure the validation error is also communicated in another accessible way.

```python
from deephaven import ui


@ui.component
def ui_checkbox_validation_example():
    invalid, set_invalid = ui.use_state(False)
    return [
        ui.button(
            "Make checkbox valid" if invalid else "Make checkbox invalid",
            on_press=lambda: set_invalid(not invalid),
        ),
        ui.checkbox("I accept the terms and conditions", is_invalid=invalid),
    ]


my_checkbox_validation_example = ui_checkbox_validation_example()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.checkbox
```
