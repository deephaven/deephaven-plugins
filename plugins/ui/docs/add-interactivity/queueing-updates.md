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

But there is another factor at play here. `deephaven.ui` waits until all code in the event handlers has run before processing your state updates. This is why the re-render only happens after all these `set_number()` calls.

This is similar to a waiter taking an order at a restaurant. A waiter does not go to the kitchen after you order your first dish. Instead, they let you finish your order, allow you to make changes to it, and even take orders from other people at the table.

This lets you update multiple state variables—even from multiple components—without triggering too many re-renders. But this also means that the UI will not be updated until after your event handler, and any code in it, completes. This behavior, also known as batching, makes your `deephaven.ui` app run much faster. It also avoids dealing with confusing “half-finished” renders where only some of the variables have been updated.

## Update the same state multiple times before the next render

If you would like to update the same state variable multiple times before the next render, instead of passing the next state value like `set_number(number + 1)`, you can pass a function that calculates the next state based on the previous one in the queue, like `set_number(lambda n: n + 1)`. It is a way to tell `deephaven.ui` to “do something with the state value” instead of just replacing it.

Try incrementing the counter now:

```python
from deephaven import ui


@ui.component
def counter():
    number, set_number = ui.use_state(0)

    def handle_press():
        set_number(lambda n: n + 1)
        set_number(lambda n: n + 1)
        set_number(lambda n: n + 1)

    return [ui.heading(f"{number}"), ui.button("+3", on_press=handle_press)]


example_counter = counter()
```

Here, `lambda n: n + 1` is called an updater function. When you pass it to a state setter:

1. `deephaven.ui` queues this function to be processed after all the other code in the event handler has run.
2. During the next render, `deephaven.ui` goes through the queue and gives you the final updated state.

```python
set_number(lambda n: n + 1)
set_number(lambda n: n + 1)
set_number(lambda n: n + 1)
```

`deephaven.ui` adds each `lambda n: n + 1` to the queue.

When you call `use_state` during the next render, `deephaven.ui` goes through the queue. The previous number state was 0, so that’s what `deephaven.ui` passes to the first updater function as the n argument. Then `deephaven.ui` takes the return value of your previous updater function and passes it to the next updater as n, and so on:

| queued update     | n   | returns     |
| ----------------- | --- | ----------- |
| `lambda n: n + 1` | `0` | `0 + 1 = 1` |
| `lambda n: n + 1` | `1` | `1 + 1 = 2` |
| `lambda n: n + 1` | `2` | `2 + 1 = 3` |

`deephaven.ui` stores `3` as the final result and returns it from `use_state`.

This is why clicking “+3” in the above example correctly increments the value by 3.

## What happens if you update state after replacing it

TODO Arman's question!!!!
