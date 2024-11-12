# use_column_data

`use_column_data` lets you use the column data of a table. This is useful when you want to listen to an updating table and use the data in your component.

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

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_column_data
```
