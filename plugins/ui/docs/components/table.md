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
2. Use a UI table to show properties like filters as if the user had created them in the UI. Users can change the default values provided by the UI table, such as filters.
3. UI tables handle ticking tables automatically, so you can pass any Deephaven table to a UI table.

## Formatting

You can format the table using the `formatting` prop. This prop takes a list of `ui.TableFormat` objects. `ui.TableFormat` is a dataclass that encapsulates the formatting options for a table. The full list of formatting options can be found in the [API Reference](#tableformat).

### Formatting Rows and Columns

Every formatting rule may optionally specify `cols` and `condition` properties. The `cols` property is a column name or list of column names to apply the formatting rule to. If `cols` is omitted, then the rule will be applied to the entire row. The `condition` property is a Deephaven formula to apply the formatting rule to. The `condition` property _must_ evaluate to a boolean. If `condition` is omitted, then the rule will be applied to every row. These may be combined to apply formatting to specific columns only when a condition is met.

> [!NOTE]
> The `condition` property is a Deephaven formula evaluated in the engine. You can think of it like adding a new boolean column using [`update_view`](https://deephaven.io/core/docs/reference/table-operations/select/update-view/)

The following example shows how to format the `Sym` and `Exchange` columns with a red background and white text when the `Sym` is `DOG`.

```python
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    formatting=[
        ui.TableFormat(
            cols=["Sym", "Exchange"],
            condition="Sym = `DOG`",
            background_color="red",
            color="white",
        )
    ],
)
```

### Formatting Rule Priority

The last matching formatting rule for each property will be applied. This means the lowest priority rules should be first in the list with higher priority rules at the end.

In the following example, the `Sym` column will have a red background with white text, and the rest of the table will have a blue background with white text.

```python
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    formatting=[
        ui.TableFormat(background_color="blue", color="white"),
        ui.TableFormat(cols="Sym", background_color="red"),
    ],
)
```

## Events

You can listen for different user events on a `ui.table`. There is both a `press` and `double_press` event for `row`, `cell`, and `column`. These events typically correspond to a click or double click on the table. The event payloads include table data related to the event. For `row` and `column` events, the corresponding data within the viewport will be sent to the event handler. The viewport is typically the visible area &plusmn; a window equal to the visible area (e.g., if rows 5-10 are visible, rows 0-15 will be in the viewport).

Note that there is no row index in event data because the row index is not a safe way to reference a row between the client and server since the user could have manipulated the table, resulting in a different client order.

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

Menu items must have a `title` and either an `action` or `actions` prop. They may have an `icon`, which is the name of the icon that will be passed to `ui.icon`.

The `action` prop is a callback that is called when the item is clicked and receives info about the cell that was clicked when the menu was opened.

The following example shows how to add a context menu item to the table and column header. When the context menu item is clicked, both actions print the cell's data.

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

The following example shows how to add a context menu item and a nested menu item to the table. When the context menu item is clicked, the actions print the data of the cell.

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

The following example shows how to create a context menu item dynamically so that it appears only on the `sym` column. If a list of functions is provided, each will be called, and any items they return will be added to the context menu.

```py
from deephaven import ui
import deephaven.plot.express as dx

def create_context_menu(data):
    if data["column_name"] == "Sym":
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

You can also pin columns to the front or back of the table using the `front_columns` and `back_columns` props. Pinned columns will be moved to the front or back of the table and will not be moveable by the user. These columns will still scroll off the screen if the user needs to scroll horizontally. The `front_columns` and `back_columns` props take a list of column names to pin.

Columns can also be hidden by default using the `hidden_columns` prop. Note that users can still expand these columns if they want to see them. The columns will be collapsed by default. The `hidden_columns` prop takes a list of column names to hide.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    frozen_columns=["Sym", "Exchange"],
    front_columns=["Price"],
    back_columns=["Index"],
    hidden_columns=["Random"]
)
```

![Example of column order and visibility](../_assets/table_column_order.png)

## Grouping Columns

Columns can be grouped visually using the `column_groups` prop. Columns in a column group are moved so they are next to each other, and a header spanning all columns in the group is added. Columns can be rearranged within a group, but they cannot be moved outside of the group without using the table sidebar menu.

The `column_groups` prop takes a list of dictionaries, each representing a column group. Each dictionary must have a `name` and `children` prop.

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
            "name": "Sym_Info",
            "children": ["Sym", "Exchange"],
        },
        {
            "name": "Price_Info",
            "children": ["Size", "Price", "Dollars"]
        },
        {
            "name": "All_Info",
            "children": ["Sym_Info", "Price_Info"],
            "color": "#3b6bda"
        }
    ]
)
```

![Example of column groups](../_assets/table_column_groups.png)

## Always Fetching Some Columns

Deephaven only fetches data for visible rows and columns within a window around the viewport (typically the viewport plus 1 page in all directions). This reduces the amount of data transferred between the server and client and allows displaying tables with billions of rows. Sometimes you may need to always fetch columns, such as a key column for a row press event. You can use the `always_fetch_columns` prop to specify columns that should always be fetched regardless of their visibility.

The `always_fetch_columns` prop takes a single column name, a list of column names, or a boolean to always fetch all columns. The data for these columns is included in row event data (e.g. `on_row_press`) and context menu callbacks.

> [!WARNING]  
> Setting `always_fetch_columns` to `True` will fetch all columns and can be slow for tables with many columns.

This example shows how to use `always_fetch_columns` to always fetch the `Sym` column for a row press event. Without the `always_fetch_columns` prop, the press callback will fail because the `Sym` column is not fetched when hidden.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    hidden_columns=["Sym"],
    on_row_press=lambda d: print(d["Sym"]),
    always_fetch_columns="Sym",
)
```

## Quick Filters

Quick filters are an easy way to filter the table while also showing the user what filters are currently applied. These filters are applied on the server via request from the client, so users may change the filters without affecting other users. Unlike a `where` statement to filter a table on the server, quick filters can be easily changed by the user.

Quick filters may be preferred if you have multiple servers or workers hosting your data. If, for example, the table is on another Deephaven instance, performing a `where` operation on the table may require copying all of the data from the host server into the server running Deephaven UI. With a quick filter, the filter can instead be applied directly on the server hosting the table.

Quick filters can be added to the table using the `quick_filters` prop. The `quick_filters` prop takes a dictionary where the key is the column and the value is the filter to apply.

The quick filter bar can be expanded by default with the `show_quick_filters` prop.

```py
from deephaven import ui
import deephaven.plot.express as dx

_stocks = dx.data.stocks()

t = _stocks.where("Sym = `CAT`") # Applied when query is run

t2 = ui.table( # Filters applied when table is opened on the client
    _stocks,
    show_quick_filters=True,
    quick_filters={
        "Sym": "CAT",
        "Exchange": "TPET",
        "Price": ">=100"
    }
)
```

![Example of quick filters](../_assets/table_quick_filter.png)

## Reverse

The table can be displayed in reverse order using the `reverse` prop. Using the reverse prop visually indicates to the user that the table is reversed via a colored bar under the column headers. Users can disable the reverse with the column header context menu or via a shortcut. The reverse is applied on the server via request from the client.

```py
from deephaven import ui
import deephaven.plot.express as dx

t = ui.table(
    dx.data.stocks(),
    reverse=True
)
```

## API Reference

### Table

```{eval-rst}
.. dhautofunction:: deephaven.ui.table
```

### TableFormat

```{eval-rst}
.. dhautofunction:: deephaven.ui.TableFormat
```
