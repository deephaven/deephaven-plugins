# Router

`ui.router` is a component that matches the current URL path against provided routes and renders the matching route's element. Use it with [`route`](#route) to define hierarchical navigation structures.

> [!NOTE]
> Deephaven and all custom components share the path. Avoid using routers, the path, path parameters, and navigation in shared components to prevent conflicts. Do not use the route segment `/-/` in your application path as it is reserved for internal use by Deephaven.

## Example

```python order=app
from deephaven import ui


@ui.component
def home_page():
    return ui.text("Home page")

@ui.component
def app():
    # Index routes match the parent path exactly, so this renders home_page at the root URL
    return ui.router(
        ui.route(index=True, element=home_page),
    )


app = app()
```

## Router Options

Build a simple app with a router, nested routes, route parameters, and a fallback "not found" page.

```python order=app
from deephaven import ui


@ui.component
def nav_links():
    # Reuse navigation across pages for convenience
    navigate = ui.use_navigate()
    return ui.button_group(
        ui.action_button("Home", on_press=lambda: navigate("/")),
        ui.action_button("All Users", on_press=lambda: navigate("/users")),
        ui.action_button("User 1", on_press=lambda: navigate("/users/1")),
        ui.action_button("User 2", on_press=lambda: navigate("/users/2")),
    )


@ui.component
def user_page():
    # The use_params hook gives access to route parameters defined in the path
    params = ui.use_params()
    # user_id is optional due to the ? in the route path, so provide a default value
    user_id = params.get("user_id", None)
    if user_id is None:
        return ui.flex(
            nav_links(),
            ui.text("All users page"),
            direction="column",
        )
    return ui.flex(
        nav_links(),
        ui.text(f"User profile for user {user_id}"),
        direction="column",
    )


@ui.component
def dashboard():
    return ui.flex(
        nav_links(),
        ui.text("Dashboard home"),
        direction="column",
    )


@ui.component
def not_found():
    return ui.flex(
        nav_links(),
        ui.text("Page not found"),
        direction="column",
    )


@ui.component
def app():
    return ui.router(
        # Nest routes for hierarchical paths
        ui.route(
            # Match /users/{user_id} and extract user_id as an optional param
            ui.route(
                path="{user_id?}",
                element=user_page,
            ),
            path="users",
        ),
        # An index route matches the path exactly, so this matches the root path /
        ui.route(index=True, element=dashboard),
        # Match any unmatched path with a wildcard route
        ui.route(path="*", element=not_found),
    )


app = app()
```

This produces the following route table:

| URL Path         | Matched Element | Params                   |
| ---------------- | --------------- | ------------------------ |
| `/`              | `dashboard`     | `{}`                     |
| `/users`         | `user_page`     | `{}`                     |
| `/users/42`      | `user_page`     | `{"user_id": "42"}`      |
| `/anything-else` | `not_found`     | `{"*": "anything-else"}` |

## Recommendations

1. Include a wildcard route (`path="*"`) as a fallback so unmatched paths render a meaningful "not found" message instead of an error.
2. Use an `index=True` route to define what renders at the exact parent path (such as a landing page at `/`).
3. Use [`use_params`](../hooks/use_params.md) inside routed components to access route parameters, and [`use_path`](../hooks/use_path.md) for the current path.
4. Use [`use_navigate`](../hooks/use_navigate.md) or [`link`](./link.md) with `to` to navigate between routes.

## API Reference

### Router

```{eval-rst}
.. dhautofunction:: deephaven.ui.router
```

#### Matching behavior

1. Static segments are preferred over parameterized segments.
2. Longer matches (more segments) are preferred over shorter ones.
3. Wildcard routes (`*`) have the lowest priority.
4. Optional segments are matched if present but do not prevent a match if absent.
5. Index routes match only the exact parent path.
6. If no route matches, the router renders an error.

### Route

```{eval-rst}
.. dhautofunction:: deephaven.ui.route
```

#### Path patterns

- `{var_name}`: Required dynamic segment
- `{var_name?}`: Optional dynamic segment (matches zero or one segments)
- `*`: Wildcard, matches any remaining path segments
- Static text: Exact match

See [`use_params`](../hooks/use_params.md) for more details on route parameters.

Child paths are appended to parent paths. For example, `ui.route(ui.route(path="{user_id}"), path="users")` produces `/users/{user_id}`.
