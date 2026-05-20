# use_navigate

`use_navigate` is a hook that returns a function to trigger single page application (SPA) navigation within Deephaven. For declarative navigation, consider using [`link`](../components/link.md) with the `to` prop instead.

> [!NOTE]
> Deephaven and all custom components share the path. Avoid using routers, the path, path parameters, and navigation in shared components to prevent conflicts. Do not use the route segment `/-/` in your application path as it is reserved for internal use by Deephaven.

## Example

```python order=app
from deephaven import ui


@ui.component
def app():
    # Navigate to the settings page
    navigate = ui.use_navigate()
    return ui.action_button(
        "Go to settings", on_press=lambda: navigate("/settings")
    )


app = app()
```

## Navigation Options

Use `use_navigate` together with `use_path` and `use_query_params` to build a simple navigation system that updates the path and displays query parameters.

```python order=app
from deephaven import ui


@ui.component
def navigation_demo():
    path = ui.use_path()
    query_params = ui.use_query_params()
    navigate = ui.use_navigate()

    def go_dashboard():
        # Navigate to a page with a query parameter
        navigate("/dashboard", query_params={"welcome": "true"})

    def go_settings():
        # Use replace=False to push a new history entry instead of replacing the current one
        navigate("/settings", replace=False)

    def scroll_to_section():
        # Jump to a fragment on the current page
        navigate(fragment="section-2")

    def filter_by_tags():
        # Update query parameters on the current page
        navigate(query_params={"tag": ["python", "java"]})

    return ui.flex(
        ui.text(f"Current path: {path}"),
        ui.text(f"Query params: {query_params}"),
        ui.action_button("Dashboard", on_press=go_dashboard),
        ui.action_button("Settings (push)", on_press=go_settings),
        ui.action_button("Jump to section", on_press=scroll_to_section),
        ui.action_button("Filter by tags", on_press=filter_by_tags),
        direction="column",
    )


app = navigation_demo()
```

## Recommendations

1. Prefer [`link`](../components/link.md) with `to` for user-clickable navigation. Reserve `use_navigate` for programmatic navigation triggered by events or side effects.
2. Use `replace=True` (the default) when navigating in response to a state change to avoid polluting the browser history.
3. Pair with [`router`](../components/router.md) and [`route`](../components/router.md) to define the route structure that `use_navigate` targets.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_navigate
```
