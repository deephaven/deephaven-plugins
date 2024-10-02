# Form

Forms allow users to enter data that can be submitted while providing alignment and styling for form fields

## Example

```python
from deephaven import ui


@ui.component
def ui_form():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(
            value=value, name="name", label="Enter name", on_change=set_value
        ),
    )


my_form = ui_form()
```

## Label Position & Alignment

```python
from deephaven import ui


@ui.component
def ui_form_label():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(value=value, name="name", label="Name", on_change=set_value),
        label_align="start",
        label_position="side",
    )


my_form_label = ui_form_label()
```

## Quiet

```python
from deephaven import ui


@ui.component
def ui_form_quiet():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(
            value=value, name="name", label="Enter name", on_change=set_value
        ),
        is_quiet=True,
    )


my_form_quiet = ui_form_quiet()
```

## Emphasized

```python
from deephaven import ui


@ui.component
def ui_form_emphasized():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(
            value=value, name="name", label="Enter name", on_change=set_value
        ),
        is_emphasized=True,
    )


my_form = ui_form_emphasized()
```

## Disabled

```python
from deephaven import ui


@ui.component
def ui_form_disabled():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(
            value=value, name="name", label="Enter name", on_change=set_value
        ),
        is_disabled=True,
    )


my_form_disabled = ui_form_disabled()
```

## Required and Necessity Indicator

```python
from deephaven import ui


@ui.component
def ui_form_required():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(value=value, name="name", label="Name", on_change=set_value),
        is_required=True,
        necessity_indicator="label",
    )


my_form_required = ui_form_required()
```

## Read only

```python
from deephaven import ui


@ui.component
def ui_form_read_only():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(value=value, name="name", label="Name", on_change=set_value),
        is_read_only=True,
    )


my_form_read_only = ui_form_read_only()
```

## Validation State

```python
from deephaven import ui


@ui.component
def ui_form_validation_state():
    value, set_value = ui.use_state("")

    return ui.form(
        ui.text_field(value=value, name="name", label="Name", on_change=set_value),
        validation_state="invalid",
    )


my_form_validation_state = ui_form_validation_state()
```

## Event Handler

