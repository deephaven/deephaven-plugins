# use_query_params

`use_query_params` is a hook that returns all URL query parameters as a dictionary. Keys are parameter names and values are `list[str]`.

> [!WARNING]
> Deephaven internally uses query parameters to manage state. It's strongly recommended to namespace your application's parameters with a prefix such as `app-` to avoid conflicts (e.g., `?app-sym=DOG`).

## Example

```python order=app,_stocks
from deephaven import ui
import deephaven.plot.express as dx

# Table containing stock data with "Sym" and "Side" columns
_stocks = dx.data.stocks()

VALID_SIDES = {"buy", "sell"}


@ui.component
def filter_app():
    # Get all query parameters as a dictionary
    params = ui.use_query_params()
    # Get the "app-side" as a string
    side = params.get("app-side", [""])[0]
    # Get the "app-sym" as a list of strings
    syms = params.get("app-sym", [])

    # Validate parameters before use as they can be manipulated by the user
    validated_side = side if side in VALID_SIDES else None
    validated_syms = [s for s in syms if s.isalpha() and s.isupper()]

    # Filter the stocks table based on the query parameters
    filtered = _stocks
    if validated_side:
        filtered = filtered.where("Side = validated_side")
    if validated_syms:
        filtered = filtered.where("Sym in validated_syms")
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
