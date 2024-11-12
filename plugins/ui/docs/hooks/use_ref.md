# use_ref

`use_ref` returns a mutable ref object whose `.current` property is initialized to the passed argument. The returned object will persist for the full lifetime of the component. Updating the `.current` property will not trigger a re-render.

## Example

```python
from deephaven import ui


@ui.component
def ui_ref_counter():
    ref = ui.use_ref(0)

    def handle_press():
        ref.current += 1
        print(f"You clicked {ref.current} times!")

    return ui.button("Click me!", on_press=handle_press)


ref_counter = ui_ref_counter()
```

Note that we're only using the `ref.current` value within the `handle_press` method. This is because updating the ref does not trigger a re-render, so the component will not reflect the updated value. The value will be printed out each time you press the button. If you need to update the component based on the ref value, consider using `use_state` instead.

## Recommendations

1. **Use `use_ref` for mutable values**: If you need to store a mutable value that doesn't affect the component's rendering, use `use_ref`.
2. **Use `use_state` for values that affect rendering**: If you need to store a value that will affect the component's rendering, use `use_state` instead of `use_ref`.

## Stopwatch example

Here's an example of a stopwatch using `use_ref`. Press the Start button to start the stopwatch, and the Stop button to stop it. The elapsed time will be displayed in the text field:

```python
from deephaven import ui
import datetime
from threading import Timer


class RepeatTimer(Timer):
    def run(self):
        while not self.finished.wait(self.interval):
            self.function(*self.args, **self.kwargs)


@ui.component
def ui_stopwatch():
    start_time, set_start_time = ui.use_state(datetime.datetime.now())
    now, set_now = ui.use_state(start_time)
    timer_ref = ui.use_ref(None)

    def stop():
        if timer_ref.current is not None:
            timer_ref.current.cancel()

    def start():
        stop()
        new_start_time = datetime.datetime.now()
        set_start_time(new_start_time)
        set_now(new_start_time)
        timer_ref.current = RepeatTimer(0.01, lambda: set_now(datetime.datetime.now()))
        timer_ref.current.start()

    return ui.view(
        ui.heading(f"Elapsed time: {now - start_time}"),
        ui.button("Start", on_press=start),
        ui.button("Stop", on_press=stop),
    )


stopwatch = ui_stopwatch()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_ref
```
