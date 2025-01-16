# Tag Group

Tags allow users to categorize content. They can represent keywords or people, and are grouped to describe an item or a search request.

## Example

```python
from deephaven import ui


@ui.component
def tag_group_example():
    return (
        ui.tag_group(
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
        ),
    )


my_tag_group_example = tag_group_example()
```

## Content

`tag_group` accepts `item` elements as children, each with a `key` prop. Basic usage of `tag_group`, seen in the example above, shows multiple items populated with a string.

## Label

To provide a visual label for the tag group, use the `label` prop.

```python
from deephaven import ui


@ui.component
def tag_group_label_example():
    return (
        ui.tag_group(
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
            label="Categories",
        ),
    )


my_tag_group_label_example = tag_group_label_example()
```

### Label Position

By default, the position of the label is above the tag group, but it can be moved to the side using the `label_position` prop.

```python
from deephaven import ui


@ui.component
def tag_group_label():
    return ui.tag_group(
        ui.item("News", key="news"),
        ui.item("Travel", key="travel"),
        ui.item("Gaming", key="gaming"),
        ui.item("Shopping", key="shopping"),
        label="Categories",
        label_position="side",
    )


my_tag_group_label = tag_group_label()
```

### Label Alignment

By default, the label is horizontally aligned to the start of the tag group element, but it can be moved to the end by using the `label_align` prop.

```python
from deephaven import ui


@ui.component
def tag_group_label():
    return ui.tag_group(
        ui.item("News", key="news"),
        ui.item("Travel", key="travel"),
        ui.item("Gaming", key="gaming"),
        ui.item("Shopping", key="shopping"),
        label="Categories",
        label_align="end",
    )


my_tag_group_label = tag_group_label()
```

## Help text

A tag group can have both a `description` and an `error_message`. The error message should offer specific guidance on how to correct the input.

The `is_invalid` prop can be used to set whether the current tag group state is valid or invalid.

```python
from deephaven import ui


@ui.component
def tag_group_help_text_example():
    return [
        ui.tag_group(
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
            description="Pick your favorite category",
        ),
        ui.tag_group(
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
            is_invalid=True,
            error_message="Sample error message",
        ),
    ]


my_tag_group_help_text_example = tag_group_help_text_example()
```

## Events

Use the `on_remove` prop to

```python
from deephaven import ui


@ui.component
def tag_group_remove_example():
    def handle_remove(keys):
        print(keys)

    return (
        ui.tag_group(
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
            on_remove=handle_remove,
        ),
    )


my_tag_group_remove_example = tag_group_remove_example()
```

Specify `action_label` to display an action button at the end of the tags. The custom action that will be performed is specified by the `on_action` prop.

```python
from deephaven import ui


@ui.component
def tag_group_action_example():
    items, set_items = ui.use_state(
        [
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
        ]
    )

    return ui.tag_group(
        *items,
        action_label="Delete Shopping",
        on_action=lambda: set_items([item for item in items if item.key != "shopping"])
    )


my_tag_group_action_example = tag_group_action_example()
```

## Max rows

To limit the number of rows initially shown, use the `max_rows` prop. This will render a button to allow the user to expand to show all tags.

```python
from deephaven import ui
```

## Empty state

## Links

Tags can become links to another page or website by passing the `href` prop to the `ui.text` component.

```python
from deephaven import ui


@ui.component
def tag_group_links_example():
    return (
        ui.tag_group(
            ui.item("Adobe", key="adobe", href="https://adobe.com/", target="_blank"),
            ui.item("Apple", key="apple", href="https://apple.com/", target="_blank"),
            ui.item(
                "Google", key="google", href="https://google.com/", target="_blank"
            ),
        ),
    )


my_tag_group_links_example = tag_group_links_example()
```

## Full example

```python
from deephaven import ui


@ui.component
def full_tag_group_example():
    return ui.tag_group()


my_full_tag_group_example() = full_tag_group_example()
```
