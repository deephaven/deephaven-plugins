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

After you trigger a render, `deephaven.ui` encodes your components as JSON which is sent from the server to the web client UI. The client decodes the JSON into a document which is rendered by React.

- On initial render, `deephaven.ui` will encode the root component.
- For subsequent renders, `deephaven.ui` will encode the component whose state update triggered the render.

This process is recursive: if the updated component returns some other component, `deephaven.ui` will render that component next, and if that component also returns something, it will render that component next, and so on. The process will continue until there are no more nested components.

Rendering must always be a [pure](../describing/pure_components.md) calculation:

- Same inputs, same output. Given the same inputs, a component should always return the output.
- It minds its own business. It should not change any objects or variables that existed before rendering.

Otherwise, you can encounter confusing bugs and unpredictable behavior as your codebase grows in complexity.

### Step 3: Commit changes to the DOM
