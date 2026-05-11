# use_params

`use_params` is a hook that returns the route parameters extracted by the nearest ancestor [`router`](../components/router.md).

> [!NOTE]
> Deephaven and all custom components share the path. Avoid using routers, the path, path parameters, and navigation in shared components to prevent conflicts. Do not use the route segment `/-/` in your application path as it is reserved for internal use by Deephaven.

## Example

```python order=app
from deephaven import ui


@ui.component
def user_page():
    # Extract the user_id parameter from the route
    params = ui.use_params()
    user_id = params["user_id"]
    return ui.text(f"User profile for user {user_id}")

@ui.component
def app():
    # Route to match variable {user_id}
    return ui.router(
        ui.route(path="{user_id}", element=user_page),
    )


app = app()
```

## Parameters with Navigation

Use `use_params` together with `use_path` and `use_navigate` to build a simple user profile page that extracts a required `user_id` parameter and an optional `section` parameter from the URL, validates them, and provides navigation buttons to update the parameters.

```python order=app
from deephaven import ui


@ui.component
def user_profile():
    params = ui.use_params()
    navigate = ui.use_navigate()
    # Access required user_id parameter
    user_id = params["user_id"]
    # Access optional section parameter with a default value
    section = params.get("section", "overview")

    # Validate that user_id is a number (since route parameters are always strings)
    if not user_id.isdigit():
        return ui.text("Invalid user ID")

    return ui.flex(
        ui.text(f"User: {user_id}, Section: {section}"),
        # Add navigation for convenience
        ui.button_group(
            ui.action_button(
                "Overview", on_press=lambda: navigate(f"/{user_id}")
            ),
            ui.action_button(
                "Settings", on_press=lambda: navigate(f"/{user_id}/settings")
            ),
            ui.action_button(
                "Activity", on_press=lambda: navigate(f"/{user_id}/activity")
            ),
        ),
        ui.button_group(
            ui.action_button("User 1", on_press=lambda: navigate("/1")),
            ui.action_button("User 2", on_press=lambda: navigate("/2")),
            ui.action_button("User 3", on_press=lambda: navigate("/3")),
        ),
        direction="column",
    )


@ui.component
def not_found():
    navigate = ui.use_navigate()
    params = ui.use_params()
    # Access the wildcard parameter for unmatched paths
    return ui.flex(
        ui.text(f"Page not found: {params['*']}"),
        ui.action_button("Go to User 1", on_press=lambda: navigate("/1")),
        direction="column",
    )


@ui.component
def app():
    return ui.router(
        ui.route(
            # Match /{user_id}/{section?} and extract user_id and optional section as params
            ui.route(path="{section?}", element=user_profile),
            # Match /{user_id} and extract user_id as a param
            path="{user_id}",
        ),
        # Match any other path and show the not found page
        ui.route(path="*", element=not_found),
    )


app = app()
```

## Route Parameter Patterns

Route parameters are defined by `&#123;var_name&#125;` segments in route paths:

- `&#123;user_id&#125;` matches a required segment and extracts it as `"user_id"` in the params dict.
- `&#123;tab?&#125;` matches an optional segment. The parameter is not included if the segment is missing.
- `*` matches any remaining path. The value is available as the `"*"` key.

See [`router`](../components/router.md) for more details on defining routes and path patterns.

## Recommendations

1. Validate and parse route parameters as needed since they are always returned as strings and users can manipulate the URL to include unexpected values.
2. Use [`use_path`](./use_path.md) to read the full matched path, or [`use_query_params`](./use_query_params.md) for query string values. `use_params` only returns route segment parameters.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_params
```
