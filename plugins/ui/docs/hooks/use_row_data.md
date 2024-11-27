# use_row_data

`use_row_data` lets you use the data of the first row of a table. This is useful when you want to listen to an updating table and use the data in your component.

## Example

```python
from deephaven import time_table, ui


@ui.component
def ui_table_row(table):
    row_data = ui.use_row_data(table)
    return ui.heading(f"The row data is {row_data}")


table_row = ui_table_row(time_table("PT1s").update("x=i").reverse())
```

In the above example, `ui_table_row` is a component that listens to a table and displays the first row of data. The `row_data` variable is updated every time the table updates.

## Recommendations

1. **Use `use_row_data` for listening to table updates**: If you need to listen to a table for one row of data, use `use_row_data`.
2. **Use table operations to filter to one row**: If your table has multiple rows and columns, use table operations such as `.where`, `.select` and `.reverse` to filter to the row you want to listen to. `use_row_data` always uses the first row of the table.

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_row_data
```
