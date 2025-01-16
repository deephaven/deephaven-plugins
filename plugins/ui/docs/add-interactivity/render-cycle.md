# Render Cycle

Before your components are displayed on screen, they must be rendered. Understanding the steps in this process will help you think about how your code executes and explain its behavior.

Think of your components as chefs in a kitchen, preparing delicious meals from various ingredients. In this analogy, `deephaven.ui` acts as the waiter, taking orders from customers and delivering the finished dishes. This process of handling UI requests and rendering them involves three main steps:

1. Triggering a render (delivering the guest’s order to the kitchen)
2. Rendering the component (preparing the order in the kitchen)
3. Committing to the DOM (placing the order on the table)

## Step 1: Trigger a render

There are two reasons for a component to render:

1. It is the component’s initial render.
2. The component’s state has been updated or one of it's ancestor's state has been updated.

### Initial Render

When your component first mounts, it triggers an initial render. It is rendered with it's props and initial state.

```python
from deephaven import ui


@ui.component
def example_renderer():
    text = "Initial Render"
    return ui.text(text)


example = example_renderer()
```

### Re-renders when state updates

Once the component has been initially rendered, you can trigger further renders by updating its state with the set function. Updating your component’s state automatically queues a render. (You can imagine these as a restaurant guest ordering tea, dessert, and all sorts of things after putting in their first order, depending on the state of their thirst or hunger.)

```python
from deephaven import ui


@ui.component
def example_renderer():
    num, set_num = ui.use_state(0)

    def handle_press():
        set_num(num + 1)

    text = "Initial Render" if num == 0 else f"Re-render {num}"

    return [
        ui.button("Render", on_press=handle_press),
        ui.text(text),
    ]


example = example_renderer()
```

## Step 2: `deephaven.ui` renders your components
