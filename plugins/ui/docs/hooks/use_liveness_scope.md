# use_liveness_scope

`use_liveness_scope` allows you to interact with the [liveness scope](https://deephaven.io/core/docs/conceptual/liveness-scope-concept/) to manage live objects within a component. Some functions that interact with a component will create live objects that need to be managed by the component to ensure they are kept active.

The primary use case is when creating tables outside the component's own function, and passing them as state for the component's next update. If the table is not kept alive by the component, it will be garbage collected and the component will not be able to update with the new data.

## Example

```python
from deephaven import ui, time_table


@ui.component
def ui_resetable_table():
    table, set_table = ui.use_state(lambda: time_table("PT1s"))
    handle_press = ui.use_liveness_scope(lambda _: set_table(time_table("PT1s")), [])
    return [
        ui.action_button(
            "Reset",
            on_press=handle_press,
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

## UI recommendations

1. **Avoid using `use_liveness_scope` unless necessary**: This is an advanced feature that should only be used when you need to manage the liveness of objects outside of the component's own function. Instead, derive a live component based on state rather than setting a live component within state.
2. **Use `use_liveness_scope` to manage live objects**: If you need to manage the liveness of objects created outside of the component's own function, use `use_liveness_scope` to ensure they are kept alive. For more information on liveness scopes and why they are needed, see the [liveness scope documentation](https://deephaven.io/core/docs/conceptual/liveness-scope-concept/).

## Refactoring to avoid liveness scope

In the above example, we could refactor the component to avoid using `use_liveness_scope` by deriving the table from state instead of setting it directly:

```python
from deephaven import ui, time_table


@ui.component
def ui_resetable_table():
    iteration, set_iteration = ui.use_state(0)
    table = ui.use_memo(lambda: time_table("PT1s"), [iteration])
    return [
        ui.action_button(
            "Reset",
            on_press=lambda: set_iteration(iteration + 1),
        ),
        table,
    ]


resetable_table = ui_resetable_table()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_liveness_scope
```
