# Multi Select

Multi select displays selected items as tags inside the input area and presents a filterable dropdown list for multi-selection.

## Example

```python
from deephaven import ui


@ui.component
def ui_multi_select_basic():
    selected, set_selected = ui.use_state([])

    return ui.multi_select(
        ui.item("red panda"),
        ui.item("cat"),
        ui.item("dog"),
        ui.item("aardvark"),
        ui.item("kangaroo"),
        ui.item("snake"),
        ui.item("ant"),
        label="Favorite Animals",
        selected_keys=selected,
        on_change=set_selected,
    )


my_multi_select_basic = ui_multi_select_basic()
```

## UI Recommendations

Recommendations for creating clear and effective multi selects:

1. The multi select's text input simplifies searching through large lists. For lists with fewer than 6 items, use a checkbox group.
2. For selecting only one option, use a [`combo_box`](combo_box.md) instead.
3. Every multi select should have a label specified. Without one, the multi select is ambiguous and not accessible.
4. Options in the multi select should be kept short and concise; multiple lines are strongly discouraged. If more than one line is needed, consider using a description to add context to the option.
5. Choose a `width` for your multi selects that can accommodate most of the available options.
6. The field labels, menu items, and placeholder text should all be in sentence case.
7. Identify which multi selects are required or optional, and use the `is_required` field or the `necessity_indicator` to mark them accordingly.
8. A multi select's help text should provide actionable guidance on what to select and how to select it, offering additional context without repeating the placeholder text.
9. When an error occurs, the help text specified in a multi select is replaced by error text; thus, ensure both help and error text convey the same essential information to maintain consistent messaging and prevent loss of critical details.
10. Write error messages in a clear, concise, and helpful manner, guiding users to resolve the issue without ambiguity; ideally, they should be 1-2 short, complete sentences.

## Data sources

For multi selects, we can use a Deephaven table or [URI](uri.md) as a data source to populate the options. When using a table, the first column automatically is used as both the key and the label. If there are any duplicate keys, an error will be thrown; to avoid this, a `select_distinct` can be used on the table prior to using it as a multi select data source.

```python order=my_multi_select_table_source_example,countries
from deephaven import ui
from deephaven.plot import express as dx


countries = dx.data.gapminder().select_distinct("Country")


my_multi_select_table_source_example = ui.multi_select(countries, label="Sample Multi Select")
```

## Item table sources

If you wish to manually specify the keys and labels, use a `ui.item_table_source` to dynamically derive the options from a table.

```python order=my_multi_select_item_table_source_example,column_types
from deephaven import ui, empty_table

account_icon = "vsAccount"
columns = [
    "Key=new Integer(i)",
    "Label=new String(`Display `+i)",
    "Icon=(String) account_icon",
]
column_types = empty_table(20).update(columns)


item_table_source = ui.item_table_source(
    column_types,
    key_column="Key",
    label_column="Label",
    icon_column="Icon",
)


my_multi_select_item_table_source_example = ui.multi_select(
    item_table_source, label="User Multi Select"
)
```

## Custom Value

By default, when a multi select loses focus, it resets its input value. To allow users to enter custom values as tags, use the `allows_custom_value` prop. Pressing **Enter** when no item is focused adds the typed text as a custom tag. If the typed text matches an existing item's label, that item's key is used instead.

```python
from deephaven import ui


@ui.component
def ui_multi_select_custom_value_example():
    selected, set_selected = ui.use_state([])
    return ui.multi_select(
        ui.item("Option 1"),
        ui.item("Option 2"),
        ui.item("Option 3"),
        ui.item("Option 4"),
        ui.item("Option 5"),
        allows_custom_value=True,
        selected_keys=selected,
        on_change=set_selected,
        label="Select or type options",
    )


my_multi_select_custom_value_example = ui_multi_select_custom_value_example()
```

## HTML Forms

Multi selects can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission. The `form_value` prop determines whether comma-joined keys or labels of the selected items are submitted via the hidden form input.

```python
from deephaven import ui


@ui.component
def ui_multi_select_form_example():
    return ui.form(
        ui.multi_select(
            ui.item("Chocolate"),
            ui.item("Mint"),
            ui.item("Vanilla"),
            ui.item("Strawberry"),
            ui.item("Cookies and Cream"),
            ui.item("Coffee"),
            ui.item("Mango"),
            label="Ice cream flavors",
            name="flavors",
        ),
        ui.button("Submit", type="submit"),
        on_submit=lambda event: print(event),
    )


my_multi_select_form_example = ui_multi_select_form_example()
```

## Labeling

Use the `label` prop to label a multi select. If no label is provided, you must use an `aria_label` to identify the control for accessibility purposes.

```python
from deephaven import ui


@ui.component
def ui_multi_select_label_examples():
    return [
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            label="Pick options",
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            aria_label="Pick options",
        ),
    ]


my_multi_select_label_examples = ui_multi_select_label_examples()
```

Use the `is_required` prop and the `necessity_indicator` props to show whether selecting an option in the multi-select is required or optional.

When the `necessity_indicator` prop is set to "label", a localized string for "(required)" or "(optional)" will automatically be generated.

```python
from deephaven import ui


@ui.component
def ui_multi_select_required_examples():
    return [
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            label="Pick options",
            is_required=True,
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            label="Pick options",
            is_required=True,
            necessity_indicator="label",
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            label="Pick options",
            necessity_indicator="label",
        ),
    ]


my_multi_select_required_examples = ui_multi_select_required_examples()
```

## Selection

Use `selected_keys` or `default_selected_keys` to set the selected options.

`default_selected_keys` is useful for simpler scenarios where you don't need to control the state externally. Use `selected_keys`for scenarios where the state should be managed by the parent component, providing control and flexibility over the selection of the multi select.

```python
from deephaven import ui


@ui.component
def ui_multi_select_selected_keys_examples():
    options, set_options = ui.use_state(["Option 1", "Option 3"])
    return [
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            default_selected_keys=["Option 2", "Option 4"],
            label="Pick options (uncontrolled)",
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            selected_keys=options,
            on_change=set_options,
            label="Pick options (controlled)",
        ),
    ]


my_multi_select_selected_keys_examples = ui_multi_select_selected_keys_examples()
```

## Sections

Multi selects support sections to group options. Sections can be used by wrapping groups of items in a `section` element. Each Section takes a title and key prop.

Note that, when searching for options, searching by section will not result in the respective options within that section appearing.

> [!CAUTION]
> Sections can only be used directly, not from a table data source.

```python
from deephaven import ui


my_multi_select_section_example = ui.multi_select(
    ui.section(
        ui.item("Option 1"),
        ui.item("Option 2"),
        ui.item("Option 3"),
        ui.item("Option 4"),
        ui.item("Option 5"),
        ui.item("Option 6"),
        ui.item("Option 7"),
        ui.item("Option 8"),
        title="Section 1",
    ),
    ui.section(
        ui.item("Option 9"),
        ui.item("Option 10"),
        ui.item("Option 11"),
        ui.item("Option 12"),
        ui.item("Option 13"),
        ui.item("Option 14"),
        ui.item("Option 15"),
        ui.item("Option 16"),
        title="Section 2",
    ),
    label="Pick options",
)
```

## Events

Multi selects support selection via mouse, keyboard, and touch. You can handle all these via the `on_change` prop. Additionally, multi selects accept an `on_input_change` prop, which is triggered whenever the search value is edited by the user, whether through typing or option selection.

Each interaction within the multi select will trigger its associated event handler. For instance, typing in the input field triggers the `on_input_change`, not the `on_change`.

> [!NOTE]
> This is not the case for selections: when a selection is made, both the `on_change` and `on_input_change` are triggered.

```python
from deephaven import ui


@ui.component
def ui_multi_select_events_example():
    input_value, set_input_value = ui.use_state("")
    selection_state, set_selection_state = ui.use_state([])

    def handle_input_change(new_value):
        set_input_value(new_value)
        print(f"Text changed to {new_value}")

    def handle_selection_change(new_value):
        set_selection_state(new_value)
        print(f"Selection changed to {new_value}")

    return ui.multi_select(
        ui.item("Option 1"),
        ui.item("Option 2"),
        ui.item("Option 3"),
        ui.item("Option 4"),
        ui.item("Option 5"),
        ui.item("Option 6"),
        ui.item("Option 7"),
        ui.item("Option 8"),
        ui.item("Option 9"),
        input_value=input_value,
        on_input_change=handle_input_change,
        selected_keys=selection_state,
        on_change=handle_selection_change,
        label="Pick options",
    )


my_multi_select_events_example = ui_multi_select_events_example()
```

## Complex items

Items within a multi select can include additional content to better convey options. You can add icons, avatars, and descriptions to the children of an `ui.item`. When adding a description, set the `slot` prop to "description" to differentiate between the text elements.

```python
from deephaven import ui


my_multi_select_complex_items_example = ui.multi_select(
    ui.item(
        ui.icon("vsGithubAlt"),
        ui.text("Github"),
        ui.text("Github Option", slot="description"),
        text_value="Github",
    ),
    ui.item(
        ui.icon("vsAzureDevops"),
        ui.text("Azure"),
        ui.text("Azure Option", slot="description"),
        text_value="Azure",
    ),
    label="Pick services",
)
```

## Validation

The `is_required` prop ensures that the user selects an option. The related `validation_behaviour` prop allows the user to specify aria or native verification.

When the prop is set to "native", validation errors block form submission and are displayed automatically as help text.

```python
from deephaven import ui


@ui.component
def ui_multi_select_validation_behaviour_example():
    return ui.form(
        ui.multi_select(
            ui.section(ui.item("Option 1"), ui.item("Option 2"), title="Section 1"),
            validation_behavior="aria",
            is_required=True,
            label="Pick options",
        )
    )


my_multi_select_validation_behaviour_example = (
    ui_multi_select_validation_behaviour_example()
)
```

## Trigger Options

By default, the multi select's menu opens when the user types into the input field (`"input"`). This behavior can be changed to open on focus (`"focus"`) or only when the field button is clicked (`"manual"`) using the `menu_trigger` prop.

```python
from deephaven import ui


@ui.component
def ui_multi_select_trigger_option_examples():
    return [
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            label="Select Options",
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            label="Select Options",
            menu_trigger="focus",
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            label="Select Options",
            menu_trigger="manual",
        ),
    ]


my_multi_select_trigger_option_examples = ui_multi_select_trigger_option_examples()
```

## Label position

By default, the label is positioned above the multi select, but it can be moved to the side using the `label_position` prop.

```python
from deephaven import ui


@ui.component
def ui_multi_select_label_position_examples():
    return [
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            label="Test Label",
        ),
        ui.multi_select(
            ui.item("Option 1"),
            ui.item("Option 2"),
            ui.item("Option 3"),
            ui.item("Option 4"),
            ui.item("Option 5"),
            ui.item("Option 6"),
            ui.item("Option 7"),
            ui.item("Option 8"),
            ui.item("Option 9"),
            label="Test Label",
            label_position="side",
        ),
    ]


my_multi_select_label_position_examples = ui_multi_select_label_position_examples()
```

## Quiet State

The `is_quiet` prop makes a multi select "quiet". This can be useful when the multi select and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_multi_select_is_quiet_example = ui.multi_select(
    ui.item("Option 1"),
    ui.item("Option 2"),
    ui.item("Option 3"),
    ui.item("Option 4"),
    ui.item("Option 5"),
    ui.item("Option 6"),
    ui.item("Option 7"),
    ui.item("Option 8"),
    ui.item("Option 9"),
    is_quiet=True,
    label="Pick options",
)
```

## Disabled State

The `is_disabled` prop disables a multi select to prevent user interaction. This is useful when the multi select should be visible but unavailable for selection.

```python
from deephaven import ui


my_multi_select_is_disabled_example = ui.multi_select(
    ui.item("Option 1"),
    ui.item("Option 2"),
    ui.item("Option 3"),
    ui.item("Option 4"),
    ui.item("Option 5"),
    ui.item("Option 6"),
    ui.item("Option 7"),
    ui.item("Option 8"),
    ui.item("Option 9"),
    is_disabled=True,
    label="Pick options",
)
```

## Read-only State

The `is_read_only` prop prevents user input in a multi select, but the selected options should be visible.

```python
from deephaven import ui


my_multi_select_is_read_only_example = ui.multi_select(
    ui.item("Option 1", key="Option 1"),
    ui.item("Option 2", key="Option 2"),
    ui.item("Option 3", key="Option 3"),
    ui.item("Option 4", key="Option 4"),
    ui.item("Option 5", key="Option 5"),
    ui.item("Option 6", key="Option 6"),
    ui.item("Option 7", key="Option 7"),
    ui.item("Option 8", key="Option 8"),
    default_selected_keys=["Option 1", "Option 3"],
    is_read_only=True,
    label="Pick options",
)
```

## Help text

A multi select can have both a `description` and an `error_message`. The description remains visible at all times. Use the error message to offer specific guidance on how to correct the input.

```python
from deephaven import ui


@ui.component
def ui_multi_select_help_text_examples():
    return [
        ui.multi_select(
            ui.section(
                ui.item("Option 1", key="Option 1"),
                ui.item("Option 2", key="Option 2"),
                ui.item("Option 3", key="Option 3"),
                ui.item("Option 4", key="Option 4"),
                ui.item("Option 5", key="Option 5"),
                ui.item("Option 6", key="Option 6"),
                ui.item("Option 7", key="Option 7"),
                ui.item("Option 8", key="Option 8"),
                title="Section 1",
            ),
            label="Sample Label",
            description="Select one or more options.",
        ),
        ui.multi_select(
            ui.section(
                ui.item("Option 1", key="Option 1"),
                ui.item("Option 2", key="Option 2"),
                ui.item("Option 3", key="Option 3"),
                ui.item("Option 4", key="Option 4"),
                ui.item("Option 5", key="Option 5"),
                ui.item("Option 6", key="Option 6"),
                ui.item("Option 7", key="Option 7"),
                ui.item("Option 8", key="Option 8"),
                title="Section 1",
            ),
            label="Sample Label",
            validation_state="invalid",
            error_message="Sample invalid error message.",
        ),
    ]


my_multi_select_help_text_examples = ui_multi_select_help_text_examples()
```

## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the multi select.

```python
from deephaven import ui


my_multi_select_contextual_help_example = ui.multi_select(
    ui.section(
        ui.item("Option 1"),
        ui.item("Option 2"),
        ui.item("Option 3"),
        ui.item("Option 4"),
        ui.item("Option 5"),
        ui.item("Option 6"),
        ui.item("Option 7"),
        ui.item("Option 8"),
        title="Section 1",
    ),
    label="Sample Label",
    contextual_help=ui.contextual_help(
        ui.heading("Content tips"), ui.content("Tips for the content.")
    ),
)
```

## Custom width

The `width` prop adjusts the width of a multi select, and the `max_width` prop enforces a maximum width.

```python
from deephaven import ui


@ui.component
def ui_multi_select_width_examples():
    return [
        ui.multi_select(
            ui.item("Option 1", key="Option 1"),
            ui.item("Option 2", key="Option 2"),
            ui.item("Option 3", key="Option 3"),
            ui.item("Option 4", key="Option 4"),
            ui.item("Option 5", key="Option 5"),
            ui.item("Option 6", key="Option 6"),
            ui.item("Option 7", key="Option 7"),
            ui.item("Option 8", key="Option 8"),
            width="size-3600",
        ),
        ui.multi_select(
            ui.item("Option 1", key="Option 1"),
            ui.item("Option 2", key="Option 2"),
            ui.item("Option 3", key="Option 3"),
            ui.item("Option 4", key="Option 4"),
            ui.item("Option 5", key="Option 5"),
            ui.item("Option 6", key="Option 6"),
            ui.item("Option 7", key="Option 7"),
            ui.item("Option 8", key="Option 8"),
            width="size-3600",
            max_width="100%",
        ),
    ]


my_multi_select_width_examples = ui_multi_select_width_examples()
```

## Align and Direction

The `align` prop sets the text alignment of the options in the multi select, while the `direction` prop specifies which direction the menu will open.

```python
from deephaven import ui


@ui.component
def ui_multi_select_alignment_direction_examples():
    return ui.view(
        ui.flex(
            ui.multi_select(
                ui.item("Option 1"),
                ui.item("Option 2"),
                ui.item("Option 3"),
                ui.item("Option 4"),
                ui.item("Option 5"),
                ui.item("Option 6"),
                ui.item("Option 7"),
                ui.item("Option 8"),
                align="end",
                menu_width="size-3000",
            ),
            ui.multi_select(
                ui.item("Option 1"),
                ui.item("Option 2"),
                ui.item("Option 3"),
                ui.item("Option 4"),
                ui.item("Option 5"),
                ui.item("Option 6"),
                ui.item("Option 7"),
                ui.item("Option 8"),
                direction="top",
            ),
            gap="size-150",
            direction="column",
        ),
        padding=40,
    )


my_multi_select_alignment_direction_examples = (
    ui_multi_select_alignment_direction_examples()
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.multi_select
```
