# Update Dictionaries in State

State can hold any kind of Python value, including dictionaries. But you should not change objects that you hold in the `deephaven.ui` state directly. Instead, when you want to update an dictionary, you need to create a new one (or make a copy of an existing one), and then set the state to use that copy.

## What is a mutation?

You can store any kind of Python value in state.

```python
x, set_x = ui.use_state(0)
```

Python data types like numbers, strings, and booleans are "immutable", meaning unchangeable or "read-only". You can trigger a re-render to replace a value:

```python
set_x(5)
```

The `x` state changed from `0` to `5`, but the number `0` itself did not change. It is not possible to make any changes to the built-in data types like numbers, strings, and booleans in Python.

Now consider an dictionary in state:

```python
position, set_position = ui.use_state({"x": 0, "y": 0})
```

It is possible to change the contents of the dictionary itself. This is called a mutation:

```python
position["x"] = 5
```

Although dictionaries in `deephaven.ui` state are technically mutable, you should treat them as if they were immutable like numbers, booleans, and strings. Instead of mutating them, you should always replace them.

## Treat state as read-only

You should treat any Python dictionary that you put into state as read-only.

This example holds an dictionary in state to represent a range. Clicking the button should increment the end of the range, but the range does no update:

```python
from deephaven import ui


@ui.component
def range_example():
    value, set_value = ui.use_state({"start": 0, "end": 50})

    def handle_press():
        value["end"] = value["end"] + 1

    return [
        ui.range_slider(value=value, label="Range"),
        ui.button("Update", on_press=handle_press),
    ]


my_range_example = range_example()
```

The problem is with this bit of code.

```python
def handle_press():
    value["end"] = value["end"] + 1
```

This code modifies the dictionary assigned to `value` from the previous render. But without using the state setting function, `deephaven.ui` has no idea that dictionary has changed. So `deephaven.ui` does not do anything in response. While mutating state can work in some cases, we don’t recommend it. You should treat the state value you have access to in a render as read-only.

To actually trigger a re-render in this case, create a new dictionary and pass it to the state setting function:

```python
def handle_press():
    set_value({"start": 0, "end": value["end"] + 1})
```

With `set_value`, you’re telling `deephaven.ui`:

- Replace `value` with this new dictionary
- And render this component again

Notice how the range updates when you click the button:

```python
from deephaven import ui


@ui.component
def range_example():
    value, set_value = ui.use_state({"start": 0, "end": 50})

    def handle_press():
        set_value({"start": 0, "end": value["end"] + 1})

    return [
        ui.range_slider(value=value, label="Range"),
        ui.button("Update", on_press=handle_press),
    ]


my_range_example = range_example()
```

## Copy Dictionaries
