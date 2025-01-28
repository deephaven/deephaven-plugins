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

Instead, create a new list which contains the existing items and a new item at the end. There are multiple ways to do this, you can use the `copy()` method, `concatenation`, or `unpacking`. Now it works correctly:

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
            # Use unpacking to create a new list
            on_press=lambda: set_artists([*artists, name]),
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

Here, `[artist for artist in artists if artist["id"] != id]` means create an list that consists of those artists whose IDs are different from `artist["id"]`. In other words, each artist’s “Delete” button will filter that artist out of the list, and then request a re-render with the resulting list. Note that list comprehension does not modify the original list.

## Transform a list

If you want to change some or all items of the list, you can use list comprehension to create a new list.

In this example, a list holds three values. Two are "mutable" and one is "immutable". Clicking on the button will increment only the "mutable" values. It does this by producing a new list using list comprehension.

```python
from deephaven import ui

initial_values = [
    {"number": 0, "type": "mutable"},
    {"number": 10, "type": "immutable"},
    {"number": 20, "type": "mutable"},
]


@ui.component
def transform():
    values, set_values = ui.use_state(initial_values)

    def handle_press(id):
        set_values(
            [
                value
                if value["type"] == "immutable"
                else {**value, "number": value["number"] + 1}
                for value in values
            ]
        )

    return [
        ui.heading("Values:"),
        ui.button("Increment mutable", on_press=handle_press),
        [ui.text(value["number"]) for value in values],
    ]


transform_example = transform()
```

## Replace items in a list

It is particularly common to want to replace one or more items in an list. Assignments like `values[0] = "bird"` are mutating the original list, so instead you will want to use list comprehension for this as well.

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
    value, set_value = ui.use_state("")
    artists, set_artists = ui.use_state(initial_artists)

    def handle_replace(id):
        set_artists(
            [
                artist if artist["id"] != id else {"id": id, "name": value}
                for artist in artists
            ]
        )

    def artist_row(artist):
        return ui.flex(
            ui.text(artist["name"]),
            ui.button("Replace", on_press=lambda: handle_replace(artist["id"])),
        )

    return [
        ui.heading("Artists:"),
        ui.text_field(label="Name", value=value, on_change=set_value),
        [artist_row(artist) for artist in artists],
    ]


artist_list_example = artist_list()
```

## Insert into a list

You may want to insert an item at a particular position that is neither at the beginning nor at the end. To do this, you can the slice syntax. The slice syntax lets you cut a “slice” of the list. To insert an item, you will create a slice before the insertion point, then the new item, and then a slice that is the rest of the original list.

In this example, the Insert button always inserts at the index 1:

```python
from deephaven import ui

next_id = 4
initial_artists = [
    {"id": 0, "name": "Leonardo"},
    {"id": 1, "name": "Donatello"},
    {"id": 2, "name": "Michelangelo"},
    {"id": 3, "name": "Raphael"},
]


@ui.component
def artist_list():
    value, set_value = ui.use_state("")
    artists, set_artists = ui.use_state(initial_artists)

    def handle_insert():
        global next_id
        # Use slicing to create a new list
        set_artists(artists[:1] + [{"id": next_id, "name": value}] + artists[1:])
        next_id += 1

    return [
        ui.heading("Artists:"),
        ui.text_field(label="Name", value=value, on_change=set_value),
        ui.button("Insert", on_press=handle_insert),
        [ui.text(artist["name"]) for artist in artists],
    ]


artist_list_example = artist_list()
```

## Make other changes to a list

There are some things you cannot do with non-mutating methods. For example, you may want to reverse or sort an array. The Python list `reverse()` and `sort()` methods are mutating the original list, so you cannot use them directly.

However, you can copy the list first, and then make changes to it.

For example:

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

    def handle_reverse():
        artists_copy = artists.copy()
        artists_copy.reverse()
        set_artists(artists_copy)

    return [
        ui.heading("Artists:"),
        ui.button("Reverse", on_press=handle_reverse),
        [ui.text(artist["name"]) for artist in artists],
    ]


artist_list_example = artist_list()
```

Here, you use the `copy()` method to create a copy of the original list first. Now that you have a copy, you can use mutating methods like `reverse()` or `sort()`, or even assign individual items.

However, even if you copy list, you cannot mutate existing items inside of it directly. This is because copying is shallow and the new list will contain the same items as the original one. So if you modify an dictionary inside the copied list, you are mutating the existing state. For example, code like this is a problem.

```python
artists_copy = artists.copy()
artists_copy[0]["name"] = "Splinter"
set_artists(artists_copy)
```

Although `artists_copy` and `artists` are two different lists, `artists_copy[0]` and `artists[0]` point to the same dictionary. So by changing `artists_copy[0]["name"]`, you are also changing `artists[0]["name"]`. This is a state mutation, which you should avoid. You can solve this issue in a similar way to updating nested python dictionaries by copying individual items you want to change instead of mutating them. Here’s how.

## Update dictionaries inside arrays

When updating nested state, you need to create copies from the point where you want to update, and all the way up to the top level. Let's see how this works.

In this example, two separate artwork lists have the same initial state. They are supposed to be isolated, but because of a mutation, their state is accidentally shared, and checking a box in one list affects the other list:

```python
from deephaven import ui

initial_art = [
    {"id": 0, "name": "Mona Lisa", "seen": False},
    {"id": 1, "name": "The Starry Night", "seen": False},
    {"id": 2, "name": "The Scream", "seen": True},
    {"id": 3, "name": "The Persistence of Memory", "seen": False},
]


@ui.component
def item_list(artworks, on_toggle):
    return [
        ui.checkbox(
            artwork["name"],
            is_selected=artwork["seen"],
            on_change=lambda value, artwork=artwork: on_toggle(artwork["id"], value),
        )
        for artwork in artworks
    ]


@ui.component
def bucket_list():
    my_list, set_my_list = ui.use_state(initial_art)
    your_list, set_your_list = ui.use_state(initial_art)

    def handle_toggle_my_list(artworkId, next_seen):
        my_list_copy = my_list.copy()
        artwork = next((a for a in my_list_copy if a["id"] == artworkId), None)
        artwork["seen"] = next_seen
        set_my_list(my_list_copy)

    def handle_toggle_your_list(artworkId, next_seen):
        your_list_copy = your_list.copy()
        artwork = next((a for a in your_list_copy if a["id"] == artworkId), None)
        artwork["seen"] = next_seen
        set_your_list(your_list_copy)

    return [
        ui.heading("Art Bucket List"),
        ui.heading("My list of art to see:", level=2),
        item_list(my_list, handle_toggle_my_list),
        ui.heading("Your list of art to see:", level=2),
        item_list(your_list, handle_toggle_your_list),
    ]


bucket_list_example = bucket_list()
```

The problem is in code like this:

```python
my_list_copy = my_list.copy()
artwork = next((a for a in my_list_copy if a["id"] == artworkId), None)
artwork["seen"] = next_seen  # Problem: mutates an existing item
set_my_list(my_list_copy)
```

Although the `my_list_copy` list is new, the items themselves are the same as in the original `my_list`. Therefore, changing `artwork["seen"]` also changes the original artwork item. Since that artwork item is also in `your_list`, this causes the bug. Such bugs can be tricky to debug, but they can be avoided by not mutating state.

You `deepcopy` to substitute an old item with its updated version without mutation.

```python
import copy
from deephaven import ui

initial_art = [
    {"id": 0, "name": "Mona Lisa", "seen": False},
    {"id": 1, "name": "The Starry Night", "seen": False},
    {"id": 2, "name": "The Scream", "seen": True},
    {"id": 3, "name": "The Persistence of Memory", "seen": False},
]


@ui.component
def item_list(artworks, on_toggle):
    return [
        ui.checkbox(
            artwork["name"],
            is_selected=artwork["seen"],
            on_change=lambda value, artwork=artwork: on_toggle(artwork["id"], value),
        )
        for artwork in artworks
    ]


@ui.component
def bucket_list():
    my_list, set_my_list = ui.use_state(initial_art)
    your_list, set_your_list = ui.use_state(initial_art)

    def handle_toggle_my_list(artworkId, next_seen):
        my_list_copy = copy.deepcopy(my_list)
        artwork = next((a for a in my_list_copy if a["id"] == artworkId), None)
        artwork["seen"] = next_seen
        set_my_list(my_list_copy)

    def handle_toggle_your_list(artworkId, next_seen):
        your_list_copy = copy.deepcopy(your_list)
        artwork = next((a for a in your_list_copy if a["id"] == artworkId), None)
        artwork["seen"] = next_seen
        set_your_list(your_list_copy)

    return [
        ui.heading("Art Bucket List"),
        ui.heading("My list of art to see:", level=4),
        item_list(my_list, handle_toggle_my_list),
        ui.heading("Your list of art to see:", level=4),
        item_list(your_list, handle_toggle_your_list),
    ]


bucket_list_example = bucket_list()
```

In general, you should only mutate items that you have just created. If you were inserting a new artwork, you could mutate it, but if you are dealing with something that is already in state, you need to make a copy.
