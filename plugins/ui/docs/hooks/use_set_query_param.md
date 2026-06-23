# use_set_query_param

`use_set_query_param` is a hook that returns a setter function for a single URL query parameter. Calling the setter updates the URL and updates the query parameter value for all hooks that read it. By default (`replace=True`), the setter replaces the current browser history entry, so the user cannot navigate back to the previous URL using the browser's back button. Pass `replace=False` to push a new history entry instead, which lets the user undo the parameter change by pressing back.

> [!NOTE]
> Deephaven and all custom components share query parameters. Avoid using query parameters in shared components to prevent conflicts. Deephaven reserves the following parameters for internal use:
>
> - `envoyPrefix`
> - `authProvider`
> - `name`
> - `psk`
> - `theme`
> - `preloadTransparentTheme`
> - `isSamlRedirect`
> - `algorithm`
> - `encodedStr`
> - Any parameter starting with `_` or `dh`

## Example

```python order=app,_stocks,_unique_sym
from deephaven import ui
import deephaven.plot.express as dx

# Table containing stock data with "Sym" column
_stocks = dx.data.stocks()
_unique_sym = _stocks.select_distinct("Sym")


@ui.component
def filter_app():
    # Read the current value of the "sym" query parameter
    sym = ui.use_query_param("sym")
    # Get a setter for the "sym" query parameter
    set_sym = ui.use_set_query_param("sym")

    sym_options = ui.use_column_data(_unique_sym)
    # Update the query parameter when the user picks a new symbol.
    sym_picker = ui.picker(
        *sym_options, label="Sym", on_change=set_sym, selected_key=sym
    )

    # Filter the stocks table based on the query parameter
    filtered = _stocks.where("Sym = sym") if sym else _stocks

    return ui.flex(
        ui.view(
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

Navigating to a URL with a query string such as `?sym=DOG` will display the table pre-filtered to only show rows where `Sym` is `DOG`. Changing the picker selection will update the URL and the table accordingly. Pressing the **Clear** button removes the `sym` parameter from the URL and displays the unfiltered table.

## Recommendations

1. **Use with `use_query_param`**: Pair `use_set_query_param` with [`use_query_param`](use_query_param.md) to read and write the same parameter concisely.
2. **Undoing `query_param` changes**: Pass `replace=False` to the setter when you want the user to be able to return to the previous URL.

## API reference

```{eval-rst}
.. autofunction:: deephaven.ui.use_set_query_param
```
