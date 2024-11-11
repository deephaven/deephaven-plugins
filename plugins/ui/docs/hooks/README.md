# Hooks

_Hooks_ let you use state and other deephaven.ui features in your components. They are a way to reuse stateful logic between components. Hooks are functions that let you "hook into" state and lifecycle features from function components. You can either use the built-in hooks or combine them to build your own.

## Example

```python
from deephaven import ui


@ui.component
def ui_counter():
    count, set_count = ui.use_state(0)
    return ui.button(f"Pressed {count} times", on_press=lambda: set_count(count + 1))


counter = ui_counter()
```

## UI recommendations

1. **Hooks must be used within components or other hooks**: Hooks require a rendering context, and therefore can only be used within component functions or other hooks. They cannot be used in regular Python functions or outside of components.
2. **All hooks start with `use_`**: For example, `use_state` is a hook that lets you add state to your components.
3. **Hooks must be called at the _top_ level**: Do not use hooks inside loops, conditions, or nested functions. This ensures that hooks are called in the same order each time a component renders. If you want to use one in a conditional or a loop, extract that logic to a new component and put it there.

## Built-in hooks

## Create custom hooks
