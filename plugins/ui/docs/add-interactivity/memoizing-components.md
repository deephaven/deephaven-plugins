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

By default, when a parent component re-renders, all of its child components re-render too. With `memo=True`, `deephaven.ui` compares the new props with the previous props using shallow equality. If all props are equal, the component skips rendering and reuses its previous result.

The render cycle with memoization:

1. **Trigger**: Parent component state changes
2. **Render**: Parent re-renders, but memoized children with unchanged props are skipped
3. **Commit**: Only changed parts of the UI are updated

## When to Use `memo`

Use `memo=True` when:

- A component renders often with the same props
- A component is expensive to render (complex calculations, many children)
- A parent component re-renders frequently but passes stable props to children

Don't use `memo` when:

- The component's props change on almost every render
- The component is cheap to render
- You're prematurely optimizing without measuring performance

```python
from deephaven import ui


# Good candidate: renders same static content while parent updates
@ui.component(memo=True)
def expensive_chart(data):
    # Imagine this does complex data processing
    return ui.text(f"Chart with {len(data)} points")


# Not a good candidate: props change every render
@ui.component
def live_counter(count):
    return ui.text(f"Count: {count}")


@ui.component
def dashboard():
    count, set_count = ui.use_state(0)
    chart_data = [1, 2, 3, 4, 5]  # Static data

    return ui.flex(
        ui.button("Update", on_press=lambda: set_count(count + 1)),
        live_counter(count),  # No benefit from memo - count always changes
        expensive_chart(chart_data),  # Benefits from memo - data is stable
        direction="column",
    )


dashboard_example = dashboard()
```

## Custom Comparison Function

By default, `memo=True` uses shallow equality to compare props. You can provide a custom comparison function by passing it directly to `memo`:

```python
from deephaven import ui


def compare_by_id(prev_props, next_props):
    """Only re-render if the 'id' prop changes."""
    return prev_props.get("id") == next_props.get("id")


@ui.component(memo=compare_by_id)
def user_card(id, name, last_updated):
    return ui.flex(
        ui.text(f"User #{id}"),
        ui.text(f"Name: {name}"),
        ui.text(f"Updated: {last_updated}"),
        direction="column",
    )


@ui.component
def user_profile():
    name, set_name = ui.use_state("Alice")
    timestamp, set_timestamp = ui.use_state("12:00")

    return ui.flex(
        ui.button("Update timestamp", on_press=lambda: set_timestamp("12:01")),
        ui.button("Change name", on_press=lambda: set_name("Bob")),
        # Only re-renders if id changes, not name or last_updated
        user_card(id=1, name=name, last_updated=timestamp),
        direction="column",
    )


user_profile_example = user_profile()
```

The custom comparison function receives two dictionaries:

- `prev_props`: The props from the previous render
- `next_props`: The props for the current render

Return `True` to skip re-rendering (props are "equal"), or `False` to re-render.

### Deep Equality Comparison

For props containing nested data structures, you might want deep equality:

```python
from deephaven import ui


def deep_equal(prev_props, next_props):
    """Compare props using deep equality."""
    import json

    return json.dumps(prev_props, sort_keys=True) == json.dumps(
        next_props, sort_keys=True
    )


@ui.component(memo=deep_equal)
def data_display(config):
    return ui.text(f"Config: {config}")


@ui.component
def app():
    count, set_count = ui.use_state(0)

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        # Even though a new dict is created each render, deep_equal
        # will detect the values are the same and skip re-rendering
        data_display(config={"setting": "value", "enabled": True}),
        direction="column",
    )


app_example = app()
```

### Threshold-Based Comparison

You can implement more sophisticated comparison logic:

```python
from deephaven import ui


def significant_change(prev_props, next_props, threshold=5):
    """Only re-render if value changes by more than threshold."""
    prev_value = prev_props.get("value", 0)
    next_value = next_props.get("value", 0)
    return abs(next_value - prev_value) <= threshold


@ui.component(memo=significant_change)
def progress_bar(value):
    return ui.progress_bar(value=value, label=f"{value}%")


@ui.component
def app():
    value, set_value = ui.use_state(0)

    return ui.flex(
        ui.button("+1", on_press=lambda: set_value(value + 1)),
        ui.button("+10", on_press=lambda: set_value(value + 10)),
        # Only re-renders when value changes by more than 5
        progress_bar(value=value),
        direction="column",
    )


app_example = app()
```

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


# Memoization with custom comparison function
@ui.component(memo=my_custom_compare)
def my_component_custom(prop):
    return ui.text(prop)
```

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

    # ❌ Creates a new list on every render
    # item_list will re-render every time even though content is the same
    items_bad = ["apple", "banana"]

    # ✅ Use use_memo to keep the same reference
    items_good = ui.use_memo(lambda: ["apple", "banana"], [])

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        ui.text(f"Count: {count}"),
        item_list(items_good),  # Won't re-render unnecessarily
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

    # ❌ Creates a new function reference every render
    handle_click_bad = lambda: print("clicked")

    # ✅ Use use_callback to memoize the function
    handle_click_good = ui.use_callback(lambda: print("clicked"), [])

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        button_row(on_click=handle_click_good),  # Won't re-render unnecessarily
        direction="column",
    )


app_example = app()
```

## Comparison with `use_memo`

| Feature | `memo` parameter              | `use_memo`             |
| ------- | ----------------------------- | ---------------------- |
| Purpose | Skip re-rendering a component | Cache a computed value |
| Usage   | Parameter on `@ui.component`  | Hook inside component  |
| Input   | Component props               | Dependencies array     |
| Output  | Memoized component            | Memoized value         |

Use `memo=True` on `@ui.component` to optimize component rendering. Use `use_memo` to optimize expensive calculations within a component.
