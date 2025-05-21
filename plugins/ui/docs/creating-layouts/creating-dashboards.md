# Creating Dashboards

When creating a workflow in `deephaven.ui`, components are laid out in a [`panel`](../components/panel.md) and those `panels` are then laid out in a [`dashboard`](../components/dashboard.md).

The [`dashboard`](../components/dashboard.md) is the top-level component that allows you to create a page layout containing a collection of components. The user can move and resize panels within the dashboard in [`rows`](../components/dashboard.md#row-api-reference), [`columns`](../components/dashboard.md#column-api-reference), and [`stacks`](../components/dashboard.md#stack-api-reference).

In the previous section, we went over the important rules of `dashboards` and the basics of how to lay out `panels` in a `dashboard` with [`ui.row`](../components/dashboard.md#row-api-reference), [`ui.column`](../components/dashboard.md#column-api-reference), and [`ui.stack`](../components/dashboard.md#stack-api-reference). This section covers more advanced topics.

## Layout Hierarchy

### Top-Level

Your dashboard must start with a row or column, which is the "top" of the layout tree. Columns should go inside rows, and rows should go inside columns.

Note: Nesting rows within rows or columns within columns will sub-divide the row or column.

### Bottom-Level

Stacks and panels are considered the "bottom" of the layout tree. Once added, the layout in that section is considered complete. You can't further nest stacks within panels. For layouts within a panel, see [`tabs`](../components/tabs.md), [`flex`](../components/flex.md), `grid`, and [`view`](../components/view.md).

## Automatic Wrapping

Children are implicitly wrapped when necessary, so the entire layout does not need to be explicitly defined.

End to end example: `dashboard([t1, t2])` would become `dashboard(column(stack(panel(t1)), stack(panel(t2))))`.

Automatic wrapping is applied by the following rules:

1. Dashboard: wrap in row/column if no single node is the default. For example, `[t1, t2]` as the child to the dashboard would become `row(t1, t2)`.
2. Row/Column:
   - If there are children that are rows/columns, wrap the non-wrapped children with the same element. For example, `row(col(t1), t2)` becomes `row(col(t1), col(t2))`.
   - If none of the children are wrapped by rows/columns, they are wrapped in stacks. For example, `row(col(t1), col(t2))` from above becomes `row(col(stack(t1)), col(stack(t2)))`.
3. Stacks: wrap non-panel children in panels. For example, `row(col(stack(t1)), col(stack(t2)))` becomes `row(col(stack(panel(t1))), col(stack(panel(t2))))`.

## Multiple dashboards

To create multiple dashboards, you can return more than one `dashboard` from your script.

```python order=dash_2x1,dash_1x2,dash_2x2
from deephaven import ui

dash_2x1 = ui.dashboard(ui.row(ui.panel("A", title="A"), ui.panel("B", title="B")))

dash_1x2 = ui.dashboard(ui.column(ui.panel("A", title="A"), ui.panel("B", title="B")))

dash_2x2 = ui.dashboard(
    ui.row(
        ui.column(ui.panel("A", title="A"), ui.panel("C", title="C")),
        ui.column(ui.panel("B", title="B"), ui.panel("D", title="D")),
    )
)
```

## Sharing state between multiple panels in a dashboard

As `deephaven.ui` components are spread across multiple `panels` in a dashboard, those components will need to interact and respond to changes in components in different panels. This means sharing state between components.

In the sections on [sharing state](../managing-state/share-state-between-components.md), we learned to "lift state up" to a common parent in order to share it between multiple components. However, one of the rules of a `dashboard` is that it must be a child of the root script and not nested inside a `@ui.component`. This means that state cannot be lifted up into a component that returns a `dashboard`.

How, then, do we lift state up to share it between `panels` in a `dashboard`? A `ui.row` or a `ui.column` can be returned from a `@ui.component` containing state for the dashboard.

In the example, `create_dashboard` contains the state variables shared across multiple panels. It then returns a `ui.row` which is used as the root layout for a `dashboard`. This allows the UI elements in the `control_panel` component to apply a filter to table and plot located in separate `panels`.

```python order=example_dashboard,_table
from deephaven.time import dh_now
from deephaven import time_table, ui
import deephaven.plot.express as dx

# The control panel contain UI elements to set filtering
@ui.component
def control_panel(filter_type, set_filter_type, dates, set_dates, value, set_value):
    return ui.panel(
        ui.radio_group(
            ui.radio("Date"),
            ui.radio("Value"),
            value=filter_type,
            on_change=set_filter_type,
            label="Filter type",
        ),
        ui.date_range_picker(label="Date filter", value=dates, on_change=set_dates),
        ui.picker(
            "A", "B", selected_key=value, on_change=set_value, label="Value filter"
        ),
        title="Controls",
    )


# The create dashboard component contains the state variables and returns the ui.row
@ui.component
def create_dashboard(start_date, end_date, table):
    # State to choose the filter type
    filter_type, set_filter_type = ui.use_state("Date")

    # State variable to filter by Value column
    value, set_value = ui.use_state("A")

    # State variable to filter by Date column
    dates, set_dates = ui.use_state({"start": start_date, "end": end_date})
    start = dates["start"]
    end = dates["end"]

    # handler to filter the table
    def handle_filter(filter_type, start, end, value, table):
        if filter_type == "Date":
            return table.where("Date >= start && Date < end")
        else:
            return table.where("Value=value")

    # memoize table operations and plots
    filtered_table = ui.use_memo(
        lambda start=start, end=end: handle_filter(
            filter_type, start, end, value, table
        ),
        [filter_type, start, end, value, table],
    )
    plot = ui.use_memo(
        lambda: dx.line(filtered_table, x="Date", y="Row"), [filtered_table]
    )

    # This row will be the root layout for the dashboard
    return ui.row(
        control_panel(filter_type, set_filter_type, dates, set_dates, value, set_value),
        ui.column(
            ui.stack(
                ui.panel(filtered_table, title="Filter table"),
                ui.panel(table, title="Original table"),
                active_item_index=0,
            ),
            ui.panel(plot, title="Plot"),
        ),
    )


SECONDS_IN_DAY = 86400
today = dh_now()
_table = time_table("PT1s").update_view(
    ["Date=today.plusSeconds(SECONDS_IN_DAY*i)", "Value=i%2==0 ? `A` : `B`", "Row=i"]
)
example_dashboard = ui.dashboard(
    create_dashboard(today, today.plusSeconds(SECONDS_IN_DAY * 10), _table)
)
```
