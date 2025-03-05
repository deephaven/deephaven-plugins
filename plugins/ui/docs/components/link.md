# Link

Links allow users to navigate to a specified location.

## Example

```python
from deephaven import ui

my_link_basic = ui.link("Learn more about Deephaven", href="https://deephaven.io/")
```

![Link Basic Example](../_assets/Link_basic.png)

## Content

The link component accepts other components, such as `text` and `icon`, as children.

```python
from deephaven import ui


@ui.component
def ui_link_content_examples():
    return [
        ui.link(ui.icon("github"), href="https://github.com/deephaven"),
        ui.link("Deephaven Website", href="https://deephaven.io/"),
    ]


my_link_content_examples = ui_link_content_examples()
```

## Variants

Links can have different styles to indicate their purpose.

```python
from deephaven import ui


@ui.component
def ui_link_variant_examples():
    return [
        ui.link("Deephaven", href="https://deephaven.io/", variant="primary"),
        ui.link(
            "Contact the team",
            href="https://deephaven.io/contact",
            variant="secondary",
        ),
    ]


my_link_variant_examples = ui_link_variant_examples()
```

## Over background

Links can be placed over a background to add a visual prominence to the link.

```python
from deephaven import ui


my_link_over_background_example = ui.view(
    ui.link(
        "Learn more about pandas here!",
        href="https://en.wikipedia.org/wiki/Giant_panda",
        variant="overBackground",
    ),
    background_color="green-500",
    padding="size-300",
)
```

## Quiet State

The `is_quiet` prop makes the link "quiet". This can be useful when the link and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_link_is_quiet_example = ui.text(
    "You can ", ui.link("use quiet", is_quiet=True), " links inline."
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.link
```
