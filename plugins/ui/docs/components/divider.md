# Divider

Dividers enhance layout clarity by grouping and separating nearby content, helping to establish structure and hierarchy.

## Example

```python
from deephaven import ui


@ui.component
def ui_divider_basic_example():
    return ["Content above", ui.divider(), "Content below"]


my_divider_basic_example = ui_divider_basic_example()
```


## Orientation

While aligned horizontally by default, the alignment of the divider can be set using the `orientation` prop.

If aligned vertically, a height should also be provided.

```python
from deephaven import ui


@ui.component
def ui_divider_orientation_example():
    return ui.flex(
        "Content before",
        ui.divider(orientation="vertical"),
        "Content after",
        flex_grow=0,
    )


my_checkbox_group_orientation_example = ui_divider_orientation_example()
```

## Sizing

The thickness (height of the divider) can be set through the `size` property.

```python
from deephaven import ui


@ui.component
def ui_divider_size_example():
    return ui.flex(
        "Content below",
        ui.divider(size="L"),
        "Content above",
        ui.divider(size="M"),
        "More content above",
        ui.divider(size="S"),
        direction="column",
    )


my_divider_size_example = ui_divider_size_example()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.divider
```