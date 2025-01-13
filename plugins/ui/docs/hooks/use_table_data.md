# use_table_data

`use_table_data` lets you use the data of a table. This is useful when you want to listen to an updating table and use the data in your component.

## Example

```python
from deephaven import time_table, ui


@ui.component
def ui_table_data(table):
    table_data = ui.use_table_data(table)
    return ui.heading(f"The table data is {table_data}")


table_data = ui_table_data(time_table("PT1s").update("x=i").tail(5))
```

In the above example, `ui_table_data` is a component that listens to the last 5 rows of a table and displays the data. The `table_data` variable is updated every time the table updates.

## Recommendations

1. **Use `use_table_data` for listening to table updates**: If you need to listen to a table for all the data, use `use_table_data`.
2. **Use table operations to filter to the data you want**: If your table has multiple rows and columns, use table operations such as [`.where`](/core/docs/reference/table-operations/filter/where/), [`.select`](/core/docs/reference/table-operations/select/) and [`.reverse`](/core/docs/reference/table-operations/sort/reverse/) to filter to the data you want to listen to.
3. **Pass a Sentinel value to `use_table_data`**: If you want to use a default value when the table is empty, pass a sentinel value to `use_table_data`. The default sentinel value is `None`, which is returned when the table is empty.

## Empty tables

If the table is empty, the value of `table_data` will return the value of `None`.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_data(table):
    table_data = ui.use_table_data(table)
    if table_data is None:
        return ui.heading("No data yet.")
    return ui.heading(f"Table data: {table_data}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_data = ui_table_data(
    time_table("PT1s", start_time=start_time).update("x=i").tail(5)
)
```

You can optionally provide a `sentinel` value to return when the table is empty instead.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_data(table):
    table_data = ui.use_table_data(table, sentinel="No data yet.")
    return ui.heading(f"Table data: {table_data}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_data = ui_table_data(
    time_table("PT1s", start_time=start_time).update("x=i").tail(5)
)
```

## Null values

If the table has null values, they will be represented in the data with `pandas.NA`.

```python
from deephaven import time_table, ui
import datetime as dt


@ui.component
def ui_table_data(table):
    table_data = ui.use_table_data(table)
    if table_data is None:
        return ui.heading("No data yet.")
    if pd.isna(table_data["x"][0]):
        return ui.heading("First value of 'x' is null.")
    return ui.heading(f"Table data: {table_data}")


start_time = dt.datetime.now() + dt.timedelta(seconds=2)
table_data = ui_table_data(
    time_table("PT1s", start_time=start_time).update("x=i%2==0?null:i").tail(3)
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_table_data
```
