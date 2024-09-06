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

## Available Icons

In the example provided, you can find a showcase of all available icons. Additionally, you have the ability to search for specific icons.

```python
from deephaven.ui.components.types import IconTypes
from deephaven import ui
from typing import get_args


@ui.component
def icon_search_example():
    available_icons = [*get_args(IconTypes)]
    filtered_icons, set_filtered_icons = ui.use_state(available_icons)

    def filter_icons(search):
        new_icons = []
        for icon in available_icons:
            if search in icon:
                new_icons.append(icon)
        set_filtered_icons(new_icons)

    def render_icons():
        entries = []

        for icon in filtered_icons:
            entries.append(
                ui.flex(
                    ui.icon(name=icon),
                    ui.text(icon),
                    direction="column",
                    align_items="center",
                )
            )

        return ui.flex(entries, wrap="wrap")

    return [ui.text_field(ui.icon("search"), on_change=filter_icons), render_icons()]


my_icon_search_example = icon_search_example()
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