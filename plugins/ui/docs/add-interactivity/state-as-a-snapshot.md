# State as a Snapshot

State variables might look like regular Python variables that you can read and write to. However, state behaves more like a snapshot. Setting it does not change the state variable you already have, but instead triggers a re-render.

## Updates to state trigger renders

You might think of your user interface as changing directly in response to the user event like a click. In `deephaven.ui`, it works a little differently from this mental model. In the previous section, you saw that setting state requests a re-render from `deephaven.ui`. This means that for an interface to react to the event, you need to update the state.

In this example, when you press “send”, `set_is_sent(True)` tells `deephaven.iu` to re-render the UI:

```python
from deephaven import ui


def send_message():
    print("Message sent!")


@ui.component
def form():
    is_sent, set_is_sent = ui.use_state(False)
    message, set_message = ui.use_state("Hi!")

    def handle_submit():
        set_is_sent(True)
        send_message()

    if is_sent:
        return ui.heading("Your message is on its way!")

    return ui.form(
        ui.text_area(value=message, on_change=set_message),
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

“Rendering” means that `deephaven.ui` is calling your component, which is a function. The components you return from that function is like a snapshot of the UI in time. Its props, event handlers, and local variables were all calculated using its state at the time of the render.

Unlike a photograph or a movie frame, the UI “snapshot” you return is interactive. It includes logic like event handlers that specify what happens in response to inputs. `deephaven.ui` updates the screen to match this snapshot and connects the event handlers. As a result, pressing a button will trigger the click handler from your components.

When `deephaven.ui` re-renders a component:

1. `deephaven.ui` calls your function again.
2. Your function returns a new snapshot of components.
3. `deephaven.ui` then converts the snapshot to JSON and sends it to the web client ui to display.

As a component’s memory, state is not like a regular variable that disappears after your function returns. State actually “lives” in a `deephaven.ui` context outside of your function. When React calls your component, it gives you a snapshot of the state for that particular render. Your component returns a snapshot of the UI with a fresh set of props and event handlers, all calculated using the state values from that render!

Here iss a little experiment to show you how this works. In this example, you might expect that clicking the “+3” button would increment the counter three times because it calls `set_number(number + 1)` three times.

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

1. `set_number(number + 1)`: number is 0 so `set_number(0 + 1)`.

- `deephaven.ui` prepares to change number to 1 on the next render.

2. `set_number(number + 1)`: number is 0 so `set_number(0 + 1)`.

- `deephaven.ui` prepares to change number to 1 on the next render.

3. `set_number(number + 1)`: number is 0 so `set_number(0 + 1)`.

- `deephaven.ui` prepares to change number to 1 on the next render.

Even though you called `set_number(number + 1)` three times, in this render’s event handler `number` is always `0`, so you set the state to `1` three times. This is why, after your event handler finishes, React re-renders the component with number equal to `1` rather than `3`.

You can also visualize this by mentally substituting state variables with their values in your code. Since the number state variable is 0 for this render, its event handler looks like this:

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
