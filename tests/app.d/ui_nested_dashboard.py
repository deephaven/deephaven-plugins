"""
Test fixtures for nested dashboard functionality.
"""

from deephaven import ui


@ui.component
def nested_dashboard_component():
    """A simple nested dashboard inside a panel."""
    return ui.panel(
        ui.dashboard(
            ui.row(
                ui.panel(ui.text("Content A"), title="Panel A"),
                ui.panel(ui.text("Content B"), title="Panel B"),
            )
        ),
        title="Nested Dashboard",
    )


@ui.component
def nested_dashboard_interactive_component():
    """A nested dashboard with interactive elements."""
    count, set_count = ui.use_state(0)

    return ui.panel(
        ui.dashboard(
            ui.row(
                ui.panel(
                    ui.button(
                        f"Clicked {count} times",
                        on_press=lambda _: set_count(count + 1),
                    ),
                    title="Interactive Panel",
                ),
                ui.panel(ui.text(f"Click count: {count}"), title="Display Panel"),
            )
        ),
        title="Interactive Nested Dashboard",
    )


@ui.component
def deeply_nested_dashboard_component():
    """A dashboard nested inside a panel, which is inside another dashboard."""
    return ui.panel(
        ui.dashboard(
            ui.row(
                ui.panel(ui.text("Content Level 1"), title="Level 1"),
                ui.panel(
                    ui.dashboard(
                        ui.row(
                            ui.panel(ui.text("Content Level 2"), title="Level 2"),
                            ui.panel(ui.text("Deepest Content"), title="Deepest Panel"),
                        )
                    ),
                    title="Nested Dashboard Container",
                ),
            )
        ),
        title="Outer Dashboard",
    )


@ui.component
def nested_dashboard_with_state_component():
    """A nested dashboard that tests state persistence."""
    text, set_text = ui.use_state("")

    return ui.panel(
        ui.dashboard(
            ui.column(
                ui.panel(
                    ui.text_field(label="Enter text", value=text, on_change=set_text),
                    title="Input Panel",
                ),
                ui.panel(ui.text(f"You typed: {text}"), title="Output Panel"),
            )
        ),
        title="Stateful Nested Dashboard",
    )


from deephaven import ui


@ui.component
def buggy_drag_panel():
    """
    DH-22743: A panel that can be dragged to a new stack, then updated to test for drag-related bugs.
    In the bug described, it would duplicate the panel in the original location and the moved panel would go blank.
    """
    title, set_title = ui.use_state("title")

    # Return it in a nested dashboard so it's easier to test
    return ui.panel(
        ui.dashboard(
            ui.stack(
                ui.panel(
                    ui.text_field(
                        default_value=title, on_change=set_title, label="Title"
                    ),
                    title="Input",
                ),
                ui.panel(
                    ui.text("Drag this panel to a new stack, then change the value"),
                    title=f"Drag me: {title}",
                ),
            )
        )
    )


# Export the test components
ui_nested_dashboard = nested_dashboard_component()
ui_nested_dashboard_interactive = nested_dashboard_interactive_component()
ui_deeply_nested_dashboard = deeply_nested_dashboard_component()
ui_nested_dashboard_with_state = nested_dashboard_with_state_component()
ui_buggy_drag_panel = buggy_drag_panel()
