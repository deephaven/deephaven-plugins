# Progress Circle

Progress circles show the progression of a system operation such as downloading, uploading, or processing, in a visual way. They can represent determinate or indeterminate progress.

## Example

```python
from deephaven import ui


@ui.component
def ui_progress_circle():
    return ui.progress_circle(is_indeterminate=True)


progress_circle = ui_progress_circle()
```

## UI Recommendations

1. Use the appropriate size based on the parent's size.
2. Use `static_color="white"` or `static_color="black"` if necessary to make sure the progress circle has enough contrast with the background.
3. If the value of the progress is unknown, use `is_indeterminate=True`.

## Value 

The progress is controlled by the `value`, `min_value`, and `max_value` props. The default values of `min_value` and `max_value` are `0` and `100`, respectively. 

```python
from deephaven import ui


@ui.component
def value_variants():
    return ui.flex(
        ui.progress_circle(value=50),
        ui.progress_circle(value=50, min_value=25, max_value=125),
    )


progress_circle_value_examples = value_variants()
```

## Indeterminate

Use `is_indeterminate=True` if the progress can not be determined.

```python
from deephaven import ui


@ui.component
def indeterminate_variant():
    return ui.progress_circle(is_indeterminate=True)


progress_circle_indeterminate_example = indeterminate_variant()
```

## Size

Progress Circle comes in three different sizes determined by the `size` prop: `"S"`, `"M"`, and `"L"`. By default, the size is `"M"`.

```python
from deephaven import ui


@ui.component
def size_variants():
    return ui.flex(
        ui.progress_circle(value=70, size="S"),
        ui.progress_circle(value=70),
        ui.progress_circle(value=70, size="L"),
    )


progress_circle_size_examples = size_variants()
```

## Static Color

The `static_color` prop can be used to control the color of the progress circle between the default color, `"black"`, and `"white"`.

```python
from deephaven import ui


@ui.component
def color_variants():
    return ui.view(
        ui.flex(
            ui.view(ui.progress_circle(value=70, margin="10px")),
            ui.view(
                ui.progress_circle(value=70, static_color="white", margin="10px"),
                background_color="black",
            ),
            ui.view(
                ui.progress_circle(value=70, static_color="black", margin="10px"),
                background_color="white",
            ),
        )
    )


progress_circle_color_examples = color_variants()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.progress_circle
```
