# Size and Theme

## Deephaven theme

The Deephaven Web IDE theme can be changed in the [settings menu](/enterprise/docs/interfaces/web/settings/#theme). The `Default Dark` and `Default Light` themes are provided, but you can also [create a custom theme](/core/docs/how-to-guides/custom-themes/).

## Color palette

`deephaven.ui` uses the same color convention as [Adobe Spectrum](https://spectrum.adobe.com/page/color-system/). A color is specified with a `name` and an `index` number. For example `blue-100` or `red-600`. In a dark theme, `blue-100` will be a dark blue and `blue-1000` will be a light blue. In a light theme, they will be reversed. The example component below displays a color palette for a selected color. Try changing the theme to see the difference in colors.

```python
from deephaven import ui


def generate_colors(color):
    colors = []
    for i in range(100, 1001, 100):
        colors.append(f"{color}-{i}")
    return colors


@ui.component
def color_palette():
    color, set_color = ui.use_state("blue")
    colors = ui.use_memo(lambda: generate_colors(color), [color])
    return [
        ui.picker(
            ui.item("blue"),
            ui.item("green"),
            ui.item("yellow"),
            ui.item("orange"),
            ui.item("red"),
            selected_key=color,
            on_selection_change=set_color,
            label="Pick a color",
        ),
        ui.grid(
            [ui.view(ui.text(color), background_color=color) for color in colors],
            columns="repeat(5, 1fr)",
            auto_rows="size-800",
            justify_content="center",
            gap="size-100",
        ),
    ]


color_palette_example = color_palette()
```

**Dark theme palette**

![dark theme palette](../_assets/size-and-theme-dark-palette.png)

**Light theme palette**

![light theme palette](../_assets/size-and-theme-light-palette.png)

For a full list of colors, see the [Adobe Spectrum color values](https://react-spectrum.adobe.com/react-spectrum/styling.html#color-values).

## Semantic color

In addition to the color palette, `deephaven.ui` uses semantic colors which assign color based on meanings. This means that a `negative` UI element will have the same color throughout the UI rather than various elements having a different shade of red.

For example, the [button](../components/button.md) component uses `variant` to apply semantic color.

```python
from deephaven import ui


@ui.component
def button_variants():
    return [
        ui.button(
            "Accent",
            variant="accent",
        ),
        ui.button("Primary", variant="primary"),
        ui.button("Secondary", variant="secondary"),
        ui.button("Negative", variant="negative"),
    ]


button_variants_example = button_variants()
```

**Dark theme buttons**

![dark theme buttons](../_assets/size-and-theme-dark-buttons.png)

**Light theme example**

![light theme buttons](../_assets/size-and-theme-light-buttons.png)

In this example, the [toast](../components/toast.md) component uses `variant` to apply semantic color.

```python
from deephaven import ui


@ui.component
def ui_toast_variants():
    ui.toast("neutral.", variant="neutral")
    ui.toast("positive.", variant="positive")
    ui.toast("negative.", variant="negative")
    ui.toast("info.", variant="info")
    return ui.text()


ui_toast_variants_example = ui_toast_variants()
```

**Dark theme toast**

![dark theme toast](../_assets/size-and-theme-dark-toast.png)

**Light theme toast**

![light theme toast](../_assets/size-and-theme-light-toast.png)

## Size
