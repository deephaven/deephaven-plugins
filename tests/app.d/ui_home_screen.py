# ruff: noqa
# This example creates a bunch of dashboards, then creates a "home page" that displays a menu of the dashboards on the left, and the embedded dashboard on the right.
# Simply run this code snippet, then navigate to http://localhost:10000/iframe/widget/?name=home
# Creating example dashboards
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
    [
        "Date=today.plusSeconds(SECONDS_IN_DAY*i)",
        "Value=i%2==0 ? `A` : `B`",
        "Row=i",
    ]
)
_example_dashboard = ui.dashboard(
    create_dashboard(today, today.plusSeconds(SECONDS_IN_DAY * 10), _table)
)

_stocks = dx.data.stocks()
_dash_2x1 = ui.dashboard(ui.row(ui.panel("A", title="A"), ui.panel("B", title="B")))
_dash_1x2 = ui.dashboard(ui.column(ui.panel("A", title="A"), ui.panel("B", title="B")))
_dash_2x2 = ui.dashboard(
    ui.row(
        ui.column(ui.panel("A", title="A"), ui.panel("C", title="C")),
        ui.column(ui.panel("B", title="B"), ui.panel("D", title="D")),
    )
)
_dash_3x1 = ui.dashboard(
    ui.row(ui.panel("A", title="A"), ui.panel("B", title="B"), ui.panel("C", title="C"))
)
_dash_stack = ui.dashboard(
    ui.stack(
        ui.panel("A", title="A"), ui.panel("B", title="B"), ui.panel("C", title="C")
    )
)
_dash_stack_nested = ui.dashboard(
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
_dash_layout_stack = ui.dashboard(
    ui.row(
        ui.stack(
            ui.panel("A", title="A"), ui.panel("B", title="B"), ui.panel("C", title="C")
        ),
        ui.panel("D", title="D"),
        ui.panel("E", title="E"),
    )
)
_double_dash = ui.dashboard(
    ui.row(
        ui.panel(
            "In this example dashboard, we show how one can make a dashboard with no headers, display UI panel on the left and display another dashboard in a panel on the right. This could be another home screen."
        ),
        ui.panel(_example_dashboard),
    ),
    show_headers=False,
)
# End of creating dashboards


from deephaven import ui
from typing import Callable

simple_dashboards = {}
for i in range(0, 10):
    simple_dashboards[f"Dashboard {i}"] = ui.dashboard(
        ui.panel(ui.heading(f"Dashboard {i}"))
    )

layout_dashboards = {
    "Row split (2x1)": _dash_2x1,
    "Column split (1x2)": _dash_1x2,
    "2x2": _dash_2x2,
    "3x1": _dash_3x1,
    "Basic stack": _dash_stack,
    "Nested stack": _dash_stack_nested,
    "Stack in a layout": _dash_layout_stack,
}

complex_dashboards = {
    "Example Dashboard": _example_dashboard,
    "Nested Dashboard": _double_dash,
}


@ui.component
def dashboard_list(dashboards, on_select: Callable[[any], None]):
    return ui.flex(
        map(
            lambda k: ui.button(
                k, on_press=lambda: on_select(dashboards[k]), variant="ghost"
            ),
            dashboards,
        ),
        direction="Column",
    )


@ui.component
def dashboard_menu(on_select: Callable[[any], None]):
    return ui.accordion(
        ui.disclosure(
            "Simple dashboards", dashboard_list(simple_dashboards, on_select=on_select)
        ),
        ui.disclosure(
            "Layout dashboards", dashboard_list(layout_dashboards, on_select=on_select)
        ),
        ui.disclosure(
            "Complex dashboards",
            dashboard_list(complex_dashboards, on_select=on_select),
        ),
    )


@ui.component
def home_screen():
    active_dashboard, set_active_dashboard = ui.use_state(None)

    return ui.dashboard(
        ui.row(
            ui.column(
                ui.panel(dashboard_menu(on_select=set_active_dashboard)), width=20
            ),
            ui.panel(
                ui.view(
                    active_dashboard,
                    key=None if active_dashboard is None else id(active_dashboard),
                    width="100%",
                    height="100%",
                )
            ),
        ),
        show_headers=False,
    )


# Show the home screen nested within itself for funsies
complex_dashboards["Nested Homescreen"] = home_screen()

ui_home_screen = home_screen()
