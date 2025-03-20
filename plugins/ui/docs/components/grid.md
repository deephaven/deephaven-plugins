# Grid

`ui.grid` is a [grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids)-based layout container that can be used to layout its children in two dimensions.

> [!TIP]
> The `ui.grid` component follows the same rules as a browser CSS grid. The [CSS grid layout guide](https://css-tricks.com/snippets/css/complete-guide-grid/) from CSS-Tricks and the [Grid Garden](https://cssgridgarden.com/) game are great resources to learn more about grid.

## Examples

### Explicit grid

This example demonstrates how to create a typical application layout featuring a header, sidebar, content area, and footer. The `areas` prop is used to specify the grid areas, while the `columns` and `rows` props define their sizes. Each child component utilizes the `grid_area` prop to indicate its designated area within the grid.

```python
from deephaven import ui


@ui.component
def explicit_grid():
    return ui.grid(
        ui.view(background_color="celery-600", grid_area="header"),
        ui.view(background_color="blue-600", grid_area="sidebar"),
        ui.view(background_color="purple-600", grid_area="content"),
        ui.view(background_color="magenta-600", grid_area="footer"),
        areas=["header header", "sidebar content", "footer footer"],
        columns=["1fr", "3fr"],
        rows=["size-1000", "size-3000", "size-1000"],
        height="size-6000",
        gap="size-100",
    )


explicit_grid_example = explicit_grid()
```

### Implicit grid

This example creates an implicit grid. It uses the `repeat` function to automatically generate five columns of equal width. The `auto_rows` prop sets the height of the rows, and the items are centered horizontally within the container. A gap is also added between the items.

```python
from deephaven import ui

colors = []
for i in range(100, 901, 100):
    colors.append(f"gray-{i}")
    colors.append(f"green-{i}")
    colors.append(f"blue-{i}")


@ui.component
def implicit_grid():
    return ui.grid(
        [ui.view(background_color=color) for color in colors],
        columns=["repeat(5, 1fr)"],
        auto_rows="size-800",
        justify_content="center",
        gap="size-100",
    )


implicit_grid_example = implicit_grid()
```
