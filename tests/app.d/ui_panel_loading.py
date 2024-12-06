from deephaven import ui
import time


@ui.component
def ui_boom_button():
    value, set_value = ui.use_state(0)

    if value > 0:
        raise ValueError("BOOM! Value too big.")

    return ui.button("Go BOOM!", on_press=lambda _: set_value(value + 1))


@ui.component
def ui_slow_multi_panel_component():
    is_mounted, set_is_mounted = ui.use_state(None)
    if not is_mounted:
        time.sleep(1)
        set_is_mounted(ui_boom_button)  # type: ignore Use a complex value that won't save between page loads
    return [
        ui.panel(ui.button("Hello")),
        ui.panel(ui.text("World")),
        ui.panel(ui_boom_button()),
    ]


ui_slow_multi_panel = ui_slow_multi_panel_component()
