# Icon

Icons can be displayed as a standalone element, or as part of other components that accept icons such as [text_field](./text_field.md) or [action_button](./action_button.md). Icons can be selected from the built in icon set. See the available icons example below for a listing of all icons.

## Example

```python
from deephaven import ui


@ui.component
def icons():
    icon = ui.icon("filter")

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
                    ui.icon(icon),
                    ui.text(icon, color="gray-700"),
                    direction="column",
                    align_items="center",
                )
            )
        return ui.grid(entries, columns="repeat(auto-fit, minmax(250px, 1fr))")

    return ui.panel(
        ui.view(
            ui.text_field(
                ui.icon("search"),
                label="Search icons",
                width="100%",
                on_change=filter_icons,
            ),
            position="sticky",
            top="0px",
            padding="size-100",
            background_color="surface-bg",
            border_bottom_width="thin",
            border_bottom_color="bg",
            width="100%",
        ),
        render_icons(),
        padding=0,
    )


my_icon_search_example = icon_search_example()
```


## Sizing

Icons support t-shirt sizing, automatically adjusting their size when used within other components. By default, icons are sized as "M" for medium scale on desktops and "L" for large scale on mobile devices.

```python
from deephaven import ui


@ui.component
def icons():
    small = ui.icon("bell", size="S")
    default = ui.icon("bell")
    large = ui.icon("bell", size="L")

    return [small, default, large]


my_icons = icons()
```

## Coloring

Icons support four semantic colors: negative, notice, positive, and informative. While icons within components are usually styled with the appropriate colors, you can use the `color` prop to customize the color of standalone icons.

```python
from deephaven import ui


@ui.component
def icons():
    negative = ui.icon("bell", color="negative")
    informative = ui.icon("bell", color="informative")
    positive = ui.icon("bell", color="positive")

    return [negative, informative, positive]


my_icons = icons()
```

## Labeling

By default, icons are treated as decorative and are hidden from assistive technology. When used within a label-less component, such as a button, an aria-label should be assigned to the parent component. If the icon is used on its own, an aria-label can be directly applied to the icon.

```python
from deephaven import ui


@ui.component
def icons():
    icon_button = ui.action_button(ui.icon("squirrel"), aria_label="squirrel")

    return icon_button


my_icons = icons()
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.icon
```