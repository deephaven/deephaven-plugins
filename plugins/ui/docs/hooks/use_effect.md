# use_effect

`use_effect` is a hook that allows you to perform side effects in your components, allowing you to interact with an external system. It is similar to [`useEffect` in React](https://react.dev/reference/react/useEffect).

## Example

```python
from deephaven import ui


@ui.component
def use_effect_example():

    ui.use_effect(increment, [count])

    return [
        ui.button("Increment", on_click=increment),
        ui.text(f"Count: {count}"),
    ]
```
