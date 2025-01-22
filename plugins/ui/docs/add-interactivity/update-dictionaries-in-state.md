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
