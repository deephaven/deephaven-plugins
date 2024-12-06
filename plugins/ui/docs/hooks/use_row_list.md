# use_row_list

`use_row_list` lets you use the data of the first row of a table as a list. This is useful when you want to listen to an updating table and use the data in your component.

## Example

```python
from deephaven import time_table, ui


@ui.component
def ui_table_row_list(table):
    row_list = ui.use_row_list(table)
    if row_list == ():
        return ui.heading("No data yet.")
    return ui.heading(f"The row list is {row_list}. Value of X is {row_list[1]}.")


table_row_list = ui_table_row_list(time_table("PT1s").update("x=i").reverse())
```

In the above example, `ui_table_row_list` is a component that listens to a table and displays the first row of data as a list. The `row_list` variable is updated every time the table updates.

## Recommendations

1. **Use `use_row_list` for listening to table updates**: If you need to listen to a table for one row of data as a list, use `use_row_list`.
2. **Use table operations to filter to one row**: If your table has multiple rows and columns, use table operations such as `.where`, `.select` and `.reverse` to filter to the row you want to listen to. `use_row_list` always uses the first row of the table.
3. **Pass a Sentinel value to `use_row_list`**: If you want to use a default value when the table is empty, pass a sentinel value to `use_row_list`. The default sentinel value is `()`, which is returned when the table is empty.

## API reference

```{eval-rst}
.. dhaufunction:: deephaven.ui.use_row_list
```
