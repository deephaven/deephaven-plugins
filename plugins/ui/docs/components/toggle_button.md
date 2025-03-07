# Toggle Button

A toggle button allows users to toggle a selection on or off, providing a way to switch between two states, such as enabling or disabling a feature.

## Example

```python
from deephaven import ui

my_toggle_button_basic = ui.toggle_button("Pin")
```

![Toggle Button Basic Example](../_assets/toggle_button_basic.png)

## UI Recommendations

If you want to represent a binary choice for the user, consider using a [`checkbox`](./checkbox.md).

## Content

A toggle button accepts a label, an icon, or both as children.

```python
from deephaven import ui


my_toggle_button = ui.toggle_button(ui.icon("pin"), ui.text("Pin content"))
```

## Accessibility

If no text is passed into the toggle button, and hence, it has no visible label, the `aria_label` prop should be set for accessibility.

```python
from deephaven import ui


my_toggle_button_accessibility_example = ui.toggle_button(
    ui.icon("pin"), aria_label="pin content"
)
```

## Value

A toggle button is not selected by default. Use the `default_selected` prop to set the initial state (uncontrolled) or the `is_selected` prop to control the selected state.

```python
from deephaven import ui


@ui.component
def ui_toggle_button_value_examples():
    selected, set_selected = ui.use_state(False)
    return [
        ui.text("Toggle Button (uncontrolled)"),
        ui.toggle_button("Pin", default_selected=True, width="90px"),
        ui.text("Toggle Button (controlled)"),
        ui.toggle_button(
            "Pin", is_selected=selected, on_change=set_selected, width="90px"
        ),
    ]


my_toggle_button_value_examples = ui_toggle_button_value_examples()
```

## Events

The `on_change` property is triggered whenever the value in the toggle button group selection is changed.

```python
from deephaven import ui


@ui.component
def ui_toggle_button_on_change_example():
    is_selected, set_is_selected = ui.use_state(False)
    return [
        ui.toggle_button(
            "Pin",
            is_selected=is_selected,
            on_change=set_is_selected,
        ),
        ui.text(
            f"The toggle button is: `{'selected' if is_selected else 'not selected'}`"
        ),
    ]


my_toggle_button_on_change_example = ui_toggle_button_on_change_example()
```

## Quiet state

The `is_quiet` prop makes a toggle button "quiet". This can be useful when the toggle button and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_toggle_button_is_quiet_example = ui.toggle_button(
    "Pin",
    is_quiet=True,
)
```

## Disabled state

The `is_disabled` prop disables a toggle button to prevent user interaction. This is useful when the toggle button should be visible but not available for selection.

```python
from deephaven import ui


my_toggle_button_is_disabled_example = ui.toggle_button(
    "Pin",
    is_disabled=True,
)
```

## Emphasized

The `is_emphasized` prop makes the toggle button the user's accent color when selected, adding a visual prominence to the selection.

```python
from deephaven import ui


my_toggle_button_is_emphasized_example = ui.toggle_button(
    "Pin",
    is_emphasized=True,
)
```

## Static Color

The `static_color` prop can be used when the toggle button is placed over a colored background.

```python
from deephaven import ui


my_toggle_button_static_color_example = ui.view(
    ui.toggle_button(
        ui.icon("pin"),
        ui.text("Pin content"),
        static_color="white",
    ),
    background_color="blue-700",
    padding="size-500",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.toggle_button
```
