# Choose the State Structure

Effectively structuring state can be the difference between a component that is easy to modify and debug and one that is a persistent source of bugs. Here are some tips to consider when organizing state.

## Principles for structuring state

When you write a component that holds state, you will make choices about how many state variables to use and what the shape of their data should be. While it is possible to write correct programs even with a suboptimal state structure, there are a few principles that can help you to make better choices:

1. **Group related state.** If you always update two or more state variables at the same time, consider merging them into a single state variable.
2. **Avoid contradictions in state.** When the state is structured in a way that several pieces of state may contradict and “disagree” with each other, you leave room for mistakes. Try to avoid this.
3. **Avoid redundant state.** If you can calculate some information from the component’s props or its existing state variables during rendering, you should not put that information into that component’s state.
4. **Avoid duplication in state.** When the same data is duplicated between multiple state variables, or within nested objects, it is difficult to keep them in sync. Reduce duplication when you can.
5. **Avoid deeply nested state.** Deeply hierarchical state is not very convenient to update. When possible, prefer to structure state in a flat way.

These principles aim to simplify state updates and minimize errors. By eliminating redundant and duplicate data from the state, you can ensure consistency across all its pieces. This approach is akin to how a database engineer might "normalize" a database structure to minimize bugs.

## Group related state

At times, you may be uncertain whether to use a single state variable or multiple state variables.

Should you use this?

```python
start_date, set_start_date = ui.use_state("2020-02-03")
end_date, set_end_date = ui.use_state("2020-02-08")
```

Or should you use this?

```python
date_range, set_date_range = ui.use_state({"start": "2020-02-03", "end": "2020-02-08"})
```

You can use either approach, but if two state variables always change together, consider combining them into a single state variable.

```python
from deephaven import ui


@ui.component
def example():
    date_range, set_date_range = ui.use_state(
        {"start": "2020-02-03", "end": "2020-02-08"}
    )
    return ui.range_calendar(
        aria_label="Date range (controlled)", value=date_range, on_change=set_date_range
    )


my_example = example()
```

Grouping data into an dictionary or list is useful when the number of state pieces is unknown. For instance, this approach is beneficial for forms where users can add custom fields.

When your state variable is an object, you must copy the other fields explicitly when updating a single field. For instance, using `set_date_range({ "start": "2020-02-03" })` in the example above would omit the `end` field. To update only x, use `set_date_range({ **date_range, "start": "2020-02-03" })` or separate them into two state variables and use `set_start("2020-02-03")`.

## Avoid contradictions in state

Here is a feedback form with `is_sending` and `is_sent` state variables:

```python
from deephaven import ui
import threading


@ui.component
def feedback_form():
    text, set_text = ui.use_state("")
    is_sending, set_is_sending = ui.use_state(False)
    is_sent, set_is_sent = ui.use_state(False)

    def finish_submit():
        set_is_sending(False)
        set_is_sent(True)

    def handle_submit():
        set_is_sending(True)
        threading.Timer(5, finish_submit).start()

    if is_sent:
        return ui.heading("Thanks for the feedback!")

    return ui.form(
        ui.text("Do you have any feedback?"),
        ui.text_area(value=text, on_change=set_text, is_disabled=is_sending),
        ui.button("Send", type="submit"),
        ui.text("Sending...") if is_sending else None,
        on_submit=handle_submit,
    )


feedback_form_example = feedback_form()
```

Although this code functions, it allows for "impossible" states. For instance, if you forget to call `set_is_sent` and `set_is_sending` together, you might end up with both `is_sending` and `is_sent` being `True` simultaneously. The more complex your component becomes, the harder it is to trace what went wrong.

Since `is_sending` and `is_sent` should never be `True` at the same time, it is better to replace them with a single status state variable that can take one of three valid states: `typing` (initial), `sending`, and `sent`:

```python
from deephaven import ui
import threading


@ui.component
def feedback_form():
    text, set_text = ui.use_state("")
    status, set_status = ui.use_state("typing")

    def finish_submit():
        set_status("sent")

    def handle_submit():
        set_status("sending")
        threading.Timer(5, finish_submit).start()

    is_sending = status == "sending"
    is_sent = status == "sent"

    if is_sent:
        return ui.heading("Thanks for the feedback!")

    return ui.form(
        ui.text("Do you have any feedback?"),
        ui.text_area(value=text, on_change=set_text, is_disabled=is_sending),
        ui.button("Send", type="submit"),
        ui.text("Sending...") if is_sending else None,
        on_submit=handle_submit,
    )


feedback_form_example = feedback_form()
```

You can still declare some constants for readability:

```python
is_sending = status == "sending"
is_sent = status == "sent"
```

However, they are not state variables, so you do not need to worry about them getting out of sync with each other.

## Avoid redundant state

If you can derive some information from the component’s props or its existing state variables during rendering, you should avoid putting that information into the component’s state.

For instance, consider this form. It functions correctly, but there is state within it.

```python
from deephaven import ui


@ui.component
def name_input():
    first_name, set_first_name = ui.use_state("")
    last_name, set_last_name = ui.use_state("")
    full_name, set_full_name = ui.use_state("")

    def handle_first_name_change(value):
        set_first_name(value)
        set_full_name(f"{value} {last_name}")

    def handle_last_name_change(value):
        set_last_name(value)
        set_full_name(f"{first_name} {value}")

    return [
        ui.heading("Check in"),
        ui.text_field(
            label="First Name", value=first_name, on_change=handle_first_name_change
        ),
        ui.text_field(
            label="Last Name", value=last_name, on_change=handle_last_name_change
        ),
        ui.text(f"You are checking in: {full_name}"),
    ]


name_input_example = name_input()
```

This form has three state variables: `first_name`, `last_name`, and `full_name`. However, `full_name` is redundant because it can be derived from `first_name` and `last_name` during render. Therefore, you should remove `full_name` from the state.

Here is how you can do it:

```python
from deephaven import ui


@ui.component
def name_input():
    first_name, set_first_name = ui.use_state("")
    last_name, set_last_name = ui.use_state("")

    def handle_first_name_change(value):
        set_first_name(value)

    def handle_last_name_change(value):
        set_last_name(value)

    full_name = f"{first_name} {last_name}"

    return [
        ui.heading("Check in"),
        ui.text_field(
            label="First Name", value=first_name, on_change=handle_first_name_change
        ),
        ui.text_field(
            label="Last Name", value=last_name, on_change=handle_last_name_change
        ),
        ui.text(f"You are checking in: {full_name}"),
    ]


name_input_example = name_input()
```

Here, `full_name` is not a state variable. Instead, it is calculated during render:

```python
full_name = f"{first_name} {last_name}"
```

Therefore, the change handlers can update it without any special actions. Calling `set_first_name` or `set_last_name` triggers a re-render, and the `full_name` will be recalculated using the updated data.

## Avoid duplication in state

This component lets you choose a single snack out of several:

```python
from deephaven import ui

initial_items = [
    {"title": "peanuts", "id": 0},
    {"title": "chips", "id": 1},
    {"title": "apples", "id": 2},
]


@ui.component
def snacks():
    items, set_items = ui.use_state(initial_items)
    selected_item, set_selected_item = ui.use_state(items[0])

    def snack_row(item):
        return ui.flex(
            ui.text(item["title"]),
            ui.button("Choose", on_press=lambda: set_selected_item(item)),
        )

    return [
        ui.heading("What is your favorite snack?"),
        [snack_row(item) for item in items],
        ui.text(f"You picked {selected_item['title']}"),
    ]


snacks_example = snacks()
```

The selected item is currently stored as a dictionary in the `selected_item` state variable. However, this approach is not ideal because the `selected_item` contains the same object as one of the items in the `items` list. This results in duplicated information about the item in two places.

Why is this an issue? Let's make each item editable:

```python
from deephaven import ui

initial_items = [
    {"title": "peanuts", "id": 0},
    {"title": "chips", "id": 1},
    {"title": "apples", "id": 2},
]


@ui.component
def snacks():
    items, set_items = ui.use_state(initial_items)
    selected_item, set_selected_item = ui.use_state(items[0])

    def handle_item_change(id, value):
        new_items = [
            {**item, "title": value} if item["id"] == id else item for item in items
        ]
        set_items(new_items)

    def snack_row(item):
        return ui.flex(
            ui.text_field(
                value=item["title"],
                on_change=lambda value: handle_item_change(item["id"], value),
            ),
            ui.button("Choose", on_press=lambda: set_selected_item(item)),
        )

    return [
        ui.heading("What is your favorite snack?"),
        [snack_row(item) for item in items],
        ui.text(f"You picked {selected_item['title']}"),
    ]


snacks_example = snacks()
```

Notice how if you first click "Choose" on an item and then edit it, the input updates, but the label at the bottom does not reflect the changes. This happens because you have duplicated state and forgot to update `selected_item`.

While you could update `selectedItem` as well, a simpler solution is to eliminate the duplication. In this example, instead of maintaining a `selected_item` dictionary (which duplicates the objects inside `items`), you store the `selected_id` in the state and then retrieve the `selected_item` by searching the `items` list for an item with that ID:

```python
from deephaven import ui

initial_items = [
    {"title": "peanuts", "id": 0},
    {"title": "chips", "id": 1},
    {"title": "apples", "id": 2},
]


@ui.component
def snacks():
    items, set_items = ui.use_state(initial_items)
    selected_id, set_selected_id = ui.use_state(0)

    selected_item = next(item for item in items if item["id"] == selected_id)

    def handle_item_change(id, value):
        new_items = [
            {**item, "title": value} if item["id"] == id else item for item in items
        ]
        set_items(new_items)

    def snack_row(item):
        return ui.flex(
            ui.text_field(
                value=item["title"],
                on_change=lambda value: handle_item_change(item["id"], value),
            ),
            ui.button("Choose", on_press=lambda: set_selected_id(item["id"])),
        )

    return [
        ui.heading("What is your favorite snack?"),
        [snack_row(item) for item in items],
        ui.text(f"You picked {selected_item['title']}"),
    ]


snacks_example = snacks()
```

Previously, the state was duplicated like this:

```python
items = [{"title": "peanuts", "id": 0}, ...]
selected_item = {"title": "peanuts", "id": 0}
```

After the change, it looks like this:

```python
items = [{"title": "peanuts", "id": 0}, ...]
selected_id = 0
```

The duplication is removed, keeping only the essential state.

Now, if you edit the selected item, the message below updates immediately. This happens because `set_items` triggers a re-render, and `selected_item = next(item for item in items if item["id"] == selected_id)` locates the item with the updated title. You don't need to store the selected item in the state, as only the selected ID is essential. The rest can be computed during render.

## Avoid deeply nested state

Consider a travel itinerary that includes planets, continents, and countries. You might think to organize its state with nested objects and arrays, as shown in this example:

```python
initial_travel_plan = {
    "id": 0,
    "title": "(Root)",
    "child_places": [
        {
            "id": 1,
            "title": "Earth",
            "child_places": [
                {
                    "id": 2,
                    "title": "Africa",
                    "child_places": [
                        {"id": 3, "title": "Botswana", "child_places": []},
                        {"id": 4, "title": "Egypt", "child_places": []},
                        {"id": 5, "title": "Kenya", "child_places": []},
                        {"id": 6, "title": "Madagascar", "child_places": []},
                        {"id": 7, "title": "Morocco", "child_places": []},
                        {"id": 8, "title": "Nigeria", "child_places": []},
                        {"id": 9, "title": "South Africa", "child_places": []},
                    ],
                },
                {
                    "id": 10,
                    "title": "Americas",
                    "child_places": [
                        {"id": 11, "title": "Argentina", "child_places": []},
                        {"id": 12, "title": "Brazil", "child_places": []},
                        {"id": 13, "title": "Barbados", "child_places": []},
                        {"id": 14, "title": "Canada", "child_places": []},
                        {"id": 15, "title": "Jamaica", "child_places": []},
                        {"id": 16, "title": "Mexico", "child_places": []},
                        {"id": 17, "title": "Trinidad and Tobago", "child_places": []},
                        {"id": 18, "title": "Venezuela", "child_places": []},
                    ],
                },
                {
                    "id": 19,
                    "title": "Asia",
                    "child_places": [
                        {"id": 20, "title": "China", "child_places": []},
                        {"id": 21, "title": "India", "child_places": []},
                        {"id": 22, "title": "Singapore", "child_places": []},
                        {"id": 23, "title": "South Korea", "child_places": []},
                        {"id": 24, "title": "Thailand", "child_places": []},
                        {"id": 25, "title": "Vietnam", "child_places": []},
                    ],
                },
                {
                    "id": 26,
                    "title": "Europe",
                    "child_places": [
                        {"id": 27, "title": "Croatia", "child_places": []},
                        {"id": 28, "title": "France", "child_places": []},
                        {"id": 29, "title": "Germany", "child_places": []},
                        {"id": 30, "title": "Italy", "child_places": []},
                        {"id": 31, "title": "Portugal", "child_places": []},
                        {"id": 32, "title": "Spain", "child_places": []},
                        {"id": 33, "title": "Turkey", "child_places": []},
                    ],
                },
                {
                    "id": 34,
                    "title": "Oceania",
                    "child_places": [
                        {"id": 35, "title": "Australia", "child_places": []},
                        {
                            "id": 36,
                            "title": "Bora Bora (French Polynesia)",
                            "child_places": [],
                        },
                        {
                            "id": 37,
                            "title": "Easter Island (Chile)",
                            "child_places": [],
                        },
                        {"id": 38, "title": "Fiji", "child_places": []},
                        {"id": 39, "title": "Hawaii (the USA)", "child_places": []},
                        {"id": 40, "title": "New Zealand", "child_places": []},
                        {"id": 41, "title": "Vanuatu", "child_places": []},
                    ],
                },
            ],
        },
        {
            "id": 42,
            "title": "Moon",
            "child_places": [
                {"id": 43, "title": "Rheita", "child_places": []},
                {"id": 44, "title": "Piccolomini", "child_places": []},
                {"id": 45, "title": "Tycho", "child_places": []},
            ],
        },
        {
            "id": 46,
            "title": "Mars",
            "child_places": [
                {"id": 47, "title": "Corn Town", "child_places": []},
                {"id": 48, "title": "Green Hill", "child_places": []},
            ],
        },
    ],
}
```

If you want to add a button for deleting a place you've visited, you need to update the nested state by making copies of dictionaries from the changed part upwards. Deleting a deeply nested place requires copying its entire parent chain, which can be verbose.

If the state is too nested, consider flattening it. One way to restructure the data is to have each place hold an array of its child place IDs, and store a mapping from each place ID to the corresponding place.

This restructuring is similar to a database table:

```python
initial_travel_plan = {
    0: {
        "id": 0,
        "title": "(Root)",
        "child_ids": [1, 42, 46],
    },
    1: {"id": 1, "title": "Earth", "child_ids": [2, 10, 19, 26, 34]},
    2: {"id": 2, "title": "Africa", "child_ids": [3, 4, 5, 6, 7, 8, 9]},
    3: {"id": 3, "title": "Botswana", "child_ids": []},
    4: {"id": 4, "title": "Egypt", "child_ids": []},
    5: {"id": 5, "title": "Kenya", "child_ids": []},
    6: {"id": 6, "title": "Madagascar", "child_ids": []},
    7: {"id": 7, "title": "Morocco", "child_ids": []},
    8: {"id": 8, "title": "Nigeria", "child_ids": []},
    9: {"id": 9, "title": "South Africa", "child_ids": []},
    10: {
        "id": 10,
        "title": "Americas",
        "child_ids": [11, 12, 13, 14, 15, 16, 17, 18],
    },
    11: {"id": 11, "title": "Argentina", "child_ids": []},
    12: {"id": 12, "title": "Brazil", "child_ids": []},
    13: {"id": 13, "title": "Barbados", "child_ids": []},
    14: {"id": 14, "title": "Canada", "child_ids": []},
    15: {"id": 15, "title": "Jamaica", "child_ids": []},
    16: {"id": 16, "title": "Mexico", "child_ids": []},
    17: {"id": 17, "title": "Trinidad and Tobago", "child_ids": []},
    18: {"id": 18, "title": "Venezuela", "child_ids": []},
    19: {
        "id": 19,
        "title": "Asia",
        "child_ids": [20, 21, 22, 23, 24, 25],
    },
    20: {"id": 20, "title": "China", "child_ids": []},
    21: {"id": 21, "title": "India", "child_ids": []},
    22: {"id": 22, "title": "Singapore", "child_ids": []},
    23: {"id": 23, "title": "South Korea", "child_ids": []},
    24: {"id": 24, "title": "Thailand", "child_ids": []},
    25: {"id": 25, "title": "Vietnam", "child_ids": []},
    26: {
        "id": 26,
        "title": "Europe",
        "child_ids": [27, 28, 29, 30, 31, 32, 33],
    },
    27: {"id": 27, "title": "Croatia", "child_ids": []},
    28: {"id": 28, "title": "France", "child_ids": []},
    29: {"id": 29, "title": "Germany", "child_ids": []},
    30: {"id": 30, "title": "Italy", "child_ids": []},
    31: {"id": 31, "title": "Portugal", "child_ids": []},
    32: {"id": 32, "title": "Spain", "child_ids": []},
    33: {"id": 33, "title": "Turkey", "child_ids": []},
    34: {
        "id": 34,
        "title": "Oceania",
        "child_ids": [35, 36, 37, 38, 39, 40, 41],
    },
    35: {"id": 35, "title": "Australia", "child_ids": []},
    36: {"id": 36, "title": "Bora Bora (French Polynesia)", "child_ids": []},
    37: {"id": 37, "title": "Easter Island (Chile)", "child_ids": []},
    38: {"id": 38, "title": "Fiji", "child_ids": []},
    39: {"id": 40, "title": "Hawaii (the USA)", "child_ids": []},
    40: {"id": 40, "title": "New Zealand", "child_ids": []},
    41: {"id": 41, "title": "Vanuatu", "child_ids": []},
    42: {"id": 42, "title": "Moon", "child_ids": [43, 44, 45]},
    43: {"id": 43, "title": "Rheita", "child_ids": []},
    44: {"id": 44, "title": "Piccolomini", "child_ids": []},
    45: {"id": 45, "title": "Tycho", "child_ids": []},
    46: {"id": 46, "title": "Mars", "child_ids": [47, 48]},
    47: {"id": 47, "title": "Corn Town", "child_ids": []},
    48: {"id": 48, "title": "Green Hill", "child_ids": []},
}
```

With the state now "flat" (or "normalized"), updating nested items is simplified.

To remove a place, you only need to update two levels of state:

- Update the parent place to exclude the removed ID from its `child_ids` array.
- Update the root "table" object to include the updated version of the parent place.

Here's an example of how to do it:

```python
from deephaven import ui

initial_travel_plan = {
    0: {
        "id": 0,
        "title": "(Root)",
        "child_ids": [1, 42, 46],
    },
    1: {"id": 1, "title": "Earth", "child_ids": [2, 10, 19, 26, 34]},
    2: {"id": 2, "title": "Africa", "child_ids": [3, 4, 5, 6, 7, 8, 9]},
    3: {"id": 3, "title": "Botswana", "child_ids": []},
    4: {"id": 4, "title": "Egypt", "child_ids": []},
    5: {"id": 5, "title": "Kenya", "child_ids": []},
    6: {"id": 6, "title": "Madagascar", "child_ids": []},
    7: {"id": 7, "title": "Morocco", "child_ids": []},
    8: {"id": 8, "title": "Nigeria", "child_ids": []},
    9: {"id": 9, "title": "South Africa", "child_ids": []},
    10: {
        "id": 10,
        "title": "Americas",
        "child_ids": [11, 12, 13, 14, 15, 16, 17, 18],
    },
    11: {"id": 11, "title": "Argentina", "child_ids": []},
    12: {"id": 12, "title": "Brazil", "child_ids": []},
    13: {"id": 13, "title": "Barbados", "child_ids": []},
    14: {"id": 14, "title": "Canada", "child_ids": []},
    15: {"id": 15, "title": "Jamaica", "child_ids": []},
    16: {"id": 16, "title": "Mexico", "child_ids": []},
    17: {"id": 17, "title": "Trinidad and Tobago", "child_ids": []},
    18: {"id": 18, "title": "Venezuela", "child_ids": []},
    19: {
        "id": 19,
        "title": "Asia",
        "child_ids": [20, 21, 22, 23, 24, 25],
    },
    20: {"id": 20, "title": "China", "child_ids": []},
    21: {"id": 21, "title": "India", "child_ids": []},
    22: {"id": 22, "title": "Singapore", "child_ids": []},
    23: {"id": 23, "title": "South Korea", "child_ids": []},
    24: {"id": 24, "title": "Thailand", "child_ids": []},
    25: {"id": 25, "title": "Vietnam", "child_ids": []},
    26: {
        "id": 26,
        "title": "Europe",
        "child_ids": [27, 28, 29, 30, 31, 32, 33],
    },
    27: {"id": 27, "title": "Croatia", "child_ids": []},
    28: {"id": 28, "title": "France", "child_ids": []},
    29: {"id": 29, "title": "Germany", "child_ids": []},
    30: {"id": 30, "title": "Italy", "child_ids": []},
    31: {"id": 31, "title": "Portugal", "child_ids": []},
    32: {"id": 32, "title": "Spain", "child_ids": []},
    33: {"id": 33, "title": "Turkey", "child_ids": []},
    34: {
        "id": 34,
        "title": "Oceania",
        "child_ids": [35, 36, 37, 38, 39, 40, 41],
    },
    35: {"id": 35, "title": "Australia", "child_ids": []},
    36: {"id": 36, "title": "Bora Bora (French Polynesia)", "child_ids": []},
    37: {"id": 37, "title": "Easter Island (Chile)", "child_ids": []},
    38: {"id": 38, "title": "Fiji", "child_ids": []},
    39: {"id": 40, "title": "Hawaii (the USA)", "child_ids": []},
    40: {"id": 40, "title": "New Zealand", "child_ids": []},
    41: {"id": 41, "title": "Vanuatu", "child_ids": []},
    42: {"id": 42, "title": "Moon", "child_ids": [43, 44, 45]},
    43: {"id": 43, "title": "Rheita", "child_ids": []},
    44: {"id": 44, "title": "Piccolomini", "child_ids": []},
    45: {"id": 45, "title": "Tycho", "child_ids": []},
    46: {"id": 46, "title": "Mars", "child_ids": [47, 48]},
    47: {"id": 47, "title": "Corn Town", "child_ids": []},
    48: {"id": 48, "title": "Green Hill", "child_ids": []},
}


@ui.component
def place_tree(my_id, parent_id, places_by_id, on_complete, n):
    place = places_by_id[my_id]
    child_ids = place["child_ids"]

    return [
        ui.flex(
            ui.text("-" * n + place["title"]),
            ui.action_button(
                "Complete", on_press=lambda: on_complete(parent_id, my_id)
            ),
        ),
        [
            place_tree(child_id, my_id, places_by_id, on_complete, n + 1)
            for child_id in child_ids
        ],
    ]


@ui.component
def travel_plan():
    plan, set_plan = ui.use_state(initial_travel_plan)

    def handle_complete(parent_id, child_id):
        parent = plan[parent_id]
        # Create a new version of the parent place that doesn't include this child id
        next_parent = {
            **parent,
            "child_ids": [cid for cid in parent["child_ids"] if cid != child_id],
        }
        # Update the root state dictionary
        set_plan({**plan, parent_id: next_parent})

    root = plan[0]
    planet_ids = root["child_ids"]

    return [
        ui.heading("Places to visit"),
        [place_tree(child_id, 0, plan, handle_complete, 0) for child_id in planet_ids],
    ]


travel_plan_example = travel_plan()
```

Nesting state is flexible, but keeping it “flat” can resolve many issues. A flat state is easier to update and helps prevent duplication across different parts of a nested object.
