# DH-21654: Routing Implementation Plan

## Overview

This plan details the implementation of single page application routing features for deephaven.ui, enabling Python components to read URL state and trigger client-side navigation.

---

# Part 1: Specification

## Features Summary

| Feature               | Type                  | Description                               |
| --------------------- | --------------------- | ----------------------------------------- |
| `use_path`            | Hook                  | Returns the current path                  |
| `use_query_params`    | Hook                  | Returns all query params as a dict        |
| `use_query_param`     | Hook                  | Returns a single query param value        |
| `use_set_query_param` | Hook                  | Returns a setter for a single query param |
| `use_navigate`        | Hook                  | Returns a navigate function               |
| `use_url_components`  | Hook                  | Returns full URL split into components    |
| `QueryParams`         | Type alias            | Dict of query param names to values       |
| `ui.link`             | Component (extension) | Renders clickable navigation element      |
| `ui.context`          | Component             | Provides context values to descendants    |
| `ui.create_context`   | Function              | Creates a context object                  |
| `use_context`         | Hook                  | Consumes a context value from ancestors   |
| `ui.router`           | Component             | Matches URL path to routes, renders match |
| `ui.route`            | Function / data class | Defines a route pattern and its element   |
| `use_params`          | Hook                  | Returns route params from nearest router  |
| `get_widget_path`     | Function              | Returns resolved URL path for a widget    |
| `use_widget_path`     | Hook                  | Hook form of `get_widget_path`            |

---

## Types

### `QueryParams`

A type alias for query parameter dictionaries used throughout the routing API.

```python
QueryParams = dict[str, str | list[str]]
```

Keys are parameter names. Values are either a single `str` (for single-value params) or a `list[str]` (for multi-value params). When serialised to a URL, list values repeat the key — `{"tag": ["python", "java"]}` becomes `?tag=python&tag=java`.

Used by `use_navigate`, `use_set_query_param`, `ui.link` (`NavigationTarget`), and any other API that accepts query parameters.

---

## 1. `use_path` Hook

Returns the current URL path.

### API

```python
def use_path(absolute: bool = False) -> str:
    """
    Get the current URL path.

    Args:
        absolute: If True, returns the full absolute path.
                  If False (default), returns the path relative to the current widget.

    Returns:
        The current path as a string.
    """
```

### Arguments

| Argument   | Type   | Default | Description                           |
| ---------- | ------ | ------- | ------------------------------------- |
| `absolute` | `bool` | `False` | Return absolute path vs relative path |

### Path Resolution

The relative path (default) is derived from the `/local/` segment in the URL. Widgets are served at routes like `/iriside/app/widget/<pq_name>/<widget_name>/local/…` — the `/local/` prefix separates platform routing from user routing. `use_path()` returns only the portion **after** `/local/`, which is the widget's own route space.

- URL `/iriside/app/widget/q/w/local/dashboard/settings` → `use_path()` returns `"/dashboard/settings"`
- URL `/iriside/app/widget/q/w/local/` or `/iriside/app/widget/q/w` → `use_path()` returns `"/"`
- URL `/iriside/embed/widget/q/w/local/page` → `use_path()` returns `"/page"`

When `absolute=True`, the full browser path is returned (e.g. `"/iriside/app/widget/q/w/local/dashboard/settings"`).

If the widget is not loaded via a route containing `/local/`, the relative path falls back to `"/"`.

### Example

```python
@ui.component
def my_component():
    path = ui.use_path()
    navigate = ui.use_navigate()

    def handle_press():
        navigate("/dashboard")

    return ui.flex(
        ui.text(f"Current path: {path}"),
        ui.button("Go to dashboard", on_press=handle_press),
    )
```

---

## 2. `use_query_params` Hook

Returns query parameters as a dictionary.

### API

```python
def use_query_params() -> QueryParams:
    """
    Get the URL query parameters.

    Returns:
        A dictionary mapping parameter names to lists of values.
    """
```

### Arguments

None.

### Example

```python
@ui.component
def search_page():
    params = ui.use_query_params()
    navigate = ui.use_navigate()
    query = params.get("q", [""])
    page = params.get("page", ["1"])
    tags = params.get("tag", [])

    def apply_filter():
        navigate(query_params={"q": "hello", "page": "1", "tag": ["python", "java"]})

    def clear_all():
        navigate(query_params="")

    return ui.flex(
        ui.text(f"Searching: {query}, page {page}, tags {tags}"),
        ui.button("Apply filter", on_press=apply_filter),
        ui.button("Clear", on_press=clear_all),
    )
```

---

## 3. `use_query_param` Hook

Returns a single query parameter's value. The type of `default` determines the return type — pass `None` (the default) to get `str | None` back, or pass a `list[str]` default to always get a `list[str]` back.

When `default` is `None`:

- If the key is **absent** from the URL → returns `None`
- If the key is **present with no value** (e.g. `/path?foo`) → returns `""`
- If the key is **present with a value** (e.g. `/path?foo=bar`) → returns `"bar"` (last value wins for multi-value keys)

### API

```python
@overload
def use_query_param(key: str, default: None = None) -> str | None:
    ...


@overload
def use_query_param(key: str, default: list[str]) -> list[str]:
    ...


def use_query_param(
    key: str,
    default: None | list[str] = None,
) -> str | None | list[str]:
    """
    Get a single URL query parameter value by key.

    The return type depends on `default`:
    - None default (default): returns the last value for the key as a str,
      '' if the key is present with no value (e.g. ?foo),
      or None if the key is absent.
    - list[str] default: returns all values for the key as a list[str],
      or `default` if the key is absent.

    Args:
        key: The query parameter name to look up.
        default: The value to return if the key is absent. Also determines
                 the return type. Defaults to None.

    Returns:
        str | None if default is None, list[str] if default is list[str].
    """
```

### Arguments

| Argument  | Type                | Default | Description                                       |
| --------- | ------------------- | ------- | ------------------------------------------------- |
| `key`     | `str`               | —       | The query parameter name                          |
| `default` | `None \| list[str]` | `None`  | Returned if key is absent; determines return type |

### Example

```python
@ui.component
def tag_filter():
    # None default → returns str | None
    page = ui.use_query_param("page")  # None if absent, "" if ?page, "2" if ?page=2
    sort = ui.use_query_param("sort")  # None if absent

    # list[str] default → always returns list[str]
    tags = ui.use_query_param("tag", [])  # [] or ["python", "java"]

    # Use use_set_query_param to get setters
    set_page = ui.use_set_query_param("page")
    set_tags = ui.use_set_query_param("tag", [])

    def next_page():
        set_page(str(int(page or "0") + 1))

    def clear_page():
        set_page()  # No value → sets to default (None), removing ?page from URL

    def add_tag():
        set_tags([*tags, "rust"])

    return ui.flex(
        ui.text(f"Page {page}, sort {sort}, tags {tags}"),
        ui.button("Next page", on_press=next_page),
        ui.button("Clear page", on_press=clear_page),
        ui.button("Add rust tag", on_press=add_tag),
    )
```

---

## 4. `use_set_query_param` Hook

Returns a setter function for a single query parameter. If no value is passed to the setter, it resets the parameter to its `default` value.

### API

```python
@overload
def use_set_query_param(
    key: str, default: None = None, replace: bool = True
) -> Callable[..., None]:
    ...


@overload
def use_set_query_param(
    key: str, default: list[str], replace: bool = True
) -> Callable[..., None]:
    ...


def use_set_query_param(
    key: str,
    default: None | list[str] = None,
    replace: bool = True,
) -> Callable[..., None]:
    """
    Get a setter function for a single URL query parameter.

    The returned setter updates the given query parameter in the URL.

    Args:
        key: The query parameter name to set.
        default: The value to use when the setter is called with no value argument.
            Also determines the type of value the setter accepts.
            Defaults to None (which removes the parameter when called with no value).
        replace: If True, replaces the current history entry instead of pushing a new one. Set to False to push a new history entry on each change.

    Returns:
        A setter function with signature:
            set_value(value=<default>) -> None

        - value: The value to set. Optional — if omitted, sets the parameter
          to `default` (e.g. None removes the key, [] clears the list).
          When default is None: accepts str | None.
          When default is list[str]: accepts list[str].
    """
```

### Arguments

| Argument  | Type                | Default | Description                                                                              |
| --------- | ------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `key`     | `str`               | —       | The query parameter name                                                                 |
| `default` | `None \| list[str]` | `None`  | Value used when setter is called with no value argument                                  |
| `replace` | `bool`              | `True`  | Whether to replace the current history entry or push a new one when the setter is called |

### Setter Arguments

| Argument | Type                         | Default   | Description                                                            |
| -------- | ---------------------------- | --------- | ---------------------------------------------------------------------- |
| `value`  | `str \| None` or `list[str]` | `default` | The value to set. Type depends on `default`. Omit to set to `default`. |

### Notes

- Calling the setter with no arguments sets the parameter to its `default` — `None` removes the key from the URL, `[]` clears all values for the key.

### Example

```python
@ui.component
def tag_filter():
    page = ui.use_query_param("page")
    tags = ui.use_query_param("tag", [])

    set_page = ui.use_set_query_param("page")
    set_tags = ui.use_set_query_param("tag", [])

    def next_page():
        set_page(str(int(page or "0") + 1))

    def clear_page():
        set_page()  # No value → sets to default (None), removing ?page from URL

    def add_tag():
        set_tags([*tags, "rust"])  # Appends "rust" to existing tags

    def replace_tags():
        set_tags(["python", "java"])  # Overwrites all tags

    def clear_tags():
        set_tags()  # No value → sets to default ([]), clearing all tags

    return ui.flex(
        ui.text(f"Page {page}, tags {tags}"),
        ui.button("Next page", on_press=next_page),
        ui.button("Clear page", on_press=clear_page),
        ui.button("Add rust tag", on_press=add_tag),
        ui.button("Replace tags", on_press=replace_tags),
        ui.button("Clear tags", on_press=clear_tags),
    )
```

---

## 5. `use_navigate` Hook

Returns a function to trigger client-side navigation.

### API

```python
def use_navigate() -> Callable[..., None]:
    """
    Get a function to navigate to a new URL.

    Returns:
        A navigate function with signature:
            navigate(
                path: str | None = None,
                query_params: str | QueryParams | None = None,
                fragment: str | None = None,
                absolute: bool = False,
                replace: bool | None = None,
            ) -> None
    """
```

### `navigate` Function Arguments

| Argument       | Type                         | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `path`         | `str \| None`                | `None`  | Target path. May include inline query params and fragment (e.g. `"/dashboard?tab=1#section"`). Leading `/` optional; preserves current path if omitted. Explicit `query_params` or `fragment` args override any inline values parsed from `path`.                                                                                                                                                                                                                                                                                    |
| `query_params` | `str \| QueryParams \| None` | `None`  | Query string or `QueryParams` dict; preserves if omitted, removes if empty (`""` or `{}`); list values repeat the key                                                                                                                                                                                                                                                                                                                                                                                                                |
| `fragment`     | `str \| None`                | `None`  | URL fragment (leading `#` optional); preserves if omitted, removes if empty (`""`)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `absolute`     | `bool`                       | `False` | Use absolute path navigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `replace`      | `bool \| None`               | `None`  | Whether to replace the current history entry or push a new one. If `None` (default), automatically determined: uses **replace** when the target is within the current dashboard context, uses **push** when navigating outside it. Generally, `absolute=False` navigates within the dashboard (replace), and `absolute=True` navigates outside (push), but if `absolute=True` targets a path still within the current dashboard, it will still default to replace. Explicitly pass `True` to force replace or `False` to force push. |

### Notes

- At least one of `path`, `query_params`, or `fragment` must be provided to `navigate`; passing none raises a `ValueError`. The values not provided are preserved with the exception of path (e.g. if `path` is omitted, the current path is unchanged). If `path` is provided, `query_params` and `fragment` are cleared if not provided.
- **Inline `path` is parsed first**: If `path` contains inline query params or fragment (e.g. `"/page?foo=bar#section"`), they are extracted first. Any explicitly provided `query_params` or `fragment` arguments then override the inline values parsed from `path`.
- Leading `/` in `path` is optional—`"dashboard"` and `"/dashboard"` are equivalent. An empty string is not valid; use `"/"` for the root.
- Leading `?` in `query_params` string form is optional.
- Leading `#` in `fragment` is optional.
- **Empty values clear the URL component**: Passing `query_params=""` or `query_params={}` removes all query parameters from the URL. Passing `fragment=""` removes the URL fragment.
- **Multi-value params**: Pass a list as a dict value to repeat a key — `{"tag": ["python", "java"]}` serialises to `?tag=python&tag=java`.
- **Replace vs push**: When `replace` is `None`, navigation within the current dashboard context uses `history.replaceState` (no new history entry), while navigation outside the dashboard uses `history.pushState` (new history entry). This prevents intra-dashboard navigation from polluting the browser history while still allowing the back button to return from cross-dashboard navigation.

### Example

```python
@ui.component
def login_form():
    path = ui.use_path()
    navigate = ui.use_navigate()

    def handle_login():
        # Navigate within dashboard — defaults to replace (no new history entry)
        navigate("/dashboard", query_params={"welcome": "true"})

    def go_to_other_dashboard():
        # Navigate outside dashboard — defaults to push (new history entry)
        navigate("/other/dashboard/path", absolute=True)

    def force_push():
        # Force a push even within the dashboard
        navigate("/settings", replace=False)

    def scroll_to_section():
        # Scroll to a fragment on the current page (no path change)
        navigate(fragment="section-2")

    def filter_by_tags():
        # Multi-value query params
        navigate(query_params={"tag": ["python", "java"]})

    def clear_query_params():
        # Clear all query parameters from the URL
        navigate(query_params="")

    def clear_fragment():
        # Clear the fragment from the URL
        navigate(fragment="")

    return ui.flex(
        ui.text(f"Current path: {path}"),
        ui.button("Login", on_press=handle_login),
        ui.button("Other dashboard", on_press=go_to_other_dashboard),
        ui.button("Force push", on_press=force_push),
        ui.button("Jump to section", on_press=scroll_to_section),
        ui.button("Filter by tags", on_press=filter_by_tags),
        ui.button("Clear query params", on_press=clear_query_params),
        ui.button("Clear fragment", on_press=clear_fragment),
    )
```

---

## 6. `use_url_components` Hook

Returns the current URL split into components using `urllib.parse.urlsplit`. This is mainly for advanced use cases where full URL access is needed. Other hooks are recommended for common routing tasks that focus on path and query parameters.

### API

```python
from urllib.parse import SplitResult


def use_url_components() -> SplitResult:
    """
    Get the current URL broken into components.

    Uses urllib.parse.urlsplit on the full URL received from the frontend.

    Returns:
        A SplitResult named tuple with fields:
        - scheme: URL scheme (e.g. "https")
        - netloc: Network location (e.g. "app.deephaven.io")
        - path: Path component
        - query: Query string (without leading "?")
        - fragment: Fragment (without leading "#")
    """
```

### Arguments

None.

### Example

```python
@ui.component
def my_component():
    url = ui.use_url_components()
    return ui.flex(
        ui.text(f"Scheme: {url.scheme}"),
        ui.text(f"Host: {url.netloc}"),
        ui.text(f"Path: {url.path}"),
        ui.text(f"Query: {url.query}"),
        ui.text(f"Fragment: {url.fragment}"),
    )
```

---

## 7. `ui.link` Component

Renders a clickable element that navigates on interaction. The new `to` prop accepts either a string (parsed for path, search, and fragment) or a `NavigationTarget` dict for explicit control. Used for SPA navigation within the app.

### Types

```python
class NavigationTarget(TypedDict, total=False):
    path: str  # The path to navigate to (`"/path"`)
    query_params: str | QueryParams  # Query string (`"?foo=bar"`) or QueryParams dict
    fragment: str  # URL fragment, e.g. `"section"` (leading `#` optional)
    absolute: bool  # If True, navigate to absolute path instead of relative path to this widget
    replace: bool  # If True, replace the current history entry instead of pushing a new one
```

### API

```python
def link(
    # ... other props ...,
    to: str | NavigationTarget = None,
    # ... other props ...,
) -> Element:
    """
    ... description of link component ...

    Args:
        ... other props ...
        to: The target location for single-page application navigation.
            Either a plain string (parsed for path, query params,
            and fragment; always absolute=False), or a NavigationTarget dict with
            `path`, `query_params`, `fragment`, `absolute`, and `replace`.
            `query_params` and `fragment` override any inline values in `path` within NavigationTarget.
            Can't be used with `href`, which always triggers a full page reload.
        ... other props ...
    """
```

### Arguments

| Argument | Type                      | Default | Description     |
| -------- | ------------------------- | ------- | --------------- |
| `to`     | `str \| NavigationTarget` | `None`  | Target location |

### Notes

- When `to` is a plain `str`, it is parsed for path, query params, and fragment (e.g. `"/path?foo=bar#section"`). Navigation is always `absolute=False` in this form.
- `absolute=True` is only available via the dict form.

### Example

```python
@ui.component
def nav():
    return ui.flex(
        # Simple string form — path, query params, and fragment all parsed from the string
        ui.link("Home", to="/"),
        ui.link("Search", to="/search?q=hello#results"),
        # Dict form for explicit control
        ui.link("Users", to={"path": "/users", "query_params": {"sort": "name"}}),
        ui.link(
            "Tags",
            to={"path": "/tags", "query_params": {"tag": ["python", "java"]}},
        ),
        ui.link("Settings", to={"path": "/settings", "fragment": "notifications"}),
        # Absolute navigation
        ui.link(
            "Other Dashboard",
            to={"path": "/other/dashboard/widget/path", "absolute": True},
        ),
    )
```

## 8. `ui.router`, `ui.route`, `ui.context`, and `use_params`

Provides declarative route matching, nested routing, route parameter extraction, and context-based parameter sharing. This is modeled after React Router's approach but adapted for deephaven.ui's Python-first design.

> **Note:** More advanced routing features (such as route guards, type coercion, and outlets) are beyond the scope of this initial implementation.

### `ui.context`

Provides a value to all descendant components without explicitly passing it through props. A context is created with `ui.create_context()`, provided via `ui.context`, and consumed via `ui.use_context()`. This is used internally by `ui.router` to provide route parameters to matched elements.

#### API

```python
def create_context(default_value: T = None) -> Context[T]:
    """
    Create a new context object.

    Args:
        default_value: The default value used when no provider is found
                       in the component tree.

    Returns:
        A Context object with a Provider component.
    """


def context(ctx: Context[T], value: T, *children: Element) -> Element:
    """
    Provide a context value to all descendant components.

    Args:
        ctx: The context object created by create_context().
        value: The value to provide to descendants.
        *children: Child elements that can consume this context.

    Returns:
        An Element wrapping the children with the context value.
    """


def use_context(ctx: Context[T]) -> T:
    """
    Consume a context value from the nearest ancestor provider.

    Args:
        ctx: The context object to read from.

    Returns:
        The value from the nearest ancestor ui.context provider,
        or the default_value if no provider is found.
    """
```

#### Example

```python
theme_context = ui.create_context("light")


@ui.component
def themed_button():
    theme = ui.use_context(theme_context)
    return ui.button(f"Theme: {theme}")


@ui.component
def app():
    return ui.context(
        theme_context,
        "dark",
        themed_button(),
    )
```

---

### `ui.route`

A factory function that constructs and returns a route data object mapping a URL path pattern to a component. Child routes are passed as positional arguments, making nested route trees read naturally without a separate `children` keyword.

#### API

```python
@dataclass
class _Route:
    path: str | None = None
    element: Callable[..., Element] | None = None
    children: list[_Route] | None = None
    index: bool = False


def route(
    *children: _Route,
    path: str | None = None,
    element: Callable[..., Element] | None = None,
    index: bool = False,
) -> _Route:
    """
    Define a route mapping a URL path pattern to a component.

    Args:
        *children: Child _Route instances for nested routing, passed as
                   positional arguments.
        path: The path segment for this route (keyword-only). Appended to
              the parent route's path. Variables are defined with {var_name}
              syntax and extracted as route params. Optional variables use
              {var_name?} syntax. Wildcard segments are supported with "*".
              Leading "/" is optional — "users" and "/users" are equivalent.
              Mutually exclusive with `index`. Pass None (or omit)
              when using `index=True`.
        element: The component function to render when this route matches.
        index: If True, this route matches the parent's exact path (like
               an index route). Mutually exclusive with `path`.
    """
    return _Route(
        path=path,
        element=element,
        children=list(children) if children else None,
        index=index,
    )
```

#### Arguments

| Argument    | Type                             | Default | Description                                                                                                                                              |
| ----------- | -------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `*children` | `_Route`                         | —       | Nested child routes passed as positional arguments.                                                                                                      |
| `path`      | `str \| None`                    | `None`  | Path segment appended to parent path (keyword-only). Supports `{var_name}`, `{var_name?}`, and wildcard (`*`) segments. Mutually exclusive with `index`. |
| `element`   | `Callable[..., Element] \| None` | `None`  | Component function to render on match.                                                                                                                   |
| `index`     | `bool`                           | `False` | If True, matches the parent's exact path. Mutually exclusive with `path`.                                                                                |

#### Notes

- Paths inherit from their parent and are appended. `ui.route(ui.route(path="{user_id}"), path="users")` produces the pattern `/users/{user_id}`.
- `{var_name}` in a path segment defines a required route parameter, extracted and available via `use_params()`.
- **Wildcard segments**: A path of `"*"` matches any remaining path segments (zero or more). The matched wildcard value is available as the `"*"` key in `use_params()`. Example: `ui.route(path="*", element=not_found)` matches any path not matched by sibling routes.
- **Optional segments**: `{var_name?}` makes a variable segment optional — it matches whether or not that segment is present in the URL. When absent, the param value is `""`. Example: `ui.route(path="users/{tab?}", element=user_page)` matches both `/users` and `/users/settings`.
- If `index=True`, the route matches when the URL exactly matches the parent's path (no additional segments).
- `path` and `index` are mutually exclusive — providing both raises a `ValueError`.
- If two sibling routes produce conflicting resolved paths, a `ValueError` is raised at router initialization.

---

### `ui.router`

A `@ui.component` that takes `ui.route` children, matches the current URL path against them, and renders the matching route's element wrapped in a context provider for `use_params`.

#### API

```python
@ui.component
def router(*routes: route) -> Element:
    """
    Match the current URL path against the provided routes and render
    the matching route's element.

    The matched element is wrapped with ui.context to provide route
    parameters accessible via use_params().

    Args:
        *routes: Route definitions to match against.

    Returns:
        The element for the matched route wrapped in a params context,
        or an error element if no route matches.

    Raises:
        ValueError: If conflicting route paths are detected among siblings.
    """
```

#### Matching Behavior

1. The router uses `use_path()` to get the current relative path.
2. All routes are compiled into a list of resolved path patterns (inheriting parent paths).
3. At initialization, the router validates that no sibling routes produce conflicting resolved paths. Conflicting paths raise a `ValueError`.
4. The router matches the **most specific** path first:
   - Static segments are preferred over parameterized segments (`/users/settings` matches before `/users/{user_id}`).
   - Longer matches (more segments) are preferred over shorter ones.
   - Wildcard routes (`*`) have the lowest priority among siblings.
   - Optional segments are matched greedily (present match preferred over absent).
   - Index routes match only the exact parent path.
5. If no route matches, the router renders an error.
6. When a match is found, route parameters (from `{var_name}` segments) are extracted and provided via `ui.context` so that `use_params()` can access them within the matched element and its descendants.

---

### `use_params` Hook

Returns the route parameters extracted by the nearest ancestor `ui.router`. Uses `ui.use_context` internally to read the params context.

#### API

```python
def use_params() -> dict[str, str]:
    """
    Get the route parameters from the nearest ancestor router.

    Route parameters are defined by {var_name} segments in route paths
    and extracted when the route matches.

    Returns:
        A dictionary mapping parameter names to their matched string values.
        Returns an empty dict if no router ancestor exists.
    """
```

#### Arguments

None.

#### Example

```python
@ui.component
def user_profile():
    params = ui.use_params()
    user_id = params["user_id"]
    return ui.text(f"User: {user_id}")


@ui.component
def user_post():
    params = ui.use_params()
    user_id = params["user_id"]
    post_id = params["post_id"]
    return ui.text(f"User {user_id}, Post {post_id}")


@ui.component
def user_list():
    return ui.text("All users")


@ui.component
def dashboard():
    return ui.text("Dashboard home")


@ui.component
def app():
    return ui.router(
        ui.route(
            ui.route(index=True, element=user_list),
            ui.route(
                ui.route(path="posts/{post_id}", element=user_post),
                path="{user_id}",
                element=user_profile,
            ),
            path="users",
        ),
        ui.route(index=True, element=dashboard),
    )
```

This produces the following route table:

| URL Path            | Matched Element | Params                              |
| ------------------- | --------------- | ----------------------------------- |
| `/`                 | `dashboard`     | `{}`                                |
| `/users`            | `user_list`     | `{}`                                |
| `/users/42`         | `user_profile`  | `{"user_id": "42"}`                 |
| `/users/42/posts/7` | `user_post`     | `{"user_id": "42", "post_id": "7"}` |
| `/anything-else`    | Not found error | —                                   |

---

## 9. `get_widget_path` and `use_widget_path`

Returns the resolved URL path for navigating to a specific widget, supporting both the embedded widget route and the in-app widget route. `get_widget_path` is a standalone function that requires the caller to pass the current path for auto-detection of embed vs app context (when `embed=None`), while `use_widget_path` is a hook that automatically reads the current path from the URL context. `use_widget_path` must be called within a `@ui.component`, but should be preferred.

### URL Routes

| Route Pattern                                               | Description                                     |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `<base_url>/embed/widget/<pq_name>/<widget_name>[/local/…]` | Existing embedded widget route                  |
| `<base_url>/app/widget/<pq_name>/<widget_name>[/local/…]`   | In-app widget navigation (navigates within app) |

The `<base_url>` is derived from the current URL at runtime (e.g. `/iriside`), rather than being hardcoded. This ensures the routing works correctly when the application is served at a different base path.

Both routes support an optional `/local/…` suffix for user-defined sub-routing within the widget. The `/local/` prefix separates platform routing from user routing — everything after `/local/` is the widget's own route space.

### API

```python
def get_widget_path(
    query: str,
    widget: str,
    current_path: str,
    embed: bool | None = None,
    local_path: str | None = None,
) -> str:
    """
    Get the resolved URL path for navigating to a widget.

    The base URL is extracted from `current_path` by finding the portion
    before `/embed/widget/` or `/app/widget/`. This avoids hardcoding
    a specific base path like `/iriside`.

    Args:
        query: The persistent query name (pq_name).
        widget: The widget name.
        current_path: The current absolute URL path, used to extract the
                      base URL and to auto-detect whether the caller is in
                      an embed or app context when embed is None.
        embed: Whether to use the embed route or the app route.
               If None (default), auto-detects based on current_path:
               True if current_path contains the embed prefix, False otherwise.
        local_path: Optional sub-path appended after "/local/" for
                    user-defined routing within the widget.

    Returns:
        The resolved URL path string.
    """
```

### Arguments

| Argument       | Type           | Default | Description                                                                               |
| -------------- | -------------- | ------- | ----------------------------------------------------------------------------------------- |
| `query`        | `str`          | —       | The persistent query name                                                                 |
| `widget`       | `str`          | —       | The widget name                                                                           |
| `current_path` | `str`          | —       | Current absolute URL path, used for embed auto-detection when `embed` is `None`.          |
| `embed`        | `bool \| None` | `None`  | Use embed route (`True`) or app route (`False`). `None` auto-detects from `current_path`. |
| `local_path`   | `str \| None`  | `None`  | User-defined sub-path appended after `/local/`. Leading `/` optional.                     |

### Examples

```python
# Auto-detect from current_path
get_widget_path(
    "my_query", "my_widget", current_path="/iriside/app/widget/other/widget"
)
# "/iriside/app/widget/my_query/my_widget"  (current_path is app route → app)

get_widget_path(
    "my_query", "my_widget", current_path="/iriside/embed/widget/other/widget"
)
# "/iriside/embed/widget/my_query/my_widget"  (current_path is embed route → embed)

# Explicit embed override
get_widget_path("my_query", "my_widget", current_path="/any/path", embed=True)
# "/iriside/embed/widget/my_query/my_widget"

get_widget_path("my_query", "my_widget", current_path="/any/path", embed=False)
# "/iriside/app/widget/my_query/my_widget"

# With user-defined local routing
get_widget_path(
    "my_query",
    "my_widget",
    current_path="/iriside/app/widget/q/w",
    local_path="dashboard/settings",
)
# "/iriside/app/widget/my_query/my_widget/local/dashboard/settings"

get_widget_path(
    "my_query",
    "my_widget",
    current_path="/any/path",
    embed=True,
    local_path="custom/page",
)
# "/iriside/embed/widget/my_query/my_widget/local/custom/page"
```

### Notes

- The `/local/` segment acts as a boundary: everything before it is platform routing (widget resolution), everything after it is the widget's own routing space accessible via `use_path()` and `ui.router`.
- The base URL (e.g. `/iriside`) is extracted from `current_path` by finding the portion before `/embed/widget/` or `/app/widget/`. This ensures `get_widget_path` works correctly regardless of the deployment base path.
- When `embed=None`, the function inspects `current_path` to determine whether the caller is in an embed route (path contains `/embed/widget/`) or an app route, and returns the matching form. If neither pattern is found in `current_path`, defaults to the app route.

---

### `use_widget_path` Hook

A hook form of `get_widget_path` that automatically reads the current URL using `use_url_components()`, so `current_path` does not need to be passed explicitly. Must be called within a `@ui.component`.

#### API

```python
def use_widget_path(
    query: str,
    widget: str,
    embed: bool | None = None,
    local_path: str | None = None,
) -> str:
    """
    Get the resolved URL path for navigating to a widget using the current URL context.

    Equivalent to:
        get_widget_path(query, widget, current_path=use_url_components().path, ...)

    Args:
        query: The persistent query name (pq_name).
        widget: The widget name.
        embed: Whether to use the embed route or the app route.
               If None (default), auto-detects based on the current URL:
               True if the current URL is an embed route, False otherwise.
        local_path: Optional sub-path appended after "/local/" for
                    user-defined routing within the widget.

    Returns:
        The resolved URL path string.
    """
```

#### Arguments

| Argument     | Type           | Default | Description                                                                            |
| ------------ | -------------- | ------- | -------------------------------------------------------------------------------------- |
| `query`      | `str`          | —       | The persistent query name                                                              |
| `widget`     | `str`          | —       | The widget name                                                                        |
| `embed`      | `bool \| None` | `None`  | Use embed route (`True`) or app route (`False`). `None` auto-detects from current URL. |
| `local_path` | `str \| None`  | `None`  | User-defined sub-path appended after `/local/`. Leading `/` optional.                  |

#### Example

```python
@ui.component
def nav_panel():
    # Automatically detects embed vs app from the current URL
    path = ui.use_widget_path("my_query", "my_widget")
    path_with_local = ui.use_widget_path("my_query", "my_widget", local_path="settings")

    return ui.flex(
        ui.link("Go to widget", to={"path": path, "absolute": True}),
        ui.link("Go to settings", to={"path": path_with_local, "absolute": True}),
    )
```

---

# Part 2: Implementation

## Architecture

### Data Flow

The frontend sends URL state to the backend via the widget state. The backend reads this state through hooks. For navigation, the backend sends an event to the frontend, which updates the URL and re-sends state.

```
┌─────────────┐    setState (path, queryParams, etc)   ┌─────────────┐
│   Frontend  │ ─────────────────────────────────────► │   Backend   │
│  (Browser)  │                                        │  (Python)   │
│             │ ◄───────────────────────────────────── │             │
└─────────────┘    navigate.event (path, params, etc)  └─────────────┘
```

### URL State Update and Re-render Cycle

1. **Initial load**: The frontend sends a `setState` message containing URL fields (`__path`, `__absolutePath`, `__queryParams`, `__fragment`, `__href`) alongside the component's serialised state. The backend's `_set_state` handler calls `import_state()` on the `RenderContext`, which populates the URL fields, then calls `_mark_dirty()` to trigger a render.
2. **Navigation (backend-initiated)**: A hook like `use_navigate()` emits a `"navigate.event"` to the frontend. The frontend updates `window.location` via the History API, then immediately re-sends a `setState` message with the updated URL fields. This `setState` flows through `import_state()` → `_mark_dirty()` → re-render, so hooks reading URL state see the new values.
3. **Navigation (browser-initiated)**: The frontend listens for the `popstate` event (back/forward button, address bar edits). On `popstate`, it re-sends a `setState` message with the new URL fields, triggering the same `import_state()` → `_mark_dirty()` → re-render cycle.
4. **URL fields are not `use_state` values**: URL state is stored as plain fields on `RenderContext` (set during `import_state`), not as reactive `use_state` hooks. Re-renders are triggered by the `setState` message itself calling `_mark_dirty()`, not by individual field changes. This means URL changes always trigger a full component re-render, which is acceptable since URL changes are infrequent.

---

## 1. `use_path` Implementation

### Backend (Python)

1. Add `_path`, `_absolute_path`, `_query_params`, and `_fragment` fields to `RenderContext`, populated from `__path`, `__absolutePath`, `__queryParams`, and `__fragment` keys in the incoming state dict.
2. Add `get_path()`, `get_absolute_path()`, `get_query_params()`, and `get_fragment()` accessors on `RenderContext`.
3. Create `hooks/use_path.py` that calls `get_context()` and returns the appropriate path string based on the `absolute` argument.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__path` (`window.location.pathname`), `__absolutePath` (`window.location.pathname`), and `__fragment` (`window.location.hash`).

---

## 2. `use_query_params` Implementation

### Backend (Python)

1. `_query_params` is already on `RenderContext` (added in step 1).
2. Create `hooks/use_query_params.py` that returns `get_context().get_query_params()`.
3. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__queryParams`, built by iterating `new URLSearchParams(window.location.search)` and grouping values by key: keys that appear once become a `string`, keys that appear multiple times become a `string[]`.

---

## 3. `use_query_param` Implementation

### Backend (Python)

1. Create `hooks/use_query_param.py`.
2. Implement with overloads: look up `key` in `get_context().get_query_params()`.
   - If absent, return `default` (`None` or the provided `list[str]`).
   - If `default` is `None`: coerce to `str` — return the last element if the value is `list[str]`, otherwise return the value directly (including `""` for present-but-empty keys like `?foo`).
   - If `default` is a `list[str]`: coerce to `list[str]` — wrap in a list if the value is a `str`, otherwise return as-is.
3. Return just the value (no setter — setters are provided by `use_set_query_param`).
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

No frontend changes — reads from the same `__queryParams` state as `use_query_params`.

---

## 4. `use_set_query_param` Implementation

### Backend (Python)

1. Create `hooks/use_set_query_param.py`.
2. Accept `key` and `default` arguments matching `use_query_param`.
3. Return a setter callable that:
   - Takes an optional `value` argument (defaults to `default` if not provided).
   - When called, reads the current full query params via `get_context().get_query_params()`, replaces the value for `key` (or removes `key` if `value` is `None`), and calls `use_navigate()`'s navigate function with the updated `query_params` dict.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

No frontend changes — uses the same `navigate.event` mechanism.

---

## 5. `use_navigate` Implementation

### Backend (Python)

1. Create `hooks/use_navigate.py`.
2. Define private normalisation helpers:
   - `_normalise_path`: prepends `/` if missing; returns `None` for `None` (preserve); raises `ValueError` for empty string. If the path contains inline query params or fragment, extracts them (using `urlsplit`) before normalising — these are then used as fallback values, overridden by any explicitly provided `query_params` or `fragment` args.
   - `_normalise_query_params`: returns `None` for `None` (preserve); returns `{}` for `""` or `{}` (clear); otherwise parses query string or `QueryParams` dict into a serialisable form where list values repeat the key.
   - `_normalise_fragment`: returns `None` for `None` (preserve); returns `""` for `""` (clear); otherwise strips leading `#`.
3. Implement `use_navigate()` as a hook that returns a `navigate` callable:
   - `navigate` validates at least one arg is not `None`, normalises the args (merging inline values from `path` with explicit `query_params`/`fragment`), then calls `use_send_event()` to emit a `"navigate.event"` payload with the normalised fields.
   - `navigate` accepts a `replace` argument (`bool | None`, default `None`). When `None`, the frontend determines replace vs push: replace if the target is within the current dashboard context, push if outside. The `replace` value is included in the event payload so the frontend can honor an explicit override.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

1. In `WidgetHandler.tsx`, add a `"navigate.event"` case to the `METHOD_EVENT` switch block.
2. Implement a `handleNavigate` handler that constructs a new URL respecting the `null`-means-preserve / empty-means-clear semantics:
   - `null` path → keep `window.location.pathname`
   - `null` params → keep `window.location.search`; `{}` → clear search; when building the URL from params, iterate entries: for `string[]` values call `searchParams.append(key, val)` for each, for `string` values call `searchParams.set(key, val)`.
   - `null` fragment → keep `window.location.hash`; `""` → clear fragment
   - For `absolute: true`: use `window.location.href`.
   - For history management: if `replace` is explicitly `true`, use `history.replaceState`; if explicitly `false`, use `history.pushState`; if `null`, determine automatically — use `replaceState` when the resolved target path is within the current dashboard's base path, otherwise use `pushState`.
   - After state change, re-send current URL state via `sendSetState`.
3. **Security validation**: Before applying navigation, validate the resolved URL:
   - Reject non-same-origin URLs — the resolved URL must have the same origin as `window.location.origin`.
   - Reject dangerous schemes — only allow `http:`, `https:`, and relative URLs. Block `javascript:`, `data:`, `vbscript:`, and other executable schemes.
   - Sanitise path components — strip any `..` traversal sequences to prevent path manipulation.
   - If validation fails, log a warning and ignore the navigation request.
4. **`popstate` listener**: Register a `popstate` event listener (on mount, cleaned up on unmount) that re-sends the current URL state via `sendSetState` whenever the user navigates with the browser's back/forward buttons or edits the address bar. This ensures the backend stays in sync with browser-initiated navigation.
5. Ensure that the URL update triggers the appropriate re-render, sending an update to the backend.

---

## 6. `use_url_components` Implementation

### Backend (Python)

1. Add `_href` field to `RenderContext`, populated from `__href` in the incoming state dict.
2. Add a `get_href()` accessor on `RenderContext`.
3. Create `hooks/use_url_components.py` that calls `urlsplit(get_context().get_href())` and returns the resulting `SplitResult`.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, include `__href: window.location.href` in the state object passed to `sendSetState` on initialization (and on subsequent URL updates alongside the other URL state fields).

---

## 7. `ui.link` Implementation

### Backend (Python)

Extend `components/link.py`:

1. Add `to: str | NavigationTarget | None = None` parameter alongside the existing `href`, `on_press`, and layout props.
2. Wrap the caller-supplied `on_press` in an internal handler that, when `to` is set, parses it (using `urllib.parse.urlsplit` for string form, or direct dict access for `NavigationTarget`) and calls a function that shares logic with `use_navigate()`'s `navigate` to emit a `"navigate.event"` with the appropriate fields.
3. When `to` is provided and `href` is not, compute a fallback `href` string from `to` for accessibility (passing it to `component_element` as the `href` prop).
4. Pass everything through to `component_element("Link", ...)` as usual.

### Frontend (TypeScript)

No frontend changes needed — the existing Spectrum `Link` component renders the `href` and fires the `on_press` callback to the backend.

---

## 8. `ui.context`, `ui.router`, `ui.route`, and `use_params` Implementation

### Backend (Python)

#### `ui.context` and `ui.create_context`

1. Create `components/context.py` with a `Context` class that holds a default value and a unique identifier.
2. Implement `create_context(default_value)` that returns a `Context` instance.
3. Implement `context(ctx, value, *children)` that wraps children in a context provider element, storing the context id and value in the render tree.
4. Implement `use_context(ctx)` as a hook that walks up the render context to find the nearest provider for the given context id, returning its value or the default.
5. Export `create_context`, `context`, and `use_context` from `components/__init__.py` and `hooks/__init__.py` respectively.

#### `ui.context` Implementation Mechanism

The existing `RenderContext` tracks parent→child relationships via `_children_context`, but has no child→parent pointer. To support `use_context` lookups, the implementation adds a `_parent` reference:

1. **`Context` class**: Each `Context` instance has a unique `id` (UUID) and a `default_value`.
2. **Parent pointer on `RenderContext`**: Add an optional `_parent: RenderContext | None` field to `RenderContext`. When `get_child_context(key)` creates or returns a child, it sets `child._parent = self`. The root context has `_parent = None`.
3. **Provider registration**: `ui.context(ctx, value, *children)` is a `@ui.component` that, on render, registers a provider entry on the current `RenderContext`. The `RenderContext` gains a `_provided_contexts: dict[str, Any]` field mapping context IDs to provided values. When `ui.context` renders, it writes `self._context._provided_contexts[ctx.id] = value` before rendering its children.
4. **`use_context(ctx)` lookup**: The hook calls `get_context()` to get the current `RenderContext`, then walks up the `_parent` chain. At each ancestor, it checks `_provided_contexts` for `ctx.id`. If found, returns the value. If the root is reached without a match, returns `ctx.default_value`.
5. **Lifecycle**: Provider entries in `_provided_contexts` are cleared at the start of each `open()` call (similar to how `_collected_contexts` is reset), ensuring stale providers don't persist across re-renders.

#### `ui.route`

1. Create `components/route.py` with an internal `_Route` dataclass and a public `route` factory function.
2. `*children` as variadic `_Route` instances, and `element`, `index`, `path` as keyword-only parameters.
3. Validate that `path` and `index=True` are mutually exclusive (raise `ValueError` if both provided).
4. Collect `children` from the variadic positional args and store as `list[_Route] | None`.
5. Export `route` (the factory function) from `components/__init__.py`.

#### `ui.router`

1. Create `components/router.py` with a `@ui.component` decorated `router` function.
2. **Route compilation**: recursively walk all `route` children, building a list of `(resolved_pattern, element, param_names)` tuples. Child paths are appended to parent paths (unless `absolute=True`).
3. **Conflict detection**: after compilation, check for duplicate resolved static paths among siblings. Raise `ValueError` if conflicts are found.
4. **Matching**: call `use_path()` to get the current path. Match against compiled patterns with specificity ordering:
   - Static segments before parameterized segments.
   - Longer (more segments) before shorter.
   - Index routes match only the exact parent path.
5. **Param extraction**: on match, extract `{var_name}` values from the URL segments into a `dict[str, str]`.
6. **Rendering**: wrap the matched element in `ui.context(_route_params_context, params, matched_element())` so descendants can access params via `use_params()`.
7. **Not found**: if no route matches, render an error element indicating the path was not found.
8. Export from `components/__init__.py`.

#### `use_params`

1. Create `hooks/use_params.py`.
2. Uses `use_context(_route_params_context)` internally to read the params dict from the nearest ancestor router.
3. Returns `dict[str, str]` (empty dict if no router ancestor).
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

No frontend changes needed — routing logic is entirely in the Python backend. The router reads URL state from the existing `use_path()` mechanism and renders standard deephaven.ui elements.

---

## 9. `get_widget_path` and `use_widget_path` Implementation

### Backend (Python)

**TODO** — Implementation details for `get_widget_path` and `use_widget_path`:

1. Implement `get_widget_path(query, widget, current_path, embed=None, local_path=None)`:
   - Extract the base URL from `current_path` by finding the portion before `/embed/widget/` or `/app/widget/`. If neither pattern is found, use `""` as the base URL (relative paths).
   - If `embed` is `None`, inspect `current_path`: set `True` if it contains `/embed/widget/`, else `False`.
   - Build the path: `{base_url}/embed/widget/{query}/{widget}` or `{base_url}/app/widget/{query}/{widget}`.
   - If `local_path` is provided, strip any leading `/` and append `/local/{local_path}`.
2. Create `hooks/use_widget_path.py`:
   - Calls `use_url_components()` to obtain the current absolute path.
   - Passes it as `current_path` to `get_widget_path` along with the other arguments.
3. Export `get_widget_path` from `utils/__init__.py` and `use_widget_path` from `hooks/__init__.py`.

### Frontend (TypeScript)

**TODO** — Register the in-app widget route. Key areas to address:

1. Route registration for `/iriside/app/widget/<pq_name>/<widget_name>` that renders the widget within the full application shell (as opposed to the existing embed route which renders standalone).
2. `/local/` path stripping: when the frontend resolves a widget at `/iriside/app/widget/q/w/local/foo/bar`, load widget `w` from query `q` and pass `/foo/bar` as the widget-relative path (returned by `use_path()`).
3. Integration with `ui.router` — widgets using `ui.router` within `/local/…` should receive the path after `/local/` as their routing space.

---

## File Changes Summary

### New Files

| File                           | Description                              |
| ------------------------------ | ---------------------------------------- |
| `hooks/use_path.py`            | Path hook                                |
| `hooks/use_query_params.py`    | Query params (all) hook                  |
| `hooks/use_query_param.py`     | Query param (single) hook                |
| `hooks/use_set_query_param.py` | Query param setter hook                  |
| `hooks/use_navigate.py`        | Navigate hook                            |
| `hooks/use_url_components.py`  | URL components hook                      |
| `hooks/use_params.py`          | Route params hook (via context)          |
| `hooks/use_widget_path.py`     | Hook form of `get_widget_path`           |
| `components/context.py`        | `create_context`, `context`, context API |
| `components/route.py`          | `route` data class                       |
| `components/router.py`         | `router` component                       |
| `utils/get_widget_path.py`     | `get_widget_path` helper function        |

### Modified Files

| File                                  | Changes                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `hooks/__init__.py`                   | Export new hooks (such as `use_params`, `use_context`, `use_widget_path`) and any others |
| `components/__init__.py`              | Export `link` (modified), `context`, `create_context`, `route`, `router`                 |
| `components/link.py`                  | Add `to` prop and routing logic (uses `use_navigate`)                                    |
| `_internal/RenderContext.py`          | Add `_path`, `_absolute_path`, `_query_params`, `_fragment`, `_href`                     |
| `src/js/src/widget/WidgetHandler.tsx` | Add URL state to initial `sendSetState`, handle `navigate.event`                         |

---

## Testing Considerations

1. **Unit tests** for each hook reading correct context values and returning correct tuple shape
2. **Unit tests** for navigate serializing correct event payload
3. **Unit tests** for `use_query_param` returning `None` when key absent, `""` when key present without value
4. **Unit tests** for `ui.router` route compilation, conflict detection, and specificity-based matching
5. **Unit tests** for `use_params` returning extracted route parameters via context
6. **Unit tests** for `ui.context` / `use_context` providing and consuming values through the component tree
7. **Unit tests** for `get_widget_path` returning correct paths for embed vs app routes, with and without local paths, using explicit `current_path`
8. **Unit tests** for `use_widget_path` auto-detecting embed vs app from current URL
9. **E2E tests** for:
   - Link click triggers navigation
   - URL state reflected in hooks after navigation
   - `absolute=True` behavior
   - Setter functions from each hook correctly update URL state
   - Router matching and rendering correct components for various paths
   - Route parameters available in matched components via `use_params`
   - Nested routes with inherited paths
   - Router "not found" error for unmatched paths

## Documentation

1. Update API docs for new hooks and functions
