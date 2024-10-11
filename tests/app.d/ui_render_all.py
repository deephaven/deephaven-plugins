# This file is used as a high level way to ensure all UI components render
# without error. We should add more robust tests that reflect all of our
# examples as suggested by #417
from deephaven import ui, empty_table

icon_names = ["vsAccount"]
columns = [
    "Id=new Integer(i)",
    "Display=new String(`Display `+i)",
    "Description=new String(`Description `+i)",
    "Icon=(String) icon_names[0]",
]
_column_types = empty_table(20).update(columns)

_item_table_source_with_icons = ui.item_table_source(
    _column_types,
    key_column="Id",
    label_column="Display",
    icon_column="Icon",
)

_item_table_source_with_action_group = ui.item_table_source(
    _column_types,
    key_column="Id",
    label_column="Display",
    icon_column="Icon",
    actions=ui.list_action_group(
        ui.item("Edit"),
        ui.item("Delete"),
    ),
)

_item_table_source_with_action_menu = ui.item_table_source(
    _column_types,
    key_column="Id",
    label_column="Display",
    icon_column="Icon",
    actions=ui.list_action_menu(
        ui.item("Edit"),
        ui.item("Delete"),
    ),
)


@ui.component
def ui_components1():
    return (
        ui.action_button("Action Button"),
        ui.action_group("Aaa", "Bbb", "Ccc"),
        ui.action_menu("Aaa", "Bbb", "Ccc"),
        ui.button_group(ui.button("One"), ui.button("Two")),
        ui.button("Button"),
        ui.calendar(value="2021-01-01"),
        ui.checkbox("Checkbox"),
        ui.column("Column child A", "Column child B", "Column child C"),
        # TODO: #201 ui.combo_box("Combo Box"),
        ui.content("Content"),
        ui.contextual_help("Contextual Help"),
        ui.date_picker(label="Date Picker", value="2021-01-01"),
        ui.date_range_picker(
            label="Date Range Picker",
            value={"start": "2021-01-01", "end": "2021-01-02"},
        ),
        ui.flex("Flex default child A", "Flex default child B"),
        ui.flex("Flex column child A", "Flex column child B", direction="column"),
        ui.form("Form"),
        ui.fragment("Fragment"),
        ui.grid("Grid A", "Grid B"),
        ui.heading("Heading"),
    )


@ui.component
def ui_components2():
    return (
        ui.icon("vsSymbolMisc"),
        ui.illustrated_message(
            ui.icon("vsWarning"),
            ui.heading("Warning"),
            ui.content("This is a warning message."),
        ),
        ui.list_view(
            _item_table_source_with_action_group,
            aria_label="List View - List action group",
            min_height="size-1600",
        ),
        ui.list_view(
            _item_table_source_with_action_menu,
            aria_label="List View - List action menu",
            min_height="size-1600",
        ),
        ui.number_field("Number Field", aria_label="Number field"),
        ui.picker(
            "Aaa",
            "Bbb",
            ui.section("Ccc", "Ddd", title="Section A"),
            aria_label="Picker with Section",
        ),
        ui.picker(
            _item_table_source_with_icons, aria_label="Picker", default_selected_key=15
        ),
        ui.radio_group(
            ui.radio("One", value="one"),
            ui.radio("Two", value="two"),
            label="Radio Group",
            orientation="HORIZONTAL",
        ),
        ui.range_slider(default_value={"start": 10, "end": 99}, label="Range Slider"),
        ui.row("Row child A", "Row child B"),
        ui.slider(
            label="Slider",
            default_value=40,
            min_value=-100.0,
            max_value=100.0,
            step=0.1,
        ),
        ui.switch("Switch"),
        # TODO: #191
        # ui.tab_list("Tab List"),
        # ui.tab_panels("Tab Panels"),
        # ui.tabs("Tabs"),
        ui.text("Text"),
        ui.text_field(
            ui.icon("vsSymbolMisc"), default_value="Text Field", label="Text Field"
        ),
        ui.time_field(default_value="12:30:00", hour_cycle=24),
        ui.toggle_button(
            ui.icon("vsBell"),
            "By Exchange",
        ),
        ui.view("View"),
    )


@ui.component
def ui_html_elements():
    # TODO: render other ui.html elements #417
    ui.html.div("div"),


_my_components1 = ui_components1()
_my_components2 = ui_components2()
_my_html_elements = ui_html_elements()

ui_render_all1 = ui.dashboard(
    ui.stack(
        ui.panel(
            ui.table(_column_types),
            ui.grid(
                _my_components1,
                _my_html_elements,
                columns=["1fr", "1fr", "1fr"],
                width="100%",
            ),
            title="Panel B",
        ),
    )
)

ui_render_all2 = ui.dashboard(
    ui.stack(
        ui.panel(
            ui.grid(
                _my_components2,
                columns=["1fr", "1fr", "1fr"],
                width="100%",
            ),
            title="Panel C",
        ),
    )
)
