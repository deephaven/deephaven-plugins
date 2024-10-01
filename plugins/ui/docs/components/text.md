# Text

Text represents text with no specific semantic meaning, serving as a basic element. It is equivalent to an HTML span element. 

## Example

```python
from deephaven import ui

my_text_basic = ui.text("Hello world")
```

## UI Recommendations

Consider using [`ui.heading`](./heading.md) if you want to create different types of headings.


## Content

The text component is sometimes used within a parent container, like [`button`](./button.md) or [`picker`](./picker.md) to define text content when multiple children are passed (such as icons and descriptions). It inherits styling from its parent container.

```python
from deephaven import ui


@ui.component
def ui_text_content_examples():
    return [
        ui.button(ui.text("Press me"), variant="accent", style="fill"),
        ui.picker(
            ui.item(
                ui.icon("github_alt"),
                ui.text("Github"),
                ui.text("Github Option", slot="description"),
                text_value="Github",
            ),
            ui.item(
                ui.icon("azure_devops"),
                ui.text("Azure"),
                ui.text("Azure Option", slot="description"),
                text_value="Azure",
            ),
        ),
    ]


my_text_content_examples = ui_text_content_examples()
```


## Color

The color prop sets the text color for the text component.

```python
from deephaven import ui


my_text_color_example = ui.flex(
    ui.text("Faded text", color="gray-500"),
    ui.text("Negative text", color="negative"),
    ui.text("Positive text", color="positive"),
    ui.text("Hex color", color="#FA8072"),
    ui.text("Nested ", ui.text("text", color="green"), "!"),
    direction="column",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.text
```




