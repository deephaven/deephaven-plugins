# use_boolean

`use_boolean` is a hook that adds a boolean variable to your component. Since it is a hook, it must be used at the top level of your component. It returns a tuple with tow items: the current boolean value, and a callable to set the variable. Updating state will cause the component to re-render (running the function again). This is a convenience hook for when you only need functions to set a boolean variable. For more complex state management, use `use_state`.

## Boolean callable

The boolean callable can be used to set the value of the boolean directly. It also includes convience methos `on` to set the variable to `True`, `off` to set the variable to `False`, and `toggle` to to set the variable to the opposite of its current state.

## Example

```python
@ui.component
def ui_boolean_example():
    value, set_value = use_boolean()

    return [
        ui.text(f"{value}"),
        ui.checkbox("My value", is_selected=value, on_change=set_value),
        ui.switch("My value", is_selected=value, on_change=set_value),
        ui.button("Set True", on_press=set_value.on),
        ui.button("Set False", variant="negative", on_press=set_value.off),
        ui.button("Toggle", variant="secondary", on_press=set_value.toggle),
    ]


my_boolean_example = ui_boolean_example()
```

## Recommendations

1. Convention is to use an unpacking assignment and name the state and setter function `value, set_value`.
2. When initializing the value with the result of a complex function, use an initializer function to avoid calling the complex function on every render.

## Initializing the value

`use_boolean` takes an optional parameter that intializes the value to an initial value:

```python
value, set_value = ui.use_boolean(True)
```

If the parameter is omitted, the value will initalize to `False`:

```python
value, set_value = ui.use_boolean()
```

If you pass a function into the initializer, it will be called on the first initialization. This is useful if you have an expensive computation to determine the value:

```python
value, set_value = ui.use_boolean(lambda: complex_function())
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_boolean
```
