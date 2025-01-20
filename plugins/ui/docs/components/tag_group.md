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

## Labeling

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
def tag_group_label_example():
    return ui.tag_group(
        ui.item("News", key="news"),
        ui.item("Travel", key="travel"),
        ui.item("Gaming", key="gaming"),
        ui.item("Shopping", key="shopping"),
        label="Categories",
        label_position="side",
    )


my_tag_group_label_example = tag_group_label_example()
```

### Label Alignment

By default, the label is horizontally aligned to the start of the tag group element, but it can be moved to the end by using the `label_align` prop.

```python
from deephaven import ui


@ui.component
def tag_group_label_example():
    return ui.tag_group(
        ui.item("News", key="news"),
        ui.item("Travel", key="travel"),
        ui.item("Gaming", key="gaming"),
        ui.item("Shopping", key="shopping"),
        label="Categories",
        label_align="end",
    )


my_tag_group_label_example = tag_group_label_example()
```

## Events

Removing tags can be enabled by providing the `on_remove` prop to the tag group, which will receive the set of keys to remove.

```python
from deephaven import ui


@ui.component
def tag_group_remove_example():
    items, set_items = ui.use_state(
        [
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
        ]
    )

    return (
        ui.tag_group(
            *items,
            on_remove=lambda keys: set_items(
                [item for item in items if item.key != keys[0]]
            )
        ),
    )


my_tag_group_remove_example = tag_group_remove_example()
```

Use the prop `action_label` to display an action button with that label at the end of the tags. The custom action that will be performed is specified by the `on_action` prop.

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

## Links

Tags can become links to another page or website by passing the `href` prop to the `ui.item` component.

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
            error_message="Sample error message",
        ),
        ui.tag_group(
            ui.item("News", key="news"),
            ui.item("Travel", key="travel"),
            ui.item("Gaming", key="gaming"),
            ui.item("Shopping", key="shopping"),
            is_invalid=True,
            description="Pick your favorite category",
            error_message="Sample error message",
        ),
    ]


my_tag_group_help_text_example = tag_group_help_text_example()
```

## Contextual help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the tag group.

```python
from deephaven import ui


@ui.component
def tag_group_contextual_help_example():
    return (
        (
            ui.tag_group(
                ui.item("News", key="news"),
                ui.item("Travel", key="travel"),
                ui.item("Gaming", key="gaming"),
                ui.item("Shopping", key="shopping"),
                label="Categories",
                contextual_help=ui.contextual_help(
                    heading="Hint", content="Pick your favorite category"
                ),
            ),
        ),
    )


my_tag_group_contextual_help_example = tag_group_contextual_help_example()
```

## Limit rows

To limit the number of rows initially shown, use the `max_rows` prop. A button to allow the user to expand to show all tags will be displayed if the tags would overflow the number of rows.

```python
from deephaven import ui


@ui.component
def tag_group_max_rows_example():
    return (
        [
            ui.view(
                ui.tag_group(
                    ui.item("News", key="news"),
                    ui.item("Travel", key="travel"),
                    ui.item("Gaming", key="gaming"),
                    ui.item("Shopping", key="shopping"),
                ),
                border_width="thin",
                border_color="accent-400",
                width="size-2000",
            ),
            ui.view(
                ui.tag_group(
                    ui.item("News", key="news"),
                    ui.item("Travel", key="travel"),
                    ui.item("Gaming", key="gaming"),
                    ui.item("Shopping", key="shopping"),
                    max_rows=1,
                ),
                border_width="thin",
                border_color="accent-400",
                width="size-2000",
            ),
        ],
    )


my_tag_group_max_rows_example = tag_group_max_rows_example()
```

## Empty state

Use the `render_empty_state` prop to specify the element to be displayed when the tag group will display when no tags are provided. By default the empty state displays the text "None".

```python
from deephaven import ui


@ui.component
def tag_group_empty_state_example():
    return (
        [
            ui.tag_group(),
            ui.tag_group(
                render_empty_state=ui.flex(
                    ui.icon("dh_warning_circle_filled", size="S"),
                    ui.text("No tags here"),
                    align_items="center",
                ),
            ),
        ],
    )


my_tag_group_empty_state_example = tag_group_empty_state_example()
```
