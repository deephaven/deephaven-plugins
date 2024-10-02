from deephaven import ui
from deephaven.plot import express as dx
from deephaven import empty_table

_t_flex = empty_table(100).update(["x = i", "y = sin(i)"])
_p_flex = dx.line(_t_flex, x="x", y="y")


@ui.component
def ui_flex_text_field_input_types_examples():
    return [
        ui.form(
            ui.text_field(label="Name", type="text", is_required=True),
            ui.text_field(label="Personal Website", type="url", is_required=True),
            ui.text_field(label="Phone", type="tel", is_required=True),
            ui.text_field(label="Email", type="email", is_required=True),
            ui.text_field(label="Password", type="password", is_required=True),
            ui.text_field(label="Search Bar", type="search"),
            validation_behavior="native",
        ),
        _t_flex,
    ]


@ui.component
def ui_flex_test_component():
    return [ui.text_field(), _t_flex, _t_flex]


flex_0 = ui_flex_test_component()
flex_1 = ui_flex_text_field_input_types_examples()
flex_2 = ui.panel(_t_flex, _t_flex, background_color="red")
flex_3 = ui.button("test")
flex_4 = ui.text_field(label="test", label_position="side")
flex_5 = ui.panel(
    ui.flex(_t_flex, _t_flex, direction="column"), background_color="blue"
)
flex_6 = ui.panel(ui.flex(_t_flex, _t_flex, direction="row"), background_color="green")
flex_7 = ui.panel(_t_flex, _p_flex, direction="row")
flex_8 = ui.panel(_t_flex, _p_flex)
flex_9 = ui.panel(ui.text_field(label="test"), _t_flex)
flex_10 = ui.panel(
    ui.flex(ui.flex(_t_flex, _t_flex), ui.button("hello")), ui.text_field()
)
flex_11 = ui.panel(
    ui.flex(ui.flex(_p_flex, _p_flex), ui.button("hello")), ui.text_field()
)
flex_12 = ui.panel(_p_flex, _p_flex, direction="row")
flex_13 = ui.panel(_p_flex, _p_flex)
flex_14 = ui.flex(
    ui.button("hello flex"), align_items="center", justify_content="center"
)
flex_15 = ui.panel(
    ui.button("hello panel"), align_items="center", justify_content="center"
)
flex_16 = ui.panel(ui.flex(ui.flex(_t_flex, _t_flex)))
flex_17 = ui.panel(
    ui.flex(ui.button("test"), ui.action_button("test"), direction="column")
)
flex_18 = ui.panel(
    ui.form(
        ui.text_field(label="Name", label_position="side"),
        ui.text_field(label="Name", label_position="side"),
        ui.text_field(label="Name", label_position="side"),
        ui.text_field(label="Name", label_position="side"),
    ),
)
flex_19 = ui.panel(
    ui.grid(ui.button("test"), _t_flex, _p_flex, rows="min-content 1fr 1fr")
)
flex_20 = ui.panel(
    ui.tabs(
        ui.tab(_p_flex, title="Tab A"),
        ui.tab(_t_flex, title="Tab B"),
    )
)
flex_21 = ui.panel(
    ui.button("Test"),
    ui.tabs(
        ui.tab(_p_flex, title="Tab A"),
        ui.tab(_t_flex, title="Tab B"),
    ),
    ui.button("Test"),
    _t_flex,
)
