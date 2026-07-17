from deephaven import ui


@ui.component
def ui_multi_select_basic():
    values, set_values = ui.use_state(None)
    return ui.flex(
        ui.multi_select(
            "Option A",
            "Option B",
            "Option C",
            "Option D",
            label="Select options",
            on_change=set_values,
        ),
        ui.text(f"Count: {len(values) if values else 0}"),
        direction="column",
    )


@ui.component
def ui_multi_select_controlled():
    values, set_values = ui.use_state(["Option A", "Option C"])
    return ui.flex(
        ui.multi_select(
            "Option A",
            "Option B",
            "Option C",
            "Option D",
            label="Controlled",
            selected_keys=values,
            on_change=set_values,
        ),
        ui.text(f"Count: {len(values) if values else 0}"),
        direction="column",
    )


ms_basic = ui_multi_select_basic()
ms_controlled = ui_multi_select_controlled()
