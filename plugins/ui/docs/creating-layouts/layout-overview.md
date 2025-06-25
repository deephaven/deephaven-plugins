# Layout Overview

When using `deephaven.ui` to build complex workflows with multiple components, it is important to arrange these components to create a user-friendly and intuitive interface. `deephaven.ui` offers various layouts that allow you to define the arrangement of components in terms of order, size, and spacing.

In `deephaven.ui`, you will have a `dashboard` that contains `panels`. The `panels` contain `components` which are arranged by various layouts.

## Dashboard

- [`dashboard`](../components/dashboard.md) is a full page top level container comprised of panels and stacks of panels, which the user can re-arrange. Dashboards cannot nest within other dashboards or panels.
- [`panel`](../components/panel.md) is a container that is presented as individual tabs in a `dashboard` that can be moved to different positions by dragging the tabs. A `panel` contains components and arranges them using layouts. Panels cannot nest within other panels.

The [`dashboard`](../components/dashboard.md) component allows you to create a page layout containing a collection of components. The user can move and resize panels within the dashboard.

### Dashboard rules

1. Dashboards must be a child of the root script and not nested inside a `@ui.component`. Otherwise, the application cannot correctly determine the type of the component.
2. Dashboards must have one and only one child, typically a row or column.
3. Height and width of panels are summed to 100% within a row or column.

## Dashboard key components

Four main children make up a dashboard: row, column, stack, and panels.

- [**Row**](../components/dashboard.md#row-api-reference): A container used to group elements horizontally. Each element is placed to the right of the previous one.
- [**Column**](../components/dashboard.md#column-api-reference): A container used to group elements vertically. Each element is placed below the previous one.
- [**Stack**](../components/dashboard.md#stack-api-reference): A container used to group elements into a stack of tabs. Each element gets its own tab, with only one element visible at a time.
- [**Panel**](../components/panel.md): A container used to group and label elements.

```python
from deephaven import ui

dashboard_example = ui.dashboard(
    ui.column(
        ui.panel("Header", title="Header"),
        ui.row(
            ui.panel("Left Sidebar", title="Left Sidebar"),
            ui.stack(
                ui.panel("Main Content", title="Main Content"),
                ui.panel("Sub Content", title="Sub Content"),
                width=70,
            ),
            ui.panel("Right Sidebar", title="Right Sidebar"),
        ),
        ui.panel("Footer", title="Footer"),
    )
)
```

## Panel

The [`panel`](../components/panel.md) component is a container designed to group and organize elements within a dashboard. It contains a flex layout by default. Panels are presented as individual tabs that can be moved to different positions by dragging the tabs around. By default, the top-level return of a `@ui.component` is automatically wrapped in a panel, so you only need to define a panel explicitly if you want to customize it or nest panels in a dashboard. Customizations can include setting a custom tab title, background color or customizing the flex layout.

```python
from deephaven import ui

my_nested_panel = ui.dashboard(
    [
        ui.panel(ui.heading("A"), ui.text_field(), title="A"),
        ui.panel(ui.heading("B"), ui.text_field(), title="B", direction="row"),
    ]
)
```

## Layouts

The following layouts can be returned by a component and used inside a `panel` to layout components:

- [`flex`](../components/flex.md) is a [flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox)-based layout container that arranges components in either a row or column.
- [`grid`](../components/grid.md) is a [CSS grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids) layout container that arranges components in a two-dimensional structure of rows and columns.
- [`view`](../components/view.md) is a general purpose container that can be used for custom styling purposes.

## Default layout

The top-level return of a `@ui.component` is automatically wrapped in a `panel` with a `flex` layout. Returning a single component or a list of components will have this default layout.

```python order=single_example,list_example
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

The [`grid`](../components/grid.md) component can be used to layout its children in two dimensions with [CSS grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids). The `columns` and `rows` props define the layout of the grid. The layout can use the `area` prop to define grid areas for child components to explicitly place components. Alternatively, an implicit layout can be created using `auto_columns`, `auto_rows`, and helper functions like `repeat`.

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

## View

The [`view`](../components/view.md) component is a general purpose container with no specific semantics that can be used for custom styling purposes. It supports Deephaven UI style props to ensure consistency with other components and is analogous to an HTML `<div>`.

```python order=view,view_overflow
from deephaven import ui

view = ui.view(
    ui.text_field(label="Name"),
    border_width="thin",
    border_color="accent-400",
    background_color="seafoam-500",
    border_radius="medium",
    padding="size-250",
)

view_overflow = ui.view(
    [ui.text_field(label=f"{i}", width="size-3000") for i in range(50)],
    border_width="thin",
    border_color="accent-400",
    background_color="seafoam-500",
    border_radius="medium",
    padding="size-250",
    overflow=True,
)
```
