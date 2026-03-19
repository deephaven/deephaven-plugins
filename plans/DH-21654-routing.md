# DH-21654: Basic Routing Implementation Plan

## Overview

This plan details the implementation of single page application routing features for deephaven.ui, enabling Python components to read URL state and trigger client-side navigation.

---

# Part 1: Specification

## Features Summary

| Feature             | Type                  | Description                               |
| ------------------- | --------------------- | ----------------------------------------- |
| `use_pathname`      | Hook                  | Returns current pathname                  |
| `use_search_params` | Hook                  | Returns all search params as a dictionary |
| `use_search_param`  | Hook                  | Returns a single search param by key      |
| `ui.navigate`       | Function              | Triggers navigation to a new path         |
| `ui.link`           | Component (extension) | Renders clickable navigation element      |

---

## 1. `use_pathname` Hook

Returns the current URL pathname.

### API

```python
def use_pathname(full: bool = False) -> str:
    """
    Get the current URL pathname.

    Args:
        full: If True, returns the full pathname.
              If False (default), returns the abstracted path relative to the current widget.

    Returns:
        The current pathname as a string.
    """
```

### Arguments

| Argument | Type   | Default | Description                             |
| -------- | ------ | ------- | --------------------------------------- |
| `full`   | `bool` | `False` | Return full pathname vs abstracted path |

### Example

```python
@ui.component
def my_component():
    path = ui.use_pathname()
    return ui.text(f"Current path: {path}")
```

---

## 2. `use_search_params` Hook

Returns search parameters as a dictionary.

### API

```python
def use_search_params() -> dict[str, list[str]]:
    """
    Get the URL search parameters.

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
    params = ui.use_search_params()
    query = params.get("q", [""])
    page = params.get("page", ["1"])
    tags = params.get("tag", [])
    return ui.text(f"Searching: {query}, page {page}, tags {tags}")
```

---

## 3. `use_search_param` Hook

Returns a single search parameter's value. The type of `default` determines the return type — pass a `str` default to always get a `str` back (last value wins for multi-value keys), or pass a `list[str]` default to always get a `list[str]` back.

### API

```python
@overload
def use_search_param(key: str, default: str = "") -> str:
    ...


@overload
def use_search_param(key: str, default: list[str]) -> list[str]:
    ...


def use_search_param(
    key: str,
    default: str | list[str] = "",
) -> str | list[str]:
    """
    Get a single URL search parameter by key.

    The return type matches the type of `default`:
    - str default (default): returns the last value for the key as a str,
      or `default` if the key is absent.
    - list[str] default: returns all values for the key as a list[str],
      or `default` if the key is absent.

    Args:
        key: The search parameter name to look up.
        default: The value to return if the key is absent. Also determines
                 the return type. Defaults to "".

    Returns:
        str if default is str, list[str] if default is list[str].
    """
```

### Arguments

| Argument  | Type               | Default | Description                                       |
| --------- | ------------------ | ------- | ------------------------------------------------- |
| `key`     | `str`              | —       | The search parameter name                         |
| `default` | `str \| list[str]` | `""`    | Returned if key is absent; determines return type |

### Example

```python
@ui.component
def tag_filter():
    # str default → always returns str (last value wins for multi-value)
    page = ui.use_search_param("page")  # "" or current value
    sort = ui.use_search_param("sort", "name")  # "name" or current value

    # list[str] default → always returns list[str]
    tags = ui.use_search_param("tag", [])  # [] or ["python", "java"]

    return ui.text(f"Page {page}, sort {sort}, tags {tags}")
```

---

## 4. `ui.navigate` Function

Triggers navigation to a new path, updates search parameters, or scrolls to a fragment. Can be used directly in event handlers or other logic.

### API

```python
def navigate(
    pathname: str | None = None,
    search_params: str | SearchParams | None = None,
    fragment: str | None = None,
    full: bool = False,
) -> None:
    """
    Navigate to a new path, update search parameters, or scroll to a fragment.

    At least one of `pathname`, `search_params`, or `fragment` must be provided.

    Args:
        pathname: The pathname to navigate to. Leading "/" is optional except for
            the root path, which must be "/" (empty string is not allowed).
            If omitted, the current pathname is preserved.
        search_params: Optional search parameters. Accepts a query string
            ("?foo=bar" or "foo=bar") or a SearchParams dict. Dict values may be
            a str for single-value params or a list[str] for multi-value params
            (e.g. {"tag": ["python", "java"]} → "?tag=python&tag=java").
            Leading "?" is optional. Can be used alone to update
            search params without changing pathname. If omitted,
            current search params are preserved. Pass "" or {} to
            clear all search params.
        fragment: Optional URL fragment. Leading "#" is optional.
            Can be provided alone to scroll to a fragment on the current page.
            If omitted, current fragment is preserved. Pass "" to clear the
            fragment.
        full: If True, navigates to full path (such as a different dashboard).
            If False (default), navigates relative to the current widget.
    """
```

### Arguments

| Argument        | Type                          | Default | Description                                                                                                            |
| --------------- | ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pathname`      | `str \| None`                 | `None`  | Target pathname (leading `/` optional); preserves current pathname if omitted                                          |
| `search_params` | `str \| SearchParams \| None` | `None`  | Query string or `SearchParams` dict; preserves if omitted, removes if empty (`""` or `{}`); list values repeat the key |
| `fragment`      | `str \| None`                 | `None`  | URL fragment (leading `#` optional); preserves if omitted, removes if empty (`""`)                                     |
| `full`          | `bool`                        | `False` | Use full path navigation                                                                                               |

### Notes

- At least one of `pathname`, `search_params`, or `fragment` must be provided; passing none raises a `ValueError`. The values not provided are preserved (e.g. if `pathname` is omitted, the current pathname is unchanged).
- Leading `/` in `pathname` is optional—`"dashboard"` and `"/dashboard"` are equivalent. An empty string is not valid; use `"/"` for the root.
- Leading `?` in `search_params` string form is optional.
- Leading `#` in `fragment` is optional.
- **Empty values clear the URL component**: Passing `search_params=""` or `search_params={}` removes all search parameters from the URL. Passing `fragment=""` removes the URL fragment.
- **Multi-value params**: Pass a list as a dict value to repeat a key — `{"tag": ["python", "java"]}` serialises to `?tag=python&tag=java`.

### Example

```python
@ui.component
def login_form():
    def handle_login():
        # Navigate to a new path
        ui.navigate("/dashboard", search_params={"welcome": "true"})

    def scroll_to_section():
        # Scroll to a fragment on the current page (no path change)
        ui.navigate(fragment="section-2")

    def filter_by_tags():
        # Multi-value search params
        ui.navigate(search_params={"tag": ["python", "java"]})

    def clear_search_params():
        # Clear all search parameters from the URL
        ui.navigate(search_params="")

    def clear_fragment():
        # Clear the fragment from the URL
        ui.navigate(fragment="")

    return ui.flex(
        ui.button("Login", on_press=handle_login),
        ui.button("Jump to section", on_press=scroll_to_section),
        ui.button("Filter by tags", on_press=filter_by_tags),
        ui.button("Clear search", on_press=clear_search_params),
        ui.button("Clear fragment", on_press=clear_fragment),
    )
```

---

## 5. `ui.link` Component

Renders a clickable element that navigates on interaction. The new `to` prop accepts either a string (parsed for pathname, search, and fragment) or a `NavigationTarget` dict for explicit control. Used for SPA navigation within the app.

### Types

```python
class NavigationTarget(TypedDict, total=False):
    pathname: str  # The path to navigate to (`"/path"`)
    search_params: str | SearchParams  # Query string (`"?foo=bar"`) or SearchParams dict
    fragment: str  # URL fragment, e.g. `"section"` (leading `#` optional)
    full: bool  # If True, navigate to full path instead of relative path to this widget
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
            Either a plain string (parsed for pathname, search params,
            and fragment; always full=False), or a NavigationTarget dict with
            `pathname`, `search_params`, `fragment`, and `full`.
        ... other props ...
    """
```

### Arguments

| Argument | Type                      | Default | Description     |
| -------- | ------------------------- | ------- | --------------- |
| `to`     | `str \| NavigationTarget` | `None`  | Target location |

### Notes

- When `to` is a plain `str`, it is parsed for pathname, search params, and fragment (e.g. `"/path?foo=bar#section"`). Navigation is always `full=False` in this form.
- `full=True` is only available via the dict form.

### Example

```python
@ui.component
def nav():
    return ui.flex(
        # Simple string form — pathname, search, and fragment all parsed from the string
        ui.link("Home", to="/"),
        ui.link("Search", to="/search?q=hello#results"),
        # Dict form for explicit control
        ui.link("Users", to={"pathname": "/users", "search_params": {"sort": "name"}}),
        ui.link(
            "Tags",
            to={"pathname": "/tags", "search_params": {"tag": ["python", "java"]}},
        ),
        ui.link("Settings", to={"pathname": "/settings", "fragment": "notifications"}),
        # Full navigation
        ui.link(
            "Other Dashboard",
            to={"pathname": "/other/dashboard/widget/path", "full": True},
        ),
    )
```

---

# Part 2: Implementation

## Architecture

### Data Flow

The frontend sends URL state to the backend via the widget state. The backend reads this state through hooks. For navigation, the backend sends an event to the frontend, which updates the URL and re-sends state.

```
┌─────────────┐    state (pathname, search)            ┌─────────────┐
│   Frontend  │ ─────────────────────────────────────► │   Backend   │
│  (Browser)  │                                        │  (Python)   │
│             │ ◄───────────────────────────────────── │             │
└─────────────┘    navigate event (path, params, etc)  └─────────────┘
```

---

## 1. `use_pathname` Implementation

### Backend (Python)

1. Add `_pathname` and `_full_pathname` fields to `RenderContext`, populated from `__pathname` and `__fullPathname` keys in the incoming state dict.
2. Add `get_pathname()` and `get_full_pathname()` accessors on `RenderContext`.
3. Create `hooks/use_pathname.py` that calls `get_context()` and returns the appropriate field based on the `full` argument.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__pathname` (`window.location.pathname`) and `__fullPathname` (`window.location.pathname`).

---

## 2. `use_search_params` Implementation

### Backend (Python)

1. Add `_search_params: SearchParams` to `RenderContext`, populated from `__searchParams` in state.
2. Add a `get_search_params()` accessor on `RenderContext`.
3. Create `hooks/use_search_params.py` that calls `get_context().get_search_params()`.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__searchParams`, built by iterating `new URLSearchParams(window.location.search)` and grouping values by key: keys that appear once become a `string`, keys that appear multiple times become a `string[]`.

---

## 3. `use_search_param` Implementation

### Backend (Python)

1. Create `hooks/use_search_param.py`.
2. Implement with overloads: look up `key` in `get_context().get_search_params()`.
   - If absent, return `default`.
   - If `default` is a `str`: coerce to `str` — return the last element if the value is `list[str]`, otherwise return the value directly.
   - If `default` is a `list[str]`: coerce to `list[str]` — wrap in a list if the value is a `str`, otherwise return as-is.
3. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

No frontend changes — reads from the same `__searchParams` state as `use_search_params`.

---

## 4. `ui.navigate` Implementation

### Backend (Python)

1. Create `components/navigate.py`.
2. Define private normalisation helpers:
   - `_normalise_pathname`: prepends `/` if missing; returns `None` for `None` (preserve); raises `ValueError` for empty string.
   - `_normalise_search_params`: returns `None` for `None` (preserve); returns `{}` for `""` or `{}` (clear); otherwise parses query string or `SearchParams` dict into a serialisable form where list values repeat the key.
   - `_normalise_fragment`: returns `None` for `None` (preserve); returns `""` for `""` (clear); otherwise strips leading `#`.
3. Implement `navigate()`: validate at least one arg is not `None`, then call `use_send_event()` and emit a `"navigate.event"` payload with the normalised fields.
4. Export from `components/__init__.py`.

### Frontend (TypeScript)

1. In `WidgetHandler.tsx`, add a `"navigate.event"` case to the `METHOD_EVENT` switch block.
2. Implement a `handleNavigate` handler that constructs a new URL respecting the `null`-means-preserve / empty-means-clear semantics:
   - `null` pathname → keep `window.location.pathname`
   - `null` params → keep `window.location.search`; `{}` → clear search; when building the URL from params, iterate entries: for `string[]` values call `searchParams.append(key, val)` for each, for `string` values call `searchParams.set(key, val)`.
   - `null` fragment → keep `window.location.hash`; `""` → clear fragment
   - Use `window.location.href` for `full: true`; otherwise `window.history.pushState` followed by a re-send of current URL state via `sendSetState`.
3. Ensure that the URL update triggers the appropriate re-render, sending an update to the backend.

---

## 5. `ui.link` Implementation

### Backend (Python)

Extend `components/link.py`:

1. Add `to: str | NavigationTarget | None = None` parameter alongside the existing `href`, `on_press`, and layout props.
2. Wrap the caller-supplied `on_press` in an internal handler that, when `to` is set, parses it (using `urllib.parse.urlsplit` for string form, or direct dict access for `NavigationTarget`) and calls `navigate()`.
3. When `to` is provided and `href` is not, compute a fallback `href` string from `to` for accessibility (passing it to `component_element` as the `href` prop).
4. Pass everything through to `component_element("Link", ...)` as usual.

### Frontend (TypeScript)

No frontend changes needed — the existing Spectrum `Link` component renders the `href` and fires the `on_press` callback to the backend.

---

## File Changes Summary

### New Files

| File                         | Description                |
| ---------------------------- | -------------------------- |
| `hooks/use_pathname.py`      | Pathname hook              |
| `hooks/use_search_params.py` | Search params (all) hook   |
| `hooks/use_search_param.py`  | Search param (single) hook |
| `components/navigate.py`     | Navigate function          |

### Modified Files

| File                                  | Changes                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| `hooks/__init__.py`                   | Export new hooks                                                 |
| `components/__init__.py`              | Export navigate, modify link                                     |
| `components/link.py`                  | Add `to` prop and routing logic                                  |
| `_internal/RenderContext.py`          | Add `_pathname`, `_full_pathname`, `_search_params`              |
| `src/js/src/widget/WidgetHandler.tsx` | Add URL state to initial `sendSetState`, handle `navigate.event` |

---

## Testing Considerations

1. **Unit tests** for each hook reading correct context values
2. **Unit tests** for navigate serializing correct event payload
3. **E2E tests** for:
   - Link click triggers navigation
   - URL state reflected in hooks after navigation
   - `full=True` behavior

## Documentation

1. Update API docs for new hooks and functions
