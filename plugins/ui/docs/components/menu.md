# Menu

Menus display a list of actions or options that a user can choose.

## Example

The menu is wrapped in a [`ui.menu_trigger`](./menu_trigger.md) along with a trigger element such as an [`ui.action_button`](./action_button.md).

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

Use the `on_change` prop as a callback to handle press events on items when `selection_mode` is either `single` or `multiple`. See [Selection](#selection) for more information.

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

Menu supports multiple selection modes. By default, selection is disabled, however this can be changed using the `selection_mode` prop. Use `default_selected_keys` to provide a default set of selected items (uncontrolled) or `selected_keys` to set the selected items (controlled). The values of the selected keys must match the key props of the items.

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
                on_change=set_selected,
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
    selected, set_selected = ui.use_state("all")
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
                on_change=set_selected,
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

By default, interacting with an item in a Menu triggers `on_action` and optionally `on_change` depending on the `selection_mode`. Alternatively, items may be links to another page or website. This can be achieved by passing the `href` prop to the `item` component. Link items in a menu are not selectable.

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
                on_change=set_selected,
            ),
            close_on_select=False,
        ),
    )


my_sections_example = sections_example()
```

## Unavailable Items

`contextual_help_trigger` disables a menu item's action and replaces it with a popover with information on why the item is unavailable and may link users to more information elsewhere.

The `contextual_help_trigger` accepts exactly two children: the `item` which triggers opening of the `dialog` and the Dialog itself. The trigger must be the first child passed into the `contextual_help_trigger` and should be an `item`. Similar to `contextual_help`, the layout of the `dialog` is very deliberate. See [`contextual_help`](./contextual_help.md) for further explanation.

Setting the `is_unavailable` prop on the `contextual_help_trigger` makes the menu item unavailable and enables the `dialog` with contextual help, allowing for programmatic control.

Note that the `menu's` `on_action` and `on_change` callbacks will not fire for items made unavailable by a `contextual_help_trigger`.

The example below illustrates how one would setup a `menu` to use `contextual_help_trigger`.

```python
from deephaven import ui


my_menu_example = ui.menu_trigger(
    ui.action_button("Edit"),
    ui.menu(
        ui.item("Undo", key="undo"),
        ui.item("Redo", key="redo"),
        ui.contextual_help_trigger(
            ui.item("Cut", key="cut"),
            ui.dialog(
                ui.heading("Cut"),
                ui.content("Please select text for 'Cut' to be enabled."),
            ),
            is_unavailable=True,
        ),
        ui.contextual_help_trigger(
            ui.item("Copy", key="copy"),
            ui.dialog(
                ui.heading("Copy"),
                ui.content("Please select text for 'Copy' to be enabled."),
            ),
            is_unavailable=True,
        ),
        ui.contextual_help_trigger(
            ui.item("Paste", key="paste"),
            ui.dialog(ui.heading("Paste"), ui.content("You have nothing to 'Paste'.")),
        ),
    ),
)
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
                        ui.item("Email as attachment", key="attachment"),
                        ui.item("Email as link", key="link"),
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

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.menu
```
