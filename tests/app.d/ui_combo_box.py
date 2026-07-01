from deephaven import ui


@ui.component
def ui_combo_box_basic():
    value, set_value = ui.use_state(None)
    return ui.flex(
        ui.combo_box(
            "Option A",
            "Option B",
            "Option C",
            label="Select an option",
            on_change=set_value,
        ),
        ui.text(f"Selected: {value}"),
        direction="column",
    )


@ui.component
def ui_combo_box_controlled():
    value, set_value = ui.use_state("Option B")
    return ui.flex(
        ui.combo_box(
            "Option A",
            "Option B",
            "Option C",
            label="Controlled",
            selected_key=value,
            on_change=set_value,
        ),
        ui.text(f"Selected: {value}"),
        direction="column",
    )


cb_basic = ui_combo_box_basic()
cb_controlled = ui_combo_box_controlled()
