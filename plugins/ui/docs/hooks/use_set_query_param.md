# use_set_query_param

`use_set_query_param` is a hook that returns a setter function for a single URL query parameter. Calling the setter updates the URL and updates the query parameter value for all hooks that read it. Pass `replace=False` to the setter to push a new history entry instead of replacing the current one.

> [!WARNING]
> Deephaven internally uses query parameters to manage state. It's strongly recommended to namespace your application's parameters with a prefix such as `app-` to avoid conflicts (e.g., `?app-sym=DOG`).

## Example

```python
from deephaven import ui
import deephaven.plot.express as dx

# Table containing stock data with "Sym" column
_stocks = dx.data.stocks()
_unique_sym = _stocks.select_distinct("Sym")


@ui.component
def filter_app():
    # Read the current value of the "app-sym" query parameter
    sym = ui.use_query_param("app-sym")
    # Get a setter for the "app-sym" query parameter
    set_sym = ui.use_set_query_param("app-sym")

    sym_options = ui.use_column_data(_unique_sym)
    # Update the query parameter when the user picks a new symbol.
    sym_picker = ui.picker(
        *sym_options, label="Sym", on_change=set_sym, selected_key=sym
    )

    # Filter the stocks table based on the query parameter
    filtered = _stocks.where(f"Sym = `{sym}`") if sym else _stocks

    return ui.flex(
        ui.flex(
            sym_picker,
            # Clear the parameter when the button is pressed.
            # Pass replace=False to allow the user to return to the previous URL after clearing.
            ui.button(
                "Clear", variant="secondary", on_press=lambda: set_sym(replace=False)
            ),
        ),
        filtered,
        direction="column",
    )


app = filter_app()
```

Navigating to a URL with a query string such as `?app-sym=DOG` will display the table pre-filtered to only show rows where `Sym` is `DOG`. Changing the picker selection will update the URL and the table accordingly. Pressing the "Clear" button will remove the `app-sym` parameter from the URL and show the unfiltered table.

## Recommendations

1. **Use with `use_query_param`**: Pair `use_set_query_param` with `use_query_param` to read and write the same parameter concisely.
2. **Undoing query param changes**: Pass `replace=False` to the setter when you want the user to be able to return to the previous URL.

## API reference

```{eval-rst}
.. autofunction:: deephaven.ui.use_set_query_param
```
