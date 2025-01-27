# Color Picker

A color picker integrates a swatch with a configurable popover for color editing.

## Example

```python
from deephaven import ui

my_color_picker = ui.color_picker(label="Background", default_value="#65C4D7")
```

## Value

A ColorArea requires either a default or controlled value. Use the `default_value` prop to set the initial state (uncontrolled) or the `value` prop to control the current state.

```python
from deephaven import ui


@ui.component
def ui_color_picker_value():
    value, set_value = ui.use_state("#65C4D7")

    return [
        ui.color_picker(label="Uncontrolled", default_value="#65C4D7"),
        ui.color_picker(label="Controlled", value=value, on_change=set_value),
    ]


my_color_picker_value = ui_color_picker_value()
```

## Labeling

A visual label can be provided using the `label` prop. If a visible label isn't specified, an `aria_label` prop should be provided for accessiblity

```python
from deephaven import ui


@ui.component
def ui_color_picker_label():
    return [
        ui.color_picker(label="Label", default_value="#65C4D7"),
        ui.color_picker(aria_label="Label", default_value="#65C4D7"),
    ]


my_color_picker_label = ui_color_picker_label()
```

## Events

Color pickers accept an `on_change` prop which triggers when the value is edited.

```python
from deephaven import ui


@ui.component
def ui_color_picker_event():
    return [
        ui.color_picker(
            label="Label",
            default_value="#65C4D7",
            on_change=lambda x: print("Color: ", x),
        )
    ]


my_color_picker_label = ui_color_picker_event()
```

## Visual Options

### Hide alpha channel

```python
from deephaven import ui

my_color_picker_hide_alpha_channel = ui.color_picker(
    ui.color_editor(hide_alpha_channel=True),
    label="Background",
    default_value="#65C4D7",
)
```

### Rounding

```python
from deephaven import ui


@ui.component
def ui_color_picker_rounding():
    value, set_value = ui.use_state("#65C4D7")

    return [
        ui.color_picker(label="None", default_value="#65C4D7", rounding="none"),
        ui.color_picker(label="Default", default_value="#FAD35B", rounding="default"),
        ui.color_picker(label="Full", default_value="#EE5D82", rounding="full"),
    ]


my_color_picker_rounding = ui_color_picker_rounding()
```

### Size

```python
from deephaven import ui


@ui.component
def ui_color_picker_size():
    value, set_value = ui.use_state("#65C4D7")

    return [
        ui.color_picker(label="Extra small", default_value="#65C4D7", size="XS"),
        ui.color_picker(label="Small", default_value="#FAD35B", size="S"),
        ui.color_picker(label="Medium", default_value="#EE5D82", size="M"),
        ui.color_picker(label="Large", default_value="#FFFFFF", size="L"),
    ]


my_color_picker_size = ui_color_picker_size()
```