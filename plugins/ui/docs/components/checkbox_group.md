# Checkbox Group

Checkbox groups areas allow the selection of one or more items from a list of choices, represented by checkboxes.

## Example

```python
from deephaven import ui


my_checkbox_group_basic = ui.checkbox_group(
    "Soccer",
    "Basketball",
    "Baseball",
    label="Favourite Sports",
)
```

## UI Recommendations

Recommendations for creating checkbox groups:

1. Every checkbox group should have a [label](#labeling) specified. Without one, the checkbox group is ambiguous. In the rare case that context is sufficient, the label is unnecessary; you must still include an aria-label via the `aria_label` prop.
2. While labels can be placed either on top or on the side of the checkbox groups, top labels are the default recommendation. Top labels work better with longer copy, localization, and responsive layouts. Side labels are more useful when vertical space is limited.
3. Checkbox groups can be either horizontal or vertical. Checkbox groups are vertical by default; the orientation should only be horizontal if vertical space is limited.
4. Checkbox groups can be marked as optional or required, with required groups indicated by either a “(required)” label or an asterisk icon, which should be accompanied by help text.
5. Checkbox groups should use help text for error messaging and descriptions, providing context for why a selection is required or clarifying the options.


Consider using [`checkbox_group`](./checkbox_group.md) to select or mark a single item as selected.

## Content

Checkbox group's accept checkboxes and primitive types as children. Checkbox's accept a child, which is rendered as the label of the checkbox.

```python
from deephaven import ui


my_checkbox_group_content_example = ui.checkbox_group(
    "Soccer",
    ui.checkbox("Basketball"),
    label="Favourite Sports",
)
```


## Value

Checkbox group's allows selecting zero or more items, with initial values set via `default_value` or controlled values via `value`.

```python
from deephaven import ui


@ui.component
def ui_checkbox_group_value_examples():
    value, set_value = ui.use_state(["Soccer"])
    return [
        ui.checkbox_group(
            "Soccer",
            "Basketball",
            "Baseball",
            label="Favourite Sports (uncontrolled)",
            default_value=["Soccer", "Baseball"],
        ),
        ui.checkbox_group(
            "Soccer",
            "Basketball",
            "Baseball",
            label="Favourite Sports (controlled)",
            value=value,
            on_change=set_value,
        ),
    ]


my_checkbox_group_value_examples = ui_checkbox_group_value_examples()
```


## HTML Forms

Checkbox groups can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_checkbox_name_example = ui.form(
    ui.checkbox_group(ui.checkbox("Sample Label"), name="Sample Name")
)
```


## Labeling

The checkbox group can be labeled using the `label` prop, and if no label is provided, an `aria_label` must be provided to identify the control for accessibility purposes.

```python
from deephaven import ui


@ui.component
def ui_checkbox_group_label_examples():
    return [
        ui.checkbox_group(
            ui.checkbox("Wizard", value="wizard"),
            ui.checkbox("Dragon", value="dragon"),
            label="Favorite avatars",
        ),
        ui.checkbox_group(
            ui.checkbox("Wizard", value="wizard"),
            ui.checkbox("Dragon", value="dragon"),
            aria_label="Favorite avatars",
        ),
    ]


my_checkbox_group_label_examples = ui_checkbox_group_label_examples()
```


The `is_required` prop and the `necessity_indicator` props can be used to show whether selecting an option in the checked group group is required or optional.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def ui_checkbox_group_required_examples():
    return [
        ui.checkbox_group(
            ui.checkbox("Wizard", value="wizard"),
            ui.checkbox("Dragon", value="dragon"),
            label="Favorite avatars",
            is_required=True,
        ),
        ui.checkbox_group(
            ui.checkbox("Wizard", value="wizard"),
            ui.checkbox("Dragon", value="dragon"),
            label="Favorite avatars",
            is_required=True,
            necessity_indicator="label",
        ),
        ui.checkbox_group(
            ui.checkbox("Wizard", value="wizard"),
            ui.checkbox("Dragon", value="dragon"),
            label="Favorite avatars",
            necessity_indicator="label",
        ),
    ]


my_checkbox_group_required_examples = ui_checkbox_group_required_examples()
```

## Events

Checkbox groups accept an `on_change` prop, which is triggered whenever a checkbox within the group is clicked

```python
from deephaven import ui


@ui.component
def ui_checkbox_group_event_example():
    selected, set_selected = ui.use_state(["Soccer"])
    return ui.flex(
        ui.checkbox_group(
            "Soccer",
            "Basketball",
            "Baseball",
            label="Favourite Sports (controlled)",
            value=selected,
            on_change=set_selected,
        ),
        ui.text(value=f"You have selected: {selected}!"),
        direction="column",
    )


my_checkbox_group_event_example = ui_checkbox_group_event_example()
```

To require specific checkboxes to be checked, set the `is_required` prop at the Checkbox level, not the CheckboxGroup. 

```python
from deephaven import ui


my_checkbox_group_individual_validation_example = ui.form(
    ui.checkbox_group(
        ui.checkbox("Terms and conditions", is_required=True),
        ui.checkbox("Privacy policy", is_required=True),
    ),
    validation_behavior="native",
)
```


## Orientation

While aligned vertically by default, the axis with which the checkboxes align can be changed via the `orientation` prop.

```python
from deephaven import ui


my_checkbox_group_orientation_example = ui.checkbox_group(
    ui.checkbox("Wizard", value="wizard"),
    ui.checkbox("Dragon", value="dragon"),
    label="Favorite avatars",
    orientation="horizontal",
)
```

## Label position

By default, the position of a checkbox group's label is above the checkbox group, but it can be changed to the side using the `label_position` prop. 

```python
from deephaven import ui


my_checkbox_group_label_position_example = ui.checkbox_group(
    ui.checkbox("Wizard", value="wizard"),
    ui.checkbox("Dragon", value="dragon"),
    label="Favorite avatars",
    label_position="side",
)
```


## Help text

A checkbox group can have both a `description` and an `error_message`. Use the error message to offer specific guidance on how to correct the input.

The `is_invalid` prop can be used to set whether the current checkbox group state is valid or invalid.

```python
from deephaven import ui


@ui.component
def ui_checkbox_group_help_text_examples():
    return [
        ui.checkbox_group(
            "Soccer",
            "Basketball",
            "Baseball",
            label="Favourite sports",
            description="Select an avatar from the two options.",
            value=selected,
            on_change=set_selected,
        ),
        ui.checkbox_group(
            "Soccer",
            "Basketball",
            "Baseball",
            label="Favourite sports",
            description="Select favourite sports from the two options.",
            error_message="Sample invalid error message.",
            is_invalid=True,
        ),
    ]


my_checkbox_group_help_text_examples = ui_checkbox_group_help_text_examples()
```


## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the checkbox group.

```python
from deephaven import ui


my_checkbox_group_contextual_help_example = ui.checkbox_group(
    "Soccer",
    "Basketball",
    "Baseball",
    label="Favorite sports",
    contextual_help=ui.contextual_help(ui.heading("Content tips")),
)
```


## Disabled state

The `is_disabled` prop disables a checkbox group to prevent user interaction. This is useful when the checkbox group should be visible but not available for selection.

```python
from deephaven import ui


my_checkbox_group_is_disabled_example = ui.checkbox_group(
    "Soccer",
    "Basketball",
    "Baseball",
    label="Favorite sports",
    is_disabled=True,
)
```


## Read only

The `is_read_only` prop makes checkbox groups read-only to prevent user interaction. This is different from setting the `is_disabled` prop since the checkbox group remains focusable and its options remain visible.

```python
from deephaven import ui


my_checkbox_group_is_read_only_example = ui.checkbox_group(
    "Soccer",
    "Basketball",
    "Baseball",
    label="Favorite sports",
    is_read_only=True,
)
```

## Emphasized

The `is_emphasized` prop makes the selected checkbox the user's accent color, adding a visual prominence to the selection.


```python
from deephaven import ui


my_checkbox_group_is_emphasized_example = ui.checkbox_group(
    "Soccer",
    "Basketball",
    "Baseball",
    label="Favorite sports",
    is_emphasized=True,
)
```



## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.checkbox_group
```

