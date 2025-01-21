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
