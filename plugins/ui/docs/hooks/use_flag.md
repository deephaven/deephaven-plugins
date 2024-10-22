# use_flag

`use_flag` is a hook used to add a boolean flag to your component. Since it is a hook, it must be used at the top level of your component. It returns a tuple with exactly three items: the current flag value, a function to set the flag to `True`, and a function to set the flag to `False` . Updating state will cause the component to re-render (running the function again). This is a convenience hook for when you only need functions to set a flag to `True` or `False`. For more complex state management, use `use_state`.

## Example

```python
from deephaven import ui


@ui.component
def ui_flag():
    flag, set_true, set_false = ui.use_flag()
    return [
        ui.text(f"{flag}"),
        ui.button("Set True", on_press=set_true),
        ui.button("Set False", on_press=set_false),
    ]


my_flag = ui_flag()
```

## Recommendations

1. Convention is to use an unpacking assignment and name the state and setter function `flag, set_true, set_false`.
2. When initializing the flag with the result of a complex function, use an initializer function to avoid calling the complex function on every render.

## Initializing the flag

`use_flag` takes an optional parameter that intializes the flag to an initial value:

```python
flag, set_true, set_false = ui.use_flag(True)
```

If the parameter is omitted, the flag will initalize to `False`:

```python
flag, set_true, set_false = ui.use_flag()
```

If you pass a function into the initializer, it will be called on the first initialization. This is useful if you have an expensive computation to determine the flag:

```python
flag, set_true, set_false = ui.use_flag(lambda: complex_function())
```

## Using readable names

When assigning the return values, you can use readable names for your use case:

```python
from deephaven import ui


@ui.component
def open_close_example():
    is_open, set_open, set_closed = ui.use_flag()
    return ui.dialog_trigger(
        ui.action_button("Open dialog", on_press=set_open),
        ui.dialog(
            ui.heading("Dialog"),
            ui.content("Close using the button."),
            ui.button_group(ui.button("close", on_press=set_closed)),
        ),
        is_open=is_open,
    )


my_open_close_example = open_close_example()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_flag
```
