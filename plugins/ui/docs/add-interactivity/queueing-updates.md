# Queueing a Series of State Updates

When you set a state variable, it queues another render. However, there are times when you may need to perform multiple operations on the value before triggering the next render. To achieve this, it's important to understand how `deephaven.ui` batches state updates.

## `deephaven.ui` batches state updates

You might expect that clicking the “+3” button will increment the counter three times because it calls `set_number(number + 1)` three times:

```python
from deephaven import ui


@ui.component
def counter():
    number, set_number = ui.use_state(0)

    def handle_press():
        set_number(number + 1)
        set_number(number + 1)
        set_number(number + 1)

    return [ui.heading(f"{number}"), ui.button("+3", on_press=handle_press)]


example_counter = counter()
```

However, as mentioned in the previous section, the state values for each render are fixed. This means that the value of `number` within the event handler of the first render is always 0, regardless of how many times you call `set_number(number + 1)`:

```python
def handle_press():
    set_number(0 + 1)
    set_number(0 + 1)
    set_number(0 + 1)
```

TODO Arman's question!!!!
