# Size and Theme

## Deephaven theme

The Deephaven Web IDE theme can be changed in the [settings menu](/enterprise/docs/interfaces/web/settings/#theme). The `Default Dark` and `Default Light` themes are provided, but you can also [create a custom theme](/core/docs/how-to-guides/custom-themes/).

## Color

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

## Size
