# Action Button

ActionButtons allow users to perform an action. The'yre used for similar, task-based options within a workflow, and are ideal for interfaces where buttons aren't meant to draw a lot of attention

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
5. Use icons only when necessary, and not as a replacement for text or decoration. Icons should be used to provide additional context to the button's action.
6. When presenting choices, use a single filled accent button to suggest to users the recommended choice, paired with outlined primary or secondary buttons for the other options. This helps to visually distinguish the primary action from the secondary actions.
7. Use negative buttons sparingly, as they can be visually distracting. They should be used for actions that are destructive or irreversible.

Consider using [`button`](./button.md) to draw attention to important actions users need to perform or for navigating to a different page. To represent a binary choice, use a [`toggle_button`](./toggle_button.md) instead. If you have a collection of related buttons, you can group them using a [`button_group`](./button_group.md).

## Events

ActionButtons accept a value to display and can trigger actions based on events such as setting state when pressed. See the [API Reference](#api-reference) for a full list of available events.

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

## Variants

ActionButtons have different types that change their behaviour in an HTML form: button (default), submit, reset. 

```python
from deephaven import ui


@ui.component
def action_button_types():
    count, set_count = ui.use_state(42)

    def handle_submit(data):
        print(f"Hello {data['name']}, you are {data['age']} years old")

    def handle_reset(data):
        print(f"Form reset")

    return ui.form(
        ui.text_field(default_value="Douglas", name="name"),
        ui.number_field(default_value=42, name="age"),
        ui.button_group(
            ui.action_button("Reset", type="reset"),
            ui.action_button("Submit", type="submit"),
        ),
        on_submit=handle_submit,
        on_reset=handle_reset,
    )


action_button_types_example = action_button_types()
```

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

## Quiet State

ActionButtons can have no visible background until they're interacted with. This style works best when a clear layout (vertical stack, table, grid) makes it easy to parse the buttons. Too many quiet components in a small space can be hard to read.

```python
from deephaven import ui

btn = ui.action_button("Quiet button", is_quiet=True)
```

## Disabled State

ActionButtons can be disabled to prevent user interaction. This is useful when the button is not available for interaction, but should still be visible.

```python
from deephaven import ui

btn = ui.action_button("Disabled button", is_disabled=True)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.action_button
```
