"""Interactive press-event showcase: a deephaven.ui dashboard driven by chart clicks.

A single candlestick + EMA chart is the only input device. Every panel around it
reacts to the chart's press events (``on_press`` / ``on_double_press``):

- **Single-click** a series -> *inspect* that moment. The Inspector shows what you
  hit (series, time, price, modifier keys) and unpacks the event's ``seriesData``
  payload: the candle series resolves to an OHLC dict, the EMA series to a single
  value, both at the instant you clicked. The Drill-down table filters the raw
  data to a window around that time.
- **Shift-click** or **double-click** -> *pin* that point into a live log table.
  The pinned log ticks as you click, and a summary badge aggregates it live.

Data comes entirely from ``tvl.data`` (the deterministic ``ohlc`` candle series),
so the demo is self-contained. Load it by pointing the server at this directory:

    python tools/plugin_builder.py --js --reinstall --server tradingview-lightweight \
        -- -Ddeephaven.application.dir=$(pwd)/plugins/tradingview-lightweight/app.d
"""

from __future__ import annotations

from deephaven import ui, new_table
from deephaven import dtypes as dht
from deephaven.column import datetime_col, string_col, double_col
from deephaven.stream.table_publisher import table_publisher
from deephaven.plot import tradingview_lightweight as tvl


# --------------------------------------------------------------------------- #
# Data - a candle series with a built-in EMA column. Candles and the EMA share
# every timestamp, so one press resolves a value for *both* series. Static seed
# keeps the window filter and snapshots reproducible for the demo.
# --------------------------------------------------------------------------- #
candles = tvl.data.ohlc(ticking=False)


# --------------------------------------------------------------------------- #
# A live "pinned levels" table. table_publisher emits a blink stream; tailing it
# accumulates the pins so the log grows as the user clicks (mirrors events.md).
# Created at module scope so its liveness outlives any single render.
# --------------------------------------------------------------------------- #
_pins_blink, _pins_pub = table_publisher(
    "Pinned levels",
    {"Time": dht.Instant, "Series": dht.string, "Price": dht.double},
)
pinned = _pins_blink.tail(500)


def _pin(event: dict) -> None:
    """Append a pressed (time, series, price) to the live log table."""
    t = event.get("time")
    price = event.get("price")
    if t is None or price is None:
        return  # press landed on empty area beyond the data - nothing to pin
    _pins_pub.add(
        new_table(
            [
                datetime_col("Time", [t]),
                string_col("Series", [event.get("seriesId", "(between series)")]),
                double_col("Price", [price]),
            ]
        )
    )


# --------------------------------------------------------------------------- #
# Helpers that turn one press event into a small renderable table.
# --------------------------------------------------------------------------- #
def _series_snapshot(event: dict):
    """Unpack the event's ``seriesData`` into a tidy (Series, Field, Value) table.

    ``seriesData`` maps each series id to its value at the pressed time: a single
    float for line/area/baseline/histogram series, or an OHLC dict for
    candlestick/bar series. We unpack an OHLC dict into four rows so both shapes
    render in one table.
    """
    series_data = event.get("seriesData", {}) or {}
    series, fields, values = [], [], []
    for sid, val in series_data.items():
        if isinstance(val, dict):
            for field in ("open", "high", "low", "close"):
                if field in val:
                    series.append(str(sid))
                    fields.append(field)
                    values.append(float(val[field]))
        else:
            series.append(str(sid))
            fields.append("value")
            values.append(float(val))
    if not series:
        series, fields, values = ["(no series under cursor)"], ["-"], [float("nan")]
    return new_table(
        [
            string_col("Series", series),
            string_col("Field", fields),
            double_col("Value", values),
        ]
    )


def _window(event: dict):
    """Filter the raw data to a +/- 10-day window around the pressed time."""
    t = event.get("time")
    if t is None:
        return candles.where("false")  # empty
    # `t` is a real Deephaven Instant; reference it directly in the formula.
    return candles.where("Timestamp >= (t - 'PT240H') && Timestamp <= (t + 'PT240H')")


# --------------------------------------------------------------------------- #
# Live summary of the pinned log - counts and averages, recomputed as it ticks.
# --------------------------------------------------------------------------- #
@ui.component
def pinned_summary():
    prices = ui.use_column_data(pinned.view("Price")) or []
    count = len(prices)
    if count == 0:
        return ui.badge("No levels pinned yet", variant="neutral")
    avg = sum(prices) / count
    return ui.flex(
        ui.badge(f"{count} pinned", variant="positive"),
        ui.badge(f"avg {avg:.2f}", variant="info"),
        ui.badge(f"low {min(prices):.2f}", variant="info"),
        ui.badge(f"high {max(prices):.2f}", variant="info"),
        gap="size-100",
        wrap=True,
        flex_grow=0,
    )


# --------------------------------------------------------------------------- #
# Inspector - reacts to the most recent single-click.
# --------------------------------------------------------------------------- #
@ui.component
def inspector(selected: dict | None):
    # Hooks must run unconditionally and in the same order every render, so
    # build the snapshot via use_memo before any early return.
    snapshot = ui.use_memo(
        lambda: _series_snapshot(selected) if selected else None,
        [selected],
    )

    if not selected:
        return ui.illustrated_message(
            ui.icon("vsInspect"),
            ui.heading("Click the chart"),
            ui.content(
                "Single-click a series to inspect that moment. "
                "Shift-click or double-click to pin it."
            ),
            width="100%",
        )

    series = selected.get("seriesId", "(between series)")
    price = selected.get("price")
    t = selected.get("time")
    pane = selected.get("paneIndex")

    chips = [
        ui.badge(f"series: {series}", variant="purple"),
        ui.badge(
            f"price: {price:.2f}" if price is not None else "price: -",
            variant="info",
        ),
    ]
    if t is not None:
        chips.append(ui.badge(f"time: {t}", variant="neutral"))
    if pane is not None:
        chips.append(ui.badge(f"pane: {pane}", variant="neutral"))

    # Modifier keys - show which were held, to advertise the shift-to-pin trick.
    held = [k for k in ("shift", "ctrl", "meta", "alt") if selected.get(f"{k}Key")]
    mods = ui.badge(
        "modifiers: " + (", ".join(held) if held else "none"),
        variant=("positive" if held else "neutral"),
    )

    return ui.flex(
        ui.heading("Inspecting press", level=4),
        ui.flex(*chips, mods, gap="size-100", wrap=True, flex_grow=0),
        ui.text(
            "Series values at this instant (unpacked from the event's seriesData):"
        ),
        ui.table(snapshot, density="compact"),
        direction="column",
        gap="size-100",
    )


# --------------------------------------------------------------------------- #
# Drill-down - raw rows near the clicked time.
# --------------------------------------------------------------------------- #
@ui.component
def drilldown(selected: dict | None):
    has_time = bool(selected) and selected.get("time") is not None
    windowed = ui.use_memo(
        lambda: _window(selected) if has_time else None,
        [selected],
    )
    if not has_time:
        return ui.illustrated_message(
            ui.icon("vsListFilter"),
            ui.heading("No window yet"),
            ui.content("Click a point on the chart to filter the raw data around it."),
            width="100%",
        )
    return ui.flex(
        ui.text("Raw rows within +/- 10 days of the click:"),
        ui.table(
            windowed,
            reverse=True,
            front_columns=["Timestamp", "Close", "Volume", "Ema"],
            density="compact",
        ),
        direction="column",
        gap="size-100",
    )


# --------------------------------------------------------------------------- #
# The dashboard itself.
# --------------------------------------------------------------------------- #
@ui.component
def events_dashboard():
    selected, set_selected = ui.use_state(None)

    def handle_press(event: dict):
        set_selected(event)
        # Power-user shortcut: shift-click pins without needing a double-click.
        if event.get("shiftKey"):
            _pin(event)

    def handle_double(event: dict):
        _pin(event)

    chart = ui.use_memo(
        lambda: tvl.chart(
            tvl.candlestick(
                candles,
                timestamp="Timestamp",
                open="Open",
                high="High",
                low="Low",
                close="Close",
                title="Price",
            ),
            tvl.line(
                candles,
                timestamp="Timestamp",
                value="Ema",
                title="EMA",
            ),
            on_press=handle_press,
            on_double_press=handle_double,
        ),
        [],
    )

    intro = ui.markdown(
        """
### Press-Event Explorer

Every panel here is driven by **chart clicks** - no other input.

- **Single-click** a series -> *inspect* that moment (Inspector).
- **Shift-click** or **double-click** -> *pin* it to the live log (Pinned levels).

The Inspector unpacks the event's `seriesData`: the candle series resolves to an
**OHLC dict**, the EMA line to a single **value**, both at the instant you
clicked. The Drill-down filters the raw table to a window around that time. The
Pinned log and its summary tick live as you click.
"""
    )

    chart_panel = ui.panel(
        ui.flex(intro, chart, direction="column", height="100%"),
        title="Candles - click to explore",
    )

    inspector_panel = ui.panel(inspector(selected), title="Inspector")

    drilldown_panel = ui.panel(drilldown(selected), title="Drill-down (window)")

    pinned_panel = ui.panel(
        ui.flex(
            pinned_summary(),
            ui.table(pinned, reverse=True, density="compact"),
            direction="column",
            gap="size-100",
        ),
        title="Pinned levels (live)",
    )

    return ui.column(
        ui.row(chart_panel, inspector_panel, height=2),
        ui.row(drilldown_panel, pinned_panel, height=1),
    )


tvl_events_demo = ui.dashboard(events_dashboard())
