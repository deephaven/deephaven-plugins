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
def ui_fragment_list():
    children = []

    for i in range(1, 4):
        children.append(ui.fragment(ui.text(f"Child {i}"), key=i))

    return ui.column(*children)


my_fragment = ui_fragment_list()
```