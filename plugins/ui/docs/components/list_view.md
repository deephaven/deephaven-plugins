## List View

ListView displays a list of interactive items, and allows a user to navigate, select, or perform an action. They offer greater flexibility in the contents it can render and can distinguish between row selection and actions performed on a row. This makes ListView an ideal component for use cases such as file managers.

## Example

```python
from deephaven import ui


@ui.component
def ui_list_view():
    value, set_value = ui.use_state(["Text 2"])

    # list_view with text children
    lv = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Basic",
        on_change=set_value,
        selected_keys=value,
    )

    # list_view with item children
    lv2 = ui.list_view(
        ui.item("Item 1", key="Text 1"),
        ui.item("Item 2", key="Text 2"),
        ui.item("Item 3", key="Text 3"),
        aria_label="List View - Basic",
        on_change=set_value,
        selected_keys=value,
    )

    text = ui.text("Selection: " + ", ".join(map(str, value)), grid_column="span 2")

    return text, lv, lv2


lv = ui_list_view()
```

## Table Example

```python
from deephaven import time_table, ui
import datetime

# Ticking table with initial row count of 200 that adds a row every second
initial_row_count = 200
column_types = time_table(
    "PT1S",
    start_time=datetime.datetime.now() - datetime.timedelta(seconds=initial_row_count),
).update(
    [
        "Id=new Integer(i)",
        "Display=new String(`Display `+i)",
    ]
)


@ui.component
def ui_list_view_table():
    value, set_value = ui.use_state([])

    lv = ui.list_view(
        column_types,
        aria_label="List View",
        on_change=set_value,
        selected_keys=value,
    )

    text = ui.text("Selection: " + ", ".join(map(str, value)))

    return ui.flex(
        lv,
        text,
        direction="column",
        margin=10,
        gap=10,
        # necessary to avoid overflowing container height
        min_height=0,
    )


lv_table = ui_list_view_table()
```

## Item Table Source Example

```python
from deephaven import time_table, ui
import datetime

# Ticking table with initial row count of 200 that adds a row every second
initial_row_count = 200
column_types = time_table(
    "PT1S",
    start_time=datetime.datetime.now() - datetime.timedelta(seconds=initial_row_count),
).update(
    [
        "Id=new Integer(i)",
        "Display=new String(`Display `+i)",
    ]
)


@ui.component
def ui_list_view_table_source():
    value, set_value = ui.use_state([2, 4, 5])

    lv = ui.list_view(
        ui.item_table_source(column_types, key_column="Id", label_column="Display"),
        aria_label="List View",
        on_change=set_value,
        selected_keys=value,
    )

    text = ui.text("Selection: " + ", ".join(map(str, value)))

    return ui.flex(
        lv,
        text,
        direction="column",
        margin=10,
        gap=10,
        # necessary to avoid overflowing container height
        min_height=0,
    )


lv_table_source = ui_list_view_table_source()
```

## List Action Menu Example

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
        aria_label="List View - Quiet",
        on_change=set_value,
        selected_keys=value,
    )
    return default_list, quiet_list


lv = ui_list_view()
```

## Empty State
<!-- not working example -->
```python
from deephaven import ui


@ui.component
def ui_list_view():
    value, set_value = ui.use_state(["Text 2"])

    error_message = ui.illustrated_message(
        ui.icon("vsWarning"),
        ui.heading("Invalid Input"),
        ui.content("Please enter 'Sym' and 'Exchange' above"),
    )

    empty_list = ui.list_view(
        # aria_label="List View - Empty",
        # on_change=set_value,
        # selected_keys=value,
        render_empty_state=error_message
    )

    return empty_list


lv = ui_list_view()
```

## Density

```python
from deephaven import ui


@ui.component
def ui_list_view():
    value, set_value = ui.use_state(["Text 2"])

    compact_list = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Quiet",
        on_change=set_value,
        selected_keys=value,
        density="compact",
    )

    spacious_list = ui.list_view(
        "Text 1",
        "Text 2",
        "Text 3",
        aria_label="List View - Quiet",
        on_change=set_value,
        selected_keys=value,
        density="spacious",
    )
    return compact_list, spacious_list


lv = ui_list_view()
```

## Overflow Mode
Can truncate or wrap

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

