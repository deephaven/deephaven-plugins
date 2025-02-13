# Share State Between Components

To synchronize the state of two components, lift the state up to their nearest common parent. Remove the state from both components, move it to the parent, and pass it down via props. This technique is known as lifting state up.

## Lift state up by example

In this example, a parent `accordion` component renders two separate `info` components:

- accordion
  - info
  - info

Each `info` component has a boolean `is_active` state that determines whether its content is visible.

Press the "Show" button for both panels:

```python
from deephaven import ui


@ui.component
def info(title, details):
    is_active, set_is_active = ui.use_state(False)

    return [
        ui.heading(title, level=4),
        ui.text(details) if is_active else None,
        ui.action_button("Show", on_press=lambda: set_is_active(True)),
    ]


@ui.component
def accordion():
    return [
        ui.heading("Fruits"),
        ui.divider(),
        info("Apple", "Red and delicious"),
        ui.divider(),
        info("Banana", "Yellow and sweet"),
        ui.divider(),
    ]


accordion_example = accordion()
```

Notice how pressing one `info` panel’s button does not affect the other `info` panel. They operate independently.

Now, suppose you want to ensure that only one `info` panel is expanded at any given time. In this design, expanding the second `info` panel should collapse the first one. How can you achieve this?

To synchronize these two `info` panels, follow these three steps to “lift their state up” to a parent component:

1. Remove the state from the child components.
2. Pass hardcoded data from the common parent component.
3. Add state to the common parent component and pass it down along with the event handlers.

This approach will enable the `accordion` component to manage both `info` panels, ensuring that only one is expanded at a time.

### Step 1: Remove state from the child components
