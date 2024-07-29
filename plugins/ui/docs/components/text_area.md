# Text Area

TextAreas are multiline text inputs, ideal for cases where users have a sizable amount of text to enter. They are available in multiple styles for various purposes, allowing for all customizations that are available to text fields.

## Example

```python
from deephaven import ui

ta = ui.text_area(
    label="Description", on_change=lambda value: print(f"Text changed to {value}")
)
```

## UI Recommendations

Recommendations for creating clear and effective text areas:

1. Text area labels should be clear and concise. No more than 4 words or 20 characters is recommended.
2. Avoid using punctuation at the end of labels or placeholder text. 
3. Placeholder text should give users a clear indication of what needs to be typed in the text area, it should not be a replacement for a label.

Consider using [`text_field`](./text_field.md) for cases wher concise, single-line input is required. In cases where the input is numeric, consider using [`number_field`](./number_field.md) 


## Variants

Buttons can have different styles to indicate their purpose.

```python
from deephaven import ui


@ui.component
def button_variants():
    return [
        ui.button("Accent fill", variant="accent", style="fill"),
        ui.button("Accent outline", variant="accent", style="outline"),
        ui.button("Primary fill", variant="primary", style="fill"),
        ui.button("Primary outline", variant="primary", style="outline"),
        ui.button("Secondary fill", variant="secondary", style="fill"),
        ui.button("Secondary outline", variant="secondary", style="outline"),
        ui.button("Negative fill", variant="negative", style="fill"),
        ui.button("Negative outline", variant="negative", style="outline"),
    ]


button_variants_example = button_variants()
```

Static-color buttons are available in white and black. They don't dynamically change in response to the user's theme. They should only be used over fixed-color backgrounds, not over theme colors that may change.

```python
from deephaven import ui


@ui.component
def static_buttons():
    return [
        ui.view(
            ui.button_group(
                ui.button("White fill", static_color="white", style="fill"),
                ui.button(
                    "White outline",
                    static_color="white",
                    style="outline",
                ),
            ),
            background_color="#000066",
            padding="size-300",
        ),
        ui.view(
            ui.button_group(
                ui.button("Black fill", static_color="black", style="fill"),
                ui.button(
                    "Black outline",
                    static_color="black",
                    style="outline",
                ),
            ),
            background_color="#FFFF00",
            padding="size-300",
        ),
    ]


static_buttons_example = static_buttons()
```

## Icon buttons

Buttons can have icons when necessary to provide additional context. If no visible label is provided (e.g., an icon-only button), an alternative text label must be provided to identify the control for accessibility using the `aria-label` prop. See [icon](./icon.md) for a list of available icons.

```python
from deephaven import ui


@ui.component
def icon_buttons():
    return [
        ui.button(ui.icon("squirrel"), "Squirrel"),
        ui.button(ui.icon("squirrel"), aria_label="Squirrel"),
    ]


icon_buttons_example = icon_buttons()
```

## Pending State

Buttons can be in a pending state to indicate that an action is in progress (such as an asynchronous server request). After a one-second delay, an indeterminate spinner will be displayed in place of the button label and icon. You can trigger this behavior by setting the `is_pending` prop. Button events are disabled while `is_pending` is true.

```python
from deephaven import ui
from threading import Timer


@ui.component
def pending_button():
    [pending, set_pending] = ui.use_state(False)

    def handle_on_press():
        # start an asynchronous thing
        timeout = Timer(3, callback_finshed)  # use a timer to wait 3 seconds
        timeout.start()

        # turn on loading spinner
        set_pending(True)

    def callback_finshed():
        # turn of loading spinner
        set_pending(False)

    return ui.button(
        "Pending request",
        on_press=handle_on_press,
        is_pending=pending,
        variant="accent",
    )


pending_example = pending_button()
```

## Disabled State

Buttons can be disabled to prevent user interaction. This is useful when the button is not available for interaction, but should still be visible.

```python
from deephaven import ui

btn = ui.button("Disabled button", is_disabled=True)
```

## Button links

Buttons can be used as links to navigate to another page if the `href` attribute is provided.

```python
from deephaven import ui

btn = ui.button("Go to deephaven.io", href="https://deephaven.io")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.button
```
