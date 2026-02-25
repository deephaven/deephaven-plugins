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


# Export the test components
ui_nested_dashboard = nested_dashboard_component()
ui_nested_dashboard_interactive = nested_dashboard_interactive_component()
ui_deeply_nested_dashboard = deeply_nested_dashboard_component()
ui_nested_dashboard_with_state = nested_dashboard_with_state_component()
