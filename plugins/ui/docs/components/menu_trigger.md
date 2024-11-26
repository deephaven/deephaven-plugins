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

By default, a menu_trigger's menu is opened by pressing the trigger element or activating it via the Space or Enter keys. However, there may be cases in which your trigger element should perform a separate default action on press such as selection, and should only display the menu when long pressed. This behavior can be changed by providing `longPress` to the `trigger` prop. With this prop, the menu will only be opened upon pressing and holding the trigger element or by using the Option (Alt on Windows) + Down Arrow/Up Arrow keys while focusing the trigger element.

The example below illustrates how one would setup a `menu_trigger` to have long press behavior.

```python
from deephaven import ui


my_long_press_example = ui.menu_trigger(
    ui.action_button("Crop tool", on_press=print("Cropping!")),
    ui.menu(
        ui.item("Crop Rotate"),
        ui.item("Slice"),
        ui.item("Clone stamp"),
    ),
    trigger="longPress",
)
```

## Visual options

### Align and direction

The `align` prop aligns the `menu` relative to the `trigger` and the direction prop controls the `direction` the `menu` will render

```python
from deephaven import ui


my_align_example = ui.flex(
    ui.menu_trigger(
        ui.action_button("Edit"),
        ui.menu(
            ui.item("Cut"),
            ui.item("Copy"),
            ui.item("Paste"),
        ),
        align="start",
    ),
    ui.menu_trigger(
        ui.action_button("View"),
        ui.menu(
            ui.item("Side bar"),
            ui.item("Page options"),
            ui.item("Edit panel"),
        ),
        align="end",
        direction="top",
        should_flip=False,
    ),
    ui.menu_trigger(
        ui.action_button("Edit"),
        ui.menu(
            ui.item("Cut"),
            ui.item("Copy"),
            ui.item("Paste"),
        ),
        align="start",
        direction="start",
    ),
    ui.menu_trigger(
        ui.action_button("View"),
        ui.menu(
            ui.item("Side bar"),
            ui.item("Page options"),
            ui.item("Edit panel"),
        ),
        align="end",
        direction="end",
    ),
    gap="size-100",
)
```

### Close on selection

By default, the `menu` closes when an item is selected. To change this, set the `close_on_select` prop to `False`. This might be useful when multiple selection is used.

```python
my_close_on_selection_example = ui.menu_trigger(
    ui.action_button("View"),
    ui.menu(
        ui.item("Side bar"),
        ui.item("Page options"),
        ui.item("Edit panel"),
        selection_mode="multiple",
    ),
    close_on_selection=False,
)
```

### Flipping

By default, the `menu` flips direction automatically upon opening when space is limited. To change this, set the `should_flip` prop to `False`. Try scrolling the viewport close to the edge of the trigger in the example to see this in action.

```python
from deephaven import ui


my_flip_example = ui.flex(
    ui.menu_trigger(
        ui.action_button("Edit"),
        ui.menu(
            ui.item("Cut"),
            ui.item("Copy"),
            ui.item("Paste"),
        ),
        should_flip=True,
    ),
    ui.menu_trigger(
        ui.action_button("View"),
        ui.menu(
            ui.item("Side bar"),
            ui.item("Page options"),
            ui.item("Edit panel"),
        ),
        should_flip=False,
    ),
    gap="size-100",
)
```

### Open

The `is_open` and `default_open` props on the `menu_trigger` control whether the Menu is open by default. They apply controlled and uncontrolled behavior on the `menu` respectively.

```python
from deephaven import ui


@ui.component
def open_example():
    is_open, set_open = ui.use_boolean()
    ui.menu_trigger(
        ui.action_button("View"),
        ui.menu(
            ui.item("Side bar"),
            ui.item("Page options"),
            ui.item("Edit panel"),
            selection_mode="multiple",
        ),
        is_open=is_open,
        on_open_chnage=set_open,
    ),


my_open_example = open_example()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.menu_trigger
```
