from deephaven import ui
from itertools import count
from typing import Any


@ui.component
def ui_basic_component():
    count, set_count = ui.use_state(0)
    text, set_text = ui.use_state("hello")

    def _handle_press(e: Any):
        set_count(lambda c: c + 1)

    handle_press = ui.use_callback(_handle_press, [])

    return ui.flex(
        ui.action_button(f"You pressed me {count} times", on_press=handle_press),
        ui.text_field(label="Greeting", value=text, on_change=set_text),
        ui.text(f"You typed {text}"),
        direction="column",
    )


@ui.component
def ui_multi_panel_component():
    return [
        ui.panel(ui.button("Hello"), title="foo"),
        ui.panel(ui.text("World"), title="bar"),
    ]


@ui.component
def ui_boom_component():
    raise Exception("BOOM!")


@ui.component
def ui_boom_counter_component():
    value, set_value = ui.use_state(0)

    if value > 1:
        raise ValueError("BOOM! Value too big.")

    return ui.button(f"Count is {value}", on_press=lambda _: set_value(value + 1))


@ui.component
def ui_cell(label: str = "Cell"):
    text, set_text = ui.use_state("")

    return ui.text_field(label=label, value=text, on_change=set_text)


@ui.component
def ui_cells_component():
    id_iter, _ = ui.use_state(lambda: count())
    cells, set_cells = ui.use_state(lambda: [next(id_iter)])

    def add_cell():
        set_cells(lambda old_cells: old_cells + [next(id_iter)])

    def delete_cell(delete_id: int):
        set_cells(lambda old_cells: [c for c in old_cells if c != delete_id])

    return ui.view(
        list(
            map(
                lambda i: ui.flex(
                    ui_cell(label=f"Cell {i}"),
                    ui.action_button(
                        ui.icon("trash"),
                        aria_label="Delete cell",
                        on_press=lambda _: delete_cell(i),
                    ),
                    align_items="end",
                    key=str(i),
                ),
                cells,
            )
        ),
        ui.action_button(ui.icon("add"), "Add cell", on_press=add_cell),
        overflow="auto",
    )


ui_component = ui_basic_component()
ui_multi_panel = ui_multi_panel_component()
ui_boom = ui_boom_component()
ui_boom_counter = ui_boom_counter_component()
ui_cells = ui_cells_component()

ui_dashboard = ui.dashboard(
    ui.column(
        ui.stack(
            ui.panel(ui_basic_component(), title="Component"),
            ui.panel(ui_boom_counter_component(), title="Boom Counter"),
            active_item_index=0,
            height=75,
        ),
        ui.row(
            ui_multi_panel_component(),
            height=25,
        ),
    )
)
