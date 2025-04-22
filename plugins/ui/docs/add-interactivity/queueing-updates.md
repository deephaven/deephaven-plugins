# Queueing a series of state updates

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

```python skip-test
def handle_press():
    set_number(0 + 1)
    set_number(0 + 1)
    set_number(0 + 1)
```

But there is another factor at play here. `deephaven.ui` waits until all code in the event handlers has run before processing your state updates. This is why the re-render only happens after all these `set_number()` calls.

This is similar to a waiter taking an order at a restaurant. A waiter does not go to the kitchen after you order your first dish. Instead, they let you finish your order, allow you to make changes to it, and even take orders from other people at the table.

This lets you update multiple state variables—even from multiple components—without triggering too many re-renders. But this also means that the UI will not be updated until after your event handler, and any code in it, completes. This behavior, also known as batching, makes your `deephaven.ui` app run much faster. It also avoids confusing “half-finished” renders where only some variables have been updated.

Note that in multi-threaded cases, state updates are not batched by default. [`use_render_queue`](../hooks/use_render_queue.md) can ensure they do get batched if you are going to do work from a background thread. See [`batch-updates`](../hooks/use_render_queue.md#batch-updates) for more information.

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

```python skip-test
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

What about this event handler? What do you think the number will be in the next render?

```python
from deephaven import ui


@ui.component
def counter():
    number, set_number = ui.use_state(0)

    def handle_press():
        set_number(number + 5)
        set_number(lambda n: n + 1)

    return [ui.heading(f"{number}"), ui.button("+3", on_press=handle_press)]


example_counter = counter()
```

Here is what this event handler tells `deephaven.ui` to do:

1. `set_number(number + 5)`: number is `0`, so `set_number(0 + 5)`. `deephaven.ui` adds "replace with 5" to its queue.
2. `set_number(lambda n: n + 1)`: `lambda n: n + 1` is an updater function. `deephaven.ui` adds that function to its queue.

During the next render, `deephaven.ui` goes through the state queue:

| queued update     | n            | returns     |
| ----------------- | ------------ | ----------- |
| "replace with 5"  | `0` (unused) | `5`         |
| `lambda n: n + 1` | `5`          | `5 + 1 = 6` |

`deephaven.ui` stores `6` as the final result and returns it from `use_state`.

## What happens if you replace state after updating it

Let's try an example where you replace state after updating it. What do you think number will be in the next render?

```python
from deephaven import ui


@ui.component
def counter():
    number, set_number = ui.use_state(0)

    def handle_press():
        set_number(number + 5)
        set_number(lambda n: n + 1)
        set_number(42)

    return [ui.heading(f"{number}"), ui.button("+3", on_press=handle_press)]


example_counter = counter()
```

Here is how `deephaven.ui` works through these lines of code while executing this event handler:

1. `set_number(number + 5)`: number is `0`, so `set_number(0 + 5)`. `deephaven.ui` adds "replace with 5" to its queue.
2. `set_number(lambda n: n + 1)`: `lambda n: n + 1` is an updater function. `deephaven.ui` adds that function to its queue.
3. `set_number(42)`: `deephaven.ui` adds "replace with 42" to its queue.

| queued update     | n            | returns     |
| ----------------- | ------------ | ----------- |
| "replace with 5"  | `0` (unused) | `5`         |
| `lambda n: n + 1` | `5`          | `5 + 1 = 6` |
| "replace with 42" | `6` (unused) | `42`        |

Then `deephaven.ui` stores `42` as the final result and returns it from `use_state`.

To summarize, here is how you can think of what you are passing to the `set_number` state setter:

1. An updater function (e.g. `lambda n: n + 1`) gets added to the queue.
2. Any other value (e.g. number `5`) adds "replace with 5" to the queue, ignoring what’s already queued.

After the event handler completes, `deephaven.ui` will trigger a re-render. During the re-render, `deephaven.ui` will process the queue. Updater functions run during rendering, so updater functions must be pure and only return the result. Do not try to set state from inside of them or run other side effects.

## Naming conventions

It is common to name the updater function argument by the first letters of the corresponding state variable:

```python skip-test
set_enabled(lambda e: not e)
set_last_name(lambda ln: ln.upper())
set_friend_count(lambda fc: fc * 2)
```

If you prefer more verbose code, another common convention is to repeat the full state variable name, like `set_enabled(lambda enabled: not enabled)`, or to use a prefix like `set_enabled(lambda prev_enabled: not prev_enabled)`.
