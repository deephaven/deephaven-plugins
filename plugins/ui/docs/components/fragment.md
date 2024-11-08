# Fragment

The `fragment` component allows you to group multiple elements without adding extra nodes to the DOM. This is especially useful when you need to return several elements but want to avoid wrapping them in an additional element. By using `fragment`, you can maintain a clean DOM tree and prevent unnecessary nesting.

## Example

```python
from deephaven import ui

my_fragment = ui.fragment(ui.text("Child 1"), ui.text("Child 2"))
```

## Rendering a List

When rendering multiple elements in a loop, ensure each fragment has a unique key. This is crucial if array items might be inserted, deleted, or reordered.

```python
from deephaven import ui


@ui.component
def ui_post_list(items):
    posts = (
        ui.fragment(ui.heading(p["title"]), ui.text(p["body"]), key=p["id"])
        for p in items
    )
    return ui.flex(
        *posts,
        direction="column",
    )


my_post_list = ui_post_list(
    [
        {"id": 1, "title": "About me", "body": "I am a developer"},
        {"id": 2, "title": "Contact", "body": "I want to hear from you!"},
    ]
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.fragment
```