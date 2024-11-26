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

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.menu
```
