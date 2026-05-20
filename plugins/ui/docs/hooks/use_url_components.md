# use_url_components

`use_url_components` is a hook that returns the current URL split into components using `urllib.parse.urlsplit`.

## Example

```python order=app
from deephaven import ui


@ui.component
def url_info():
    url = ui.use_url_components()
    return ui.flex(
        ui.text(f"Scheme: {url.scheme}"),
        ui.text(f"Host: {url.netloc}"),
        ui.text(f"Path: {url.path}"),
        ui.text(f"Query: {url.query}"),
        ui.text(f"Fragment: {url.fragment}"),
        direction="column",
    )


app = url_info()
```

## Recommendations

1. Prefer more specific hooks over `use_url_components` when possible: [`use_path`](./use_path.md) for the path, [`use_query_params`](./use_query_params.md) for query strings, and [`use_params`](./use_params.md) for route parameters.
2. The returned object is a standard Python `SplitResult` from `urllib.parse`, so all `SplitResult` attributes and methods are available.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_url_components
```
