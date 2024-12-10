# Conditional Rendering

Your components will often need to display different things depending on different conditions. In `deephaven.ui`, you can conditionally render components using Python syntax like if statements, `and` operator, and the ternary operator.

## Conditional returning

Consider a `packing_list` component rendering several `item` components, which can be marked as packed or not:

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    return ui.text("- ", name)


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
        return ui.text("- ", name + " ✅")
    return ui.text("- ", name)


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

### Conditionally return nothing with `None`

In some situations, you do not want to render anything at all. For example, you do not want to show packed items at all. A component must return something. In this case, you can return `None`:

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    if is_packed:
        return None
    return ui.text("- ", name)


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

If `is_packed` is True, the component will return nothing. Otherwise, it will return a component to render.

In practice, returning `None` from a component is not common because it might surprise a developer trying to render it. More often, you would conditionally include or exclude the component in the parent component. Here’s how to do that.

## Conditionally including components

In the previous example, you controlled which component would be returned by using an if/else statement. This led to some code duplication. You can remove this duplication by conditionally including components.

### Conditional ternary

Python has a ternary conditional in the form: `a if condition else b`. This can simplify the `item` component.

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    return ui.text("- ", name + " ✅" if is_packed else name)


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

### Logical `and` operator

Another common shortcut you will encounter is the Python logical `and` operator. Inside `deephaven.ui` components, it often comes up when you want to render a component when the condition is `True`, or render nothing otherwise. With `and`, you could conditionally render the checkmark only if `is_packed` is `True`:

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    return ui.text("- ", name, is_packed and " ✅")


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

A Python `and` expression returns the value of its right side (in our case, the checkmark) if the left side (our condition) is `True`. But if the condition is `False`, the whole expression becomes `False`. `deephaven.ui` considers `False` to be like `None` and does not render anything in its place.

### Conditionally assigning to a variable

When the shortcuts get in the way of writing plain code, try using an if statement and a variable. You can reassign variables, so start by providing the default content you want to display. Use an if statement to reassign an expression to `item_content` if `is_packed` is `True`.

```python
from deephaven import ui


@ui.component
def item(name, is_packed):
    item_content = name
    if is_packed:
        item_content = name + " ✅"
    return ui.text("- ", item_content)


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
