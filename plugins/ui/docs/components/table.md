# Table

Tables are wrappers for Deephaven tables that allow you to change how the table is displayed in the UI and handle user events.

## Example

```python
from deephaven import ui, empty_table

_t = empty_table(10).update("X=i")
t = ui.table(_t)
```

## UI Recommendations

1. It is not necessary to use a UI table if you do not need any of its properties. You can just use the Deephaven table directly.
2. Use a UI table to show properties like filters as if the user had created them in the UI. Users will be able to change the default values provided by the UI table such as filters.
3. UI tables handle ticking tables automatically, so you can pass any Deephaven table to a UI table.

## Events

You can listen for different user events on a `ui.table`. There is both a `press` and `double_press` event for `row`, `cell`, and `column`. These events typically correspond to a click or double click on the table. The event payloads include table data related to the event. Note there is not a row index in event data because the row index is not a safe way to reference a row between the client and server since the user could have manipulated the table resulting in a different client order.

A `double_press` event will be preceded by 2 `press` events with the same data.

The following example shows how to listen for the different events and prints the event data to the console.

```python
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    on_row_press=lambda data: print(f"Row Press: {data}"),
    on_row_double_press=lambda data: print(f"Row Double Press: {data}"),
    on_cell_press=lambda data: print(f"Cell Press: {data}"),
    on_cell_double_press=lambda data: print(f"Cell Double Press: {data}"),
    on_column_press=lambda column: print(f"Column Press: {column}"),
    on_column_double_press=lambda column: print(f"Column Double Press: {column}"),
)
```

## Context Menu

Items can be added to the bottom of the `ui.table` context menu (right-click menu) by using the `context_menu` or `context_header_menu` props. The `context_menu` prop adds items to the cell context menu, while the `context_header_menu` prop adds items to the column header context menu. You can pass either a single dictionary for a single item or a list of dictionaries for multiple items.

Menu items must have a `title` and either an `action` or `actions` prop. They may have an `icon` which is the name of the icon that will be passed to `ui.icon`.

The `action` prop is a callback that is called when the item is clicked and receives info about the cell that was clicked when the menu was opened.

The following example shows how to add a context menu item to the table and column header. Both actions print the data of the cell when the context menu item is clicked.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    context_menu={
        "title": "Context item",
        "icon": "dhTruck",
        "action": lambda d: print("Context item", d)
    },
    context_header_menu={
        "title": "Header context menu item",
        "action": lambda d: print("Header context menu item", d)
    }
)
```

### Sub-menus

The `actions` prop is an array of menu items that will be displayed in a sub-menu. If you specify `actions`, you cannot specify an `action` for the menu item. The action will be to show the sub-menu. Sub-menus can contain other sub-menus for deeply nested menus.

The following example shows how to add a context menu item and a nested menu item to the table. The actions will print the data of the cell when the context menu item is clicked.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    context_menu=[
        {
            "title": "Context item",
            "icon": "dhTruck",
            "action": lambda d: print("Context item", d)
        },
        {
            "title": "Nested menu",
            "actions": [
                {
                    "title": "Nested item 1",
                    "action": lambda d: print("Nested item 1", d)
                },
                {
                    "title": "Nested item 2",
                    "icon": "vsCheck",
                    "action": lambda d: print("Nested item 2", d)
                }
            ]
        }
    ]
)
```

### Dynamic Menu Items

Menu items can be dynamically created by passing a function as the context item. The function will be called with the data of the cell that was clicked when the menu was opened, and must return the menu items or None if you do not want to add context menu items based on the cell info.

The following example shows creating context menu items dynamically so that the item only appears on the `sym` column. If a list of functions is provided, each will be called, and any items they return will be added to the context menu.

```py
from deephaven import ui
import deephaven.plot.express as dx

def create_context_menu(data):
    if data["column_name"] == "sym":
        return {
            "title": f"Print {data['value']}",
            "action": lambda d: print(d['value'])
        }
    return None

t = ui.table(
    dx.data.stocks(),
    context_menu=create_context_menu
)
```

## Column Order and Visibility

You can freeze columns to the front of the table using the `frozen_columns` prop. Frozen columns will always be visible on the left side of the table, even when the user scrolls horizontally. The `frozen_columns` prop takes a list of column names to freeze.

You can also pin columns to the front or back of the table using the `front_columns` and `back_columns` props. Pinned columns will be moved to the front/back of the table and will not be moveable by the user. These columns will still scroll off the screen if the uesr needs to scroll horizontally. The `front_columns` and `back_columns` props take a list of column names to pin.

Columns can also be hidden by defualt using the `hidden_columns` prop. Note that the user can still expand these columns if they want to see them. The columns will be collapsed by default. The `hidden_columns` prop takes a list of column names to hide.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    frozen_columns=["sym", "exchange"],
    front_columns=["price"],
    back_columns=["index"],
    hidden_columns=["random"]
)
```

![Example of column order and visibility](../_assets/table_column_order.png)

## Grouping Columns

Columns can be grouped visually using the `column_groups` prop. Columns in a column group will be moved so they are next to each other and a header spanning all columns in the group will be added. Columns can be rearranged within a group, but cannot be moved outside of the group without using the table sidebar menu.

The `column_groups` prop takes a list of dictionaries where each dictionary represents a column group. Each dictionary must have a `name` and `children` prop.

The `name` prop is the name of the column group. Column group names must follow the same guidelines as column names. Group names should be unique among all column names and group names.

The `children` prop is a list of column names or groups that belong to the group. Any columns or groups should only ever be listed as children in one group.

The `color` prop is optional and sets the color of the column group header.

Column groups may be nested by including the name of another group in the `children` list of a group.

The following example shows how to group columns and nest groups.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    column_groups=[
        {
            "name": "sym_info",
            "children": ["sym", "exchange"],
        },
        {
            "name": "price_info",
            "children": ["size", "price", "dollars"]
        },
        {
            "name": "all_info",
            "children": ["sym_info", "price_info"],
            "color": "#3b6bda"
        }
    ]
)
```

![Example of column groups](../_assets/table_column_groups.png)

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.table
```
