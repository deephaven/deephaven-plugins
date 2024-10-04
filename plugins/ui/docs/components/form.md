# Form

Forms allow users to enter data that can be submitted while providing alignment and styling for form fields

## Example

```python
from deephaven import ui


@ui.component
def ui_form():
    return ui.form(
        ui.text_field(name="name", label="Enter name"),
    )


my_form = ui_form()
```

## Action

The `action` prop enables forms to be sent to a URL. The example below communicates with a 3rd party server and displays the content received from the form.

```python
from deephaven import ui


@ui.component
def ui_form_action():
    return ui.form(
        ui.text_field(name="first_name", default_value="Mickey", label="First Name"),
        ui.text_field(name="last_name", default_value="Mouse", label="Last Name"),
        ui.button("Submit", type="submit"),
        action="https://postman-echo.com/get",
        method="get",
        target="_blank",
    )


my_form_action = ui_form_action()
```

## Validation Behavior

By default, validation errors will be displayed in real-time as the fields is edited but form submission is not blocked. To enable this and native HTML form validation, set `validation_behavior` to "native"

```python
from deephaven import ui


@ui.component
def ui_form_validation_behavior():
    return ui.form(
        ui.text_field(name="email", label="Email", type="email", is_required=True),
        ui.button("Submit", type="submit"),
        validation_behavior="native",
    )


my_form_validation_behavior = ui_form_validation_behavior()
```

## Label Position & Alignment

```python
from deephaven import ui


@ui.component
def ui_form_label():
    return ui.form(
        ui.text_field(name="name", label="Name"),
        label_align="start",
        label_position="side",
    )


my_form_label = ui_form_label()
```

## Quiet

The `is_quiet` prop makes form fields "quiet". This can be useful when its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


@ui.component
def ui_form_quiet():

    return ui.form(
        ui.text_field(name="name", label="Enter name"),
        is_quiet=True,
    )


my_form_quiet = ui_form_quiet()
```

## Emphasized

The `is_emphasized` prop adds visual prominence to the form fields. This can be useful when its corresponding styling should catch the user's attention.

```python
from deephaven import ui


@ui.component
def ui_form_emphasized():

    return ui.form(
        ui.text_field(name="name", label="Enter name"),
        is_emphasized=True,
    )


my_form = ui_form_emphasized()
```

## Disabled

The `is_disabled` prop disables form fields to prevent user interaction. This is useful when the fields should be visible but not available for input.

```python
from deephaven import ui


@ui.component
def ui_form_disabled():
    return ui.form(
        ui.text_field(name="name", label="Enter name"),
        is_disabled=True,
    )


my_form_disabled = ui_form_disabled()
```

## Necessity Indicator

The `necessity_indicator` prop dictates whether form labels will use an icon or a label to outline which form fields are required. The default is "icon"

```python
from deephaven import ui


@ui.component
def ui_form_indicator():
    def icon_indicator():
        return ui.form(
            ui.text_field(name="name", label="Name", is_required=True),
            ui.text_field(name="age", label="Age"),
            is_required=True,
        )

    def label_indicator():
        return ui.form(
            ui.text_field(name="name", label="Name", is_required=True),
            ui.text_field(name="age", label="Age"),
            is_required=True,
            necessity_indicator="label",
        )

    return [icon_indicator(), label_indicator()]


my_form_required = ui_form_indicator()
```

## Read only

The `is_read_only` prop makes form fields read-only to prevent user interaction. This is different than setting the `is_disabled` prop since the fields remains focusable, and the contents of the fields remain visible.

```python
from deephaven import ui


@ui.component
def ui_form_read_only():
    return ui.form(
        ui.text_field(name="name", label="Name"),
        is_read_only=True,
    )


my_form_read_only = ui_form_read_only()
```


## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.form
```
