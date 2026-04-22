# use_query_params

`use_query_params` is a hook that returns all URL query parameters as a dictionary. Keys are parameter names and values are `list[str]`.

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
    # Get the "side" as a string
    side = params.get("side", [""])[0]
    # Get the "sym" as a list of strings
    syms = params.get("sym", [])

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

Navigating to a URL with a query string such as `?sym=DOG&sym=CAT&side=buy` will display the table pre-filtered to only show rows where `Sym` is `DOG` or `CAT` and `Side` is `buy`.

## Recommendations

1. **Multiple parameter access**: Use `use_query_params` when you need access to all query parameters or custom parsing logic.
2. **Single parameter access**: If you only need a single parameter, consider `use_query_param` for a more concise API.
3. **Validate parameters before use**: Parameters can be manipulated by the user and may not be in the format you expect.

## API reference

```{eval-rst}
.. autofunction:: deephaven.ui.use_query_params
```
