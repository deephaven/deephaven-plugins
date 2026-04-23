# use_query_param

`use_query_param` is a hook that returns the value of a single URL query parameter. The return type depends on the `default` argument. If `default` is not provided, the return type is `str | None`, where `None` indicates that the parameter is not present in the URL. If `default` is a list of strings, the return type is `list[str]`, where an empty list indicates that the parameter is not present.

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


# Valid values for the "side" parameter
VALID_SIDES = {"buy", "sell"}


@ui.component
def filter_app():
    # Get the "side" parameter as a string
    side = ui.use_query_param("side")
    # Get the "sym" parameter as a list of strings
    syms = ui.use_query_param("sym", [])

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

1. **Single parameter access**: Use `use_query_param` when you only need to read a single parameter.
2. **Multiple parameter access**: If you need access to multiple parameters at once, consider using `use_query_params` instead.
3. **Validate parameters before use**: Parameters can be manipulated by the user and may not be in the format you expect.
4. **Use with `use_set_query_param`**: Pair `use_query_param` with [`use_set_query_param`](use_set_query_param.md) to read and write the same parameter concisely.

## API reference

```{eval-rst}
.. autofunction:: deephaven.ui.use_query_param
```
