# use_state

`use_state` is a hook that adds state to your component. Add it to the top-level of your component to get the current value of the state and a setter function for updating the state. Updating state will cause the component to re-render (running the function again).

## Example

```python
from deephaven import ui


@ui.component
def ui_counter():
    count, set_count = ui.use_state(0)
    return ui.button(f"Pressed {count} times", on_press=lambda: set_count(count + 1))


counter = ui_counter()
```

## Recommendations

Recommendations for using state and creating state variables:

1. Convention is to name the state and setter function `something, set_something`
2. State variables should be immutable. When using arrays or dictionaries in a state function, call the setter function with a new instance of the array/dictionary instead of mutating the existing array/dictionary.
3. When initializing state with the result of a complex function, use an initializer function to avoid calling the complex function on every render.
4. Try and keep state data simple. While you can store any type of object in a state variable, deephaven.ui will attempt to serialize the state data and store it with the user's data running your component. If the data is not serializable, your state will not be maintained between sessions. If possible, use a state that is serializable, and build up any complex objects using a `use_memo` hook.

## Initializing state

`use_state` takes a parameter that intializes the state to an initial value:

```python
answer, set_answer = ui.use_state(42)
```

In the example above, `set_answer` initializes to the value `42`. If you pass a function into the initializer, it will be called on the first initialization. This is useful if you have an expensive computation you want to set as your state:

```python
complex_item, set_complex_item = ui.use_state(lambda: complex_function())
```

Note the initializer function does not take any parameters, and should be deterministic. If you wish to store a function in your state, return that function as a result of a function:

```python
operation, set_operation = ui.use_state(lambda: math.sin)
```

## Using state

Use the state within your component like you would any variable, and call the setter function to update the value and re-render the component:

```python
from deephaven import ui


@ui.component
def my_component():
    name, set_name = ui.use_state("Hector")

    return [
        ui.text_field(value=name, on_change=set_name),
        ui.text(f"Your name is {name}"),
    ]


result = my_component()
```

The state variable is updated on the _next_ render, so if you call the setter function, the state variable is still the old value in the current render cycle.

```python
from deephaven import ui


@ui.component
def my_component():
    name, set_name = ui.use_state("Hector")

    def handle_change(new_name):
        set_name(new_name)
        print(name)  # Still "Hector"

    return [
        ui.text_field(value=name, on_change=set_name),
        ui.text(f"Your name is {name}"),
    ]


result = my_component()
```

## Setting state based on the previous value

You can update the state using the previous value. However, let's say you have a function to update the count by three:

```python
def handle_press():
    set_count(count + 1)  # set_age(0 + 1)
    set_count(count + 1)  # set_age(0 + 1)
    set_count(count + 1)  # set_age(0 + 1)
```

You can instead pass in an updater function, that will allow you to use the previous value:

```python
def handle_press():
    set_count(lambda c: c + 1)  # set_age(0 + 1)
    set_count(lambda c: c + 1)  # set_age(1 + 1)
    set_count(lambda c: c + 1)  # set_age(2 + 1)
```

Here's an example with different buttons for increasing the value:

```python
from deephaven import ui


@ui.component
def multi_count_buttons():
    count, set_count = ui.use_state(0)

    def increase_value(n):
        for i in range(n):
            set_count(lambda c: c + 1)

    return [
        ui.flex(
            ui.button("+1", on_press=lambda: increase_value(1)),
            ui.button("+10", on_press=lambda: increase_value(10)),
            ui.button("+100", on_press=lambda: increase_value(100)),
            flex_grow=0,
        ),
        ui.text(f"Current value is {count}"),
    ]


result = multi_count_buttons()
```

All of these setters will be batched together and the component will only re-render once after the event loop (the call to `increase_value`) returns.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_state
```
