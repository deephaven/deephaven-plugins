from typing import Any

from deephaven import ui


@ui.component
def ui_query_params_component():
    """Displays all query params as text elements for e2e verification."""
    params = ui.use_query_params()

    if not params:
        return ui.panel(ui.text("No query params"), title="Query Params")

    items = []
    for key, values in params.items():
        for value in values:
            items.append(ui.text(f"{key}={value}", key=f"{key}-{value}"))

    return ui.panel(
        ui.flex(*items, direction="column"),
        title="Query Params",
    )


@ui.component
def ui_query_param_single_component():
    """Displays a single 'page' query param value."""
    page_val = ui.use_query_param("page")
    return ui.panel(
        ui.text(f"page={page_val}" if page_val is not None else "page=None"),
        title="Query Param Single",
    )


@ui.component
def ui_set_query_param_component():
    """Has a button that sets a query param when clicked."""
    page_val = ui.use_query_param("counter")
    set_counter = ui.use_set_query_param("counter")

    current = int(page_val) if page_val is not None else 0

    def handle_press(_event: Any):
        set_counter(str(current + 1))

    return ui.panel(
        ui.flex(
            ui.text(f"counter={current}"),
            ui.action_button(
                f"Increment (current: {current})",
                on_press=handle_press,
            ),
            direction="column",
        ),
        title="Set Query Param",
    )


ui_query_params = ui_query_params_component()
ui_query_param_single = ui_query_param_single_component()
ui_set_query_param = ui_set_query_param_component()
