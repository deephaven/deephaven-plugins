# Menu Trigger

The `menu_trigger` serves as a wrapper around a `menu` and its associated trigger, linking the menu's open state with the trigger's press state.

## Example

```python
from deephaven import ui


my_menu_trigger_example = ui.menu_trigger(
    ui.action_button("Edit"),
    ui.menu(
        ui.item("Cut"),
        ui.item("Copy"),
        ui.item("Paste"),
    ),
)
```

## Content

The `menu_trigger` accepts exactly two children: the element which triggers the opening of the `menu` and the `menu` itself. The trigger element must be the first child passed into the `menu_trigger` and should support press events.

## Events

`menu_trigger` accepts an `on_open_chnage` handler which is triggered whenever the `menu` is opened or closed.

```python
from deephaven import ui


@ui.component
def open_change_example():
    is_open, set_open = ui.use_boolean()
    return ui.flex(
        ui.menu_trigger(
            ui.action_button("Edit"),
            ui.menu(
                ui.item("Cut"),
                ui.item("Copy"),
                ui.item("Paste"),
            ),
            on_open_chnage=set_open,
        ),
        ui.text(f"Currently open: {is_open}"),
        gap="size-100",
        align_items="center",
    )


my_open_change_example = open_change_example()
```

## Long press

By default, a menu_trigger's menu is opened by pressing the trigger element or activating it via the Space or Enter keys. However, there may be cases in which your trigger element should perform a separate default action on press such as selection, and should only display the menu when long pressed. This behavior can be changed by providing `long_press` to the trigger prop. With this prop, the menu will only be opened upon pressing and holding the trigger element or by using the Option (Alt on Windows) + Down Arrow/Up Arrow keys while focusing the trigger element.

The example below illustrates how one would setup a `menu_trigger` to have long press behavior.

TODO EXAMPLE
