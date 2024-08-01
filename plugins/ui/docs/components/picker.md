# Picker

Picker enables user to pick an option from a collapsible list of options, often used when the space is limited.

## Example

```python
from deephaven import ui

btn = ui.button("Press me", on_press=lambda: print("Button clicked"))
```

```python
from deephaven import ui


@ui.component
def picker():
    option, set_option = use_state("")

    return ui.picker(
        "Rarely",
        "Sometimes",
        "Always",
        label="Choose frequency",
        on_selection_change=set_option,
    )


result = picker()
```

## UI Recommendations

Recommendations for creating clear and effective buttons:

1. Every picker should have a label specified, without one, the picker is both ambiguous and not accessible.
2. In the rare case that context is sufficient, and thus, the label is not neccessary, make sure to still include an aria-label via the `aria_label` prop.
3. Options in the picker should be kept short and concise, multiple lines is strongly discouraged.
4. The width of the picker should be set such that the field button should not intefere with the options being displayed in full.
5. The label, menu items, and placeholder text should all be in sentence case.
6. Identify the minority of picker's in a form (optional or required) and either mark fields as `is_required`, or use the `necessity_indicator` to mark as optional, based on whichever occurs less.
7. A picker's help text should provide actionable guidance on what to select and how to select it, offering additional context without repeating the label, and should only be included if relevant to the user.
8. When an error occurs, the help text specified in a picker is replaced by error text; thus, ensure both help and error text convey the same essential information to maintain consistent messaging and prevent loss of critical details.
9. Write error messages in a clear, concise, and helpful manner, guiding users to resolve the issue without ambiguity; ideally, they should be 1-2 short, complete sentences.


## Content -- NEED TO DO

Buttons accept a value to display and can trigger actions based on events such as setting state when pressed. See the [API Reference](#api-reference) for a full list of available events.

```python
from deephaven import ui


@ui.component
def counter():
    count, set_count = use_state(0)
    return ui.button(
        f"Pressed {count} times",
        on_press=lambda: set_count(count + 1),
    )


counter_example = counter()
```


## Selection

In a picker, a selected option can be set using the `default_selected_key` or `selected_key` prop.

```python
from deephaven import ui


option, set_option = ui.use_state("Option 2")


@ui.component
def selected_key_variants():
    return [
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            default_selected_key="Option 2",
            label="Pick an option (uncontrolled)",
        ),
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            selected_key=option,
            on_selection_change=set_option,
            label="Pick an option (controlled)",
        ),
    ]


selected_keys_example = selected_key_variants()
```


## HTML Forms

Picker's can support a `name` prop for integration with HTML form, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


text_area_name_example = ui.picker(
    ui.item("Option 1"), ui.item("Option 2"), name="Sample Name"
)
```


## Sections

Picker supports sections in order to group options. Sections can be used by wrapping groups of items in a Section element. Each Section takes a title and key prop.

