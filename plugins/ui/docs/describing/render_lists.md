# Render Lists

You will often want to display multiple similar components from a collection of data. You can use Python `filter` and `list comprehension` with `deephaven.ui` to filter and transform your list of data into an list of components.

## Render data from lists

Here is an example list of content:

```python
from deephaven import ui


@ui.component
def content_list():
    return ui.flex(
        ui.text("apple: fruit"),
        ui.text("broccoli: vegetable"),
        ui.text("banana: fruit"),
        ui.text("yogurt: dairy"),
        ui.text("carrot: vegetable"),
        direction="column",
    )


my_content_list = content_list()
```

![my_content_list](../_assets/render_lists1.png)

The only difference among those list items is their contents, their data. You will often need to show several instances of the same component using different data when building interfaces. Here is a short example of how to generate a list of items from an list of data:

1. Move the data into a list
2. Use list comprehension to map the list of data to a list of components
3. Use the list of components in your component

```python
from deephaven import ui

food = [
    "apple: fruit",
    "broccoli: vegetable",
    "banana: fruit",
    "yogurt: dairy",
    "carrot: vegetable",
]


@ui.component
def content_list(data):
    # map the text items to components
    components = [ui.text(item) for item in data]
    return ui.flex(components, direction="column")


my_content_list = content_list(food)
```

## Filter lists of items

If you want a way to only show items of type vegetable, you can use the Python `filter` function to return just those items.

```python
from deephaven import ui

food = [
    "apple: fruit",
    "broccoli: vegetable",
    "banana: fruit",
    "yogurt: dairy",
    "carrot: vegetable",
]


@ui.component
def content_list(data, data_type):
    # filter for items that end with the desired data type
    filtered = list(filter(lambda item: item.endswith(data_type), data))
    # map the text items to components
    components = [ui.text(item) for item in filtered]
    return ui.flex(components, direction="column")


my_content_list = content_list(food, "vegetable")
```

![my_content_list2](../_assets/render_lists2.png)
