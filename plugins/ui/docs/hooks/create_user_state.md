# create_user_state

`create_user_state` is a factory function that creates a shared state hook scoped to the current effective user. Like [`create_global_state`](create_global_state.md), the state is shared across all components that call the returned hook — but each user gets their own independent state. When User A updates a value, only User A's components re-render; User B's components remain unaffected.

Call `create_user_state` at module level (outside of any component) to create a store. Then call the returned hook inside `@ui.component` functions to subscribe.

When all of a user's components using a shared store unmount, that user's state resets to the initial value.

## Example

```python
from deephaven import ui

# Create user-scoped shared state at module level
use_user_name = ui.create_user_state("")


@ui.component
def ui_name_input():
    name, set_name = use_user_name()
    return ui.text_field(label="Your name", value=name, on_change=set_name)


@ui.component
def ui_greeting():
    name, _ = use_user_name()
    return ui.text(f"Hello, {name or 'stranger'}!")


name_input = ui_name_input()
greeting = ui_greeting()
```

In this example, each user sees their own name. If User A types "Alice", User B still sees "stranger" until they type their own name.

## Recommendations

1. **Create stores at module level**: Call `create_user_state` at module level, not inside a component. The returned hook is then used inside components.
2. **Naming convention**: Name the returned hook starting with `use_`, e.g. `use_user_preference = ui.create_user_state(default)`.
3. **Use for user-specific data**: Preferences, selections, UI state that should differ per user.
4. **Use `create_global_state` for shared data**: If you want all users to share the same value (e.g., a global configuration), use [`create_global_state`](create_global_state.md) instead.

## Community vs. Enterprise

On **Deephaven Enterprise**, `create_user_state` uses `deephaven_enterprise.auth_context.get_effective_user()` to identify the current user. Each user gets independent state.

On **Deephaven Community** (where `deephaven_enterprise` is not installed), all callers share a single anonymous state — effectively behaving the same as `create_global_state`. This allows you to write code that works in both environments without modification.

## User preferences example

A common use case is per-user UI preferences:

```python
from deephaven import ui, empty_table

use_page_size = ui.create_user_state(25)

t = empty_table(1000).update(["x = i", "y = Math.sin(i / 10.0) * 100"])


@ui.component
def ui_page_size_picker():
    page_size, set_page_size = use_page_size()
    return ui.picker(
        "10",
        "25",
        "50",
        "100",
        label="Rows per page",
        selected_key=str(page_size),
        on_selection_change=lambda key: set_page_size(int(key)),
    )


@ui.component
def ui_paged_table():
    page_size, _ = use_page_size()
    page, set_page = ui.use_state(0)
    paged = ui.use_memo(
        lambda: t.head(page_size * (page + 1)).tail(page_size),
        [page_size, page],
    )
    return ui.flex(
        paged,
        ui.flex(
            ui.button("Prev", on_press=lambda: set_page(lambda p: max(0, p - 1))),
            ui.text(f"Page {page + 1}"),
            ui.button("Next", on_press=lambda: set_page(lambda p: p + 1)),
            direction="row",
            gap="size-100",
        ),
        direction="column",
    )


picker = ui_page_size_picker()
table_view = ui_paged_table()
```

## Per-user selection tracking

```python
from deephaven import ui

use_selected_items = ui.create_user_state([])


@ui.component
def ui_item_list():
    selected, set_selected = use_selected_items()

    items = ["Alpha", "Beta", "Gamma", "Delta"]

    def toggle_item(item):
        if item in selected:
            set_selected([i for i in selected if i != item])
        else:
            set_selected(selected + [item])

    return ui.flex(
        *[
            ui.checkbox(
                item,
                is_selected=item in selected,
                on_change=lambda _, i=item: toggle_item(i),
            )
            for item in items
        ],
        direction="column",
    )


@ui.component
def ui_selection_summary():
    selected, _ = use_selected_items()
    if not selected:
        return ui.text("No items selected")
    return ui.text(f"Selected: {', '.join(selected)}")


item_list = ui_item_list()
summary = ui_selection_summary()
```

## Cleanup behavior

When all components for a given user unmount, that user's state resets to the initial value and the internal store for that user is cleaned up. This prevents stale state across sessions and avoids memory leaks when users disconnect.

## Thread safety

`create_user_state` is thread-safe. Multiple users' components can safely read and update their state concurrently.

## API reference

```python skip-test
use_hook = ui.create_user_state(initial_value)
```

###### Parameters

| Parameter       | Type | Description                                                             |
| --------------- | ---- | ----------------------------------------------------------------------- |
| `initial_value` | `T`  | The initial value for the user-scoped shared state. Defaults to `None`. |

###### Returns

| Type                                                                | Description                                                                                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Callable[[], tuple[T, Callable[[T \| UpdaterFunction[T]], None]]]` | A hook function. When called inside a component, returns a `(value, set_value)` tuple matching `use_state`. The state is scoped to the current effective user. |
