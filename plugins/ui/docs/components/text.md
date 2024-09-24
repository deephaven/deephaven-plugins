# Text

Text represents text with no specific semantic meaning, serving as a basic element.

## Example

```python
from deephaven import ui

my_text_basic = ui.text("Paste")
```

## UI Recommendations

If single-line input is required, consider using [`text_field`](./text_field.md). If multi-line input is required, use [`text_area`](./text_area.md).


## Content

The text component represents text with no inherent semantic value within a container, like [`button`](./button.md) or [`picker`](./picker.md). It inherits styling from its parent container.

```python
from deephaven import ui


@ui.component
def ui_text_content_examples():
    return [
        ui.button(ui.text("Press me"), variant="accent", style="fill"),
        ui.picker(
            ui.item(
                ui.icon("vsGithubAlt"),
                ui.text("Github"),
                ui.text("Github Option", slot="description"),
                text_value="Github",
            ),
            ui.item(
                ui.icon("vsAzureDevops"),
                ui.text("Azure"),
                ui.text("Azure Option", slot="description"),
                text_value="Azure",
            ),
        ),
    ]


my_text_content_examples = ui_text_content_examples()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.text
```




