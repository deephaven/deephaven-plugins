# Menu

Menus display a list of actions or options that a user can choose.

## Example

```python
from deephaven import ui


my_menu_example = ui.menu_trigger(
    ui.action_button("Edit"),
    ui.menu(
        ui.item("Cut", key="cut"),
        ui.item("Copy", key="copy"),
        ui.item("Paste", key="paste"),
        ui.item("Replace", key="replace"),
        on_action=lambda key: print(key),
    ),
)
```

## Content

Menu accepts `item` elements as children, each with a `key` prop. Basic usage of `menu`, seen in the example above, shows multiple items populated with a string.

## Events

Use the `on_selection_change` prop as a callback to handle press events on items when `selection_mode` is either `single` or `multiple`. See Selection for more information.

Menu also supports the `on_action` callback when `selection_mode` is `none` (default).

```python
from deephaven import ui


@ui.component
def open_action_example():
    action, set_action = ui.use_state()
    return ui.flex(
        ui.menu_trigger(
            ui.action_button("Edit"),
            ui.menu(
                ui.item("Cut", key="cut"),
                ui.item("Copy", key="copy"),
                ui.item("Paste", key="paste"),
                on_action=set_action,
            ),
        ),
        ui.text(f"Action {action}"),
        gap="size-100",
        align_items="center",
    )


my_open_action_example = open_action_example()
```

## Selection

Menu supports multiple selection modes. By default, selection is disabled, however this can be changed using the `selection_mode` prop. Use `default_selected_keys` to provide a default set of selected items (uncontrolled) and `selected_keys` to set the selected items (controlled). The value of the selected keys must match the key prop of the items.

```python
from deephaven import ui


@ui.component
def single_selection_example():
    selected, set_selected = ui.use_state(["middle"])
    return ui.flex(
        ui.menu_trigger(
            ui.action_button("Align"),
            ui.menu(
                ui.item("Left", key="left"),
                ui.item("Middle", key="middle"),
                ui.item("Right", key="right"),
                selection_mode="single",
                selected_keys=selected,
                on_selection_change=set_selected,
            ),
        ),
        ui.text(f"Current selection (controlled) {selected}"),
        gap="size-100",
        align_items="center",
    )


my_single_selection_example = single_selection_example()
```

Set `selection_mode` prop to `multiple` to allow more than one selection.

```python
from deephaven import ui


@ui.component
def multiple_selection_example():
    selected, set_selected = ui.use_state(["sidebar", "console"])
    return ui.flex(
        ui.menu_trigger(
            ui.action_button("Show"),
            ui.menu(
                ui.item("Sidebar", key="sidebar"),
                ui.item("Searchbar", key="searchbar"),
                ui.item("Tools", key="tools"),
                ui.item("Console", key="console"),
                selection_mode="multiple",
                selected_keys=selected,
                on_selection_change=set_selected,
            ),
            close_on_select=False,
        ),
        ui.text(f"Current selection (controlled) {selected}"),
        gap="size-100",
        align_items="center",
    )


my_multiple_selection_example = multiple_selection_example()
```

## Links

By default, interacting with an item in a Menu triggers `on_action` and optionally `on_selection_change` depending on the `selection_mode`. Alternatively, items may be links to another page or website. This can be achieved by passing the `href` prop to the `item` component. Link items in a menu are not selectable.

```python
from deephaven import ui


my_link_example = ui.menu_trigger(
    ui.action_button("Links"),
    ui.menu(
        ui.item("Adobe", href="https://adobe.com/", target="_blank"),
        ui.item("Apple", href="https://apple.com/", target="_blank"),
        ui.item("Google", href="https://google.com/", target="_blank"),
        ui.item("Microsoft", href="https://microsoft.com/", target="_blank"),
    ),
)
```

## Sections

```python
from deephaven import ui


@ui.component
def sections_example():
    selected, set_selected = ui.use_state(["bold", "left"])
    return (
        ui.menu_trigger(
            ui.action_button("Show"),
            ui.menu(
                ui.section(
                    ui.item("Bold", key="bold"),
                    ui.item("Underline", key="underline"),
                    title="Styles",
                ),
                ui.section(
                    ui.item("Left", key="left"),
                    ui.item("Middle", key="middle"),
                    ui.item("Right", key="right"),
                    title="Align",
                ),
                selection_mode="multiple",
                selected_keys=selected,
                on_selection_change=set_selected,
            ),
            close_on_select=False,
        ),
    )


my_sections_example = sections_example()
```

## Submenus

Submenus can be created by wrapping an item and a menu in a `submenu_trigger`. The `submenu_trigger` accepts exactly two children: the `item` which triggers opening of the submenu, and the `menu` itself. Each submenu's `menu` accepts its own set of menu props, allowing you to customize its user action and selection behavior.

```python
from deephaven import ui


my_submenu_example = ui.menu_trigger(
    ui.action_button("Actions"),
    ui.menu(
        ui.item("Cut", key="cut"),
        ui.item("Copy", key="copy"),
        ui.item("Paste", key="paste"),
        ui.submenu_trigger(
            ui.item("Share", key="share"),
            ui.menu(
                ui.item("Copy link", key="copy link"),
                ui.submenu_trigger(
                    ui.item("Email", key="email"),
                    ui.menu(
                        ui.item("Email as attachment", "attachment"),
                        ui.item("Email as link", "link"),
                        on_action=lambda key: print(f"Email menu {key} action"),
                    ),
                ),
                ui.item("SMS", key="sms"),
                on_action=lambda key: print(f"Share menu {key} action"),
            ),
        ),
        ui.item("Delete", key="delete"),
        on_action=lambda key: print(f"Root menu {key} action"),
    ),
)
```

## Using item_table_source

`item_table_source` is used to create complex items from a table (ie., defining which columns are the keys/labels of the data).

```python
from deephaven import ui, new_table
from deephaven.column import string_col

_table = new_table(
    [
        string_col("Keys", ["key-0", "key-1", "key-2"]),
        string_col("Labels", ["Option 0", "Option 1", "Option 2"]),
    ]
)


@ui.component
def menu_table_source():
    source = ui.item_table_source(_table, key_column="Keys", label_column="Labels")
    return ui.menu_trigger(
        ui.action_button("Table source"),
        ui.menu(source),
    )


my_menu_table_source = menu_table_source()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.menu
```
