# Combo Box

ComboBoxes combine a text input field with a picker menu, enabling users to filter and select from longer lists based on their query.

## Example

```python
from deephaven import ui


@ui.component
def combo_box():
    option, set_option = use_state("")

    return ui.combo_box(
        ui.item("red panda"),
        ui.item("cat"),
        ui.item("dog"),
        ui.item("aardvark"),
        ui.item("kangaroo"),
        ui.item("snake"),
        label="Favourite Animal",
        on_selection_change=set_option,
    )


result = combo_box()
```

## UI Recommendations

Recommendations for creating clear and effective combo boxes:

1. The combo box's text input simplifies searching through large lists. For lists with fewer than 6 items, use radio buttons. For lists with more than 6 items, assess if the list is complex enough to need searching and filtering, and if not, use a picker instead.
2. It's acceptable to suppress the popover when the combo box contains familiar entries. The popover can still be opened by clicking the field button with the chevron.
3. Immediately launch the popover if users are unfamiliar with the combo box content or if the data is particularly complex.
4. Launch the popover on input change if users can begin typing without needing to see a long list of options first.
5. Every combo box should have a label specified, without one, the picker is both ambiguous and not accessible.
6. Options in the combo box should be kept short and concise; multiple lines are strongly discouraged.
7. Choose a `width` for your combo boxes that can accommodate most of the available options. When the combo box is focused and the typed input exceeds the field's width, allow the leftmost text to scroll out of view while continuing to enter text towards the chevron. When the combo box is deselected, truncate the selected entry with an ellipsis before it overlaps with the chevron button.
8. The field labels, menu items, and placeholder text should all be in sentence case.
9. Identify which combo boxes are required or optional, and use the `is_required` field or the `necessity_indicator` to mark them accordingly.
10. Use help text instead of placeholder text to convey requirements or formatting examples. Having both can be redundant and distracting, especially if they communicate the same information.
11. A combo boxes' help text should provide actionable guidance on what to select and how to select it, offering additional context without repeating the placeholder text.
12. When an error occurs, the help text specified in a combo box is replaced by error text; thus, ensure both help and error text convey the same essential information to maintain consistent messaging and prevent loss of critical details.
13. Write error messages in a clear, concise, and helpful manner, guiding users to resolve the issue without ambiguity; ideally, they should be 1-2 short, complete sentences.


## Labeling

The picker can be labeled using the `label` prop, and if no label is provided, an `aria_label` msut be provided to identify the control for accessibility purposes.

```python
from deephaven import ui


option, set_option = ui.use_state("Option 2")


@ui.component
def label_variants():
    return [
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            label="Pick an option",
        ),
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            aria_label="Pick an option",
        ),
    ]


label_examples = label_variants()
```

The `is_required` prop and the `necessary_indicator` props can be used to show whether selecting an option in the picker is required or option.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


option, set_option = ui.use_state("Option 2")


@ui.component
def required_variants():
    return [
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            label="Pick an option",
            is_required=True,
        ),
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            label="Pick an option",
            is_required=True,
            necessary_indicator="label",
        ),
        ui.picker(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            label="Pick an option",
            necessary_indicator="label",
        ),
    ]


required_examples = required_variants()
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


picker_name_example = ui.form(
    ui.flex(ui.picker(ui.item("Option 1"), ui.item("Option 2"), name="Sample Name"))
)
```


## Sections

Picker supports sections in order to group options. Sections can be used by wrapping groups of items in a Section element. Each Section takes a title and key prop.

```python
from deephaven import ui

picker_name_example = ui.picker(
    ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
    ui.section(ui.item("Option 3"), ui.item("Option 4"), title="Section 2"),
)
```

## Events

The Picker component supports selection through mouse, keyboard, and touch inputs via the `on_selection_change` prop, which receives the selected key as an argument.

```python
from deephaven import ui

value, set_value = use_state("")

picker_events_example = ui.picker(
    ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
    on_selection_change=set_value,
)
```

## Complex Items

Items within a Picker can include additional content to better convey options. You can add icons, avatars, and descriptions to the children of an `ui.item`. When adding a description, set the `slot` prop to "description", in order to differentiate between the text elements.

```python
from deephaven import ui

complex_items_picker_example = ui.picker(
    ui.item(
        ui.icon("vsGithubAlt"),
        ui.text("Github"),
        ui.text("Github Option", slot="description"),
    ),
    ui.item(
        ui.icon("vsAzureDevops"),
        ui.text("Azure"),
        ui.text("Azure Option", slot="description"),
    ),
)
```

## Loading

The picker has the `is_loading` prop that will display a progress a circle when in use, which could be used to give immediate visual feedback to users, indicating that the picker is loading or processing data. It will also prevent users from interacting with the picker while data is loading, avoiding potential bad states.

```python
from deephaven import ui

loading, set_loading = ui.use_state("loading")

picker_loading_example = ui.form(
    ui.picker(
        ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
    ),
    is_loading=True if loading == "loading" else False,
)
```


## Validation

The picker has the `is_required` prop in order to ensure that the user selects an option, and also has the `validation_behaviour` prop, that allows the user to specify aria or native verification.

```python
from deephaven import ui

picker_validation_example = ui.form(
    ui.picker(
        ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
        ui.section(ui.item("Option 3"), ui.item("Option 4"), title="Section 2"),
    ),
    validation_behaviour="aria",
)
```

## Label alignment and position

By default, the position of a picker's label is above the picker, but it can be changed to the side using the `label_position` prop. 

When positioned on the side, the `label_align` property can be set to "start", referring to the leftmost edge of the picker, or to "end, referring to the rightmost edge.

```python
from deephaven import ui


@ui.component
def picker_label_position_alignment_props():
    return [
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            label="Test Label",
            label_position="side",
        ),
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            label="Test Label",
            label_position="side",
            label_align="start",
        ),
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            label="Test Label",
            label_position="side",
            label_align="end",
        ),
    ]


picker_label_position_alignment_example = picker_label_position_alignment_props()
```

## Quiet State

The `is_quiet` prop makes a picker "quiet". This can be useful when the picker and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


picker_is_quiet_example = ui.picker(
    ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
    is_quiet=True,
)
```

## Disabled State

The `is_disabled` prop disables a picker to prevent user interaction. This is useful when the picker should be visible but not available for selection.

```python
from deephaven import ui


picker_is_disabled_example = ui.picker(
    ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
    is_disabled=True,
)
```

## Help text

A picker can have both a `description` and an `error_message`. The description remains visible at all times, except when the `validation_state` is set to "invalid" and an error message is present. Use the error message to offer specific guidance on how to correct the input.

```python
from deephaven import ui


@ui.component
def picker_help_text_props():
    return [
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            label="Sample Label",
            default_value="Awesome!",
            validation_state="valid",
            description="Enter a comment.",
        ),
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            label="Sample Label",
            validation_state="invalid",
            error_message="Sample invalid error message.",
        ),
    ]


picker_help_text_example = picker_help_text_props()
```

## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the picker.

```python
from deephaven import ui


text_area_contextual_help_example = ui.picker(
    ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
    label="Sample Label",
    contextual_help=ui.contextual_help(ui.heading("Content tips")),
)
```

## Custom width

The `width` prop adjusts the width of a picker, and the `max_width` prop enforces a maximum width. 

```python
from deephaven import ui


@ui.component
def picker_width_props():
    return [
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            width="size-3600",
        ),
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            width="size-3600",
            max_width="100%",
        ),
    ]


picker_width_props = picker_width_props()
```

## Align and Direction

The `align` prop sets the text alignment of the options in the picker, while the `direction` prop specifies which direction the menu will open.

```python
from deephaven import ui


@ui.component
def picker_alignment_direction_props():
    return [
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            align="end",
        ),
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            direction="top",
        ),
    ]


picker_alignment_direction_example = picker_alignment_direction_props()
```

## Menu state

The open state of the picker menu can be controlled through the `is_open` and `default_open` props.

```python
from deephaven import ui

open, set_open = ui.use_state(False)


@ui.component
def picker_open_state_props():
    return [
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            open=open,
            on_open_change=set_open,
        ),
        ui.picker(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            default_open=True,
        ),
    ]


picker_open_state_example = picker_open_state_props()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.combo_box
```