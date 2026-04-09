# use_query_params

`use_query_params` is a hook that returns all URL query parameters as a dictionary. Keys are parameter names and values are `list[str]`.

> [!WARNING]
> Deephaven internally uses query parameters to manage state. It's strongly recommended to namespace your application's parameters with a prefix such as `app-` to avoid conflicts (e.g., `?app-sym=DOG`).

## Example

```python
from deephaven import ui
import deephaven.plot.express as dx

# Table containing stock data with "Sym" and "Side" columns
_stocks = dx.data.stocks()


@ui.component
def filter_app():
    # Get all query parameters as a dictionary
    params = ui.use_query_params()
    # Get the "app-sym" as a string
    sym = params.get("app-sym", [""])[0]
    # Get the "app-side" as a list of strings
    sides = params.get("app-side", [])

    # Filter the stocks table based on the query parameters
    filtered = _stocks
    if sym:
        filtered = filtered.where(f"Sym = `{sym}`")
    if sides:
        filtered = filtered.where("Side in sides")
    return filtered


app = filter_app()
```

Navigating to a URL with a query string such as `?app-sym=DOG&app-side=buy&app-side=sell` will display the table pre-filtered to only show rows where `Sym` is `DOG` and `Side` is either `buy` or `sell`.

## Recommendations

1. **Multiple parameter access**: Use `use_query_params` when you need access to all query parameters or custom parsing logic.
2. **Single parameter access**: If you only need a single parameter, consider `use_query_param` for a more concise API.
3. **Validate parameters before use**: Parameters can be manipulated by the user and may not be in the format you expect.

## API reference

```{eval-rst}
.. autofunction:: deephaven.ui.use_query_params
```
