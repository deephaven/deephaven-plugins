# Icon

Custom icons can be used by wrapping them in an Icon component.

## Example

```python
from deephaven import ui


@ui.component
def icons():
    icon = ui.icon(name="dhTruck")

    return icon


my_icons = icons()
```


## Sizing

Icons support t-shirt sizing, automatically adjusting their size when used within other components. By default, icons are sized as "M" for medium scale on desktops and "L" for large scale on mobile devices.

```python
from deephaven import ui


@ui.component
def icons():
    small = ui.icon(name="dhTruck", size="S")
    default = ui.icon(name="dhTruck")
    large = ui.icon(name="dhTruck", size="L")

    return [small, default, large]


my_icons = icons()
```

## Coloring

Icons in Spectrum support four semantic colors: negative, notice, positive, and informative. While icons within React Spectrum components are usually styled with the appropriate colors, you can use the `color` prop to customize the color of standalone icons.

```python
from deephaven import ui


@ui.component
def icons():
    negative = ui.icon(name="dhTruck", color="negative")
    informative = ui.icon(name="dhTruck", color="informative")
    positive = ui.icon(name="dhTruck", color="positive")

    return [negative, informative, positive]


my_icons = icons()
```

## Labeling

By default, icons are treated as decorative and are hidden from assistive technology. When used within a label-less component, such as a button, an aria-label should be assigned to the parent component. If the icon is used on its own, an aria-label can be directly applied to the icon.

```python
from deephaven import ui


@ui.component
def icons():
    icon_button = ui.button(ui.icon(name="dhTruck"), aria_label="truck")

    return icon_button


my_icons = icons()
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.icon
```