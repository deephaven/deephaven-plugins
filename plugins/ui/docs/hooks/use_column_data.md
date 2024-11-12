# use_column_data

`use_column_data` lets you use the data of the first column of a table. This is useful when you want to listen to an updating table and use the data in your component.

## Example

```python
from deephaven import time_table, ui


@ui.component
def ui_table_column(table):
    column_data = ui.use_column_data(table)
    return ui.heading(f"The column data is {column_data}")


table_column = ui_table_column(time_table("PT1s").tail(5))
```

In the above example, `ui_table_column` is a component that listens to the last 5 rows of a table and displays the values of the first column. The `column_data` variable is updated every time the table updates.

## Recommendations

1. **Use `use_column_data` for listening to table updates**: If you need to listen to a table for one column of data, use `use_column_data`.
2. **Use table operations to filter to one column**: If your table has multiple rows and columns, use table operations such as `.where` and `.select` to filter to the column you want to listen to. `use_column_data` always uses the first column of the table.
3. **Do not use `use_column_data` with [`list_view`](../components/list_view.md) or [`picker`](../components/picker.md)**: Some components are optimized to work with large tables of data, and will take a table passed in directly as their data source, only pulling in the options currently visible to the user. In those cases, pass the table directly to the component, otherwise you will fetch the entire column of data unnecessarily.

## Tab switcher with `use_column_data`

In the example below, use the `use_column_data` hook to get all the options for the `Exchange` columns, then build tabs for each option. When you click on a tab, the table is filtered to show only the rows where the `Exchange` column matches the tab name.

```python
from deephaven import ui
from deephaven.table import Table
from deephaven.plot import express as dx


@ui.component
def ui_table_tabs(source: Table, column_name: str):
    table_options = ui.use_memo(
        lambda: source.select_distinct("Exchange"), [source, column_name]
    )
    exchanges = ui.use_column_data(table_options)

    return ui.tabs(
        *[
            ui.tab(source.where(f"{column_name}=`{exchange}`"), title=exchange)
            for exchange in exchanges
        ]
    )


_stocks = dx.data.stocks()
table_tabs = ui_table_tabs(_stocks, "Exchange")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_column_data
```
