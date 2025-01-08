# use_row_data

`use_row_data` lets you use the data of the first row of a table as a dictionary. This is useful when you want to listen to an updating table and use the data in your component.

## Example

```python
from deephaven import time_table, ui


@ui.component
def ui_table_row(table):
    row_data = ui.use_row_data(table)
    if row_data == ():
        return ui.heading("No data yet.")
    return ui.heading(f"Row data is {row_data}. Value of X is {row_data['x']}")


table_row = ui_table_row(time_table("PT1s").update("x=i").reverse())
```

In the above example, `ui_table_row` is a component that listens to a table and displays the first row of data. The `row_data` variable is updated every time the table updates.

## Recommendations

1. **Use `use_row_data` for listening to table updates**: If you need to listen to a table for one row of data, use `use_row_data`.
2. **Use table operations to filter to one row**: If your table has multiple rows and columns, use table operations such as [`.where`](/core/docs/reference/table-operations/filter/where/), [`.select`](/core/docs/reference/table-operations/select/) and [`.reverse`](/core/docs/reference/table-operations/sort/reverse/) to filter to the row you want to listen to. `use_row_data` always uses the first row of the table.
3. **Pass a Sentinel value to `use_row_data`**: If you want to use a default value when the table is empty, pass a sentinel value to `use_row_data`. The default sentinel value is `None`, which is returned when the table is empty.

## Empty tables

If the table is empty, the value of `row_data` will return the value of `None`.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_row(table):
    row_data = ui.use_row_data(table)
    if row_data is None:
        return ui.heading("No data yet.")
    return ui.heading(f"Row data: {row_data}.")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_row = ui_table_row(
    time_table("PT1s", start_time=start_time).update("x=i").tail(1)
)
```

You can optionally provide a `sentinel` value to return when the table is empty instead.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_row(table):
    row_data = ui.use_row_data(table, sentinel={"Timestamp": "No data yet."})
    return ui.heading(f"Row data: {row_data}. Value of 'x' is {row_data['x']}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_row = ui_table_row(
    time_table("PT1s", start_time=start_time).update("x=i").tail(1)
)
```

## Null values

If the table has a `null` value in the first row, the value for that cell will be `pandas.NA`.

```python
from deephaven import time_table, ui
import datetime as dt
import pandas as pd


@ui.component
def ui_table_row(table):
    row_data = ui.use_row_data(table)
    if row_data is None:
        return ui.heading("No data yet.")
    if pd.isna(row_data["x"]):
        return ui.heading("Value of 'x' is null.")
    return ui.heading(f"Row data: {row_data}. Value of 'x' is {row_data['x']}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_row = ui_table_row(
    time_table("PT1s", start_time=start_time).update("x=i%2==0?null:i").tail(1)
)
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_row_data
```
