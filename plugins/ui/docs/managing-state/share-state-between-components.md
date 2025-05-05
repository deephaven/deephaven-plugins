# Share State Between Components

To synchronize the state of two components, lift the state up to its nearest common parent. Remove the state from both components, move it to the parent, and pass it down via props. This technique is known as lifting state up.

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

You will delegate control of the `info` panel’s `is_active` state to its parent component. This means the parent component will pass `is_active` to the `info` panel as a prop. Start by removing this line from the `info` component:

```python skip-test
is_active, set_is_active = ui.use_state(False)
```

Next, add `is_active` to the `info` panel’s list of parameters:

```
def info(title, details, is_active):
```

Now, the parent component can control `is_active` by passing it down as a prop. Consequently, the `info` component no longer manages the value of `is_active`. It is now controlled by the parent component.

### Step 2: Pass hardcoded data from the common parent

To lift state up, identify the nearest common parent component of the child components you want to synchronize:

- accordion (nearest common parent)
  - info
  - info

In this case, the `accordion` component is the common parent. Since it is above both `info` components and can manage their props, it will serve as the “source of truth” for the active `info` panel. Have the `accordion` component pass a hardcoded value of `is_active` (e.g., `True`) to both `info` components:

```python
from deephaven import ui


@ui.component
def info(title, details, is_active):
    return [
        ui.heading(title, level=4),
        ui.text(details) if is_active else None,
        # ui.action_button("Show", on_press=lambda: set_is_active(True)),
    ]


@ui.component
def accordion():
    return [
        ui.heading("Fruits"),
        ui.divider(),
        info("Apple", "Red and delicious", True),
        ui.divider(),
        info("Banana", "Yellow and sweet", True),
        ui.divider(),
    ]


accordion_example = accordion()
```

Try modifying the hardcoded `is_active` values in the `accordion` component and observe the changes on the screen.

### Step 3: Add state to the common parent

Lifting state up often changes the nature of the state you are managing.

In this scenario, only one `info` panel should be active at any given time. Therefore, the parent component must track which `info` is currently active. Instead of using a boolean value, it can use a number representing the index of the active `info` for the state variable:

```python skip-test
active, set_active = ui.use_state(0)
```

When `active` is `0`, the first `info` is active. When it is `1`, the second `info` is active.

Clicking the “Show” button in any panel should change `active` in the `accordion`. An `info` cannot directly set the `active` state because it is defined within the `accordion`. The `accordion` component must explicitly allow the `info` component to change its state by passing an event handler as a prop:

```python skip-test
info(
    "Apple", "Red and delicious", is_active=active == 0, on_show=lambda: set_active(0)
),
ui.divider(),
info(
    "Banana", "Yellow and sweet", is_active=active == 1, on_show=lambda: set_active(1)
),
```

The `button` inside the `info` component will now use the `on_show` prop as its press event handler:

```python
from deephaven import ui


@ui.component
def info(title, details, is_active, on_show):
    return [
        ui.heading(title, level=4),
        ui.text(details) if is_active else None,
        ui.action_button("Show", on_press=on_show),
    ]


@ui.component
def accordion():
    active, set_active = ui.use_state(0)

    return [
        ui.heading("Fruits"),
        ui.divider(),
        info(
            "Apple",
            "Red and delicious",
            is_active=active == 0,
            on_show=lambda: set_active(0),
        ),
        ui.divider(),
        info(
            "Banana",
            "Yellow and sweet",
            is_active=active == 1,
            on_show=lambda: set_active(1),
        ),
        ui.divider(),
    ]


accordion_example = accordion()
```

This completes the process of lifting state up. By moving the state into the common parent component, you can coordinate the two `info` panels effectively. Using the `active` index instead of two separate `is_shown` flags ensures that only one `info` is active at any given time. Additionally, passing down the event handler to the child component allows the child to update the parent’s state.

## A single source of truth for each state

In a `deephaven.ui` application, many components will manage their own state. Some state may reside close to the leaf components (those at the bottom of the tree) like inputs, while other state may be managed closer to the top of the app.

For each unique piece of state, you will determine the component that “owns” it. This concept is known as having a “single source of truth”. It doesn’t imply that all state is centralized, but rather that each piece of state is held by a specific component. Instead of duplicating shared state across components, lift it up to their common parent and pass it down to the children that require it.

As you develop your app, it will evolve. It is common to move state down or back up while determining the optimal location for each piece of state. This is a natural part of the development process.
