# Progress Circle

Progress circles show the progression of a system operation such as downloading, uploading, or processing, in a visual way. They can represent determinate or indeterminate progress.

## Example

```python
from deephaven import ui


@ui.component
def ui_progress_circle():
    return ui.progress_circle(size="L", is_indeterminate=True)


progress_circle = ui_progress_circle()
```

## UI Recommendations

1. Use the appropriate size based on parent's size
2. Use `static_color="white"` or `static_color="white"` if necessary to make sure the progress circle has enough contrast with the background
3. If the value of the progress is unknown, use `is_indeterminate=True`

## Visual Options

Progress Circle comes in 3 different sizes by the `size` prop: `"S"`, `"M"`, and `"L"`. Furthermore, the `static_color` prop can be used to control the color of the progress circle.

```python
def progress_circle_variants():
    return ui.view(
        ui.view(
            ui.progress_circle(size="S", value=30, margin="5px"),
            ui.progress_circle(size="M", value=60, margin="5px"),
            ui.progress_circle(size="L", is_indeterminate=True, margin="5px"),
        ),
        ui.view(
            ui.progress_circle(size="S", value=30, margin="5px", static_color="white"),
            ui.progress_circle(size="M", value=60, margin="5px", static_color="white"),
            ui.progress_circle(
                size="L", is_indeterminate=True, margin="5px", static_color="white"
            ),
        ),
        ui.view(
            ui.progress_circle(size="S", value=30, margin="5px", static_color="black"),
            ui.progress_circle(size="M", value=60, margin="5px", static_color="black"),
            ui.progress_circle(
                size="L", is_indeterminate=True, margin="5px", static_color="black"
            ),
            background_color="white",
        ),
    )


progress_circle_variants_example = progress_circle_variants()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.progress_circle
```
