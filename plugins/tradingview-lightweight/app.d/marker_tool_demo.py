"""Marker-drawing tool: click the chart to stamp markers, driven through a table.

Pick a marker tool from the toolbar (Buy / Sell / Note), then click a spot on
the chart. The press event's ``time`` is appended as a row to a live
``table_publisher`` table. That table is wired to the chart with
``markers_from_table``, so the new row immediately renders as a marker on the
chart. The flow is entirely:

    button selects a tool  ->  press the chart  ->  publish a row to a table
                           ->  the table drives the chart's markers

The markers table is shown alongside the chart so you can watch rows land and
see that the chart's markers are column-driven, not hard-coded.

Data is the deterministic ``tvl.data.ohlc`` candle series. Load with:

    python tools/plugin_builder.py --js --reinstall --server tradingview-lightweight \
        -- -Ddeephaven.application.dir=$(pwd)/plugins/tradingview-lightweight/app.d
"""

from __future__ import annotations

from deephaven import ui, new_table
from deephaven import dtypes as dht
from deephaven.column import datetime_col, string_col
from deephaven.stream.table_publisher import table_publisher
from deephaven.plot import tradingview_lightweight as tvl


# --------------------------------------------------------------------------- #
# Candle data to draw on.
# --------------------------------------------------------------------------- #
candles = tvl.data.ohlc(ticking=False)


# --------------------------------------------------------------------------- #
# The marker tools. Each maps to the camelCase position/shape values that
# Lightweight Charts expects in a table-driven marker spec.
# --------------------------------------------------------------------------- #
TOOLS = {
    "buy": {
        "text": "Buy",
        "position": "belowBar",
        "shape": "arrowUp",
        "color": "#26a69a",
    },
    "sell": {
        "text": "Sell",
        "position": "aboveBar",
        "shape": "arrowDown",
        "color": "#ef5350",
    },
    "note": {
        "text": "Note",
        "position": "aboveBar",
        "shape": "circle",
        "color": "#2962ff",
    },
}


# --------------------------------------------------------------------------- #
# Live markers table. Each press appends one row; tailing the blink stream
# accumulates them so the marker set grows as the user clicks.
# --------------------------------------------------------------------------- #
_markers_blink, _markers_pub = table_publisher(
    "Drawn markers",
    {
        "Time": dht.Instant,
        "Label": dht.string,
        "Position": dht.string,
        "Shape": dht.string,
        "Color": dht.string,
    },
)
markers_table = _markers_blink.tail(500)


# --------------------------------------------------------------------------- #
# The chart reads markers straight from the table via a per-row marker spec.
# Created once (module scope) so its viewport survives every new marker.
# --------------------------------------------------------------------------- #
marker_spec = tvl.markers_from_table(
    markers_table,
    timestamp="Time",
    text_column="Label",
    position_column="Position",
    shape_column="Shape",
    color_column="Color",
)


@ui.component
def marker_tool():
    # Display state for the toolbar + a ref the press handler reads, so the
    # memoized chart's handler always sees the *current* tool without the
    # chart having to be rebuilt (which would reset zoom).
    tool, set_tool = ui.use_state("buy")
    tool_ref = ui.use_ref("buy")

    def select_tool(key: str | None):
        if key:
            tool_ref.current = key
            set_tool(key)

    def handle_press(event: dict):
        t = event.get("time")
        if t is None:
            return  # pressed empty area beyond the data - nothing to stamp
        spec = TOOLS[tool_ref.current]
        _markers_pub.add(
            new_table(
                [
                    datetime_col("Time", [t]),
                    string_col("Label", [spec["text"]]),
                    string_col("Position", [spec["position"]]),
                    string_col("Shape", [spec["shape"]]),
                    string_col("Color", [spec["color"]]),
                ]
            )
        )

    chart = ui.use_memo(
        lambda: tvl.candlestick(
            candles,
            timestamp="Timestamp",
            open="Open",
            high="High",
            low="Low",
            close="Close",
            marker_spec=marker_spec,
            on_press=handle_press,
        ),
        [],
    )

    toolbar = ui.radio_group(
        ui.radio("[green] Buy", value="buy"),
        ui.radio("[red] Sell", value="sell"),
        ui.radio("[blue] Note", value="note"),
        value=tool,
        on_change=select_tool,
        orientation="horizontal",
        label="Marker tool",
    )

    intro = ui.markdown(
        f"""
### Marker Drawing Tool

1. Pick a tool below. **Currently armed: `{TOOLS[tool]["text"]}`**
2. Click anywhere on the candles - the press time is published as a row.
3. That row drives a marker on the chart via `markers_from_table`.

The table on the right is the single source of truth for the markers.
"""
    )

    left = ui.flex(
        intro,
        toolbar,
        chart,
        direction="column",
        gap="size-100",
        height="100%",
    )

    right = ui.flex(
        ui.heading("Markers table (drives the chart)", level=4),
        ui.text("Each click appends one row. The chart re-reads this table live."),
        ui.table(markers_table, reverse=True, density="compact"),
        direction="column",
        gap="size-100",
    )

    return ui.row(
        ui.panel(left, title="Draw markers"),
        ui.panel(right, title="Markers source table"),
    )


tvl_marker_tool = ui.dashboard(marker_tool())
