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
2. **Use table operations to filter to the data you want**: If your table has multiple rows and columns, use table operations such as `.where` and `.select` to filter to the data you want to listen to.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_table_data
```
