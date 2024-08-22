# Action Button

Action buttons allow users to perform an action. They are used for similar, task-based options within a workflow, and are ideal for interfaces where buttons aren't meant to draw a lot of attention. Action buttons are the preferred button for taking actions on tables and plots that in some way alter tables, such as applying a filter.

## Example

```python
from deephaven import ui

btn = ui.action_button("Press me", on_press=lambda: print("Button clicked"))
```

## UI Recommendations

Recommendations for creating clear and effective action buttons:

1. Button text should be clear and concise. No more than 4 words or 20 characters is recommended.
2. Use verbs for button text to indicate the action that will be taken when the button is clicked. For example, "Save", "Delete", or "Add friend", rather than "Ok" or "Cancel". Nouns or adjectives tend to be less clear.
3. Use sentence case for button text with more than one word. For example, "Add friend" instead of "Add Friend" or "ADD FRIEND".
4. No punctuation is needed at the end of the button text.
5. For icon only buttons, include a tooltip

Consider using [`button`](./button.md) to draw attention to important actions users need to perform or for navigating to a different page. To represent a binary choice, use a [`toggle_button`](./toggle_button.md) instead. If you have a collection of related buttons, you can group them using an [`action_group`](./action_group.md).

## Events

`action_button` accept a value to display and can trigger actions based on events such as setting state when pressed. See the [API Reference](#api-reference) for a full list of available events.

```python
from deephaven import ui


@ui.component
def counter():
    count, set_count = use_state(0)
    return ui.action_button(
        f"Pressed {count} times",
        on_press=lambda: set_count(count + 1),
    )


counter_example = counter()
```

## Icon Buttons

Action buttons can have icons when necessary to provide additional context. If no visible label is provided (e.g., an icon-only button), an alternative text label must be provided to identify the control for accessibility using the `aria-label` prop. See [icon](./icon.md) for a list of available icons.

```python
from deephaven import ui


@ui.component
def ui_button_group():
    iconAndLabel = ui.button_group(
        ui.action_button("Restart", ui.icon("vsDebugRestart")),
        ui.action_button("Record", ui.icon("vsRecord")),
        ui.action_button("Play", ui.icon("vsDebugPause")),
        ui.action_button("Pause", ui.icon("vsDebugStart")),
        ui.action_button("Edit", ui.icon("vsEdit")),
        ui.action_button("Configure", ui.icon("vsGear")),
    )
    iconOnly = ui.button_group(
        ui.action_button(ui.icon("vsDebugRestart"), aria_label="Restart"),
        ui.action_button(ui.icon("vsRecord"), aria_label="Record"),
        ui.action_button(ui.icon("vsDebugPause"), aria_label="Play"),
        ui.action_button(ui.icon("vsDebugStart"), aria_label="Pause"),
        ui.action_button(ui.icon("vsEdit"), aria_label="Edit"),
        ui.action_button(ui.icon("vsGear"), aria_label="Configure"),
    )
    return [iconAndLabel, iconOnly]


my_action_buttons = ui_button_group()
```

## Quiet State

Action buttons can have no visible background until they're interacted with. This style works best when a clear layout (vertical stack, table, grid) makes it easy to parse the buttons. Too many quiet components in a small space can be hard to read.

```python
from deephaven import ui

btn = ui.action_button("Quiet button", is_quiet=True)
```

## Disabled State

Action buttons can be disabled to prevent user interaction. This is useful when the button is not currently available, but the button should still be visible.

```python
from deephaven import ui

btn = ui.action_button("Disabled button", is_disabled=True)
```

## Static Colors

Static-color buttons are available in white and black. They don't dynamically change in response to the user's theme. They should only be used over fixed-color backgrounds, not over theme colors that may change.

```python
from deephaven import ui


@ui.component
def static_buttons():
    return [
        ui.view(
            ui.action_button(
                "White outline",
                static_color="white",
            ),
            background_color="#000066",
            padding="size-300",
        ),
        ui.view(
            ui.action_button(
                "Black outline",
                static_color="black",
            ),
            background_color="#FFFF00",
            padding="size-300",
        ),
    ]


static_buttons_example = static_buttons()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.action_button
```
