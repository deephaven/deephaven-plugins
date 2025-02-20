# Layout Overview

When using `deephaven.ui` to build complex workflows with multiple components, it is important to arrange these components to create a user-friendly and intuitive interface. `deephaven.ui` offers various layouts that allow you to define the arrangement of components in terms of order, size, and spacing.

## Layouts

The following layouts are available in `deephaven.ui`:

- [`flex`](../components/flex.md) is a [flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox)-based layout container that arranges components in either a row or column.
- `grid` is a [CSS grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids) layout container that arranges components two-dimensional structure of rows and columns.
- [`panel`](../components/panel.md) is a `flex` container that is presented as individual tabs that can be moved to different positions by dragging the tabs.
- [`dashboard`](../components/dashboard.md) is a page layout that arranges a collection of `panels` if rows, columns, and stacks.
- [`view`](../components/view.md) is a general purpose container that can be used for custom styling purposes.

## Default layout

The top-level return of a `@ui.component` is automatically wrapped in a `panel` with a `flex` layout. Returning a single component or a list of components will have this default layout.

```python
from deephaven import ui


@ui.component
def single_component():
    return ui.text("hello")


@ui.component
def list_of_components():
    return [ui.heading("hello"), ui.text("good bye"), ui.button("button")]


single_example = single_component()
list_example = list_of_components()
```

## Flex

The [`flex`](../components/flex.md) layout follows the same rules as the [CSS flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox) layout. The `flex` layout container can specify the following:

- The `direction` prop determines the direction in which the flex items are laid out such as "row" or "column".
- When enabled, the `wrap` prop causes items that overflow to wrap into the next row. Resize your browser window to see the items reflow.
- The `justify_content` prop is used to align items along the main axis. When the `direction` is set to "column", it controls the vertical alignment, and when the direction is set to "row", it controls the horizontal alignment.
- The `align_items` prop aligns items along the cross-axis. When the direction is set to "column", it controls horizontal alignment, and when it is set to "row", it controls vertical alignment.

In addition, `flex` layouts can be nested to create more complex layouts.

```python
from deephaven import ui


@ui.component
def ui_flex_nesting():
    return [
        ui.flex(
            ui.view(1, background_color="red", height="size-800"),
            ui.flex(
                ui.view(
                    2, background_color="green", height="size-800", width="size-800"
                ),
                ui.view(
                    3, background_color="blue", height="size-800", width="size-800"
                ),
                justify_content="right",
                wrap=True,
            ),
            direction="column",
        ),
    ]


my_flex_nesting = ui_flex_nesting()
```

## Grid

The `grid` component can be used to layout its children in two dimensions with [CSS grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids). The `columns` and `rows` props define the layout of the grid. The layout can use the `area` prop to define grid areas for child components to explicitly place components. Alternatively, an implicit layout can be created using `autoColumns`, `autoRows`, and helper functions like `repeat`.

Similar to `flex`, a grid can justify and align items.

### Explicit grid

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

## Panel

## Dashboard

## View
