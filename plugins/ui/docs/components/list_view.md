## List View

ListView displays a list of interactive items, and allows a user to navigate, select, or perform an action. It offers greater flexibility in the contents it can render and can distinguish between row selection and actions performed on a row. This makes ListView an ideal component for use cases such as file managers.

## Example

```python
from deephaven import time_table, ui
import datetime

# Ticking table with initial row count of 200 that adds a row every second
initial_row_count = 200
_column_types = time_table(
    "PT1S",
    start_time=datetime.datetime.now() - datetime.timedelta(seconds=initial_row_count),
).update(
    [
        "Id=new String(`key-`+i)",
        "Display=new String(`Display `+i)",
    ]
)

# `ui.list_view`` with `ui.list_action_menu` actions
@ui.component
def ui_list_view_action_menu():
    value, set_value = ui.use_state(["key-2", "key-4", "key-5"])

    action_item_keys, set_action_item_idx = ui.use_state(["", ""])
    on_action = ui.use_callback(
        lambda action_key, item_key: set_action_item_idx([action_key, str(item_key)]),
        [],
    )

    lv = ui.list_view(
        _column_types,
        key_column="Id",
        label_column="Display",
        aria_label="List View",
        on_change=set_value,
        selected_keys=value,
        actions=ui.list_action_menu(
            "Edit",
            "Delete",
            on_action=on_action,
        ),
    )

    text_selection = ui.text("Selection: " + ", ".join(map(str, value)))
    text_action = ui.text("Action: " + " ".join(map(str, action_item_keys)))

    return lv, text_selection, text_action


my_list_view_action_menu = ui_list_view_action_menu()
```

## Events

ListView accepts an action that can be triggered when a user performs an action on an item.

```python
from deephaven import time_table, ui
import datetime

# Ticking table with initial row count of 200 that adds a row every second
initial_row_count = 200
_column_types = time_table(
    "PT1S",
    start_time=datetime.datetime.now() - datetime.timedelta(seconds=initial_row_count),
).update(
    [
        "Id=new String(`key-`+i)",
        "Display=new String(`Display `+i)",
    ]
)

# `ui.list_view`` with `ui.list_action_group` actions
@ui.component
def ui_list_view_action_group():
    value, set_value = ui.use_state(["key-2", "key-4", "key-5"])

    action_item_keys, set_action_item_idx = ui.use_state(["", ""])
    on_action = ui.use_callback(
        lambda action_key, item_key: set_action_item_idx([action_key, str(item_key)]),
        [],
    )

    lv = ui.list_view(
        _column_types,
        key_column="Id",
        label_column="Display",
        aria_label="List View",
        on_change=set_value,
        selected_keys=value,
        actions=ui.list_action_group(
            "Edit",
            "Delete",
            on_action=on_action,
        ),
    )

    text_selection = ui.text("Selection: " + ", ".join(map(str, value)))
    text_action = ui.text("Action: " + " ".join(map(str, action_item_keys)))

    return lv, text_selection, text_action


my_list_view_action_group = ui_list_view_action_group()
```

ListView can also accept a handler that is called when the selection is changed.

```python
from deephaven import time_table, ui
import datetime

# Ticking table with initial row count of 200 that adds a row every second
initial_row_count = 200
_column_types = time_table(
    "PT1S",
    start_time=datetime.datetime.now() - datetime.timedelta(seconds=initial_row_count),
).update(
    [
        "Id=new String(`key-`+i)",
        "Display=new String(`Display `+i)",
    ]
)

# `ui.list_view`` with `ui.list_action_menu` actions
@ui.component
def ui_list_view_action_menu():
    value, set_value = ui.use_state(["key-2", "key-4", "key-5"])

    action_item_keys, set_action_item_idx = ui.use_state(["", ""])
    on_action = ui.use_callback(
        lambda action_key, item_key: set_action_item_idx([action_key, str(item_key)]),
        [],
    )

    lv = ui.list_view(
        _column_types,
        key_column="Id",
        label_column="Display",
        aria_label="List View",
        on_change=set_value,
        selected_keys=value,
        actions=ui.list_action_menu(
            "Edit",
            "Delete",
            on_action=on_action,
        ),
        on_selection_change=print("Selection: " + ", ".join(map(str, value))),
    )
    return lv


my_list_view_action_menu = ui_list_view_action_menu()
```


## Quiet State

```python
from deephaven import ui


@ui.component
def ui_list_view():
    value, set_value = ui.use_state(["Text 2"])

    quiet_list = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Quiet",
        on_change=set_value,
        selected_keys=value,
        is_quiet=True,
    )

    default_list = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Default",
        on_change=set_value,
        selected_keys=value,
    )
    return default_list, quiet_list


lv = ui_list_view()
```

## Modifying Density
To adjust the vertical padding of each row in the ListView, use the `density` prop.


```python
from deephaven import ui


@ui.component
def ui_list_view():
    value, set_value = ui.use_state(["Text 2"])

    compact_list = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Compact",
        on_change=set_value,
        selected_keys=value,
        density="compact",
    )

    spacious_list = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Spacious",
        on_change=set_value,
        selected_keys=value,
        density="spacious",
    )
    return compact_list, spacious_list


lv = ui_list_view()
```

## Overflow Mode
The default behavior is to truncate content that overflows its row. Text can be wrapped instead by adding `wrap` to the `overflow_mode` prop.

```python
from deephaven import ui


@ui.component
def ui_list_view():
    value, set_value = ui.use_state(["Text 2"])

    truncated_list = ui.list_view(
        "Really long Text 1",
        "Really long Text 2",
        "Really long Text 3",
        aria_label="List View - Quiet",
        on_change=set_value,
        selected_keys=value,
        overflow_mode="truncate",
        width="150px",
    )

    wrapped_list = ui.list_view(
        "Really long Text 1",
        "Really long Text 2",
        "Really long Text 3",
        aria_label="List View - Quiet",
        on_change=set_value,
        selected_keys=value,
        overflow_mode="wrap",
        width="150px",
    )
    return truncated_list, wrapped_list


lv = ui_list_view()
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.list_view
```