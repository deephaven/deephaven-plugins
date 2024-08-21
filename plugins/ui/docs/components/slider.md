# Slider

Sliders allow users to quickly select a value within a fixed range and should be used when the upper and lower bounds of the range are constant.


## Example

```python
from deephaven import ui

my_slider_basic = ui.slider(default_value=12, label="Cookies to buy")
```


## UI recommendations

Recommendations for creating sliders:

1. Every slider should have a [label](#labeling) specified. Without one, the slider is ambiguous. In the rare case that context is sufficient, the label is unnecessary; you must still include an aria-label via the `aria_label` prop.
2. The label and contextual help text should be in sentence case.

Consider using a `range_slider` when users should select a subset range or a `number_field` when the range is large or greater precision is required.


## Value

Sliders are controlled with the `value` prop and uncontrolled with the `default_value` prop. This value must fall between the slider's minimum and maximum values, which by default are 0 and 100 respectively.

```python
from deephaven import ui


@ui.component
def slider_value_example():
    value, set_value = ui.use_state(25)
    return [
        ui.slider(default_value=25, label="Cookies to buy (Uncontrolled)"),
        ui.slider(
            value=value, on_change=set_value, label="Cookies to buy (Controlled)"
        ),
    ]


my_slider_value_example = slider_value_example()
```


## Scale

Setting the `min_value` and `max_value` props configures a custom scale for the slider.  

The `step` prop changes the increments that the slider changes.

```python
from deephaven import ui


@ui.component
def slider_range_step_examples():
    return [
        ui.slider(
            default_value=100, min_value=50, max_value=150, label="Cookies to buy"
        ),
        ui.slider(
            default_value=100,
            min_value=0,
            max_value=1000,
            step=100,
            label="Donuts to buy for group event",
        ),
    ]


my_slider_range_step_examples = slider_range_step_examples()
```


## HTML Forms

Sliders can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_slider_name_example = ui.form(
    ui.slider(label="Opacity", default_value=50, name="opacity")
)
```


## Labeling

Value labels are shown above the slider by default but can be moved to the side or hidden using the `label_position` prop.

Note that if the `label` prop is set, the `show_value_label` is set to True by default.

```python
from deephaven import ui


my_slider_label_example = ui.flex(
    ui.slider(label="Cookies to buy", default_value=25),
    ui.slider(label="Donuts to buy", label_position="side", default_value=25),
    ui.slider(label="Cakes to buy", show_value_label=False, default_value=25),
    direction="column",
    gap="size-500"
)
```


## Fill

The `is_filled` prop can be set to fill the slider. The `fill_offset` prop can be set to apply an offset for the fill.

```python
from deephaven import ui


my_slider_fill_example = ui.flex(
    ui.slider(
        label="Contrast",
        min_value=-5,
        max_value=5,
        default_value=0.75,
        step=0.05,
        is_filled=True,
    ),
    ui.slider(
        label="Exposure",
        min_value=-5,
        max_value=5,
        default_value=1.83,
        step=0.01,
        fill_offset=1,
        is_filled=True,
    ),
    direction="column",
    gap="size-300",
)
```


## Gradient

The `track_gradient` prop applies a gradient to the slider's fill. 

```python
from deephaven import ui


my_slider_gradient_example = ui.slider(
    label="Filter density",
    track_gradient=["white", "rgba(177,141,32,1)"],
    default_value=0.3,
    max_value=1,
    step=0.01,
    is_filled=True,
)
```


## Contextual Help

A `ui.contextual_help` can be passed into the `contextual_help` prop to provide additional information about the slider.

```python
from deephaven import ui


my_slider_contextual_help_example = ui.slider(
    label="Exposure",
    min_value=-100,
    max_value=100,
    default_value=0,
    is_filled=True,
    fill_offset=0,
    contextual_help=ui.contextual_help(
        ui.heading("What is exposure?"),
        ui.content("Exposure adjusts how bright the image is"),
    ),
)
```

## Disabled

Setting the `is_disabled` prop disables the slider.  

```python
from deephaven import ui


my_slider_disabled_example = ui.slider(
    label="Cookies to share", default_value=0, is_disabled=True
)
```


## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.slider
```