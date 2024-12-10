# Conditional Rendering

Your components will often need to display different things depending on different conditions. In `deephaven.ui`, you can conditionally render components using Python syntax like if statements, `and` operator, and the ternary operator.

## Conditional returning

Consider a `packing_list` component rendering several `item` components, which can be marked as packed or not:

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    return ui.text("- " + name)


@ui.component
def packing_list():
    return ui.flex(
        ui.heading("Packing list"),
        item("Clothes", is_packed=True),
        item("Shoes", is_packed=True),
        item("Wallet", is_packed=False),
        direction="column",
    )


my_packing_list = packing_list()
```

Some of the `item` components have their `is_packed` prop set to `True` instead of `False`. You want to add a checkmark (✅) to packed items if `is_packed=True`.

You can write this as an if/else statement like so:

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    if is_packed:
        return ui.text("- " + name + " ✅")
    return ui.text("- " + name)


@ui.component
def packing_list():
    return ui.flex(
        ui.heading("Packing list"),
        item("Clothes", is_packed=True),
        item("Shoes", is_packed=True),
        item("Wallet", is_packed=False),
        direction="column",
    )


my_packing_list = packing_list()
```

Notice you are creating branching logic with Python's if and return statements. In `deephaven.ui`, control flow (like conditions) is handled by Python.

### Returning None

## Conditionally including components

### Conditional ternary

### Logical and operator

### Conditionally assigning to a variable

## Recap
