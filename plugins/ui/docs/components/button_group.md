# Button Group

A button group is a UI component that groups buttons with related actions together.

Note that the button component can only be used within a button group.

## Example

```python
from deephaven import ui


my_button_group_basic = ui.button_group(
    ui.button("Rate Now", variant="primary"),
    ui.button("No, thanks", variant="secondary"),
    ui.button("Remind me later", variant="secondary"),
)
```

## UI Recommendations

Recommendations for creating button groups:

1. The most critical action in a button group should use an accent, primary, or negative button style, while other actions should be secondary outline buttons.
2. Button groups should be left-aligned to follow content such as blocks of text, center-aligned in empty states, and right-aligned in container components like dialogs, popovers, or cards.
3. Button priority should match text alignment: for left-aligned text, the most critical button is on the left; for right- or center-aligned text, the most critical button is on the right.
4. Icons should be used for higher priority actions if used in the button group. If the most critical action does not have an icon, avoid using icons for the other lower priority actions.

Consider using a [`action_group`](./action_group.md) to allow the user to select from a list of actions. 


## Content

Button group is used used to handle button overflow, and thus, expects buttons as children. It switches to a vertical layout when horizontal space is limited.

```python
from deephaven import ui

my_button_group_content_with_space_example = ui.button_group(
    ui.button("No, thanks", variant="secondary"),
    ui.button("Remind me later", variant="secondary"),
    ui.button("Rate Now", variant="primary"),
)

my_button_group_content_with_less_space_example = ui.button_group(
    ui.button("No, thanks", variant="secondary"),
    ui.button("Remind me later", variant="secondary"),
    ui.button("Rate Now", variant="primary"),
    width=20,
)
```


## Orientation

Setting the `orientation` prop to "vertical" will prevent any spacing-related dynamic orientation changes.

The button group will remain in the orientation regardless of the width.

```python
from deephaven import ui


my_button_group_orientation_example = ui.button_group(
    ui.button("No, thanks", variant="secondary"),
    ui.button("Remind me later", variant="secondary"),
    ui.button("Rate Now", variant="primary"),
    orientation="vertical",
)
```


## Disabled state

The `is_disabled` prop disables the button group to prevent user interaction. This is useful when the button group should be visible but not available for selection.


```python
from deephaven import ui


my_button_group_is_disabled_example = ui.button_group(
    ui.button("No, thanks", variant="secondary"),
    ui.button("Remind me later", variant="secondary"),
    ui.button("Rate Now", variant="primary"),
    is_disabled=True,
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.button_group
```
