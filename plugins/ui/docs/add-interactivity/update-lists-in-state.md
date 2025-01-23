# Update Lists in State

Python lists are mutable, but you should treat them as immutable when you store them in state. Just like with dictionaries, when you want to update an list stored in state, you need to create a new one (or make a copy of an existing one), and then set state to use the new list.

## Update lists without mutation

Like with dictionaries, you should treat lists in `deephaven.ui` state as read-only. This means that you should not reassign items inside an list like `my_list[0] = "bird"`, and you also should not use methods that mutate the list, such as `append()` and `remove()`.

Instead, every time you want to update an list, you will want to pass a new list to your state setting function. To do that, you can create a new list from the original list in your state by copying the list or creating new list via list comprehension. Then you can set your state to the resulting new list.

## Add to a list

`append()` and `insert()` will mutate a list, which you do not want.

```python
from deephaven import ui


@ui.component
def artist_list():
    name, set_name = ui.use_state("")
    artists, set_artists = ui.use_state([])

    return [
        ui.heading("Artists:"),
        ui.text_field(value=name, on_change=set_name),
        ui.button(
            "Add",
            # Append mutates the existing list
            on_press=lambda: artists.append(name),
        ),
        [ui.text(n) for n in artists],
    ]


artist_list_example = artist_list()
```

Instead, create a new list which contains the existing items and a new item at the end. There are multiple ways to do this, you can use the `copy()` method or `concatenation`. Now it works correctly:

```python
from deephaven import ui


@ui.component
def artist_list():
    name, set_name = ui.use_state("")
    artists, set_artists = ui.use_state([])

    return [
        ui.heading("Artists:"),
        ui.text_field(value=name, on_change=set_name),
        ui.button(
            "Add",
            # Concatenate to create a new list
            on_press=lambda: set_artists(artists + [name]),
        ),
        [ui.text(n) for n in artists],
    ]


artist_list_example = artist_list()
```

The `concatenation` syntax also lets you prepend by placing it before the original list:

```python
set_artists([name] + artists)
```

## Remove from a list

`remove()`, `pop()`, `del`, and `clear()` will mutate a list. Instead, you can slice or use a list comprehension to filter out unwanted items.

```python
from deephaven import ui

initial_artists = [
    {"id": 0, "name": "Leonardo"},
    {"id": 1, "name": "Donatello"},
    {"id": 2, "name": "Michelangelo"},
    {"id": 3, "name": "Raphael"},
]


@ui.component
def artist_list():
    artists, set_artists = ui.use_state(initial_artists)

    def handle_remove(id):
        # Use list comprehension to filter by id
        set_artists([artist for artist in artists if artist["id"] != id])

    def artist_row(artist):
        return ui.flex(
            ui.text(artist["name"]),
            ui.button("Delete", on_press=lambda: handle_remove(artist["id"])),
        )

    return [ui.heading("Artists:"), [artist_row(artist) for artist in artists]]


artist_list_example = artist_list()
```

Here, `[artist for artist in artists if artist["id"] != id]` means create an list that consists of those artists whose IDs are different from `artist["id"]`. In other words, each artist’s “Delete” button will filter that artist out of the list, and then request a re-render with the resulting array. Note that list comprehension does not modify the original array.

## Transform a list
