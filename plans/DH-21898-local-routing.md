# DH-21898: Within Widget Routing Implementation Plan

## Overview

This plan covers a subset of routing features for deephaven.ui: path-based navigation within a widget's `/-/` route space, declarative routing, and route parameter extraction.

# Part 1: Specification

## Features Summary

| Feature              | Type                  | Description                               |
| -------------------- | --------------------- | ----------------------------------------- |
| `use_path`           | Hook                  | Returns the current path                  |
| `use_navigate`       | Hook                  | Returns a navigate function               |
| `use_url_components` | Hook                  | Returns full URL split into components    |
| `ui.link`            | Component (extension) | Renders clickable navigation element      |
| `ui.router`          | Component             | Matches URL path to routes, renders match |
| `ui.route`           | Function / data class | Defines a route pattern and its element   |
| `use_params`         | Hook                  | Returns route params from nearest router  |

---

## Types

### `NavigationTarget`

A `TypedDict` used by `ui.link`'s `to` prop for explicit control over navigation.

```python
class NavigationTarget(TypedDict, total=False):
    path: str  # The path to navigate to ("/path")
    query_params: str | QueryParams  # Query string ("?foo=bar") or QueryParams dict
    fragment: str  # URL fragment, e.g. "section" (leading "#" optional)
    replace: bool  # If True, replace the current history entry instead of pushing
```

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

The path is derived from the `/-/` segment in the URL. Widgets are served at routes like `<base_url>/embed/widget/<pq_name>/<widget_name>/-/…` — the `/-/` prefix separates platform routing from widget routing. `use_path()` returns only the portion **after** `/-/`, which is the widget's own route space. The `/-/` segment should not be used anywhere else in the URL to avoid conflicts.

- URL `/iriside/embed/widget/q/w/-/dashboard/settings` → `use_path()` returns `"/dashboard/settings"`
- URL `/iriside/embed/widget/q/w/-/` or `/iriside/embed/widget/q/w` → `use_path()` returns `"/"`
- URL `/iriside/embed/widget/q/w/-/page` → `use_path()` returns `"/page"`

When `absolute=True`, the full browser path is returned (e.g. `"/iriside/embed/widget/q/w/-/dashboard/settings"`).

If the widget is not loaded via a route containing `/-/`, the relative path falls back to `"/"`.

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

## 2. `use_navigate` Hook

Returns a function to trigger client-side navigation within the widget's route space.

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
                replace: bool | None = None,
            ) -> None
    """
```

### `navigate` Function Arguments

| Argument       | Type                         | Default | Description                                                                                                                                                                                                                                       |
| -------------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`         | `str \| None`                | `None`  | Target path. May include inline query params and fragment (e.g. `"/dashboard?tab=1#section"`). Leading `/` optional; preserves current path if omitted. Explicit `query_params` or `fragment` args override any inline values parsed from `path`. |
| `query_params` | `str \| QueryParams \| None` | `None`  | Query string or `QueryParams` dict; preserves if omitted and `path` is not provided; cleared if `path` is provided and omitted. Removes if empty (`""` or `{}`); list values repeat the key.                                                      |
| `fragment`     | `str \| None`                | `None`  | URL fragment (leading `#` optional); preserves if omitted and `path` is not provided; cleared if `path` is provided and omitted. Removes if empty (`""`).                                                                                         |
| `replace`      | `bool \| None`               | `None`  | Whether to replace the current history entry or push a new one. If `None` (default), uses `history.replaceState` (no new history entry) since currently navigation stays within the widget.                                                       |

**Future extension**: For future cross-widget routing, `use_navigate` could accept an `absolute` option to indicate that the provided path is absolute rather than relative to the widget's base path. `absolute` navigation that doesn't target the current widget would push to history.

Additionally, the `path` argument could be extended to accept a `WidgetPath` or `EnterpriseWidgetPath`. These are data classes that resolve to absolute widget URL paths at render time. `WidgetPath` targets a widget by name (for non-enterprise/community environments), while `EnterpriseWidgetPath` targets a persistent query by or serial number (for enterprise environments). Ideally, the query name by itself would even be optional, in which case the current PQ would be the target, for easy cross-widget navigation within the same PQ.

Before implementing absolute cross-widget routing, several prerequisites should be addressed, some of which were discovered while experimenting with the `WidgetPath`/`EnterpriseWidgetPath` resolution:

1. **Improved URL routes**: Enterprise should support cleaner paths like `/dashboard/<query_name>/<widget>`, and community should use a path param instead of a query param for the widget name.
2. **Route construction outside ui plugin**: It should be straightforward to construct these widget URLs. It would be ideal if much of this logic lived within the web UI itself rather than the plugin so that route changes do not require plugin changes, which would be fragile and redundant.
3. **History integration**: Cross-widget navigation currently requires a page reload when trying to change widgets, such as switching to another dashboard. We need a way to tie into the existing history tracking so that navigating between widgets can be done as a client-side transition.
4. **Robust embed/non-embed transitions**: Switching between embedded and non-embedded contexts (and between widgets in general) currently has reliability issues when built with the current approach. Constant logouts and spurious errors like "dashboard has been deleted" when it hasn't hampered usability. These edge cases need to be resolved before cross-widget routing can be dependable.

Tickets for this future work are DH-22498, DH-22499, and DH-22500.

### Notes

- At least one of `path`, `query_params`, or `fragment` must be provided to `navigate`; passing none raises a `ValueError`. The values not provided are preserved with the exception of `query_params` and `fragment` when `path` is provided (they are cleared if not provided).
- **Inline `path` is parsed first**: If `path` contains inline query params or fragment (e.g. `"/page?foo=bar#section"`), they are extracted first. Any explicitly provided `query_params` or `fragment` arguments then override the inline values parsed from `path`.
- Leading `/` in `path` is optional — `"dashboard"` and `"/dashboard"` are equivalent. An empty string is not valid; use `"/"` for the root.
- Leading `?` in `query_params` string form is optional.
- Leading `#` in `fragment` is optional.
- **Empty values clear the URL component**: Passing `query_params=""` or `query_params={}` removes all query parameters from the URL. Passing `fragment=""` removes the URL fragment.
- **Multi-value params**: Pass a list as a dict value to repeat a key — `{"tag": ["python", "java"]}` serialises to `?tag=python&tag=java`.
- **Replace vs push**: When `replace` is `None`, navigation defaults to `history.replaceState` (no new history entry) since all current navigation stays within the widget. Explicitly pass `False` to force a push (new history entry).

### Example

```python
@ui.component
def login_form():
    path = ui.use_path()
    navigate = ui.use_navigate()

    def handle_login():
        # Navigate to /dashboard with query_params; fragment is cleared since path is provided
        navigate("/dashboard", query_params={"welcome": "true"})

    def force_push():
        # Force a push to create a history entry
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
        ui.button("Force push", on_press=force_push),
        ui.button("Jump to section", on_press=scroll_to_section),
        ui.button("Filter by tags", on_press=filter_by_tags),
        ui.button("Clear query params", on_press=clear_query_params),
        ui.button("Clear fragment", on_press=clear_fragment),
    )
```

---

## 3. `use_url_components` Hook

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
        - netloc: Network location (e.g. "example.com:8080")
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

## 4. `ui.link` Component

Renders a clickable element that navigates on interaction. The new `to` prop accepts either a string (parsed for path, search, and fragment) or a `NavigationTarget` dict for explicit control. Used for SPA navigation within the widget's route space.

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
            and fragment), or a NavigationTarget dict with
            `path`, `query_params`, `fragment`, and `replace`.
            `query_params` and `fragment` override any inline values in `path` within NavigationTarget.
            Can't be used with `href`, which always triggers a full page reload.
            Throws a ValueError if both `to` and `href` are provided.
        ... other props ...
    """
```

### Arguments

| Argument | Type                      | Default | Description                                      |
| -------- | ------------------------- | ------- | ------------------------------------------------ |
| `to`     | `str \| NavigationTarget` | `None`  | Target location. Mutually exclusive with `href`. |

**Future extension**: For future cross-widget routing, `to` could also accept the `WidgetPath` or `EnterpriseWidgetPath` described in the `use_navigate` section, which would resolve to absolute widget paths at render time.

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
    )
```

---

## 5. `ui.router`, `ui.route`, and `use_params`

Provides declarative route matching, nested routing, route parameter extraction, and context-based parameter sharing.

> **Note:** More advanced routing features (such as route guards, type coercion, and outlets) are beyond the scope of this initial implementation.

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
        path: The path segment appended to the parent route's path. Variables
                are defined with {var_name} syntax and extracted as route
                params. Optional variables use {var_name?} syntax. Wildcard
                segments are supported with "*". Leading "/" is optional —
                "users" and "/users" are equivalent.
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

| Argument    | Type                             | Default | Description                                                                                                       |
| ----------- | -------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `*children` | `_Route`                         | —       | Nested child routes passed as positional arguments.                                                               |
| `path`      | `str \| None`                    | `None`  | Path segment. Supports `{var_name}`, `{var_name?}`, and wildcard (`*`) segments. Mutually exclusive with `index`. |
| `element`   | `Callable[..., Element] \| None` | `None`  | Component function to render on match.                                                                            |
| `index`     | `bool`                           | `False` | If True, matches the parent's exact path. Mutually exclusive with `path`.                                         |

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

1. The router uses `use_path()` to get the current path.
2. All routes are compiled into a list of resolved path patterns (inheriting parent paths).
3. At initialization, the router validates that no sibling routes produce conflicting resolved paths. Conflicting paths raise a `ValueError`.
4. The router matches the **most specific** path first:
   - Static segments are preferred over parameterized segments (`/users/settings` matches before `/users/{user_id}`).
   - Longer matches (more segments) are preferred over shorter ones.
   - Wildcard routes (`*`) have the lowest priority among siblings.
   - Optional segments are matched greedily (present match preferred over absent).
   - Index routes match only the exact parent path.
5. If no route matches, the router renders an error.
6. When a match is found, route parameters (from `{var_name}` segments) are extracted and provided via the existing `Context` system so that `use_params()` can access them within the matched element and its descendants.

---

### `use_params` Hook

Returns the route parameters extracted by the nearest ancestor `ui.router`.

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

# Part 2: Implementation

## Architecture

### Data Flow

The frontend sends URL state to the backend via the widget state. The backend reads this state through hooks. For navigation, the backend sends an event to the frontend, which updates the URL and re-sends state. This extends the existing query-params-only data flow from Part 1.

```
┌─────────────┐    setState (path, queryParams, fragment, href)   ┌─────────────┐
│   Frontend  │ ──────────────────────────────────────────────►   │   Backend   │
│  (Browser)  │                                                   │  (Python)   │
│             │ ◄──────────────────────────────────────────────   │             │
└─────────────┘    navigate.event (path, queryParams, fragment…)  └─────────────┘
```

### URL State Update and Re-render Cycle

This extends the existing cycle from Part 1 (which only sends `__queryParams`) to include path, fragment, and full URL state.

1. **Initial load**: The frontend sends a `setState` message containing URL fields (`__path`, `__queryParams`, `__fragment`, `__href`) alongside the component's serialised state. The backend's `_set_state` handler calls `import_state()` on the `RenderContext`, which populates the URL fields, then calls `_mark_dirty()` to trigger a render. (Part 1 already sends `__queryParams`; this plan adds the remaining fields.)
2. **Navigation (backend-initiated)**: A hook like `use_navigate()` emits a `"navigate.event"` to the frontend with a payload (`path`, `queryParams`, `fragment`, `replace`). The frontend updates `window.location` via the History API, then immediately re-sends `setUrlState` with the updated URL fields. This flows through `import_state()` → `_mark_dirty()` → re-render, so hooks reading URL state see the new values. (Part 1 already handles `queryParams` and `replace`; this plan adds `path` and `fragment`.)
3. **Navigation (browser-initiated)**: The frontend already listens for the `popstate` event (Part 1). On `popstate`, it re-sends `setUrlState` with the full URL state (now including path, fragment, and href in addition to query params).
4. **URL fields are not `use_state` values**: URL state is stored as plain fields on the root render context (set during `import_state`), not as reactive `use_state` hooks. Re-renders are triggered by the `setState`/`setUrlState` message itself calling `_mark_dirty()`, not by individual field changes. This means URL changes always trigger a full component re-render, which is acceptable since URL changes are infrequent.

---

## 1. `use_path` Implementation

### Backend (Python)

1. **Extend `RootRenderContextProtocol`** with `get_path()`, `set_path()`, `get_absolute_path()`, `set_absolute_path()`, `get_fragment()`, `set_fragment()`, `get_href()`, `set_href()` — following the existing pattern of `get_query_params()` / `set_query_params()`.
2. **Extend `RenderContext`** with delegation methods `get_path()`, `get_absolute_path()`, `get_fragment()`, `get_href()` that call through to `self._root`, following the existing `get_query_params()` pattern.
3. **Update `import_state()`** in `RenderContext` to extract `__path`, `__absolutePath`, `__fragment`, and `__href` from the incoming state dict (alongside the existing `__queryParams` extraction).
4. **Create `hooks/use_path.py`** that calls `get_context()` and returns the appropriate path string based on the `absolute` argument.
5. **Export** `use_path` from `hooks/__init__.py`.

### Frontend (TypeScript)

1. **Extend `getUrlState()`** in `WidgetHandler.tsx` to include `__path`, `__fragment`, and `__href` alongside the existing `__queryParams`:
   - `__path`: The widget's path extracted from `window.location.pathname` by finding the portion after `/-/`. Falls back to `"/"` if `/-/` is not in the path.
   - `__absolutePath`: `window.location.pathname` (the full path).
   - `__fragment`: `window.location.hash` with the leading `#` stripped, or `""` if no hash.
   - `__href`: `window.location.href` (the full URL).
2. **Update `Navigate.ts` constants** to export keys for the new state fields.

---

## 2. `use_navigate` Implementation

### Backend (Python)

1. **Create `hooks/use_navigate.py`**.
2. Define private normalization helpers:
   - `_normalize_path`: prepends `/` if missing; returns `None` for `None` (preserve); raises `ValueError` for empty string. If the path contains inline query params or fragment, extracts them (using `urlsplit`) before normalising — these are then used as fallback values, overridden by any explicitly provided `query_params` or `fragment` args.
   - `_normalize_query_params`: returns `None` for `None` (preserve); returns `""` for `""` or `{}` (clear); otherwise converts `QueryParams` dict to a query string using the same `_query_params_to_query_string()` helper from `use_set_query_param.py` (or a shared utility). String form is returned as-is (with leading `?` stripped if present).
   - `_normalize_fragment`: returns `None` for `None` (preserve); returns `""` for `""` (clear); otherwise strips leading `#`.
3. Implement `use_navigate()` as a hook that returns a `navigate` callable:
   - Uses `use_send_event()` (same as `use_set_query_param`) to emit `"navigate.event"`.
   - `navigate` validates at least one arg is not `None`, normalizes the args (merging inline values from `path` with explicit `query_params`/`fragment`), then sends the payload: `{ path, queryParams, fragment, replace }`.
   - Fields set to `None` in the payload tell the frontend to preserve the current value.
4. **Export** `use_navigate` from `hooks/__init__.py`.

### Frontend (TypeScript)

1. **Extend `NavigateParams`** in `Navigate.ts` to include the new fields:
   ```typescript
   export type NavigateParams = {
     path?: string | null;
     queryParams?: string | null;
     fragment?: string | null;
     replace?: boolean | null;
   };
   ```
2. **Update the `Navigate()` function** to handle the extended payload:
   - `null`/`undefined` path → keep current path; otherwise resolve the path relative to the widget's base path (the portion up to and including `/-/`).
   - `null`/`undefined` queryParams → keep `window.location.search`; `""` → clear search; otherwise set `url.search`.
   - `null`/`undefined` fragment → keep `window.location.hash`; `""` → clear hash; otherwise set `url.hash`.
   - History management: if `replace` is explicitly `true`, use `history.replaceState`; if explicitly `false`, use `history.pushState`; if `null`, default to `replaceState` for navigation within the widget.
3. **Security validation** (extending existing cross-origin check):
   - Reject non-same-origin URLs — the resolved URL must have the same origin as `window.location.origin`.
   - Reject dangerous schemes — only allow `http:`, `https:`, and relative URLs. Block `javascript:`, `data:`, `vbscript:`, and other executable schemes.
   - Sanitise path components — strip any `..` traversal sequences to prevent path manipulation.
   - If validation fails, log a warning and ignore the navigation request.
4. **`popstate` listener** already exists (Part 1) — ensure it re-sends the extended URL state (including the new fields) via `sendUrlState()`. This should happen automatically since `getUrlState()` is updated to include all fields.

---

## 3. `use_url_components` Implementation

### Backend (Python)

1. `_href` is already added to `RenderContext` in the `use_path` implementation step above.
2. **Create `hooks/use_url_components.py`** that calls `urlsplit(get_context().get_href())` and returns the resulting `SplitResult`.
3. **Export** `use_url_components` from `hooks/__init__.py`.

### Frontend (TypeScript)

No additional frontend changes — `__href` is already included in `getUrlState()` from the `use_path` implementation step.

---

## 4. `ui.link` Implementation

### Backend (Python)

Extend `components/link.py`:

1. **Add `to` parameter** (`str | NavigationTarget | None = None`) alongside the existing `href`, `on_press`, and layout props.
2. **Validate** that `to` and `href` are mutually exclusive — raise `ValueError` if both are provided.
3. **Wrap the caller-supplied `on_press`** in an internal handler that, when `to` is set, parses it (using `urllib.parse.urlsplit` for string form, or direct dict access for `NavigationTarget`) and calls a shared `_build_navigate_payload` function (same logic as `use_navigate()`'s normalization) to emit a `"navigate.event"` via `use_send_event()`.
4. **Compute a fallback `href`** from `to` for accessibility when `href` is not provided — this ensures the rendered `<a>` tag has an `href` attribute for screen readers and keyboard navigation.
5. Pass everything through to `component_element("Link", ...)` as usual.

### Frontend (TypeScript)

No frontend changes needed — the existing Spectrum `Link` component renders the `href` and fires the `on_press` callback to the backend. The backend handles the `navigate.event` emission.

---

## 5. `ui.router`, `ui.route`, and `use_params` Implementation

### Backend (Python)

All routing logic is pure Python. No frontend changes needed. The router reads URL state from `use_path()` and renders standard deephaven.ui elements. Route parameters are provided via the existing `Context` system.

#### `ui.route`

1. **Create `components/route.py`** with an internal `_Route` dataclass and a public `route` factory function.
2. `*children` as variadic `_Route` instances, and `element`, `index`, `path` as keyword-only parameters.
3. Validate that `path` and `index=True` are mutually exclusive (raise `ValueError` if both provided).
4. Collect `children` from the variadic positional args and store as `list[_Route] | None`.
5. **Export** `route` from `components/__init__.py`.

#### `ui.router`

1. **Create `components/router.py`** with a `@ui.component` decorated `router` function.
2. **Create a module-level context** for route params: `_route_params_context = create_context({})` using the already-implemented `create_context` function.
3. **Route compilation**: recursively walk all `route` children, building a list of `(resolved_pattern, element, param_names)` tuples. Child paths are appended to parent paths.
4. **Conflict detection**: after compilation, check for duplicate resolved static paths among siblings. Raise `ValueError` if conflicts are found.
5. **Matching**: call `use_path()` to get the current path. Match against compiled patterns with specificity ordering:
   - Static segments before parameterized segments.
   - Longer (more segments) before shorter.
   - Wildcard routes (`*`) have the lowest priority among siblings.
   - Optional segments are matched greedily (present match preferred over absent).
   - Index routes match only the exact parent path.
6. **Param extraction**: on match, extract `{var_name}` values from the URL segments into a `dict[str, str]`.
7. **Rendering**: wrap the matched element using the existing `Context` callable: `_route_params_context(matched_element(), value=params)`. This pushes the params onto the context stack so `use_params()` can read them.
8. **Not found**: if no route matches, render an error element indicating the path was not found.
9. **Export** `router` from `components/__init__.py`.

#### `use_params`

1. **Create `hooks/use_params.py`**.
2. Uses the already-implemented `use_context(_route_params_context)` internally to read the params dict from the nearest ancestor router.
3. Returns `dict[str, str]` (empty dict if no router ancestor, which is the `create_context({})` default).
4. **Export** `use_params` from `hooks/__init__.py`.

### Frontend (TypeScript)

No frontend changes needed — routing logic is entirely in the Python backend.

---

## File Changes Summary

### New Files

| File                          | Description                              |
| ----------------------------- | ---------------------------------------- |
| `hooks/use_path.py`           | Path hook                                |
| `hooks/use_navigate.py`       | Navigate hook                            |
| `hooks/use_url_components.py` | URL components hook                      |
| `hooks/use_params.py`         | Route params hook                        |
| `components/route.py`         | `_Route` dataclass and `route()` factory |
| `components/router.py`        | `router` component                       |

### Modified Files

| File                                     | Changes                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/__init__.py`                      | Export `use_path`, `use_navigate`, `use_url_components`, `use_params`                                                                        |
| `components/__init__.py`                 | Export `route`, `router`                                                                                                                     |
| `components/link.py`                     | Add `to` prop and routing logic (emits `navigate.event` via `use_send_event`)                                                                |
| `_internal/RenderContext.py`             | Add `get_path()`, `get_absolute_path()`, `get_fragment()`, `get_href()` delegation; update `import_state()`                                  |
| `_internal/RootRenderContextProtocol.py` | Add `get_path()`, `set_path()`, `get_absolute_path()`, `set_absolute_path()`, `get_fragment()`, `set_fragment()`, `get_href()`, `set_href()` |
| `src/js/src/events/Navigate.ts`          | Extend `NavigateParams` with `path`, `fragment`; update `Navigate()` handler                                                                 |
| `src/js/src/widget/WidgetHandler.tsx`    | Extend `getUrlState()` to include `__path`, `__absolutePath`, `__fragment`, `__href`                                                         |

---

## Testing Considerations

### Unit Tests (Python)

1. **`use_path`** — returns correct relative path from various URL patterns; returns absolute path when `absolute=True`; falls back to `"/"` when `/-/` is absent.
2. **`use_navigate`** — serializes correct event payload for path-only, query-only, fragment-only, and combined navigation; validates `ValueError` when no args provided; correctly merges inline path query/fragment with explicit args; normalizes leading `/` and `#`.
3. **`use_url_components`** — returns correct `SplitResult` fields from full URL.
4. **`ui.route`** — validates `path`/`index` mutual exclusivity; collects children correctly; builds `_Route` dataclass properly.
5. **`ui.router`** — route compilation produces correct resolved patterns; conflict detection raises `ValueError` for duplicate static paths; specificity-based matching (static > parameterized > wildcard); index route matching; nested route path inheritance; renders error for unmatched paths.
6. **`use_params`** — returns extracted route parameters via context; returns empty dict when no router ancestor.

### Unit Tests (TypeScript)

1. **`Navigate.ts`** — handles extended payload fields (path, fragment); preserves unspecified fields; clears fields when empty; security validation rejects dangerous schemes.

### E2E Tests (Playwright)

1. **Path reading** — `use_path()` returns correct relative path from URL; `absolute=True` returns full path.
2. **Navigation** — `use_navigate()` updates URL path, query params, and fragment; link click with `to` prop triggers SPA navigation.
3. **History management** — `replace=True` does not create history entry; `replace=False` creates history entry; back button works after push navigation.
4. **Router matching** — renders correct component for static paths, parameterized paths, and wildcard paths; route parameters available via `use_params()`; nested routes with inherited paths; "not found" error for unmatched paths.
5. **URL components** — `use_url_components()` returns correct scheme, host, path, query, and fragment.

---

## Documentation

1. **API reference** — Document all new hooks (`use_path`, `use_navigate`, `use_url_components`, `use_params`), components (`ui.router`, `ui.route`), types (`NavigationTarget`), and the `to` prop on `ui.link`.
2. **Routing guide** — A conceptual guide covering:
   - How URL state flows between frontend and backend
   - Path resolution and the `/-/` boundary
   - Declarative routing with `ui.router` and `ui.route`
   - Navigation patterns (programmatic vs link-based)
3. **Migration notes** — Document that `use_set_query_param` continues to work unchanged; `use_navigate` is the new general-purpose navigation hook.
4. **Examples** — Provide example widgets demonstrating:
   - Basic path-based navigation
   - Router with nested routes and params
   - SPA link navigation with `ui.link` `to` prop
