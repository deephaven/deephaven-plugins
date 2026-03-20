# DH-21654: Basic Routing Implementation Plan

## Overview

This plan details the implementation of single page application routing features for deephaven.ui, enabling Python components to read URL state and trigger client-side navigation.

---

# Part 1: Specification

## Features Summary

| Feature              | Type                  | Description                                     |
| -------------------- | --------------------- | ----------------------------------------------- |
| `use_path`           | Hook                  | Returns current path and a setter               |
| `use_search_params`  | Hook                  | Returns all search params and a setter          |
| `use_search_param`   | Hook                  | Returns a single search param and a setter      |
| `use_navigate`       | Hook                  | Returns current URL state and navigate function |
| `use_url_components` | Hook                  | Returns full URL split into components          |
| `ui.link`            | Component (extension) | Renders clickable navigation element            |

---

## 1. `use_path` Hook

Returns the current URL path and a setter to navigate to a new path.

### API

```python
def use_path(absolute: bool = False) -> tuple[str, Callable[[str], None]]:
    """
    Get the current URL path and a setter to navigate to a new path.
    The setter uses absolute to determine if the specified path is absolute or relative automatically.

    Args:
        absolute: If True, returns the full absolute path.
                  If False (default), returns the path relative to the current widget.

    Returns:
        A tuple of (path, set_path):
        - path: The current path as a string.
        - set_path: A function that navigates to the given path.
    """
```

### Arguments

| Argument   | Type   | Default | Description                           |
| ---------- | ------ | ------- | ------------------------------------- |
| `absolute` | `bool` | `False` | Return absolute path vs relative path |

### Example

```python
@ui.component
def my_component():
    path, set_path = ui.use_path()

    def handle_press():
        set_path("/dashboard")

    return ui.flex(
        ui.text(f"Current path: {path}"),
        ui.button("Go to dashboard", on_press=handle_press),
    )
```

---

## 2. `use_search_params` Hook

Returns search parameters as a dictionary and a setter to update them.

### API

```python
def use_search_params() -> tuple[
    dict[str, list[str]], Callable[[str | SearchParams], None]
]:
    """
    Get the URL search parameters and a setter to replace them.

    Returns:
        A tuple of (params, set_search_params):
        - params: A dictionary mapping parameter names to lists of values.
        - set_search_params: A function that replaces all search parameters.
          Accepts a query string ("foo=bar") or a SearchParams dict.
          Pass "" or {} to clear all search params.
    """
```

### Arguments

None.

### Example

```python
@ui.component
def search_page():
    params, set_search_params = ui.use_search_params()
    query = params.get("q", [""])
    page = params.get("page", ["1"])
    tags = params.get("tag", [])

    def apply_filter():
        set_search_params({"q": "hello", "page": "1", "tag": ["python", "java"]})

    def clear_all():
        set_search_params("")

    return ui.flex(
        ui.text(f"Searching: {query}, page {page}, tags {tags}"),
        ui.button("Apply filter", on_press=apply_filter),
        ui.button("Clear", on_press=clear_all),
    )
```

---

## 3. `use_search_param` Hook

Returns a single search parameter's value and a setter. The type of `default` determines the return type — pass `None` (the default) to get `str | None` back, or pass a `list[str]` default to always get a `list[str]` back.

When `default` is `None`:

- If the key is **absent** from the URL → returns `None`
- If the key is **present with no value** (e.g. `/path?foo`) → returns `""`
- If the key is **present with a value** (e.g. `/path?foo=bar`) → returns `"bar"` (last value wins for multi-value keys)

### API

```python
@overload
def use_search_param(
    key: str, default: None = None
) -> tuple[str | None, Callable[[str | None], None]]:
    ...


@overload
def use_search_param(
    key: str, default: list[str]
) -> tuple[list[str], Callable[[list[str]], None]]:
    ...


def use_search_param(
    key: str,
    default: None | list[str] = None,
) -> tuple[str | None, Callable[[str | None], None]] | tuple[
    list[str], Callable[[list[str]], None]
]:
    """
    Get a single URL search parameter by key and a setter to update it.

    The return type depends on `default`:
    - None default (default): returns the last value for the key as a str,
      '' if the key is present with no value (e.g. ?foo),
      or None if the key is absent.
    - list[str] default: returns all values for the key as a list[str],
      or `default` if the key is absent.

    Args:
        key: The search parameter name to look up.
        default: The value to return if the key is absent. Also determines
                 the return type. Defaults to None.

    Returns:
        A tuple of (value, set_value):
        - value: str | None if default is None, list[str] if default is list[str].
        - set_value: A function that sets this search parameter's value.
          Pass None (when default is None) to remove the parameter.
    """
```

### Arguments

| Argument  | Type                | Default | Description                                       |
| --------- | ------------------- | ------- | ------------------------------------------------- |
| `key`     | `str`               | —       | The search parameter name                         |
| `default` | `None \| list[str]` | `None`  | Returned if key is absent; determines return type |

### Example

```python
@ui.component
def tag_filter():
    # None default → returns str | None
    page, set_page = ui.use_search_param(
        "page"
    )  # None if absent, "" if ?page, "2" if ?page=2
    sort, set_sort = ui.use_search_param("sort")  # None if absent

    # list[str] default → always returns list[str]
    tags, set_tags = ui.use_search_param("tag", [])  # [] or ["python", "java"]

    def next_page():
        set_page(str(int(page or "0") + 1))

    def clear_page():
        set_page(None)  # Removes ?page from URL

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

## 4. `use_navigate` Hook

Returns the current URL state as a `NavigationTarget` and a function to trigger navigation.

### API

```python
def use_navigate() -> tuple[NavigationTarget, Callable[..., None]]:
    """
    Get the current URL state and a function to navigate.

    Returns:
        A tuple of (location, navigate):
        - location: A NavigationTarget dict with 'path', 'search_params', 'fragment', and 'absolute'
        - navigate: A function to trigger navigation. Signature:
            navigate(
                path: str | None = None,
                search_params: str | SearchParams | None = None,
                fragment: str | None = None,
                absolute: bool = False,
            ) -> None
    """
```

### `navigate` Function Arguments

| Argument        | Type                          | Default | Description                                                                                                                                                                                                                                         |
| --------------- | ----------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`          | `str \| None`                 | `None`  | Target path. May include inline search params and fragment (e.g. `"/dashboard?tab=1#section"`). Leading `/` optional; preserves current path if omitted. Explicit `search_params` or `fragment` args override any inline values parsed from `path`. |
| `search_params` | `str \| SearchParams \| None` | `None`  | Query string or `SearchParams` dict; preserves if omitted, removes if empty (`""` or `{}`); list values repeat the key                                                                                                                              |
| `fragment`      | `str \| None`                 | `None`  | URL fragment (leading `#` optional); preserves if omitted, removes if empty (`""`)                                                                                                                                                                  |
| `absolute`      | `bool`                        | `False` | Use absolute path navigation                                                                                                                                                                                                                        |

### Notes

- At least one of `path`, `search_params`, or `fragment` must be provided to `navigate`; passing none raises a `ValueError`. The values not provided are preserved (e.g. if `path` is omitted, the current path is unchanged).
- **Inline `path` is parsed first**: If `path` contains inline search params or fragment (e.g. `"/page?foo=bar#section"`), they are extracted first. Any explicitly provided `search_params` or `fragment` arguments then override the inline values parsed from `path`.
- Leading `/` in `path` is optional—`"dashboard"` and `"/dashboard"` are equivalent. An empty string is not valid; use `"/"` for the root.
- Leading `?` in `search_params` string form is optional.
- Leading `#` in `fragment` is optional.
- **Empty values clear the URL component**: Passing `search_params=""` or `search_params={}` removes all search parameters from the URL. Passing `fragment=""` removes the URL fragment.
- **Multi-value params**: Pass a list as a dict value to repeat a key — `{"tag": ["python", "java"]}` serialises to `?tag=python&tag=java`.

### Example

```python
@ui.component
def login_form():
    location, navigate = ui.use_navigate()

    def handle_login():
        # Navigate to a new path
        navigate(
            "/dashboard", search_params={"welcome": "true"}
        )  # explicit search_params overrides any inline

    def scroll_to_section():
        # Scroll to a fragment on the current page (no path change)
        navigate(fragment="section-2")

    def filter_by_tags():
        # Multi-value search params
        navigate(search_params={"tag": ["python", "java"]})

    def clear_search_params():
        # Clear all search parameters from the URL
        navigate(search_params="")

    def clear_fragment():
        # Clear the fragment from the URL
        navigate(fragment="")

    return ui.flex(
        ui.text(f"Current location: {location['path']}"),
        ui.button("Login", on_press=handle_login),
        ui.button("Jump to section", on_press=scroll_to_section),
        ui.button("Filter by tags", on_press=filter_by_tags),
        ui.button("Clear search", on_press=clear_search_params),
        ui.button("Clear fragment", on_press=clear_fragment),
    )
```

---

## 5. `use_url_components` Hook

Returns the current URL split into components using `urllib.parse.urlsplit`. This is mainly for advanced use cases where full URL access is needed. Other hooks are recommended for common routing tasks that focus on path and search parameters.

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

## 6. `ui.link` Component

Renders a clickable element that navigates on interaction. The new `to` prop accepts either a string (parsed for path, search, and fragment) or a `NavigationTarget` dict for explicit control. Used for SPA navigation within the app.

### Types

```python
class NavigationTarget(TypedDict, total=False):
    path: str  # The path to navigate to (`"/path"`)
    search_params: str | SearchParams  # Query string (`"?foo=bar"`) or SearchParams dict
    fragment: str  # URL fragment, e.g. `"section"` (leading `#` optional)
    absolute: bool  # If True, navigate to absolute path instead of relative path to this widget
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
            Either a plain string (parsed for path, search params,
            and fragment; always absolute=False), or a NavigationTarget dict with
            `path`, `search_params`, `fragment`, and `absolute`.
            `search_params` and `fragment` override any inline values in `path` within NavigationTarget.
        ... other props ...
    """
```

### Arguments

| Argument | Type                      | Default | Description     |
| -------- | ------------------------- | ------- | --------------- |
| `to`     | `str \| NavigationTarget` | `None`  | Target location |

### Notes

- When `to` is a plain `str`, it is parsed for path, search params, and fragment (e.g. `"/path?foo=bar#section"`). Navigation is always `absolute=False` in this form.
- `absolute=True` is only available via the dict form.

### Example

```python
@ui.component
def nav():
    return ui.flex(
        # Simple string form — path, search, and fragment all parsed from the string
        ui.link("Home", to="/"),
        ui.link("Search", to="/search?q=hello#results"),
        # Dict form for explicit control
        ui.link("Users", to={"path": "/users", "search_params": {"sort": "name"}}),
        ui.link(
            "Tags",
            to={"path": "/tags", "search_params": {"tag": ["python", "java"]}},
        ),
        ui.link("Settings", to={"path": "/settings", "fragment": "notifications"}),
        # Absolute navigation
        ui.link(
            "Other Dashboard",
            to={"path": "/other/dashboard/widget/path", "absolute": True},
        ),
    )
```

---

# Part 2: Implementation

## Architecture

### Data Flow

The frontend sends URL state to the backend via the widget state. The backend reads this state through hooks. For navigation, the backend sends an event to the frontend, which updates the URL and re-sends state.

```
┌─────────────┐    state (path, search)                ┌─────────────┐
│   Frontend  │ ─────────────────────────────────────► │   Backend   │
│  (Browser)  │                                        │  (Python)   │
│             │ ◄───────────────────────────────────── │             │
└─────────────┘    navigate event (path, params, etc)  └─────────────┘
```

---

## 1. `use_path` Implementation

### Backend (Python)

1. Add `_path`, `_absolute_path`, `_search_params`, and `_fragment` fields to `RenderContext`, populated from `__path`, `__absolutePath`, `__searchParams`, and `__fragment` keys in the incoming state dict.
2. Add `get_path()`, `get_absolute_path()`, `get_search_params()`, and `get_fragment()` accessors on `RenderContext`.
3. Create `hooks/use_path.py` that calls `get_context()` and returns a tuple of `(path, set_path)` where:
   - `path` is the appropriate path based on the `absolute` argument.
   - `set_path` is a callable that internally calls `use_navigate()`'s navigate function with the given path.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__path` (`window.location.pathname`), `__absolutePath` (`window.location.pathname`), and `__fragment` (`window.location.hash`).

---

## 2. `use_search_params` Implementation

### Backend (Python)

1. `_search_params` is already on `RenderContext` (added in step 1).
2. Create `hooks/use_search_params.py` that returns a tuple of `(params, set_search_params)` where:
   - `params` is `get_context().get_search_params()`.
   - `set_search_params` is a callable that internally calls `use_navigate()`'s navigate function with the given search params.
3. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__searchParams`, built by iterating `new URLSearchParams(window.location.search)` and grouping values by key: keys that appear once become a `string`, keys that appear multiple times become a `string[]`.

---

## 3. `use_search_param` Implementation

### Backend (Python)

1. Create `hooks/use_search_param.py`.
2. Implement with overloads: look up `key` in `get_context().get_search_params()`.
   - If absent, return `default` (`None` or the provided `list[str]`).
   - If `default` is `None`: coerce to `str` — return the last element if the value is `list[str]`, otherwise return the value directly (including `""` for present-but-empty keys like `?foo`).
   - If `default` is a `list[str]`: coerce to `list[str]` — wrap in a list if the value is a `str`, otherwise return as-is.
3. Return a tuple of `(value, set_value)` where `set_value` is a callable that updates this specific search parameter via `use_navigate()`'s navigate function. When `set_value(None)` is called (only valid for `None` default), the parameter is removed from the URL.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

No frontend changes — reads from the same `__searchParams` state as `use_search_params`.

---

## 4. `use_navigate` Implementation

### Backend (Python)

1. Create `hooks/use_navigate.py`.
2. Define private normalisation helpers:
   - `_normalise_path`: prepends `/` if missing; returns `None` for `None` (preserve); raises `ValueError` for empty string. If the path contains inline search params or fragment, extracts them (using `urlsplit`) before normalising — these are then used as fallback values, overridden by any explicitly provided `search_params` or `fragment` args.
   - `_normalise_search_params`: returns `None` for `None` (preserve); returns `{}` for `""` or `{}` (clear); otherwise parses query string or `SearchParams` dict into a serialisable form where list values repeat the key.
   - `_normalise_fragment`: returns `None` for `None` (preserve); returns `""` for `""` (clear); otherwise strips leading `#`.
3. Implement `use_navigate()` as a hook that returns a tuple of `(location, navigate)` where:
   - `location` is a `NavigationTarget` dict built from `get_context()` with keys `path`, `search_params`, `fragment`, and `absolute`.
   - `navigate` is a callable that validates at least one arg is not `None`, normalises the args (merging inline values from `path` with explicit `search_params`/`fragment`), then calls `use_send_event()` to emit a `"navigate.event"` payload with the normalised fields.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

1. In `WidgetHandler.tsx`, add a `"navigate.event"` case to the `METHOD_EVENT` switch block.
2. Implement a `handleNavigate` handler that constructs a new URL respecting the `null`-means-preserve / empty-means-clear semantics:
   - `null` path → keep `window.location.pathname`
   - `null` params → keep `window.location.search`; `{}` → clear search; when building the URL from params, iterate entries: for `string[]` values call `searchParams.append(key, val)` for each, for `string` values call `searchParams.set(key, val)`.
   - `null` fragment → keep `window.location.hash`; `""` → clear fragment
   - Use `window.location.href` for `absolute: true`; otherwise `window.history.pushState` followed by a re-send of current URL state via `sendSetState`.
3. Ensure that the URL update triggers the appropriate re-render, sending an update to the backend.

---

## 5. `use_url_components` Implementation

### Backend (Python)

1. Add `_href` field to `RenderContext`, populated from `__href` in the incoming state dict.
2. Add a `get_href()` accessor on `RenderContext`.
3. Create `hooks/use_url_components.py` that calls `urlsplit(get_context().get_href())` and returns the resulting `SplitResult`.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, include `__href: window.location.href` in the state object passed to `sendSetState` on initialization (and on subsequent URL updates alongside the other URL state fields).

---

## 6. `ui.link` Implementation

### Backend (Python)

Extend `components/link.py`:

1. Add `to: str | NavigationTarget | None = None` parameter alongside the existing `href`, `on_press`, and layout props.
2. Wrap the caller-supplied `on_press` in an internal handler that, when `to` is set, parses it (using `urllib.parse.urlsplit` for string form, or direct dict access for `NavigationTarget`) and calls a function that shares logic with `use_navigate()`'s `navigate` to emit a `"navigate.event"` with the appropriate fields.
3. When `to` is provided and `href` is not, compute a fallback `href` string from `to` for accessibility (passing it to `component_element` as the `href` prop).
4. Pass everything through to `component_element("Link", ...)` as usual.

### Frontend (TypeScript)

No frontend changes needed — the existing Spectrum `Link` component renders the `href` and fires the `on_press` callback to the backend.

---

## File Changes Summary

### New Files

| File                          | Description                |
| ----------------------------- | -------------------------- |
| `hooks/use_path.py`           | Path hook                  |
| `hooks/use_search_params.py`  | Search params (all) hook   |
| `hooks/use_search_param.py`   | Search param (single) hook |
| `hooks/use_navigate.py`       | Navigate hook              |
| `hooks/use_url_components.py` | URL components hook        |

### Modified Files

| File                                  | Changes                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `hooks/__init__.py`                   | Export new hooks                                                      |
| `components/__init__.py`              | Modify link                                                           |
| `components/link.py`                  | Add `to` prop and routing logic (uses `use_navigate`)                 |
| `_internal/RenderContext.py`          | Add `_path`, `_absolute_path`, `_search_params`, `_fragment`, `_href` |
| `src/js/src/widget/WidgetHandler.tsx` | Add URL state to initial `sendSetState`, handle `navigate.event`      |

---

## Testing Considerations

1. **Unit tests** for each hook reading correct context values and returning correct tuple shape
2. **Unit tests** for navigate serializing correct event payload
3. **Unit tests** for `use_search_param` returning `None` when key absent, `""` when key present without value
4. **E2E tests** for:
   - Link click triggers navigation
   - URL state reflected in hooks after navigation
   - `absolute=True` behavior
   - Setter functions from each hook correctly update URL state

## Documentation

1. Update API docs for new hooks and functions

## Future Routing Work

Future routing work could build on the foundation laid out in this plan. Some possible directions include:

### `use_params` with a Pattern Argument

A simple way to get route params without a full router is to build a hook with a `pattern` argument, similar to `useParams` found in similar libraries but requiring the user to provide the pattern each time.

```python
@ui.component
def user_post_view():
    path, _ = ui.use_path()
    # A simple pattern matcher that extracts params from the path
    params = match_path("/users/:userId/posts/:postId", path)
    # params == {"userId": "123", "postId": "456"} or None

    if params is None:
        return ui.text("Not found")

    return ui.text(f"User {params['userId']}, Post {params['postId']}")
```

This approach does not scale and will not work for complex routing scenarios, but is a minimal way to get route params working without building a full router. This could be used as a workaround for a user, but would not be an official API.

### Router with Context

Context or some other form of state management can provide route params to child components. Full consideration for context management is outside the scope of this plan, but would enable a router component or hook to provide params to nested components.

There are many options for router structure, but for illustration assume a simple `ui.router` component that provides route matching and param extraction:

```python
@ui.component
def user_post_view():
    params, set_params = ui.use_params()
    # params == {"userId": "123", "postId": "456"}

    user_id = params["userId"]
    post_id = params["postId"]
    return ui.text(f"User {user_id}, Post {post_id}")


@ui.component
def app():
    return ui.router(
        ui.route("/users/:userId/posts/:postId", element=user_post_view()),
        ui.route("/users/:userId", element=...),
        ui.route("/", element=...),
    )
```

This approach is cohesive with the rest of the plan but requires substantial additional work.
