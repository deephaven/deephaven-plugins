# Work with Tables

`deephaven.ui` allows you to programmatically create your own custom UIs. However, the real power of `deephaven.ui` is in its most unique feature: the ability to combine those UIs with Deephaven tables.

The Deephaven table is the key data structure for working with and analyzing large real time data. By combining tables with `deephaven.ui`, you can create a UI that allows you to visualize and work with data in way that best suits your own unique needs.

For more information, see the quickstart guide on [Working with Deephaven Tables](/core/docs/getting-started/quickstart/#4-working-with-deephaven-tables).

## Display a table in a component

You can display a Deephaven table in a component by doing one of the following:

- return a table directly from a component
- return a table as part of a `list` or `tuple`
- add a table to a container such as a `flex` or `panel`
- [use ui.table](#use-ui.table)

```python
from deephaven import new_table, ui
from deephaven.column import int_col

# Prepend name with an underscore to avoid displaying the source table
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

```py
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

If you are working with a table, memoize the table operation. This stores the result in a memoized value and prevents the table from being re-computed on every render. This can be done with the [use_memo](../hooks/use_memo.md) hook.

```python
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

The [`use_table_data`](../hooks/use_table_data.md) hook lets you use a table's data. This is useful when you want to listen to an updating table and use the data in your component. This example uses the table data to populate two list views with the table data.

```python
from deephaven import time_table, ui


@ui.component
def ui_table_data(table):
    table_data = ui.use_table_data(table)
    return ui.flex(
        table,
        ui.list_view(
            [ui.item(str(timestamp)) for timestamp in table_data["Timestamp"]],
            selection_mode=None,
        ),
        ui.list_view(
            [ui.item(x) for x in table_data["x"]],
            selection_mode=None,
        ),
    )


table_data_example = ui_table_data(time_table("PT1s").update("x=i").tail(5))
```

The [`use_cell_data`](../hooks/use_cell_data.md) hook lets you use the cell data of the first cell (first row in the first column) in a table. This is useful when you want to listen to an updating table and use the data in your component. This value can be used for conditional rendering as shown in this example.

```python
from deephaven import time_table, ui


@ui.component
def ui_table_first_cell(table):
    cell_value = ui.use_cell_data(table)
    is_even = cell_value % 2 == 0
    return [
        ui.heading(f"The first cell value is {cell_value}"),
        ui.text(f"Is {cell_value} even?", " ✅" if is_even else " ❌"),
    ]


table_first_cell2 = ui_table_first_cell(
    time_table("PT1s").update("x=i").drop_columns("Timestamp").tail(1)
)
```
