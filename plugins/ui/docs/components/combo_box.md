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
4. Every combo box should have a label specified, without one, the picker is both ambiguous and not accessible.
5. Options in the combo box should be kept short and concise; multiple lines are strongly discouraged.
6. Choose a `width` for your combo boxes that can accommodate most of the available options. When the combo box is focused and the typed input exceeds the field's width, allow the leftmost text to scroll out of view while continuing to enter text towards the chevron. When the combo box is deselected, truncate the selected entry with an ellipsis before it overlaps with the chevron button.
7. The field labels, menu items, and placeholder text should all be in sentence case.
8. Identify which combo boxes are required or optional, and use the `is_required` field or the `necessity_indicator` to mark them accordingly.
9. A combo boxes' help text should provide actionable guidance on what to select and how to select it, offering additional context without repeating the placeholder text.
10. When an error occurs, the help text specified in a combo box is replaced by error text; thus, ensure both help and error text convey the same essential information to maintain consistent messaging and prevent loss of critical details.
11. Write error messages in a clear, concise, and helpful manner, guiding users to resolve the issue without ambiguity; ideally, they should be 1-2 short, complete sentences.


## Data sources

For combo boxes, we can use a Deephaven table as a data source to populate the options. When using a table, it automatically uses the first column as both the key and label. If there are any duplicate keys, an error will be thrown; to avoid this, a `select_distinct` can be used on the table prior to using it as a picker data source.

```python
from deephaven import ui, empty_table
from deephaven.plot import express as dx


t = empty_table(10).update(
    [
        "Timestamp = '2024-01-01T00:00:00 ET' + 'PT1m'.multipliedBy(ii)",
        "Group = randomInt(1, 5)",
    ]
)

stocks = dx.data.stocks().select_distinct("Sym")

combo_box_table_source_example = ui.combo_box(t, label="Sample ComboBox")

combo_box_table_source_example_2 = ui.combo_box(stocks, label="Stock Symbol ComboBox")
```


If you wish to manually specify the keys and labels, you can use a  `ui.item_table_source` to dynamically derive the options from a table. 

```python
from deephaven import ui, empty_table

icon_names = ["vsAccount"]
columns = [
    "Key=new Integer(i)",
    "Label=new String(`Display `+i)",
    "Icon=(String) icon_names[0]",
]
column_types = empty_table(20).update(columns)

item_table_source = ui.item_table_source(
    column_types,
    key_column="Key",
    label_column="Label",
    icon_column="Icon",
)

combo_box_item_table_source_example = ui.combo_box(
    item_table_source, label="User ComboBox"
)
```

## Custom Value

By default, when a ComboBox loses focus, it resets its input value to match the selected option's text or clears the input if no option is selected. To allow users to enter a custom value, use the `allows_custom_value` prop to override this behavior.


```python
from deephaven import ui


@ui.component
def combo_box_custom_value_prop():
    return [
        ui.combo_box(
            ui.section(ui.item("Option 1"), ui.item("Option 2")),
            allows_custom_value=True,
        ),
        ui.combo_box(
            ui.section(ui.item("Option 1"), ui.item("Option 2")),
            allows_custom_value=False,
        ),
    ]


combo_box_custom_value_example = combo_box_custom_value_prop()
```

## HTML Forms

Combo boxes can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission. The `form_value` prop determines whether the text or key of the selected item is submitted in an HTML form; if `allows_custom_value` is true, only the text is submitted.

```python
from deephaven import ui


@ui.component
def combo_box_form_prop():
    return [
        ui.flex(
            ui.combo_box(
                ui.item("Chocolate"),
                ui.item("Mint"),
                ui.item("Vanilla"),
                ui.item("Strawberry"),
                label="Ice cream flavor",
                allows_custom_value=True,
            ),
            ui.combo_box(
                ui.item("Panda"),
                ui.item("Cat"),
                ui.item("Dog"),
                label="Favourite Animal",
                name="favouriteAnimalId",
            ),
            gap="size-200",
        )
    ]


combo_box_form_example = combo_box_form_prop()
```

## Labeling

The combo box can be labeled using the `label` prop, and if no label is provided, an `aria_label` msut be provided to identify the control for accessibility purposes.

```python
from deephaven import ui


@ui.component
def combo_box_label_prop():
    return [
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            label="Pick an option",
        ),
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            aria_label="Pick an option",
        ),
    ]


combo_box_label_example = combo_box_label_prop()
```


The `is_required` prop and the `necessity_indicator` props can be used to show whether selecting an option in the combo box is required or optional.

When the `necessity_indicator` prop is set to "label", a localized string will be generated for "(required)" or "(optional)" automatically.

```python
from deephaven import ui


@ui.component
def combo_box_required_prop():
    return [
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            label="Pick an option",
            is_required=True,
        ),
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            label="Pick an option",
            is_required=True,
            necessity_indicator="label",
        ),
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            label="Pick an option",
            necessity_indicator="label",
        ),
    ]


combo_box_required_example = combo_box_required_prop()
```


## Selection

In a combo box, the `default_selected_key` or `selected_key` props set a selected option.

```python
from deephaven import ui


@ui.component
def combo_box_selected_key_prop():
    option, set_option = ui.use_state("Option 1")
    return [
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            default_selected_key="Option 2",
            label="Pick an option (uncontrolled)",
        ),
        ui.combo_box(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            selected_key=option,
            on_selection_change=set_option,
            label="Pick an option (controlled)",
        ),
    ]


combo_box_selected_key_example = combo_box_selected_key_prop()
```


## Sections

Combo box supports sections in order to group options. Sections can be used by wrapping groups of items in a Section element. Each Section takes a title and key prop.

```python
from deephaven import ui

combo_box_section_example = ui.combo_box(
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