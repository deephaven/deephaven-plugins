# use_cell_data

`use_cell_data` lets you use the cell data of the first cell (first row in the first column) in a table. This is useful when you want to listen to an updating table and use the data in your component.

## Example

```python
from deephaven import time_table, ui


@ui.component
def ui_table_first_cell(table):
    cell_value = ui.use_cell_data(table)
    return ui.heading(f"The first cell value is {cell_value}")


table_first_cell = ui_table_first_cell(time_table("PT1s").tail(1))
```

In the above example, `ui_table_first_cell` is a component that listens to the last row of a table and displays the value of the first cell. The `cell_value` variable is updated every time the table updates.

## Recommendations

1. **Use `use_cell_data` for listening to table updates**: If you need to listen to a table for one cell of data, use `use_cell_data`.
2. **Use table operations to filter to one cell**: Because `use_cell_data` always uses the top-left cell of the table, you can filter your table to determine what cell to listen to. If your table has multiple rows and columns, use table operations such as `.where` and `.select` to filter to the desired cell.

## Empty tables

If the table is empty, the value of `cell_value` will return the value of `None`.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_first_cell(table):
    cell_value = ui.use_cell_data(table)
    if cell_value is None:
        return ui.heading("No data yet.")
    return ui.heading(f"The first cell value is {cell_value}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_first_cell = ui_table_first_cell(
    time_table("PT1s", start_time=start_time).tail(1)
)
```

You can optionally provide a `sentinel` value to return when the table is empty instead.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_first_cell(table):
    cell_value = ui.use_cell_data(table, sentinel="No data yet.")
    return ui.heading(f"Cell value: {cell_value}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_first_cell = ui_table_first_cell(
    time_table("PT1s", start_time=start_time).tail(1)
)
```

## Null values

If the table cell is a `null` value, the value of `cell_value` will be `pandas.NA`. You can check for `null` values using the `pandas.isna` function.

```python
from deephaven import time_table, ui
import datetime as dt
import pandas as pd


@ui.component
def ui_table_first_cell(table):
    cell_value = ui.use_cell_data(table)
    if cell_value is None:
        return ui.heading("No data yet.")
    if pd.isna(cell_value):
        return ui.heading("Cell value is null.")
    return ui.heading(f"Cell value: {cell_value}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_first_cell = ui_table_first_cell(
    time_table("PT1s", start_time=start_time)
    .update("x=i%2==0?null:i")
    .select("x")
    .tail(1)
)
```

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_cell_data
```
