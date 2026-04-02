# create_user_state

`create_user_state` creates a shared state hook scoped to the current effective user. Like [`create_global_state`](create_global_state.md), the state is shared across all components that call the returned hook — but each user gets their own independent state. When User A updates a value, only User A's components re-render; User B's components remain unaffected.

Call `create_user_state` at module level (outside of any component) to create a store. Then call the returned hook inside `@ui.component` functions to subscribe.

When all of a user's components using a shared store unmount, that user's state resets to the initial value.

## Examples

### Basic example

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

### Per-user selection tracking

```python
from deephaven import ui

use_selected_items = ui.create_user_state([])


@ui.component
def ui_item_list():
    selected, set_selected = use_selected_items()

    return ui.list_view(
        ui.item("Alpha"),
        ui.item("Beta"),
        ui.item("Gamma"),
        ui.item("Delta"),
        aria_label="Items",
        selection_mode="MULTIPLE",
        selected_keys=selected,
        on_change=lambda keys: set_selected(list(keys)),
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

### Custom hooks

You can wrap the hook returned by `create_user_state` to build a custom hook with prepackaged behavior:

```python
from deephaven import ui

_use_messages = ui.create_user_state([])


def use_messages():
    """A custom hook that adds convenience methods on top of user-scoped state."""
    messages, set_messages = _use_messages()

    def add(text):
        set_messages(lambda prev: prev + [text])

    def clear():
        set_messages([])

    return messages, add, clear


@ui.component
def ui_message_input():
    text, set_text = ui.use_state("")
    _, add, _ = use_messages()

    def handle_add(_e):
        if text.strip():
            add(text.strip())
            set_text("")

    return ui.flex(
        ui.text_field(label="Message", value=text, on_change=set_text),
        ui.action_button("Send", on_press=handle_add),
        direction="row",
        gap="size-100",
        align_items="end",
    )


@ui.component
def ui_message_list():
    messages, _, clear = use_messages()
    return ui.flex(
        ui.list_view(
            *[ui.item(m) for m in messages],
            aria_label="Messages",
            selection_mode=None,
        )
        if messages
        else ui.text("No messages yet"),
        ui.action_button(
            f"Clear ({len(messages)})",
            on_press=lambda _e: clear(),
            is_disabled=len(messages) == 0,
        ),
        direction="column",
        gap="size-100",
    )


message_input = ui_message_input()
message_list = ui_message_list()
```

Components call `use_messages()` and get back `add` and `clear` functions instead of a raw setter. Each user's messages are independent — on Enterprise, User A and User B see different lists.

## Cleanup behavior

When all components for a given user unmount, that user's state resets to the initial value and the internal store for that user is cleaned up. This prevents stale state across sessions and avoids memory leaks when users disconnect.

## Thread safety

`create_user_state` is thread-safe. Multiple users' components can safely read and update their state concurrently.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.create_user_state
```
