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

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_cell_data
```
