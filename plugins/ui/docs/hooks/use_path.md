# use_path

`use_path` is a hook that returns the current URL path relative to the widget's route space.

Widgets use `/-/` to separate Deephaven's internal router from user-specified widget routing. `use_path()` returns only the portion after `/-/` by default and returns the whole path if the `absolute` argument is set to `True`.

## Example

```python order=app
from deephaven import ui


@ui.component
def app():
    # Display the current path
    path = ui.use_path()
    return ui.text(f"Current path: {path}")


app = app()
```

## Path with Navigation

Use `use_path` together with `use_navigate` to build a simple navigation system that updates the path and displays query parameters.

```python order=app
from deephaven import ui


@ui.component
def path_display():
    path = ui.use_path()
    absolute_path = ui.use_path(absolute=True)
    navigate = ui.use_navigate()

    def go_dashboard():
        navigate("/dashboard")

    def go_home():
        navigate("/")

    return ui.flex(
        ui.text(f"Current path: {path}"),
        ui.text(f"Absolute path: {absolute_path}"),
        ui.action_button("Go to Dashboard", on_press=go_dashboard),
        ui.action_button("Go Home", on_press=go_home),
        direction="column",
    )


app = path_display()
```

## Recommendations

1. Use the default (relative) path for routing logic within your widget. Use `absolute=True` only when you need the full URL path including Deephaven's internal prefix.
2. Use [`use_params`](./use_params.md) to extract named route parameters instead of parsing the path string manually.
3. Use [`use_navigate`](./use_navigate.md) to change the current path programmatically, or [`link`](../components/link.md) with `to` for declarative navigation.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_path
```
