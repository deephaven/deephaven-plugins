"""
Python scripts for chart event e2e tests.

Each panel renders a chart with an on_click handler alongside a read-only
`ui.text_area` "Event Log" that the handler sets. The Playwright tests click the
chart and assert on the log's value. This mirrors the pattern used by
``ui_events.py`` / ``ui_events.spec.ts`` and avoids reading iris-grid cells,
which are rendered to a canvas and are not present in the DOM.

Scatter charts use ``render_mode="svg"`` so that markers are real SVG DOM
elements the tests can click.
"""

from deephaven.column import int_col, string_col
from deephaven import new_table
from deephaven import ui
import deephaven.plot.express as dx

click_source = new_table(
    [
        int_col("X", [1, 2, 3, 4, 5]),
        int_col("Y", [2, 4, 1, 5, 3]),
        string_col("Sym", ["A", "B", "A", "B", "A"]),
    ]
)


# ============================================================
# Test: scatter on_click fires with point data
# ============================================================
@ui.component
def scatter_click_app():
    log, set_log = ui.use_state("")

    def on_click(event: dict) -> None:
        points = event.get("points") or []
        shift = event.get("modifiers", {}).get("shift", False)
        if points:
            point = points[0]
            set_log(f"click:{point.get('x')},{point.get('y')}:shift={shift}")
        else:
            set_log(f"click:empty:shift={shift}")

    handle_click = ui.use_callback(on_click, [])

    fig = ui.use_memo(
        lambda: dx.scatter(
            click_source,
            x="X",
            y="Y",
            by="Sym",
            render_mode="svg",
            on_click=handle_click,
        ),
        [handle_click],
    )

    return ui.flex(
        fig,
        ui.text_area(label="Event Log", value=log, is_read_only=True),
        direction="column",
    )


events_scatter_click = scatter_click_app()


# ============================================================
# Test: scatter on_double_click fires
# ============================================================
@ui.component
def scatter_double_click_app():
    log, set_log = ui.use_state("")

    def on_double_click(event: dict) -> None:
        set_log("doubleclick")

    handle_double_click = ui.use_callback(on_double_click, [])

    fig = ui.use_memo(
        lambda: dx.scatter(
            click_source,
            x="X",
            y="Y",
            by="Sym",
            render_mode="svg",
            on_double_click=handle_double_click,
        ),
        [handle_double_click],
    )

    return ui.flex(
        fig,
        ui.text_area(label="Event Log", value=log, is_read_only=True),
        direction="column",
    )


events_scatter_double_click = scatter_double_click_app()


# ============================================================
# Test: scatter on_relayout fires (pan/zoom via modebar)
# ============================================================
@ui.component
def scatter_relayout_app():
    log, set_log = ui.use_state("")

    def on_relayout(event: dict) -> None:
        set_log("relayout")

    handle_relayout = ui.use_callback(on_relayout, [])

    fig = ui.use_memo(
        lambda: dx.scatter(
            click_source,
            x="X",
            y="Y",
            by="Sym",
            render_mode="svg",
            on_relayout=handle_relayout,
        ),
        [handle_relayout],
    )

    return ui.flex(
        fig,
        ui.text_area(label="Event Log", value=log, is_read_only=True),
        direction="column",
    )


events_scatter_relayout = scatter_relayout_app()
