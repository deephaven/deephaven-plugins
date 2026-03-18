# DH-21654: Basic Routing Implementation Plan

## Overview

This plan details the implementation of single page application routing features for deephaven.ui, enabling Python components to read URL state and trigger client-side navigation.

---

# Part 1: Specification

## Features Summary

| Feature             | Type                  | Description                          |
| ------------------- | --------------------- | ------------------------------------ |
| `use_pathname`      | Hook                  | Returns current pathname             |
| `use_search_params` | Hook                  | Returns search params as dictionary  |
| `ui.navigate`       | Function              | Triggers navigation to a new path    |
| `ui.link`           | Component (extension) | Renders clickable navigation element |

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
def use_search_params() -> Dict[str, str]:
    """
    Get the URL search parameters.

    Returns:
        A dictionary mapping parameter names to values.
    """
```

### Arguments

None.

### Example

```python
@ui.component
def search_page():
    params = ui.use_search_params()
    query = params.get("q", "")
    page = params.get("page", "1")
    return ui.text(f"Searching: {query}, page {page}")
```

---

## 3. `ui.navigate` Function

Triggers navigation to a new path, updates search parameters, or scrolls to an anchor. Can be used directly in event handlers or other logic.

### API

```python
def navigate(
    path: str | None = None,
    search_params: str | Dict[str, str] | None = None,
    anchor: str | None = None,
    full: bool = False,
) -> None:
    """
    Navigate to a new path, update search parameters, or scroll to an anchor.

    At least one of `path`, `search_params`, or `anchor` must be provided.

    Args:
        path: The pathname to navigate to. Leading "/" is optional except for
            the root path, which must be "/" (empty string is not allowed).
            If omitted, the current pathname is preserved.
        search_params: Optional search parameters. Accepts a query string
            ("?foo=bar" or "foo=bar") or a dict ({"foo": "bar"}).
            Leading "?" is optional. Can be used alone to update
            search params without changing path. If omitted,
            current search params are preserved. Pass "" or {} to
            clear all search params.
        anchor: Optional hash fragment. Leading "#" is optional.
            Can be provided alone to scroll to a section on the current page.
            If omitted, current anchor is preserved. Pass "" to clear the
            anchor.
        full: If True, navigates to full path (such as a different dashboard).
            If False (default), navigates relative to the current widget.
    """
```

### Arguments

| Argument        | Type                            | Default | Description                                                                                        |
| --------------- | ------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `path`          | `str \| None`                   | `None`  | Target pathname (leading `/` optional); preserves current path if omitted                          |
| `search_params` | `str \| Dict[str, str] \| None` | `None`  | Query string or dict (leading `?` optional); preserves if omitted, removes if empty (`""` or `{}`) |
| `anchor`        | `str \| None`                   | `None`  | Hash fragment (leading `#` optional); preserves if omitted, removes if empty (`""`)                |
| `full`          | `bool`                          | `False` | Use full path navigation                                                                           |

### Notes

- At least one of `path`, `search_params`, or `anchor` must be provided; passing none raises a `ValueError`. The values not provided are preserved (e.g. if `path` is omitted, the current path is unchanged).
- Leading `/` in `path` is optional—`"dashboard"` and `"/dashboard"` are equivalent. An empty string is not valid; use `"/"` for the root.
- Leading `?` in `search_params` string form is optional.
- Leading `#` in `anchor` is optional.
- **Empty values clear the URL component**: Passing `search_params=""` or `search_params={}` removes all search parameters from the URL. Passing `anchor=""` removes the hash fragment.

### Example

```python
@ui.component
def login_form():
    def handle_login():
        # Navigate to a new path
        ui.navigate("/dashboard", search_params={"welcome": "true"})

    def scroll_to_section():
        # Scroll to an anchor on the current page (no path change)
        ui.navigate(anchor="section-2")

    def clear_search_params():
        # Clear all search parameters from the URL
        ui.navigate(search_params="")

    def clear_anchor():
        # Clear the anchor/hash from the URL
        ui.navigate(anchor="")

    return ui.flex(
        ui.button("Login", on_press=handle_login),
        ui.button("Jump to section", on_press=scroll_to_section),
        ui.button("Clear search", on_press=clear_search_params),
        ui.button("Clear anchor", on_press=clear_anchor),
    )
```

---

## 4. `ui.link` Component

Renders a clickable element that navigates on interaction. The new `to` prop accepts either a string (parsed for pathname, search, and hash) or a `LinkTarget` dict for explicit control. Used for SPA navigation within the app.

### Types

```python
class LinkTarget(TypedDict, total=False):
    pathname: str  # The path to navigate to (`"/path"`)
    search_params: str | Dict[
        str, str
    ]  # Query string (`"?foo=bar"`) or dict ({"foo": "bar"})
    anchor: str  # Hash fragment, e.g. `"section"` (leading `#` optional)
    full: bool  # If True, navigate to full path instead of relative path to this widget
```

### API

```python
def link(
    # ... other props ...,
    to: str | LinkTarget = None,
    # ... other props ...,
) -> Element:
    """
    ... description of link component ...

    Args:
        ... other props ...
        to: The target location for single-page application navigation.
            Either a plain string (parsed for pathname, search params,
            and anchor; always full=False), or a LinkTarget dict with
            `pathname`, `search_params`, `anchor`, and `full`.
        ... other props ...
    """
```

### Arguments

| Argument    | Type                | Default    | Description                   |
| ----------- | ------------------- | ---------- | ----------------------------- |
| `*children` | `Any`               | (required) | Link content                  |
| `to`        | `str \| LinkTarget` | `None`     | Target location               |
| ...         | ...                 | ...        | Standard layout/styling props |

### `LinkTarget` Fields

| Field           | Type                    | Required | Description                          |
| --------------- | ----------------------- | -------- | ------------------------------------ |
| `pathname`      | `str`                   | One of   | The path to navigate to (`"/path"`)  |
| `search_params` | `str \| Dict[str, str]` | One of   | Query string (`"?foo=bar"`) or dict  |
| `anchor`        | `str`                   | One of   | Hash fragment (leading `#` optional) |
| `full`          | `bool`                  | No       | If `True`, navigate to full path     |

### Notes

- When `to` is a plain `str`, it is parsed for pathname, search params, and anchor (e.g. `"/path?foo=bar#section"`). Navigation is always `full=False` in this form.
- `full=True` is only available via the dict form.

### Example

```python
@ui.component
def nav():
    return ui.flex(
        # Simple string form — pathname, search, and hash all parsed from the string
        ui.link("Home", to="/"),
        ui.link("Search", to="/search?q=hello#results"),
        # Dict form for explicit control
        ui.link("Users", to={"pathname": "/users", "search_params": {"sort": "name"}}),
        ui.link("Settings", to={"pathname": "/settings", "anchor": "notifications"}),
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

1. Add `_search_params: Dict[str, str]` to `RenderContext`, populated from `__searchParams` in state.
2. Add a `get_search_params()` accessor on `RenderContext`.
3. Create `hooks/use_search_params.py` that calls `get_context().get_search_params()`.
4. Export from `hooks/__init__.py`.

### Frontend (TypeScript)

In `WidgetHandler.tsx`, augment the state object passed to `sendSetState` on initialization to include `__searchParams`, built by iterating `new URLSearchParams(window.location.search)` into a plain `Record<string, string>`.

---

## 3. `ui.navigate` Implementation

### Backend (Python)

1. Create `components/navigate.py`.
2. Define private normalisation helpers:
   - `_normalise_path`: prepends `/` if missing; returns `None` for `None` (preserve); raises `ValueError` for empty string.
   - `_normalise_search_params`: returns `None` for `None` (preserve); returns `{}` for `""` or `{}` (clear); otherwise parses query string into a dict.
   - `_normalise_anchor`: returns `None` for `None` (preserve); returns `""` for `""` (clear); otherwise strips leading `#`.
3. Implement `navigate()`: validate at least one arg is not `None`, then call `use_send_event()` and emit a `"navigate.event"` payload with the normalised fields.
4. Export from `components/__init__.py`.

### Frontend (TypeScript)

1. In `WidgetHandler.tsx`, add a `"navigate.event"` case to the `METHOD_EVENT` switch block.
2. Implement a `handleNavigate` handler that constructs a new URL respecting the `null`-means-preserve / empty-means-clear semantics:
   - `null` path → keep `window.location.pathname`
   - `null` params → keep `window.location.search`; `{}` → clear search
   - `null` anchor → keep `window.location.hash`; `""` → clear hash
   - Use `window.location.href` for `full: true`; otherwise `window.history.pushState` followed by a re-send of current URL state via `sendSetState`.
3. Ensure that the URL update triggers the appropriate re-render, sending an update to the backend.

---

## 4. `ui.link` Implementation

### Backend (Python)

Extend `components/link.py`:

1. Add `to: str | LinkTarget | None = None` parameter alongside the existing `href`, `on_press`, and layout props.
2. Wrap the caller-supplied `on_press` in an internal handler that, when `to` is set, parses it (using `urllib.parse.urlsplit` for string form, or direct dict access for `LinkTarget`) and calls `navigate()`.
3. When `to` is provided and `href` is not, compute a fallback `href` string from `to` for accessibility (passing it to `component_element` as the `href` prop).
4. Pass everything through to `component_element("Link", ...)` as usual.

### Frontend (TypeScript)

No frontend changes needed — the existing Spectrum `Link` component renders the `href` and fires the `on_press` callback to the backend.

---

## File Changes Summary

### New Files

| File                         | Description        |
| ---------------------------- | ------------------ |
| `hooks/use_pathname.py`      | Pathname hook      |
| `hooks/use_search_params.py` | Search params hook |
| `components/navigate.py`     | Navigate function  |

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
