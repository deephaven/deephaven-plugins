from deephaven import ui

# Global shared counter - all components and users share the same value
use_global_counter = ui.create_global_state(0)

# Global shared state using a callable initializer
use_global_list = ui.create_global_state(lambda: ["initial"])


@ui.component
def ui_shared_state_component():
    """Single component that uses the shared state hook twice
    to demonstrate that state changes sync between hook calls."""
    count, set_count = use_global_counter()
    # Second hook call in the same component to demonstrate sharing
    count2, _ = use_global_counter()

    items, set_items = use_global_list()

    return ui.flex(
        ui.action_button(f"Count: {count}", on_press=lambda _: set_count(count + 1)),
        ui.action_button("Reset", on_press=lambda _: set_count(0)),
        ui.text(f"Mirror: {count2}"),
        ui.text(f"List: {', '.join(items)}"),
        ui.action_button(
            "Add item",
            on_press=lambda _: set_items(lambda prev: prev + [f"item{len(prev)}"]),
        ),
        direction="column",
    )


ui_shared_state = ui_shared_state_component()
