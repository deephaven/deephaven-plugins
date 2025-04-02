from deephaven import ui
from deephaven.plot import express as dx
from deephaven import empty_table

_t_grid = empty_table(100).update(["x = i", "y = sin(i)"])
# By default, dx.line renders with webgl but some tests use the trace class to see if the chart is rendered,
# which is not there in webgl.
_p_grid = dx.line(_t_grid, x="x", y="y", render_mode="svg")


# TODO change all flexes to grids
@ui.component
def ui_grid_text_field_input_types_examples():
    return ui.grid(
        ui.form(
            ui.text_field(label="Name", type="text", is_required=True),
            ui.text_field(label="Personal Website", type="url", is_required=True),
            ui.text_field(label="Phone", type="tel", is_required=True),
            ui.text_field(label="Email", type="email", is_required=True),
            ui.text_field(label="Password", type="password", is_required=True),
            ui.text_field(label="Search Bar", type="search"),
            validation_behavior="native",
        ),
        _t_grid,
    )


@ui.component
def ui_grid_test_component():
    return ui.grid(ui.text_field(), _t_grid, _t_grid)


grid_0 = ui_grid_test_component()
grid_1 = ui_grid_text_field_input_types_examples()
grid_2 = ui.panel(ui.grid(_t_grid, _t_grid), background_color="red")
grid_3 = ui.grid(ui.button("test"))
grid_4 = ui.grid(ui.text_field(label="test", label_position="side"))
grid_5 = ui.panel(
    ui.grid(_t_grid, _t_grid, rows=["auto", "auto"]), background_color="blue"
)
grid_6 = ui.panel(
    ui.grid(_t_grid, _t_grid, columns=["auto", "auto"]), background_color="green"
)
grid_7 = ui.panel(ui.grid(_t_grid, _p_grid, columns=["auto", "auto"]))
grid_8 = ui.panel(ui.grid(_t_grid, _p_grid))
grid_9 = ui.panel(ui.grid(ui.text_field(label="test"), _t_grid))
grid_10 = ui.panel(
    ui.grid(ui.flex(_t_grid, _t_grid), ui.button("hello")), ui.text_field()
)
grid_11 = ui.panel(
    ui.grid(ui.flex(_p_grid, _p_grid), ui.button("hello")), ui.text_field()
)
grid_12 = ui.panel(ui.grid(_p_grid, _p_grid, columns=["auto", "auto"]))
grid_13 = ui.panel(ui.grid(_p_grid, _p_grid))
grid_14 = ui.grid(
    ui.button("hello flex"), align_items="center", justify_content="center"
)
grid_15 = ui.panel(
    ui.grid(ui.button("hello panel"), align_items="center", justify_content="center")
)
grid_16 = ui.panel(ui.grid(ui.grid(_t_grid, _t_grid)))
grid_17 = ui.panel(
    ui.grid(ui.button("test"), ui.action_button("test"), rows=["auto", "auto"])
)
grid_18 = ui.panel(
    ui.grid(
        ui.form(
            ui.text_field(label="Name", label_position="side"),
            ui.text_field(label="Name", label_position="side"),
            ui.text_field(label="Name", label_position="side"),
            ui.text_field(label="Name", label_position="side"),
        ),
    )
)
grid_19 = ui.panel(
    ui.grid(ui.button("test"), _t_grid, _p_grid, rows="min-content 1fr 1fr")
)
grid_20 = ui.panel(
    ui.grid(
        ui.tabs(
            ui.tab(_p_grid, title="Tab A"),
            ui.tab(_t_grid, title="Tab B"),
        )
    )
)
grid_21 = ui.panel(
    ui.grid(
        ui.button("Test"),
        ui.tabs(
            ui.tab(_p_grid, title="Tab A"),
            ui.tab(_t_grid, title="Tab B"),
        ),
        ui.button("Test"),
        _t_grid,
    )
)
grid_22 = ui.panel(
    ui.grid(ui.table(_t_grid, margin="20px"), _t_grid, rows=["auto", "auto"])
)
grid_23 = ui.panel(
    ui.grid(ui.table(_t_grid, margin="20px"), _t_grid, columns=["auto", "auto"])
)
grid_24 = ui.panel(
    ui.grid(ui.table(_t_grid, height="200px"), _t_grid, rows=["auto", "auto"])
)
