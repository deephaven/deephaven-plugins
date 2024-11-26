# Divider

Dividers enhance layout clarity by grouping and separating nearby content, helping to establish structure and hierarchy.

## Example

```python
from deephaven import ui


@ui.component
def ui_divider_basic_example():
    return [ui.text("Content above"), ui.divider(), ui.text("Content below")]


my_divider_basic_example = ui_divider_basic_example()
```


## Orientation

While aligned horizontally by default, the alignment of the divider can be set using the `orientation` prop.

```python
from deephaven import ui


@ui.component
def ui_divider_orientation_example():
    return [
        ui.text("Content above"),
        ui.divider(orientation="vertical"),
        ui.text("Content below"),
    ]


my_checkbox_group_orientation_example = ui_divider_orientation_example()
```

## Sizing

The thickness (height of the divider) can be set through the `size`.s

```python
from deephaven import ui


@ui.component
def ui_divider_size_example():
    ui.text("Content above"),
    ui.divider(size="L"),
    ui.text("Content below")
    ui.divider(size="M"),
    ui.text("More content below"),
    ui.divider(size="S"),


my_divider_size_example = ui_divider_size_example()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.divider
```