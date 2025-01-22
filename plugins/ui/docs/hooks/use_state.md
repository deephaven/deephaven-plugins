# use_state

`use_state` is a hook used to add state to your component. Since it is a hook, it must be used at the top level of your component. It returns a tuple with exactly two items: the current value, and a setter function for updating the state. Updating state will cause the component to re-render (running the function again).

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

1. Convention is to use an unpacking assignment and name the state and setter function `something, set_something`.
2. State variables should be immutable. When using arrays or dictionaries in a state function, call the setter function with a new instance of the array/dictionary instead of mutating the existing array/dictionary.
3. When initializing state with the result of a complex function, use an initializer function to avoid calling the complex function on every render.
4. Try and keep state data simple. While you can store any type of object in a state variable, deephaven.ui will attempt to serialize the state data and store it with the user's data running your component. If the data is not serializable, your state is not maintained between sessions. If possible, use a state or multiple state variables that are serializable and build up any complex objects using a `use_memo` hook.

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

## Updating state based on the previous value

You can update the state using the previous value. However, let's say you have a function to update the count by three:

```python
def handle_press():
    set_count(count + 1)  # set_age(0 + 1)
    set_count(count + 1)  # set_age(0 + 1)
    set_count(count + 1)  # set_age(0 + 1)
```

You can instead pass in an updater function that will allow you to use the previous value:

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

## Multiple updates are batched

When a component calls state setters multiple times, the updates a to state are batched. This means multiple updates to state will only trigger one re-render.

For the example above, All of the `set_count` calls will be batched together and the component will only re-render once after the event loop (the call to `increase_value`) returns.

## Updating state with a dictionary

You can set state with a dictionary. Instead of modifying the dictionary in place, create a new dictionary with the updated values. In this example, `person` contains a dictionary of name and age. When the name or age is updated, the dictionary unpacking operator is used to create a new dictionary with the updated values:

```python
from deephaven import ui


@ui.component
def person_component():
    person, set_person = ui.use_state({"name": "Hector", "age": 42})

    def update_name(new_name):
        # Use the dictionary unpacking operator with the old dictionary to create a new dictionary with the updated name
        set_person(lambda p: {**p, "name": new_name})

    def update_age(new_age):
        # Use the dictionary unpacking operator with the old dictionary to create a new dictionary with the updated name
        set_person(lambda p: {**p, "age": new_age})

    return [
        ui.text_field(value=person["name"], on_change=update_name),
        ui.text_field(value=person["age"], on_change=update_age),
        ui.text(f"{person['name']} is {person['age']} years old"),
    ]


result = person_component()
```

## Updating state with a list

You can also set state with a list of values. Instead of modifying the list in place, create a new list with the updated values. In this example, `items` contains a list of todo items. When an item is added or deleted, we use the list add operator or list comprehension to create a new list with the updated values:

```python
from deephaven import ui
from typing import Callable, List


@ui.component
def todo_item(item: str, on_delete: Callable[[], None]):
    return ui.flex(
        ui.checkbox(item), ui.button("Delete", on_press=on_delete, variant="negative")
    )


@ui.component
def todo_list(items: list[str], on_delete: Callable[[str], None]):
    return list(
        map(lambda item: todo_item(item, on_delete=lambda: on_delete(item)), items)
    )


@ui.component
def add_todo(on_submit: Callable[[str], None]):
    item, set_item = ui.use_state("")

    def handle_submit():
        on_submit(item)
        set_item("")

    return ui.flex(
        ui.text_field(value=item, label="Add Todo", on_change=set_item),
        ui.button("Add", on_press=handle_submit),
        align_items="end",
    )


@ui.component
def todo_app():
    items, set_items = ui.use_state([])

    def handle_add(new_item: str):
        # Updating the items to a new list containing all the old items and the new item
        set_items(lambda old_items: old_items + [new_item])

    def handle_delete(delete_item: str):
        # Updating the items to a new list containing all the old items except the deleted item
        set_items(lambda old_items: [item for item in old_items if item != delete_item])

    return ui.flex(
        add_todo(on_submit=handle_add),
        todo_list(items, on_delete=handle_delete),
        direction="column",
        flex_grow=0,
    )


result = todo_app()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_state
```
