"""
Test fixtures for dashboard/layout persistence.

These fixtures back the tests in ``tests/ui_dashboard_persistence.spec.ts``.
Each exercises a different kind of state that should survive a page refresh
when the layout is persisted (i.e. "Close Panels on Disconnect" disabled):

- ``ui_persist_inputs``: controlled text fields and pickers keep their values.
- ``ui_persist_move_panel``: a moved panel stays where it was dropped.
- ``ui_persist_stack``: the active tab of a stack of panels is retained.
- ``ui_persist_tabs``: the selected tab of a ``ui.tabs`` component is retained.
- ``ui_persist_table_columns``: custom columns added to a ``ui.table`` persist.
"""

from deephaven import ui, empty_table


@ui.component
def persist_inputs_component():
    """A panel with controlled text fields and pickers.

    The values are held in server-side state so that, when the widget
    reconnects after a refresh, the selected values should be restored.
    """
    text, set_text = ui.use_state("")
    number_text, set_number_text = ui.use_state("")
    color, set_color = ui.use_state(None)
    fruit, set_fruit = ui.use_state(None)

    return ui.panel(
        ui.text_field(
            label="Name",
            value=text,
            on_change=set_text,
        ),
        ui.text_field(
            label="Amount",
            value=number_text,
            on_change=set_number_text,
        ),
        ui.picker(
            "Red",
            "Green",
            "Blue",
            label="Color",
            selected_key=color,
            on_selection_change=set_color,
        ),
        ui.picker(
            "Apple",
            "Banana",
            "Cherry",
            label="Fruit",
            selected_key=fruit,
            on_selection_change=set_fruit,
        ),
        title="Persist Inputs",
    )


@ui.component
def persist_move_panel_component():
    """A nested dashboard whose panels can be rearranged via drag-and-drop.

    The panels start stacked together; a test drags one into its own stack and
    verifies the new location is retained after a refresh.
    """
    return ui.panel(
        ui.dashboard(
            ui.stack(
                ui.panel(ui.text("Content A"), title="Move Panel A"),
                ui.panel(ui.text("Content B"), title="Move Panel B"),
            )
        ),
        title="Persist Move Panel",
    )


@ui.component
def persist_stack_component():
    """A nested dashboard with a single stack of three panels.

    The active tab of the stack should persist across a refresh.
    """
    return ui.panel(
        ui.dashboard(
            ui.stack(
                ui.panel(ui.text("Content One"), title="Stack Panel 1"),
                ui.panel(ui.text("Content Two"), title="Stack Panel 2"),
                ui.panel(ui.text("Content Three"), title="Stack Panel 3"),
            )
        ),
        title="Persist Stack",
    )


@ui.component
def persist_tabs_component():
    """A panel containing a ``ui.tabs`` component.

    The selected tab should persist across a refresh.
    """
    return ui.panel(
        ui.tabs(
            ui.tab(ui.text("This is the content of the first tab."), title="Tab One"),
            ui.tab(ui.text("This is the content of the second tab."), title="Tab Two"),
            ui.tab(ui.text("This is the content of the third tab."), title="Tab Three"),
        ),
        title="Persist Tabs",
    )


@ui.component
def persist_table_columns_component():
    """A nested dashboard with multiple tables in a stack.

    Custom columns added to a table through the UI should persist across a
    refresh.
    """
    _t1 = empty_table(20).update(["a = i", "b = i * 2"])
    _t2 = empty_table(20).update(["c = i", "d = i * 3"])
    return ui.panel(
        ui.dashboard(
            ui.stack(
                ui.panel(ui.table(_t1), title="Table One"),
                ui.panel(ui.table(_t2), title="Table Two"),
            )
        ),
        title="Persist Table Columns",
    )


# Export the test components
ui_persist_inputs = persist_inputs_component()
ui_persist_move_panel = persist_move_panel_component()
ui_persist_stack = persist_stack_component()
ui_persist_tabs = persist_tabs_component()
ui_persist_table_columns = persist_table_columns_component()
