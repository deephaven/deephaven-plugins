# Update Dictionaries in State

State can hold any kind of Python value, including dictionaries. But you should not change objects that you hold in the `deephaven.ui` state directly. Instead, when you want to update an dictionary, you need to create a new one (or make a copy of an existing one), and then set the state to use that copy.

## What is a mutation?

You can store any kind of Python value in state.

```python
x, set_x = ui.use_state(0)
```

Python data types like numbers, strings, and booleans are "immutable", meaning unchangeable or "read-only". You can trigger a re-render to replace a value:

```python
set_x(5)
```

The `x` state changed from `0` to `5`, but the number `0` itself did not change. It is not possible to make any changes to the built-in data types like numbers, strings, and booleans in Python.

Now consider an dictionary in state:

```python
position, set_position = ui.use_state({"x": 0, "y": 0})
```

It is possible to change the contents of the dictionary itself. This is called a mutation:

```python
position["x"] = 5
```

Although dictionaries in `deephaven.ui` state are technically mutable, you should treat them as if they were immutable like numbers, booleans, and strings. Instead of mutating them, you should always replace them.

## Treat state as read-only

You should treat any Python dictionary that you put into state as read-only.

This example holds a dictionary in state to represent a range. Clicking the button should increment the end of the range, but the range does not update:

```python
from deephaven import ui


@ui.component
def range_example():
    value, set_value = ui.use_state({"start": 0, "end": 50})

    def handle_press():
        value["end"] = value["end"] + 1

    return [
        ui.range_slider(value=value, label="Range"),
        ui.button("Update", on_press=handle_press),
    ]


my_range_example = range_example()
```

The problem is with this bit of code.

```python
def handle_press():
    value["end"] = value["end"] + 1
```

This code modifies the dictionary assigned to `value` from the previous render. But without using the state setting function, `deephaven.ui` has no idea that dictionary has changed. So `deephaven.ui` does not do anything in response. While mutating state can work in some cases, we don’t recommend it. You should treat the state value you have access to in a render as read-only.

To actually trigger a re-render in this case, create a new dictionary and pass it to the state setting function:

```python
def handle_press():
    set_value({"start": 0, "end": value["end"] + 1})
```

With `set_value`, you’re telling `deephaven.ui`:

- Replace `value` with this new dictionary
- And render this component again

Notice how the range updates when you click the button:

```python
from deephaven import ui


@ui.component
def range_example():
    value, set_value = ui.use_state({"start": 0, "end": 50})

    def handle_press():
        set_value({"start": 0, "end": value["end"] + 1})

    return [
        ui.range_slider(value=value, label="Range"),
        ui.button("Update", on_press=handle_press),
    ]


my_range_example = range_example()
```

## Copy Dictionaries

In the previous example, the `value` dictionary is always created from new data. But often, you will want to include existing data as a part of the new dictionary you are creating. For example, you may want to update only one field in a form, but keep the previous values for all other fields.

These input fields don’t work because the `on_change` handlers mutate the state:

```python
from deephaven import ui


@ui.component
def form():
    person, set_person = ui.use_state(
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "jondoe@domain.com",
        }
    )

    def handle_first_name_change(value):
        person["first_name"] = value

    def handle_last_name_change(value):
        person["last_name"] = value

    def handle_email_change(value):
        person["email"] = value

    return [
        ui.text_field(
            label="First name",
            value=person["first_name"],
            on_change=handle_first_name_change,
        ),
        ui.text_field(
            label="Last name",
            value=person["last_name"],
            on_change=handle_last_name_change,
        ),
        ui.text_field(
            label="Email", value=person["email"], on_change=handle_email_change
        ),
        ui.text(f'{person["first_name"]} {person["last_name"]} {person["email"]}'),
    ]


form_example = form()
```

For example, this line mutates the state from a past render:

```python
person["first_name"] = value
```

The reliable way to get the behavior you are looking for is to create a new dictionary and pass it to `set_person`. But here, you want to also copy the existing data into it because only one of the fields has changed:

```python
set_person(
    {
        "first_name": value,
        "last_name": person["last_name"],
        "email": person["email"],
    }
)
```

You can use dictionary `unpacking` so that you do not need to copy every property separately.

```python
set_person({**person, "first_name": value})
```

Now the form works.

Notice you did not need to declare a separate state variable for each input field. For large forms, keeping all data grouped in a dictionary is convenient if updated correctly.

```python
from deephaven import ui


@ui.component
def form():
    person, set_person = ui.use_state(
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "jondoe@domain.com",
        }
    )

    return [
        ui.text_field(
            label="First name",
            value=person["first_name"],
            on_change=lambda new_first_name: set_person(
                {
                    **person,
                    "first_name": new_first_name,
                }
            ),
        ),
        ui.text_field(
            label="Last name",
            value=person["last_name"],
            on_change=lambda new_last_name: set_person(
                {
                    **person,
                    "last_name": new_last_name,
                }
            ),
        ),
        ui.text_field(
            label="Email",
            value=person["email"],
            on_change=lambda new_email: set_person({**person, "email": new_email}),
        ),
        ui.text(f'{person["first_name"]} {person["last_name"]} {person["email"]}'),
    ]


form_example = form()
```

Note that the dictionary `unpacking` is “shallow”. It only copies things one level deep. This makes it fast, but it also means that if you want to update a nested property, you’ll have to use it more than once.

## Update a nested dictionary

Consider a nested dictionary structure like this:

```python
person, set_person = ui.use_state(
    {
        "first_name": "John",
        "last_name": "Doe",
        "contact": {"email": "jondoe@domain.com", "phone": "555-5555"},
    }
)
```

If you wanted to update `email`, it’s clear how to do it with mutation:

```python
person["contact"]["email"] = "jdoe@domain.net"
```

But in `deephaven.ui`, you should treat state as immutable. In order to change `email`, you would first need to produce the new `contact` dictionary (pre-populated with data from the previous one), and then produce the new `person` dictionary which points at the new artwork:

```python
new_person = {**person, "contact": {**person["contact"], "email": "jdoe@domain.net"}}
```

This gets a bit wordy, but it works fine for many cases:

```python
from deephaven import ui


@ui.component
def form():
    person, set_person = ui.use_state(
        {
            "first_name": "John",
            "last_name": "Doe",
            "contact": {"email": "jondoe@domain.com", "phone": "555-5555"},
        }
    )

    return [
        ui.text_field(
            label="First name",
            value=person["first_name"],
            on_change=lambda new_first_name: set_person(
                {
                    **person,
                    "first_name": new_first_name,
                    "contact": {**person["contact"]},
                }
            ),
        ),
        ui.text_field(
            label="Last name",
            value=person["last_name"],
            on_change=lambda new_last_name: set_person(
                {**person, "last_name": new_last_name, "contact": {**person["contact"]}}
            ),
        ),
        ui.text_field(
            label="Email",
            value=person["contact"]["email"],
            on_change=lambda new_email: set_person(
                {**person, "contact": {**person["contact"], "email": new_email}}
            ),
        ),
        ui.text_field(
            label="Phone",
            value=person["contact"]["phone"],
            on_change=lambda new_phone: set_person(
                {**person, "contact": {**person["contact"], "phone": new_phone}}
            ),
        ),
        ui.text(
            f'{person["first_name"]} {person["last_name"]} {person["contact"]["email"]} {person["contact"]["phone"]}'
        ),
    ]


form_example = form()
```

## Write concise update logic with `deepcopy`

If your state is deeply nested, you might want to consider flattening it. But, if you do not want to change your state structure, you might prefer to use `deepcopy`. The Python `copy` library includes a `deepcopy` function that constructs a new dictionary and recursively inserts copies of dictionaries found in the original.

```python
import copy
from deephaven import ui


@ui.component
def form():
    person, set_person = ui.use_state(
        {
            "first_name": "John",
            "last_name": "Doe",
            "contact": {"email": "jondoe@domain.com", "phone": "555-5555"},
        }
    )

    def handle_first_name_change(value):
        person_copy = copy.deepcopy(person)
        person_copy["first_name"] = value
        set_person(person_copy)

    def handle_last_name_change(value):
        person_copy = copy.deepcopy(person)
        person_copy["last_name"] = value
        set_person(person_copy)

    def handle_email_change(value):
        person_copy = copy.deepcopy(person)
        person_copy["contact"]["email"] = value
        set_person(person_copy)

    def handle_phone_change(value):
        person_copy = copy.deepcopy(person)
        person_copy["contact"]["phone"] = value
        set_person(person_copy)

    return [
        ui.text_field(
            label="First name",
            value=person["first_name"],
            on_change=handle_first_name_change,
        ),
        ui.text_field(
            label="Last name",
            value=person["last_name"],
            on_change=handle_last_name_change,
        ),
        ui.text_field(
            label="Email",
            value=person["contact"]["email"],
            on_change=handle_email_change,
        ),
        ui.text_field(
            label="Phone",
            value=person["contact"]["phone"],
            on_change=handle_phone_change,
        ),
        ui.text(
            f'{person["first_name"]} {person["last_name"]} {person["contact"]["email"]} {person["contact"]["phone"]}'
        ),
    ]


form_example = form()
```

Notice how much more concise the event handlers have become. `deepcopy` is a great way to keep the update handlers if there is nesting in your state.
