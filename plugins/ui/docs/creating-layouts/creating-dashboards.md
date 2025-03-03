# Creating Dashboards

When creating a workflow in `deephaven.ui`, components are laid out in a [`panel`](../components/panel.md) and those `panels` are then laid out in a [`dashboard`](../components/dashboard.md).

The [`dashboard`](../components/dashboard.md) is the top level component that allows you to create a page layout containing a collection of components. The user can move and resize panels within the dashboard in [`rows`](../components/dashboard.md#row-api-reference), [`columns`](../components/dashboard.md#column-api-reference), and [`stacks`](../components/dashboard.md#stack-api-reference).

## Dashboard rules

1. Dashboards must be a child of the root script and not nested inside a `@ui.component`. Otherwise, the application cannot correctly determine the type of the component.
2. Dashboards must have one and only one child, typically a row or column.
3. Height and width of panels are summed to 100% within a row or column.

## Dashboard key components

Four main children make up a dashboard: row, column, stack, and panels.

- [**Row**](../components/dashboard.md#row-api-reference): A container used to group elements horizontally. Each element is placed to the right of the previous one.
- [**Column**](../components/dashboard.md#column-api-reference): A container used to group elements vertically. Each element is placed below the previous one.
- [**Stack**](../components/dashboard.md#stack-api-reference): A container used to group elements into a stack of tabs. Each element gets its own tab, with only one element visible at a time.
- [**Panel**](../components/panel.md): A container used to group and label elements.

## Layout Hierarchy

### Top-Level

Your dashboard must start with a row or column, which is the "top" of the layout tree. Columns should go inside rows and rows should go inside columns

Note: Nesting rows within rows or columns within columns will sub-divide the row or column.

### Bottom-Level

Stacks and panels are considered the "bottom" of the layout tree. Once added, the layout in that section is considered complete. You can't further nest stacks within panels. For layouts within a panel, see [`tabs`](../components/tabs.md), [`flex`](../components/flex.md), `grid`, and [`view`](../components/view.md).

## Automatic Wrapping

Children are implicitly wrapped when necessary, so the entire layout does not need to be explicitly defined.

End to end example: `dashboard([t1, t2])` would become `dashboard(column(stack(panel(t1)), stack(panel(t2))))`.

Automatic wrapping is applied by the following rules:

1. Dashboard: wrap in row/column if no single node is the default (e.g., `[t1, t2]` as the child to the dashboard would become `row(t1, t2)`).
2. Row/Column:
   - If there are children that are rows/columns, wrap the non-wrapped children with the same element (e.g., `row(col(t1), t2)` becomes `row(col(t1), col(t2))`).
   - If none of the children are wrapped by rows/columns, they are wrapped in stacks (e.g., `row(col(t1), col(t2))` from above becomes `row(col(stack(t1)), col(stack(t2)))`).
3. Stacks: wrap non-panel children in panels (e.g., `row(col(stack(t1)), col(stack(t2)))` becomes `row(col(stack(panel(t1))), col(stack(panel(t2))))`).

## Layout Examples

### Row split (2x1)

```python
from deephaven import ui

dash_2x1 = ui.dashboard(ui.row(ui.panel("A", title="A"), ui.panel("B", title="B")))
```

### Column split (1x2)

```python
from deephaven import ui

dash_1x2 = ui.dashboard(ui.column(ui.panel("A", title="A"), ui.panel("B", title="B")))
```

### 2x2

```python
from deephaven import ui

dash_2x2 = ui.dashboard(
    ui.row(
        ui.column(ui.panel("A", title="A"), ui.panel("C", title="C")),
        ui.column(ui.panel("B", title="B"), ui.panel("D", title="D")),
    )
)
```

### 3x1

```python
from deephaven import ui

dash_3x1 = ui.dashboard(
    ui.row(ui.panel("A", title="A"), ui.panel("B", title="B"), ui.panel("C", title="C"))
)
```

### Basic stack

```python
from deephaven import ui

dash_stack = ui.dashboard(
    ui.stack(
        ui.panel("A", title="A"), ui.panel("B", title="B"), ui.panel("C", title="C")
    )
)
```

### Stack with nested tabs

```python
from deephaven import ui

dash_stack = ui.dashboard(
    ui.stack(
        ui.panel(
            ui.tabs(ui.tab("A1 content", title="A1"), ui.tab("A2 content", title="A2")),
            title="A",
        ),
        ui.panel(
            ui.tabs(ui.tab("B1 content", title="B1"), ui.tab("B2 content", title="B2")),
            title="B",
        ),
    )
)
```

### Stack in a layout

```python
from deephaven import ui

dash_layout_stack = ui.dashboard(
    ui.row(
        ui.stack(
            ui.panel("A", title="A"), ui.panel("B", title="B"), ui.panel("C", title="C")
        ),
        ui.panel("D", title="D"),
        ui.panel("E", title="E"),
    )
)
```

## Combined example

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

## Multiple dashboards
