# Search Field

Search fields are specialized text fields designed for searching.

## Example

```python
from deephaven import ui


my_search_field_basic = ui.search_field(
    label="Description", on_change=lambda value: print(f"Search changed to {value}")
)
```

![Search Field Basic Example](../_assets/search_field_basic.png)

## Value

A search field's value is empty by default, but the `default_value` prop can set an initial, uncontrolled value, or a controlled value can be set via the `value` prop.

```python
from deephaven import ui


@ui.component
def ui_search_field_value_examples():
    value, set_value = ui.use_state("Aardvark")
    return [
        ui.search_field(label="Search (Uncontrolled)", default_value="Aardvark"),
        ui.search_field(label="Search (controlled)", value=value, on_change=set_value),
    ]


my_search_field_value_examples = ui_search_field_value_examples()
```

## HTML Forms

Search fields can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_search_field_name_example = ui.form(
    ui.search_field(label="Email", name="email", type="email"),
    ui.button("Submit", type="submit"),
    on_submit=print,
)
```

## Labeling

To provide a visual label for the search field, use the `label` prop. To indicate that the search field is mandatory, use the `is_required` prop.

```python
from deephaven import ui


@ui.component
def ui_search_field_is_required_examples():
    return [
        ui.search_field(label="Search"),
        ui.search_field(label="Search", is_required=True),
    ]


my_search_field_is_required_example = ui_search_field_is_required_examples()
```

By setting `is_required` to True, the `necessity_indicator` is set to "icon" by default. This can be changed with the `necessity_indicator` prop, which can be used independently to indicate that the search field is optional.

When `necessity_indicator` is set to "label," a localized string will be automatically generated for "(required)" or "(optional)."

```python
from deephaven import ui


@ui.component
def ui_search_field_necessity_indicator_examples():
    return [
        ui.search_field(label="Search", is_required=True, necessity_indicator="label"),
        ui.search_field(label="Search", necessity_indicator="label"),
    ]


my_search_field_necessity_indicator_examples = (
    ui_search_field_necessity_indicator_examples()
)
```

## Events

The `on_change` property is triggered whenever the value in the search field is edited.

```python
from deephaven import ui


@ui.component
def ui_search_field_on_change():
    value, set_value = ui.use_state("")
    return [
        ui.search_field(label="Your search", value=value, on_change=set_value),
        ui.text(f"Search has been changed to: {value}"),
    ]


my_search_field_on_change = ui_search_field_on_change()
```

The `on_submit` property is triggered whenever the value in the search field is submitted.

```python
from deephaven import ui

my_search_field_on_submit = ui.search_field(
    on_submit=lambda e: print(f"Submitted value: {e}")
)
```

The `on_clear` property is triggered whenever the value in the search field is cleared.

```python
from deephaven import ui

my_search_field_on_clear = ui.search_field(on_clear=lambda: print("Input cleared"))
```

## Input Types

The `type` prop changes the type of search field that is rendered to suit different input requirements.

```python
from deephaven import ui


@ui.component
def ui_search_field_input_types():
    return ui.form(
        ui.search_field(label="Name", type="text", is_required=True),
        ui.search_field(label="Personal Website", type="url", is_required=True),
        ui.search_field(label="Phone", type="tel", is_required=True),
        ui.search_field(label="Email", type="email", is_required=True),
    )


my_search_field_input_types = ui_search_field_input_types()
```

## Quiet State

The `is_quiet` prop makes search fields "quiet". This can be useful when the text area and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_search_field_is_quiet_example = ui.search_field(label="Animal", is_quiet=True)
```

## Disabled State

The `is_disabled` prop disables search fields to prevent user interaction. This is useful when the search field should be visible but not available for input.

```python
from deephaven import ui


my_search_field_is_quiet_example = ui.search_field(label="Animal", is_disabled=True)
```

## Read only

The `is_read_only` prop makes search fields read-only to prevent user interaction. This is different than setting the `is_disabled` prop since the search field remains focusable, and the contents of the search field remain visible.

```python
from deephaven import ui


my_search_field_is_quiet_example = ui.search_field(
    label="Animal", default_value="Panda", is_read_only=True
)
```

## Label position

By default, the position of a search field's label is above the search field, but it can be changed to the side using the `label_position` prop.

While labels can be placed either on top or on the side of the search field, top labels are the default recommendation. Top labels work better with longer copy, localization, and responsive layouts. Side labels are more useful when vertical space is limited.

```python
from deephaven import ui


@ui.component
def ui_search_field_label_position_examples():
    return [
        ui.search_field(label="Sample Label"),
        ui.search_field(
            label="Sample Label", label_position="side", label_align="start"
        ),
    ]


my_search_field_label_position_examples = ui_search_field_label_position_examples()
```

## Help text

A search field can have both a `description` and an `error_message`. The description remains visible at all times, except when the `validation_state` is set to "invalid" and an error message is present. Use the error message to offer specific guidance on how to correct the input.


```python
from deephaven import ui


@ui.component
def ui_search_field_help_text_examples():
    return [
        ui.search_field(
            label="Search",
            default_value="Sushi",
            validation_state="valid",
            description="Enter a query",
        ),
        ui.search_field(
            label="Search",
            validation_state="invalid",
            error_message="Empty input is not allowed.",
        ),
    ]


my_search_field_help_text_examples = ui_search_field_help_text_examples()
```

## Contextual Help

The `contextual_help` prop places a `ui.contextual_help` next to the label to provide additional information about the search field.


```python
from deephaven import ui


my_search_field_contextual_help_example = ui.search_field(
    label="Animal",
    contextual_help=ui.contextual_help(
        ui.heading("Information about animals"),
        ui.content(
            "Animals are classified into two main categories – the vertebrates and the invertebrates."
        ),
    ),
)
```

## Custom width

The `width` prop adjusts the width of a search field, and the `max_width` prop enforces a maximum width.


```python
from deephaven import ui


@ui.component
def ui_search_field_width_examples():
    return [
        ui.search_field(label="Animal", width="size-3600"),
        ui.search_field(label="Animal", width="size-3600", max_width="100%"),
    ]


my_search_field_width_examples = ui_search_field_width_examples()
```

## Custom icon

The `icon` prop changes the icon within the search field. This can quickly indicate to the user what the field is for. The complete list of icons can be found in [`icon`](./icon.md).


```python
from deephaven import ui


my_search_field_icon = ui.search_field(label="User", icon=ui.icon("account"))
```


## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.ui.search_field
```
