# Range Slider

Range sliders allow users to quickly select a subset range within a fixed range and should be used when the upper and lower bounds of the range are constant.

## Example

```python
from deephaven import ui

my_range_slider_basic = ui.range_slider(
    default_value={"start": 18, "end": 80}, label="Age range"
)
```

## UI recommendations

Recommendations for creating range sliders:

1. Every range slider should have a [label](#labeling) specified. Without one, the range slider is ambiguous. In the rare case that context is sufficient, the label is unnecessary; you must still include an aria-label via the `aria_label` prop.
2. The label and contextual help text should be in sentence case.

Consider using a `slider` instead of a `range_slider` when users should select a singular value or a `number_field` when the range is large and sliding between the upper and lower bound is no longer quick.

## Value

Sliders are controlled with the `value` prop and uncontrolled with the `default_value` prop. This value, consisting of `start` and `end`, must fall between the slider's minimum and maximum values, which by default are 0 and 100 respectively.

```python
from deephaven import ui


@ui.component
def range_slider_value_example():
    value, set_value = ui.use_state({"start": 25, "end": 75})

    def handle_value_change(new_value):
        print(f"Range changed to {new_value}")
        set_value(new_value)

    return [
        ui.range_slider(
            default_value={"start": 25, "end": 75}, label="Range (uncontrolled)"
        ),
        ui.range_slider(
            value=value, on_change=handle_value_change, label="Range (controlled)"
        ),
    ]


my_range_slider_value_example = range_slider_value_example()
```


## Scale

Setting the `min_value` and `max_value` props configures a custom scale for the range slider.  

The `step` prop changes the increments in which the range slider changes.

```python
from deephaven import ui


@ui.component
def range_slider_range_step_examples():
    return [
        ui.range_slider(
            default_value={"start": 75, "end": 100},
            min_value=50,
            max_value=150,
            label="Range",
        ),
        ui.range_slider(
            default_value={"start": 10, "end": 100},
            min_value=0,
            max_value=500,
            step=10,
            label="Range",
        ),
    ]


my_range_slider_range_step_examples = range_slider_range_step_examples()
```


## HTML Forms

Range sliders can support a `name` prop for integration with HTML forms, allowing for easy identification of a value on form submission.

```python
from deephaven import ui


my_range_slider_name_example = ui.form(
    ui.range_slider(
        label="Opacity", default_value={"start": 50, "end": 100}, name="Opacity Range"
    )
)
```


## Labeling

Value labels are shown above the range slider by default but can be moved to the side or hidden using the `label_position` prop.

Note that if the `label` prop is set, the `show_value_label` is set to True by default.

```python
from deephaven import ui


my_range_slider_label_example = ui.flex(
    ui.range_slider(label="Jeans price range", default_value={"start": 75, "end": 100}),
    ui.range_slider(
        label="Shoes price range",
        label_position="side",
        default_value={"start": 50, "end": 100},
    ),
    ui.range_slider(
        label="Cakes to buy",
        show_value_label=False,
        default_value={"start": 15, "end": 30},
    ),
    max_width="size-5000",
    gap="size-300",
)
```


## Contextual Help

A `ui.contextual_help` can be passed into the `contextual_help` prop to provide additional information about the range slider.

```python
from deephaven import ui


my_range_slider_contextual_help_example = ui.range_slider(
    label="Search Radius",
    min_value=0,
    max_value=100,
    default_value={"start": 15, "end": 60},
    contextual_help=ui.contextual_help(
        ui.heading("Ranking"),
        ui.content("Search results are sorted by distance from city center."),
    ),
)
```


## Disabled

Setting the `is_disabled` prop disables the range slider.  

```python
from deephaven import ui


my_range_slider_disabled_example = ui.range_slider(
    label="Price filter", default_value={"start": 25, "end": 50}, is_disabled=True
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.range_slider
```