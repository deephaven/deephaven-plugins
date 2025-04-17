# State as a Snapshot

State variables might look like regular Python variables that you can read and write to. However, state behaves more like a snapshot. Setting it does not change the state variable you already have, but instead triggers a re-render.

## Updates to state trigger renders

You might think of your user interface as changing directly in response to the user event like a click. In `deephaven.ui`, it works a little differently from this mental model. In the previous section, you saw that setting state requests a re-render from `deephaven.ui`. This means that for an interface to react to the event, you need to update the state.

In this example, when you press “send”, `set_is_sent(True)` tells `deephaven.ui` to re-render the UI:

```python
from deephaven import ui


def send_message(message: str):
    print("Message sent: ", message)


@ui.component
def form():
    is_sent, set_is_sent = ui.use_state(False)

    def handle_submit(form_data):
        set_is_sent(True)
        send_message(form_data["message"])

    if is_sent:
        return ui.heading("Your message is on its way!")

    return ui.form(
        ui.text_area(default_value="Hi!", name="message"),
        ui.button("Send", type="submit"),
        on_submit=handle_submit,
    )


example_form = form()
```

Here’s what happens when you click the button:

1. The `on_submit` event handler executes.
2. `set_is_sent(True)` sets `is_sent` to `True` and queues a new render.
3. `deephaven.ui` re-renders the component according to the new `is_sent` value.

Let’s take a closer look at the relationship between state and rendering.

## A render takes one snapshot in time

“Rendering” means that `deephaven.ui` is calling your component, which is a function. The components you return from that function are like a snapshot of the UI in time. Its props, event handlers, and local variables were all calculated using its state at the time of the render.

Unlike a photograph or a movie frame, the UI “snapshot” you return is interactive. It includes logic, like event handlers that specify what happens in response to inputs. `deephaven.ui` updates the screen to match this snapshot and connects the event handlers. As a result, pressing a button will trigger the click handler from your components.

When `deephaven.ui` re-renders a component:

1. `deephaven.ui` calls your function again.
2. Your function returns a new snapshot of components.
3. `deephaven.ui` then converts the snapshot to JSON and sends it to the web client UI to display.

As a component’s memory, state is not like a regular variable that disappears after your function returns. State actually “lives” in a `deephaven.ui` context outside of your function. When React calls your component, it gives you a snapshot of the state for that particular render. Your component returns a snapshot of the UI with a fresh set of props and event handlers, all calculated using the state values from that render!

Here is a little experiment to show you how this works. In this example, you might expect that clicking the “+3” button would increment the counter three times because it calls `set_number(number + 1)` three times.

See what happens when you click the “+3” button:

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

Notice that `number` only increments once per click.

Setting state only changes it for the next render. During the first render, `number` was `0`. This is why, in that render’s `on_press` handler, the value of `number` is still `0` even after `set_number(number + 1)` was called.

Here is what `handle_press` tells `deephaven.ui` to do:

1. `set_number(number + 1)`: `number` is 0 so `set_number(0 + 1)`.

    - `deephaven.ui` prepares to change `number` to 1 on the next render.

2. `set_number(number + 1)`: `number` is 0 so `set_number(0 + 1)`.

    - `deephaven.ui` prepares to change `number` to 1 on the next render.

3. `set_number(number + 1)`: `number` is 0 so `set_number(0 + 1)`.

    - `deephaven.ui` prepares to change `number` to 1 on the next render.

Even though you called `set_number(number + 1)` three times, in this render’s event handler, `number` is always `0`, so you set the state to `1` three times. This is why, after your event handler finishes, React re-renders the component with `number` equal to `1` rather than `3`.

You can also visualize this by mentally substituting state variables with their values in your code. Since the `number` state variable is 0 for this render, its event handler looks like this:

```python
def handle_press():
    set_number(0 + 1)
    set_number(0 + 1)
    set_number(0 + 1)
```

For the next render, `number` is `1`, so that render’s click handler looks like this:

```python
def handle_press():
    set_number(1 + 1)
    set_number(1 + 1)
    set_number(1 + 1)
```

This is why clicking the button again will set the counter to `2`, then to `3` on the next click, and so on.

## State over time

What number will this print when clicking the button?

```python
from deephaven import ui


@ui.component
def counter():
    number, set_number = ui.use_state(0)

    def handle_press():
        set_number(number + 5)
        print(number)

    return [ui.heading(f"{number}"), ui.button("+5", on_press=handle_press)]


example_counter = counter()
```

If you use the substitution method from before, you can guess that the alert shows “0”:

```python
def handle_press():
    set_number(0 + 5)
    print(5)
```

What if you put a timer on the alert, so it only fires after the component re-rendered? Will it say “0” or “5”?

```python
from threading import Timer
from deephaven import ui


@ui.component
def counter():
    number, set_number = ui.use_state(0)

    def handle_press():
        set_number(number + 5)
        Timer(3, lambda: print(number)).start()

    return [ui.heading(f"{number}"), ui.button("+5", on_press=handle_press)]


example_counter = counter()
```

If you use the substitution method, you can see the “snapshot” of the state passed to the alert.

```python
def handle_press():
    set_number(0 + 5)
    Timer(3, lambda: print(0)).start()
```

The state stored in `deephaven.ui` may have changed by the time the alert runs, but it was scheduled using a snapshot of the state at the time the user interacted with it.

A state variable’s value never changes within a render, even if its event handler’s code is asynchronous. Inside that render’s `on_press`, the value of `number` continues to be 0 even after `set_number(number + 5)` was called. Its value was “fixed” when `deephaven.ui` “took the snapshot” of the UI by calling your component.

Here is an example of how that makes your event handlers less prone to timing mistakes. Below is a form that sends a message with a five-second delay. Imagine this scenario:

1. You press the “Send” button, sending “Hello” to Alice.
2. Before the five-second delay ends, you change the value of the “To” field to “Bob”.

What do you expect the alert to display? Would it display, “You said Hello to Alice”? Or would it display, “You said Hello to Bob”?

```python
from threading import Timer
from deephaven import ui


@ui.component
def form():
    to, set_to = ui.use_state("Alice")
    message, set_message = ui.use_state("Hello")

    def handle_submit():
        Timer(5, lambda: print(f"You said {message} to {to}")).start()

    return ui.form(
        ui.picker(
            "Alice", "Bob", label="To", selected_key=to, on_selection_change=set_to
        ),
        ui.text_area(value=message, on_change=set_message),
        ui.button("Send", type="submit"),
        on_submit=handle_submit,
    )


example_form = form()
```

`deephaven.ui` keeps the state values “fixed” within one render’s event handlers. You do not need to worry whether the state has changed while the code is running.
