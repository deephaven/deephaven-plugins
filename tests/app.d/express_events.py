"""
Python scripts for chart event e2e tests.
These create charts with event handlers and result tables that the Playwright
tests can verify.
"""

from deephaven.column import int_col, string_col, double_col
from deephaven import new_table, empty_table, dtypes
import deephaven.plot.express as dx

# ============================================================
# Test: scatter on_click fires
# ============================================================
click_source = new_table(
    [
        int_col("X", [1, 2, 3, 4, 5]),
        int_col("Y", [2, 4, 1, 5, 3]),
        string_col("Sym", ["A", "B", "A", "B", "A"]),
    ]
)

events_click_result = empty_table(0).update_view(
    ["EventType = (String)null", "PointX = NULL_INT", "PointY = NULL_INT"]
)


def handle_scatter_click(event: dict) -> None:
    global events_click_result
    from deephaven import new_table
    from deephaven.column import string_col, int_col

    point = event["points"][0] if event.get("points") else {}
    events_click_result = new_table(
        [
            string_col("EventType", ["click"]),
            int_col("PointX", [point.get("x", -1)]),
            int_col("PointY", [point.get("y", -1)]),
        ]
    )


events_scatter_click = dx.scatter(
    click_source, x="X", y="Y", by="Sym", on_click=handle_scatter_click
)

# ============================================================
# Test: scatter on_legend_click returning False prevents toggle
# ============================================================


def handle_legend_prevent(event: dict) -> bool:
    # Return False to prevent the toggle
    return False


events_legend_prevent = dx.scatter(
    click_source,
    x="X",
    y="Y",
    by="Sym",
    on_legend_click=handle_legend_prevent,
)

# ============================================================
# Test: sunburst on_click returning False prevents drill-down
# ============================================================
sunburst_source = new_table(
    [
        string_col("Labels", ["All", "A", "B", "A1", "A2", "B1"]),
        string_col("Parents", ["", "All", "All", "A", "A", "B"]),
        int_col("Values", [60, 30, 30, 15, 15, 30]),
    ]
)

events_sunburst_result = empty_table(0).update_view(
    ["Clicked = (String)null", "NextLevel = (String)null"]
)


def handle_sunburst_prevent(event: dict) -> bool:
    global events_sunburst_result
    from deephaven import new_table
    from deephaven.column import string_col

    point = event["points"][0] if event.get("points") else {}
    events_sunburst_result = new_table(
        [
            string_col("Clicked", [str(point.get("label", ""))]),
            string_col("NextLevel", [str(event.get("next_level", ""))]),
        ]
    )
    # Return False to prevent drill-down
    return False


events_sunburst_prevent = dx.sunburst(
    sunburst_source,
    names="Labels",
    parents="Parents",
    values="Values",
    on_click=handle_sunburst_prevent,
)

# ============================================================
# Test: scatter on_selected fires
# ============================================================
events_select_result = empty_table(0).update_view(["NumPoints = NULL_INT"])


def handle_select(event: dict) -> None:
    global events_select_result
    from deephaven import new_table
    from deephaven.column import int_col

    num_points = len(event.get("points", []))
    events_select_result = new_table([int_col("NumPoints", [num_points])])


events_scatter_select = dx.scatter(
    click_source, x="X", y="Y", on_selected=handle_select
)
