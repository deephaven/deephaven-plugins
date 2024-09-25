# Heading

The Heading component is used to create different levels of headings.

By default, it creates a level 3 (`<h3>`) heading.

## Example

```python
from deephaven import ui

my_heading_basic = ui.heading("Hello world")
```

## UI recommendations

Consider using a `text` component if the content does not require a specific heading level or semantic importance, such as for paragraphs or inline text.


## Content

The heading component represents a header that inherits styling from its parent container.

```python
from deephaven import ui


@ui.component
def ui_heading_content_examples():
    return [
        ui.heading("Heading 1", level=1),
        ui.heading("Heading 2", level=2),
        ui.heading("Heading 3", level=3),
        ui.heading("Heading 4", level=4),
        ui.heading("Heading 5", level=5),
        ui.heading("Heading 6", level=6),
        ui.time_field(
            label="Sample Label",
            contextual_help=ui.contextual_help(ui.heading("Content tips")),
        ),
    ]


my_heading_content_examples = ui_heading_content_examples()
```


## Color

The color prop sets the text color for the heading component.

```python
from deephaven import ui


my_heading_faded_example = ui.heading("Faded heading", color="gray-500")
my_heading_negative_example = ui.heading("Negative heading", color="negative")
my_heading_postive_example = ui.heading("Positive heading", color="positive")
my_heading_hex_example = ui.heading("Hex color", color="#FA8072")
my_heading_colored_sentence_example = h1 = ui.heading(
    "Hello ", ui.text("world", color="accent"), "!"
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.heading
```