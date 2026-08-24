"""
Test fixtures for dashboard panel headers (``show_headers``).

These fixtures back the tests in ``tests/ui_dashboard_headers.spec.ts``:

- ``ui_dashboard_headers_on``: top-level dashboard using the default headers.
- ``ui_dashboard_headers_off``: top-level dashboard with ``show_headers=False``.
- ``ui_dashboard_headers_off_nested_on``: headerless top-level dashboard
  containing a nested dashboard that opts back in to headers.
- ``ui_dashboard_headers_on_nested_off``: top-level dashboard with headers
  containing a nested dashboard with ``show_headers=False``.
- ``ui_dashboard_headers_off_nested_default``: headerless top-level dashboard
  containing a nested dashboard that does not set ``show_headers``.
"""

from deephaven import ui

ui_dashboard_headers_on = ui.dashboard(
    ui.row(
        ui.panel(ui.text("Content shown alpha"), title="Shown Alpha"),
        ui.panel(ui.text("Content shown beta"), title="Shown Beta"),
    )
)

ui_dashboard_headers_off = ui.dashboard(
    ui.row(
        ui.panel(ui.text("Content hidden alpha"), title="Hidden Alpha"),
        ui.panel(ui.text("Content hidden beta"), title="Hidden Beta"),
    ),
    show_headers=False,
)

ui_dashboard_headers_off_nested_on = ui.dashboard(
    ui.row(
        ui.panel(ui.text("Content outer hidden"), title="Outer Hidden"),
        ui.panel(
            ui.dashboard(
                ui.row(
                    ui.panel(ui.text("Content inner shown"), title="Inner Shown"),
                ),
                show_headers=True,
            ),
            title="Wrapper Hidden",
        ),
    ),
    show_headers=False,
)

ui_dashboard_headers_on_nested_off = ui.dashboard(
    ui.row(
        ui.panel(ui.text("Content outer shown"), title="Outer Shown"),
        ui.panel(
            ui.dashboard(
                ui.row(
                    ui.panel(ui.text("Content inner hidden"), title="Inner Hidden"),
                ),
                show_headers=False,
            ),
            title="Wrapper Shown",
        ),
    ),
)

ui_dashboard_headers_off_nested_default = ui.dashboard(
    ui.row(
        ui.panel(ui.text("Content outer default"), title="Outer Default"),
        ui.panel(
            ui.dashboard(
                ui.row(
                    ui.panel(ui.text("Content inner default"), title="Inner Default"),
                )
            ),
            title="Wrapper Default",
        ),
    ),
    show_headers=False,
)
