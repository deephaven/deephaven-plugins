# Radio Group

A radio group is a UI component that groups multiple radio buttons together, allowing users to select one option from a set of mutually exclusive choices. 

Note that the radio component can only be used within a radio group.

## Example

```python
from deephaven import ui


my_radio_group_basic = ui.radio_group(
    ui.radio("Dogs", value="dogs"), ui.radio("Cats", value="cats")
)
```

## UI Recommendations

Recommendations for creating radio groups:

1. Every radio group should have a [label](#labeling) specified. Without one, the radio group is ambiguous. In the rare case that context is sufficient, the label is unnecessary; you must still include an aria-label via the `aria_label` prop.
2. Use radio groups when the list of options are mutually exclusive.
3. Emphasized radio buttons are ideal for forms and settings where they need to stand out, while non-emphasized radio buttons are best for monochrome application panels to keep the focus on the application.
4. The label, options, and help text should all be in sentence case.
5. Identify which radio groups are required or optional, and use the `is_required` field or the `necessity_indicator` to mark them accordingly.

Consider using a [`checkbox_group`](./checkbox_group.md) to manage multiple selections or no selections within a group at once. If you need to display a list of items driven by a Deephaven table, use a [`list_view`](./list_view.md) to dynamically generate the checkboxes.

## Value

A radio group's value is not set by default, but a single initial, uncontrolled, value can be set using the `default_value` prop, or, a controlled value can be set via the `value` prop.

```python
from deephaven import ui


@ui.component
def radio_group_value_examples():
    selected, set_selected = ui.use_state("yes")
    return [
        ui.radio_group(
            ui.radio("Yes", value="yes"),
            ui.radio("No", value="no"),
            label="Are you a wizard? (no value set)?",
        ),
        ui.radio_group(
            ui.radio("Yes", value="yes"),
            ui.radio("No", value="no"),
            label="Are you a wizard? (uncontrolled)?",
            default_value="yes",
        ),
        ui.radio_group(
            ui.radio("Yes", value="yes"),
            ui.radio("No", value="no"),
            label="Are you a wizard? (controlled)?",
            value=selected,
            on_change=set_selected,
        ),
    ]


my_radio_group_value_examples = radio_group_value_examples()
```


## HTML Forms

Radio groups can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_radio_group_name_example = ui.form(
    ui.radio_group(
        ui.radio("Yes", value="yes"),
        ui.radio("No", value="no"),
        label="Is your favorite color blue?",
    ),
)
```


## Labeling

The radio group can be labeled using the `label` prop, and if no label is provided, an `aria_label` must be provided to identify the control for accessibility purposes.

```python
from deephaven import ui


@ui.component
def ui_radio_group_label_examples():
    return [
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            label="Favorite avatar",
        ),
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            aria_label="Favorite avatar",
        ),
    ]


my_radio_group_label_examples = ui_radio_group_label_examples()
```


The `is_required` prop and the `necessity_indicator` props can be used to show whether selecting an option in the radio group is required or optional.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def ui_radio_group_required_examples():
    return [
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            label="Favorite avatar",
            is_required=True,
        ),
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            label="Favorite avatar",
            is_required=True,
            necessity_indicator="label",
        ),
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            label="Favorite avatar",
            necessity_indicator="label",
        ),
    ]


my_radio_group_required_examples = ui_radio_group_required_examples()
```


## Events

The `on_change` property is triggered whenever the value in the radio group selection is changed.

```python
from deephaven import ui


@ui.component
def ui_radio_group_on_change_example():
    value, set_value = ui.use_state("")
    return [
        ui.radio_group(
            ui.radio("Yes", value="Yes"),
            ui.radio("No", value="No"),
            label="Is vanilla the best flavor of ice cream?",
            value=value,
            on_change=set_value,
        ),
        ui.text(f"You have selected: {value}"),
    ]


my_radio_group_on_change_example = ui_radio_group_on_change_example()
```


## Validation

The `is_required` prop ensures that the user selects an option. The related `validation_behaviour` prop allows the user to specify aria or native verification.

When the prop is set to "native", the validation errors block form submission and are displayed as help text automatically.

```python
from deephaven import ui


@ui.component
def ui_radio_group_validation_behaviour_example():
    return ui.form(
        ui.radio_group(
            ui.radio("Yes", value="Yes"),
            ui.radio("No", value="No"),
            label="Is vanilla the best flavor of ice cream?",
            validation_behavior="aria",
            is_required=True,
        )
    )


my_radio_group_validation_behaviour_example = (
    ui_radio_group_validation_behaviour_example()
)
```


## Orientation

While aligned vertically by default, the axis the radio buttons align with can be changed via the `orientation` prop.

```python
from deephaven import ui


my_radio_group_orientation_example = ui.radio_group(
    ui.radio("Wizard", value="wizard"),
    ui.radio("Dragon", value="dragon"),
    label="Favorite avatar",
    orientation="horizontal",
)
```


## Label position

By default, the position of a radio group's label is above the radio group, but it can be changed to the side using the `label_position` prop. 

```python
from deephaven import ui


my_radio_group_label_position_example = ui.radio_group(
    ui.radio("Wizard", value="wizard"),
    ui.radio("Dragon", value="dragon"),
    label="Favorite avatar",
    label_position="side",
)
```


## Help text

A radio group can have both a `description` and an `error_message`. Use the error message to offer specific guidance on how to correct the input.

The `is_invalid` prop can be used to set whether the current radio group state is valid or invalid.

```python
from deephaven import ui


@ui.component
def ui_radio_group_help_text_examples():
    return [
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            label="Favorite avatar",
            description="Select an avatar from the two options.",
        ),
        ui.radio_group(
            ui.radio("Wizard", value="wizard"),
            ui.radio("Dragon", value="dragon"),
            label="Favorite avatar",
            description="Select an avatar from the two options.",
            error_message="Sample invalid error message.",
            is_invalid=True,
        ),
    ]


my_radio_group_help_text_examples = ui_radio_group_help_text_examples()
```


## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the radio group.

```python
from deephaven import ui


my_radio_group_contextual_help_example = ui.radio_group(
    ui.radio("Wizard", value="wizard"),
    ui.radio("Dragon", value="dragon"),
    label="Favorite avatar",
    contextual_help=ui.contextual_help(ui.heading("Content tips")),
)
```


## Disabled state

The `is_disabled` prop disables a radio group to prevent user interaction. This is useful when the radio group should be visible but not available for selection.

```python
from deephaven import ui


my_radio_group_is_disabled_example = ui.radio_group(
    ui.radio("Wizard", value="wizard"),
    ui.radio("Dragon", value="dragon"),
    label="Favorite avatar",
    is_disabled=True,
)
```

## Read only

The `is_read_only` prop makes radio groups read-only to prevent user interaction. This is different than setting the `is_disabled` prop since the radio group remains focusable, and the options of the radio group remain visible.

```python
from deephaven import ui


my_radio_group_is_read_only_example = ui.radio_group(
    ui.radio("Wizard", value="wizard"),
    ui.radio("Dragon", value="dragon"),
    label="Favorite avatar",
    default_value="dragon",
    is_read_only=True,
)
```

## Emphasized

The `is_emphasized` prop makes the selected radio button blue, adding a visual prominence to the selection.


```python
from deephaven import ui


my_radio_group_is_emphasized_example = ui.radio_group(
    ui.radio("Wizard", value="wizard"),
    ui.radio("Dragon", value="dragon"),
    label="Favorite avatar",
    default_value="dragon",
    is_emphasized=True,
)
```



## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.radio_group
```