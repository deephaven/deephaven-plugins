# Render Cycle

Before your components are displayed on screen, they must be rendered. Understanding the steps in this process will help you think about how your code executes and explain its behavior.

Think of your components as chefs in a kitchen, preparing delicious meals from various ingredients. In this analogy, `deephaven.ui` acts as the waiter, taking orders from customers and delivering the finished dishes. This process of handling UI requests and rendering them involves three main steps:

1. Triggering a render (delivering the guest’s order to the kitchen)
2. Rendering the component (preparing the order in the kitchen)
3. Committing to the DOM (placing the order on the table)

## Step 1: Trigger a render

There are two reasons for a component to render:

1. It is the component’s initial render.
2. The component’s state has been updated or one of its ancestors' state has been updated.

### Initial Render

Opening a component to view it causes the component to be mounted, which means adding nodes to the DOM. When your component first mounts, it triggers an initial render. It is rendered with its props and initial state.

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

After you trigger a render, `deephaven.ui` runs the component functions and then encodes your components as JSON which is sent from the server to the web client UI. The client decodes the JSON into a document which is rendered by React.

This process is recursive: if the updated component returns some other component, `deephaven.ui` will render that component next, and if that component also returns something, it will render that component next, and so on. The process will continue until there are no more nested components.

> [!Note]
> In the current implementation, when any state changes in a component tree, **all components re-render from the root down to the leaf nodes**. This means if a child component's state updates, the parent and all siblings will also re-render. While this ensures consistency, it's important to use `ui.use_memo` for expensive calculations to avoid re-computing values unnecessarily on every render.

Rendering must always be a [pure](../describing/pure_components.md) calculation:

- Same inputs, same output. Given the same inputs, a component should always return the output.
- It minds its own business. It should not change any objects or variables that existed before rendering.

Otherwise, you can encounter confusing bugs and unpredictable behavior as your codebase grows in complexity.

### Step 3: Commit changes to the DOM

After rendering your components, `deephaven.ui` sends the components to client and React renders and will modify the DOM.

- For the initial render, React will use the `appendChild()` DOM API to put all the DOM nodes it has created on screen.
- For re-renders, React will apply the minimal necessary operations (calculated while rendering!) to make the DOM match the latest rendering output.

React only changes the DOM nodes if there’s a difference between renders. For example, here is a component that re-renders with different props passed from its parent every second. Notice how you can add some text into the `ui.text_field`, updating its value, but the text doesn’t disappear when the component re-renders:

```python
import time, threading
from deephaven import ui


@ui.component
def clock(t):
    return [ui.heading(t), ui.text_field()]


@ui.component
def clock_wrapper():
    clock_time, set_clock_time = ui.use_state(time.ctime())
    is_cancelled = False

    def periodic_update():
        if is_cancelled:
            return
        set_clock_time(time.ctime())
        threading.Timer(1, periodic_update).start()

    def start_update():
        periodic_update()

        def cancel_timer():
            nonlocal is_cancelled
            is_cancelled = True

        return cancel_timer

    start_timer = ui.use_callback(start_update, [set_clock_time])
    ui.use_effect(start_timer, [])

    return clock(clock_time)


clock_example = clock_wrapper()
```

This works because during this last step, React only updates the content of `ui.header` with the new time. It sees that the `ui.text_field` appears in the JSX in the same place as last time, so React doesn’t touch the `ui.text_field` or its value.

After rendering is done and React updated the DOM, the browser will repaint the screen.

## Optimizing Re-renders with `@ui.memo`

By default, when any component's state changes, `deephaven.ui` re-renders the entire component tree from the root—not just the component that triggered the change or its children, but every component in the tree. This is usually not a problem, but if you have a deeply nested tree or expensive components, you can optimize performance by wrapping components with `@ui.memo`.

The `@ui.memo` decorator tells `deephaven.ui` to skip re-rendering a component when its props haven't changed:

```python
from deephaven import ui


@ui.memo
@ui.component
def expensive_child(value):
    # This component will only re-render when `value` changes
    return ui.text(f"Value: {value}")


@ui.component
def parent():
    count, set_count = ui.use_state(0)
    static_value = "hello"

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        ui.text(f"Count: {count}"),
        # This child won't re-render when count changes because static_value stays the same
        expensive_child(static_value),
    )


parent_example = parent()
```

In this example, clicking the button updates `count`, which causes `parent` to re-render. However, `expensive_child` will skip re-rendering because its `value` prop (`"hello"`) hasn't changed.

For more details on when and how to use memoization effectively, see [Memoizing Components](./memoizing-components.md).
