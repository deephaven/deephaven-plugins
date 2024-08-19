# Range Slider

Range sliders allow users to quickly select a subset range within a fixed range and should be used when the upper and lower bounds of the range are constant.


## Example

```python
from deephaven import ui

my_range_slider_basic = ui.range_slider(
    default_value={"start": 18, "end": 80}, label="Age range"
)
```


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

The `step` prop changes the increments that the range slider changes.

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