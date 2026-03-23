# create_global_state

`create_global_state` is a factory function that creates a shared state hook. Unlike `use_state`, which creates state local to a single component, the state created by `create_global_state` is shared across all components that call the returned hook. When any component updates the shared state, all other components using the same hook will re-render with the new value.

Call `create_global_state` at module level (outside of any component) to create a store. Then call the returned hook inside `@ui.component` functions to subscribe to the shared state.

When all components using a shared store unmount, the state resets to the initial value.

## Example

```python
from deephaven import ui

# Create the shared state at module level
use_shared_counter = ui.create_global_state(0)


@ui.component
def ui_counter_controls():
    count, set_count = use_shared_counter()
    return ui.flex(
        ui.button(f"Count: {count}", on_press=lambda: set_count(count + 1)),
        ui.button("Reset", on_press=lambda: set_count(0)),
    )


@ui.component
def ui_counter_display():
    count, _ = use_shared_counter()
    return ui.text(f"The shared count is: {count}")


controls = ui_counter_controls()
display = ui_counter_display()
```

In this example, clicking the button in `ui_counter_controls` will update the count displayed in both `ui_counter_controls` and `ui_counter_display`.

## Recommendations

1. **Create stores at module level**: Call `create_global_state` at module level, not inside a component. The returned hook is then used inside components.
2. **Naming convention**: Name the returned hook starting with `use_`, e.g. `use_shared_counter = ui.create_global_state(0)`. This makes it clear that it follows hook rules.
3. **Keep state serializable**: As with `use_state`, use simple serializable values (numbers, strings, lists, dicts) when possible for best compatibility.
4. **Prefer `create_user_state` for user-specific data**: If the state should be independent per user (e.g., user preferences or user-specific selections), use [`create_user_state`](create_user_state.md) instead.

## Using updater functions

Like `use_state`, the setter function supports updater functions for state that depends on the previous value:

```python
from deephaven import ui

use_shared_counter = ui.create_global_state(0)


@ui.component
def ui_increment_buttons():
    count, set_count = use_shared_counter()

    def increase_by(n):
        for _ in range(n):
            set_count(lambda prev: prev + 1)

    return ui.flex(
        ui.button("+1", on_press=lambda: increase_by(1)),
        ui.button("+10", on_press=lambda: increase_by(10)),
        ui.text(f"Count: {count}"),
    )


buttons = ui_increment_buttons()
```

When an updater function is passed, it is resolved once using the current store value and the resolved value is broadcast to all subscribers. This ensures all components see the same value regardless of timing.

## Shared filter example

A common use case is sharing filter criteria across multiple views:

```python
from deephaven import ui, empty_table

use_filter_value = ui.create_global_state(50)

t = empty_table(1000).update(["x = i", "y = Math.sin(i / 10.0) * 100"])


@ui.component
def ui_filter_slider():
    threshold, set_threshold = use_filter_value()
    return ui.slider(
        label=f"Filter threshold: {threshold}",
        value=threshold,
        on_change=set_threshold,
        min_value=0,
        max_value=100,
    )


@ui.component
def ui_filtered_table():
    threshold, _ = use_filter_value()
    filtered = ui.use_memo(lambda: t.where(f"y > {threshold}"), [threshold])
    return filtered


slider = ui_filter_slider()
filtered = ui_filtered_table()
```

## Color theme toggler example

```python
from deephaven import ui

use_theme = ui.create_global_state("light")


@ui.component
def ui_theme_toggle():
    theme, set_theme = use_theme()
    return ui.switch(
        "Dark mode",
        is_selected=theme == "dark",
        on_change=lambda is_dark: set_theme("dark" if is_dark else "light"),
    )


@ui.component
def ui_themed_card():
    theme, _ = use_theme()
    bg = "#1a1a2e" if theme == "dark" else "#ffffff"
    fg = "#ffffff" if theme == "dark" else "#000000"
    return ui.view(
        ui.text(f"Current theme: {theme}"),
        background_color=bg,
        color=fg,
        padding="size-200",
    )


toggle = ui_theme_toggle()
card = ui_themed_card()
```

## Cleanup behavior

When all components that subscribe to a shared store unmount (e.g., all panels using the hook are closed), the store automatically resets to the initial value. This prevents stale state from persisting across sessions.

If at least one subscriber remains active, the state is preserved.

## Thread safety

`create_global_state` is thread-safe. Multiple components can safely read and update the shared state concurrently. State updates are serialized internally using a lock.

## API reference

```python skip-test
use_hook = ui.create_global_state(initial_value)
```

###### Parameters

| Parameter       | Type | Description                                                 |
| --------------- | ---- | ----------------------------------------------------------- |
| `initial_value` | `T`  | The initial value for the shared state. Defaults to `None`. |

###### Returns

| Type                                                                | Description                                                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Callable[[], tuple[T, Callable[[T \| UpdaterFunction[T]], None]]]` | A hook function. When called inside a component, returns a `(value, set_value)` tuple matching `use_state`. |
