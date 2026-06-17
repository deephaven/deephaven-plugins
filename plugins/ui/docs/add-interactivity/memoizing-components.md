# Memoizing Components

The `memo` parameter on `@ui.component` optimizes component rendering by skipping re-renders when a component's props haven't changed. This is similar to [React.memo](https://react.dev/reference/react/memo) and is useful for improving performance in components that render often with the same props.

> [!NOTE]
> The `memo` parameter is for memoizing entire components. To memoize a value or computation within a component, use the [`use_memo`](../hooks/use_memo.md) hook instead.

## Basic Usage

Add `memo=True` to your component to skip re-renders when props are unchanged:

```python
from deephaven import ui


@ui.component(memo=True)
def greeting(name):
    print(f"Rendering greeting for {name}")
    return ui.text(f"Hello, {name}!")


@ui.component
def app():
    count, set_count = ui.use_state(0)

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        ui.text(f"Count: {count}"),
        greeting("World"),  # Won't re-render when count changes
        direction="column",
    )


app_example = app()
```

In this example, clicking the button increments `count`, causing `app` to re-render. However, `greeting` will not re-render because its prop (`"World"`) hasn't changed.

## How It Works

When a parent component re-renders, its children are considered for re-rendering too. With `memo=True`, `deephaven.ui` compares the new props with the previous props using shallow equality. If all props are equal, the component skips rendering and reuses its previous result.

Memoization only applies to props from the parent. A memoized component will still re-render when its own state changes.

The render cycle with memoization:

1. **Trigger**: Parent component state changes
2. **Render**: Parent re-renders, but memoized children with unchanged props are skipped
3. **Commit**: Only changed parts of the UI are updated

## When to Use `memo`

Treat `memo` as a performance optimization, not as a requirement for correctness. Most components do not need it.

Use `memo=True` when:

- A component re-renders often with the same props
- A component is expensive to render because it builds a large UI subtree or many children
- A parent component re-renders frequently but passes stable props to the child
- You have measured or observed lag from unnecessary re-renders

Don't use `memo` when:

- The component's props change on almost every render
- The component is cheap to render
- The expensive part is a calculation inside the component. Use [`use_memo`](../hooks/use_memo.md) for that instead.
- The underlying issue is an impure render or side effect during rendering
- You're prematurely optimizing without measuring performance

```python
from deephaven import ui


# Good candidate: large rendered subtree with stable props
@ui.component(memo=True)
def activity_feed(entries):
    return ui.flex(
        *[
            ui.flex(
                ui.text(entry["time"]),
                ui.text(entry["message"]),
                gap="size-100",
            )
            for entry in entries
        ],
        direction="column",
        gap="size-100",
    )


# Not a good candidate: prop changes every render
@ui.component
def live_counter(count):
    return ui.text(f"Count: {count}")


@ui.component
def dashboard():
    count, set_count = ui.use_state(0)
    entries = ui.use_memo(
        lambda: [
            {"time": "09:00", "message": "Connected"},
            {"time": "09:02", "message": "Loaded table"},
            {"time": "09:05", "message": "Opened dashboard"},
        ],
        [],
    )

    return ui.flex(
        ui.button("Update", on_press=lambda: set_count(count + 1)),
        live_counter(count),  # No benefit from memo - count always changes
        activity_feed(entries),  # Stable props let memo skip rebuilding the feed
        direction="column",
    )


dashboard_example = dashboard()
```

In this example, `use_memo` keeps `entries` stable, while `memo=True` avoids rebuilding the `activity_feed` subtree each time `dashboard` updates for unrelated reasons.

## Syntax Options

The `memo` parameter accepts different values:

```python skip-test
# Memoization disabled (default behavior)
@ui.component
def my_component(prop):
    return ui.text(prop)


# Memoization with shallow comparison
@ui.component(memo=True)
def my_memoized_component(prop):
    return ui.text(prop)


# Memoization with a custom comparison function
@ui.component(memo=my_custom_compare)
def my_component_custom(prop):
    return ui.text(prop)
```

## Custom Comparison Function

By default, `memo=True` uses shallow equality to compare props. You can provide a custom comparison function by passing it directly to `memo`:

> [!WARNING]
> Custom comparison functions are rare. Prefer reducing prop changes first by passing simpler props or stabilizing objects and callbacks with [`use_memo`](../hooks/use_memo.md) and `use_callback`. If you do write a custom comparator, compare every prop that affects rendering or behavior.

```python
from deephaven import ui


def compare_series(prev_props, next_props):
    """Compare a bounded series shape prop-by-prop."""
    prev_points = prev_props.get("data_points", ())
    next_points = next_props.get("data_points", ())

    return (
        prev_props.get("color") == next_props.get("color")
        and len(prev_points) == len(next_points)
        and all(
            prev_point["x"] == next_point["x"] and prev_point["y"] == next_point["y"]
            for prev_point, next_point in zip(prev_points, next_points)
        )
    )


@ui.component(memo=compare_series)
def sparkline(data_points, color="blue"):
    return ui.flex(
        ui.text(f"Color: {color}"),
        *[ui.text("({}, {})".format(point["x"], point["y"])) for point in data_points],
        direction="column",
    )


@ui.component
def chart_panel():
    tick, set_tick = ui.use_state(0)
    points = ui.use_memo(
        lambda: [
            {"x": 0, "y": 2},
            {"x": 1, "y": 5},
            {"x": 2, "y": 3},
        ],
        [],
    )

    return ui.flex(
        ui.button("Tick", on_press=lambda: set_tick(tick + 1)),
        ui.text(f"Tick: {tick}"),
        sparkline(data_points=points, color="blue"),
        direction="column",
    )


chart_panel_example = chart_panel()
```

The custom comparison function receives two dictionaries:

- `prev_props`: The props from the previous render
- `next_props`: The props for the current render

Return `True` to skip re-rendering (props are "equal"), or `False` to re-render.

When writing a custom comparison function:

- Compare every prop that affects output or behavior, including callback props
- Only use custom comparison for data with a known, limited shape
- Measure whether the comparison is actually cheaper than re-rendering
- Avoid generic deep equality checks on unknown or deeply nested structures

## Common Pitfalls

### Creating New Objects in Props

When you pass a new object, list, or dictionary as a prop, it will always be a different reference, causing re-renders even if the content is the same:

```python
from deephaven import ui


@ui.component(memo=True)
def item_list(items):
    return ui.flex(*[ui.text(item) for item in items], direction="column")


@ui.component
def app():
    count, set_count = ui.use_state(0)

    # Bad: creating the list inline changes the reference every render.
    # item_list(["apple", "banana"])

    # Good: use use_memo to keep the same reference.
    items_good = ui.use_memo(lambda: ["apple", "banana"], [])

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        ui.text(f"Count: {count}"),
        item_list(items_good),  # Skips unnecessary re-renders.
        direction="column",
    )


app_example = app()
```

### Passing Callback Functions

Lambda functions and inline function definitions create new references each render:

```python
from deephaven import ui


@ui.component(memo=True)
def button_row(on_click):
    return ui.button("Click me", on_press=on_click)


@ui.component
def app():
    count, set_count = ui.use_state(0)

    # Bad: creating the callback inline changes the reference every render.
    # button_row(on_click=lambda: None)

    # Good: use use_callback to memoize the function.
    handle_click_good = ui.use_callback(lambda: print("clicked"), [])

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        button_row(on_click=handle_click_good),  # Skips unnecessary re-renders.
        direction="column",
    )


app_example = app()
```

### Side Effects During Rendering

Memoized components still need [pure rendering logic](../describing/pure_components.md). If a component mutates global state, performs I/O, or depends on side effects during rendering, `memo` can hide the bug by causing that render to run less often.

Keep rendering pure, and move side effects into event handlers or [`use_effect`](../hooks/use_effect.md).

## Comparison with `use_memo`

| Feature | `memo` parameter              | `use_memo`             |
| ------- | ----------------------------- | ---------------------- |
| Purpose | Skip re-rendering a component | Cache a computed value |
| Usage   | Parameter on `@ui.component`  | Hook inside component  |
| Input   | Component props               | Dependencies array     |
| Output  | Memoized component            | Memoized value         |

Use `memo=True` on `@ui.component` to optimize component rendering. Use `use_memo` to optimize expensive calculations within a component.
