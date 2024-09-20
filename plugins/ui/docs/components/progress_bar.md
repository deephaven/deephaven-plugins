# Progress Bar

Progress Bars show the progression of a system operation: downloading, uploading, processing, etc., in a visual way. They can represent either determinate or indeterminate progress.

## Example

```python
from deephaven import ui


@ui.component
def ui_progress_bar():
    return ui.progress_bar(size="L", is_indeterminate=True)


progress_bar = ui_progress_bar()
```

## UI Recommendations

1. Use the appropriate size based on the parent's size.
2. Use `static_color="white"` or `static_color="black"` if necessary to ensure the progress circle has enough contrast with the background.
3. If the value of the progress is unknown, use `is_indeterminate=True`.

## Visual Options

Progress Bar comes in two different sizes determined by the `size` prop: `"S"` and `"L"`. Furthermore, the `static_color` prop can be used to control the color of the progress circle.

```python
def progress_bar_variants():
    return ui.view(
        ui.flex(
            ui.progress_bar(size="S", value=30, margin="10px"),
            ui.progress_bar(size="L", value=60, margin="10px"),
            ui.progress_bar(size="L", is_indeterminate=True, margin="10px"),
            direction="column",
        ),
        ui.flex(
            ui.progress_bar(size="S", value=30, margin="10px", static_color="white"),
            ui.progress_bar(size="L", value=60, margin="10px", static_color="white"),
            ui.progress_bar(
                size="L", is_indeterminate=True, margin="10px", static_color="white"
            ),
            direction="column",
        ),
        ui.view(
            ui.flex(
                ui.progress_bar(
                    size="S", value=30, margin="10px", static_color="black"
                ),
                ui.progress_bar(
                    size="L", value=60, margin="10px", static_color="black"
                ),
                ui.progress_bar(
                    size="L", is_indeterminate=True, margin="10px", static_color="black"
                ),
                direction="column",
            ),
            background_color="white",
        ),
    )


progress_bar_variants_example = progress_bar_variants()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.progress_bar
```
