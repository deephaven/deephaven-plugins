# UI with Tables

`deephaven.ui` allows you to programmatically create your own custom UIs. However, the real power of `deephaven.ui` is in its most unique feature: the ability to combine those UIs with Deephaven tables.

The Deephaven table is the key data structure for working with and analyzing large real-time data. By combining tables with `deephaven.ui`, you can create a UI that allows you to visualize and work with data in a way that best suits your own unique needs.

For more information, see the quickstart guide on [Working with Deephaven Tables](/core/docs/getting-started/quickstart/#4-working-with-deephaven-tables).

## Display a table in a component

You can display a Deephaven table in a component by doing one of the following:

- Return a table directly from a component.
- Return a table as part of a `list` or `tuple`.
- Add a table to a container such as a `flex` or `panel`.
- [Use `ui.table`](#use-uitable).

```python order=my_single_table,my_list_table,my_flex_table,_source
from deephaven import new_table, ui
from deephaven.column import int_col

_source = new_table([int_col("IntegerColumn", [1, 2, 3])])


@ui.component
def single_table(t):
    ui.use_effect(lambda: print("displaying table"), [])
    return t


@ui.component
def list_table(t):
    return [ui.text("list table"), t]


@ui.component
def flex_table(t):
    return ui.flex(ui.text("flex table"), t)


my_single_table = single_table(_source)
my_list_table = list_table(_source)
my_flex_table = flex_table(_source)
```

![Display a table in a component](../_assets/work_with_tables1.png)

## Use `ui.table`

[`ui.table`](../components/table.md) is a wrapper for Deephaven tables that allows you to change how the table is displayed in the UI and how to handle user events. Here is an example of adding custom color formatting.

```python order=t,_stocks_table
from deephaven import ui
import deephaven.plot.express as dx

_stocks_table = dx.data.stocks()

t = ui.table(
    _stocks_table,
    format_=[
        ui.TableFormat(color="fg"),
        ui.TableFormat(cols="Sym", color="white"),
    ],
)
```

![Use ui.table](../_assets/work_with_tables2.png)

## Memoize table operations

If you are working with a table, memoize the table operation. This stores the result in a memoized value and prevents the table from being re-computed on every render. This can be done with the [`use_memo`](../hooks/use_memo.md) hook.

```python order=memo_table_app
from deephaven import time_table, ui
from deephaven.table import Table


theme_options = ["accent-200", "red-200", "green-200"]


@ui.component
def ui_memo_table_app():
    n, set_n = ui.use_state(1)
    theme, set_theme = ui.use_state(theme_options[0])

    # ✅ Memoize the table operation, only recompute when the dependency `n` changes
    result_table = ui.use_memo(
        lambda: time_table("PT1s").update(f"x=i*{n}").reverse(), [n]
    )

    return ui.view(
        ui.flex(
            ui.picker(
                *theme_options, label="Theme", selected_key=theme, on_change=set_theme
            ),
            ui.slider(value=n, min_value=1, max_value=999, on_change=set_n, label="n"),
            result_table,
            direction="column",
            height="100%",
        ),
        background_color=theme,
        align_self="stretch",
        flex_grow=1,
    )


memo_table_app = ui_memo_table_app()
```

## Hooks for tables

The [`use_table_data`](../hooks/use_table_data.md) hook lets you use a table's data. This is useful when you want to listen to an updating table and use the data in your component. This example uses the table data to populate two list views.

```python order=table_data_example
from deephaven import time_table, ui


@ui.component
def ui_table_data(table):
    table_data = ui.use_table_data(table)
    return ui.flex(
        table,
        ui.list_view(
            [ui.item(str(timestamp)) for timestamp in table_data["Timestamp"]]
            if table_data
            else None,
            selection_mode=None,
        ),
        ui.list_view(
            [ui.item(x) for x in table_data["x"]] if table_data else None,
            selection_mode=None,
        ),
    )


table_data_example = ui_table_data(time_table("PT1s").update("x=i").tail(5))
```

The [`use_row_data`](../hooks/use_row_data.md) hook lets you use the first row of table data as a dictionary. This example displays the latest row of data in a ticking time table.

```python
from deephaven import time_table, ui


@ui.component
def ui_table_first_cell(table):
    row_data = ui.use_row_data(table)
    return (
        [
            ui.heading("Latest data"),
            ui.text(f"Timestamp: {row_data['Timestamp']}"),
            ui.text(f"x: {row_data['x']}"),
        ]
        if row_data
        else ui.heading("Waiting for data...")
    )


table_first_cell2 = ui_table_first_cell(time_table("PT1s").update("x=i").reverse())
```

The [`use_cell_data`](../hooks/use_cell_data.md) hook lets you use the cell data of the first cell (first row in the first column) in a table. This value can be used for conditional rendering as shown in this example.

```python
from deephaven import time_table, ui


@ui.component
def ui_table_first_cell(table):
    cell_value = ui.use_cell_data(table)
    is_even = (cell_value % 2 == 0) if cell_value is not None else False
    return [
        ui.heading(f"The first cell value is {cell_value}"),
        ui.text(f"Is {cell_value} even?", " ✅" if is_even else " ❌"),
    ]


table_first_cell2 = ui_table_first_cell(
    time_table("PT1s").update("x=i").drop_columns("Timestamp").tail(1)
)
```

If the previous hooks do not fit your use case, you can use the [`use_table_listener`](../hooks/use_table_listener.md) hook. This allows you to listen to the raw updates from a table and perform a custom action when the table updates. The update is a dictionary containing dictionaries for data that is `added`, `removed`, or `modified`. Additionally, there is flag indicating if the data is a [replay](/core/docs/how-to-guides/replay-data/).

```python order=table_monitor,_source
from deephaven import time_table, ui
from deephaven.table import Table

_source = time_table("PT1s").update("X = i")


@ui.component
def ui_table_monitor(t: Table):
    def listener_function(update, is_replay):
        print(f"Table updated: {update}, is_replay: {is_replay}")

    ui.use_table_listener(t, listener_function, [])
    return t


table_monitor = ui_table_monitor(_source)
```

## Use tables directly with components

Some `deephaven.ui` components support the use of tables directly or through an `item_table_source`.

This example shows a [`list_view`](../components/list_view.md) populated directly from a table.

```python order=list_view_table_example,_colors
from deephaven import ui, new_table
from deephaven.column import string_col

_colors = new_table(
    [
        string_col("Colors", ["Red", "Blue", "Green"]),
    ]
)


@ui.component
def ui_list_view_table():
    return ui.list_view(_colors)


list_view_table_example = ui_list_view_table()
```

In this example, an `item_table_source` is used to create complex items from a table (i.e., defining which columns are the data's keys/labels). These complex items are displayed in a `picker`.

```python order=picker_item_table_source_example
from deephaven import ui, empty_table

icon_names = ["vsAccount"]
columns = [
    "Key=new Integer(i)",
    "Label=new String(`Display `+i)",
    "Icon=(String) icon_names[0]",
]
_column_types = empty_table(20).update(columns)

item_table_source = ui.item_table_source(
    _column_types,
    key_column="Key",
    label_column="Label",
    icon_column="Icon",
)

picker_item_table_source_example = ui.picker(item_table_source, label="User Picker")
```

## Update tables and plots from user input

Tables and plots can update in response to user input. The following examples allows a user to pick two dates on a [`date_range_picker`](../components/date_range_picker.md). This updates a state variable which causes the component to re-render with a filtered table and plot.

```python order=date_filter,_table
from deephaven.time import dh_now
from deephaven import time_table, ui
import deephaven.plot.express as dx


@ui.component
def date_table_filter(table, start_date, end_date, time_col="Timestamp"):
    dates, set_dates = ui.use_state({"start": start_date, "end": end_date})

    def filter_by_dates():
        start = dates["start"]
        end = dates["end"]
        return table.where(f"{time_col} >= start && {time_col} < end")

    filtered_table = ui.use_memo(filter_by_dates, [table, dates])
    plot = ui.use_memo(
        lambda: dx.line(filtered_table, x="Timestamp", y="Row"), [filtered_table]
    )

    return [
        ui.date_range_picker(
            label="Dates", value=dates, on_change=set_dates, max_visible_months=2
        ),
        filtered_table,
        plot,
    ]


SECONDS_IN_DAY = 86400
today = dh_now()
_table = time_table("PT1s").update_view(
    ["Timestamp=today.plusSeconds(SECONDS_IN_DAY*i)", "Row=i"]
)
date_filter = date_table_filter(_table, today, today.plusSeconds(SECONDS_IN_DAY * 10))
```
