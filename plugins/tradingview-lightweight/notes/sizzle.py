"""
Sizzle Dashboard — TradingView Lightweight Charts showcase.

Simulates ticking stock + options data and builds an interactive dashboard
with 6 TVL chart panels connected via shared state.
"""

import datetime
from typing import Any

from deephaven import empty_table, merge, new_table, time_table, ui
from deephaven.column import datetime_col, double_col, long_col, string_col
from deephaven.time import to_j_instant
from deephaven.stream.table_publisher import table_publisher
from deephaven import dtypes as dht
from deephaven import updateby as uby
from deephaven.plot import tradingview_lightweight as tvl

# =============================================================================
# 1. Simulated ticking stock data
# =============================================================================

# 5 symbols, each with 200 rows of seed history + continuous ticking.
# Both use the same random walk via cum_sum so there's no price jump at the seam.
SYMBOLS = ["AAPL", "MSFT", "GOOG", "AMZN", "TSLA"]

_seed_start = to_j_instant("2024-06-01T09:30:00 ET")

# Static seed: 200 rows per symbol = 1000 rows
_seeds = []
for _idx, _sym in enumerate(SYMBOLS):
    _base = 150.0 + _idx * 30
    _vol = 1.2 + _idx * 0.25
    _t = (
        empty_table(200)
        .update(
            [
                f"Sym = `{_sym}`",
                f"Timestamp = _seed_start + (long)(ii * 60_000_000_000L)",
                f"_Ret = (Math.random() - 0.48) * {_vol}",
            ]
        )
        .update_by(
            [uby.cum_sum(cols=["_Cum = _Ret"])],
        )
        .update(
            [
                f"Open  = {_base} + _Cum",
                f"Close = Open + (Math.random() - 0.48) * {_vol * 0.6}",
                "High  = Math.max(Open, Close) + Math.random() * 2",
                "Low   = Math.min(Open, Close) - Math.random() * 2",
                "Volume = (long)(500_000 + Math.random() * 1_500_000)",
            ]
        )
        .view(["Sym", "Timestamp", "Open", "High", "Low", "Close", "Volume"])
    )
    _seeds.append(_t)

seed_table = merge(_seeds)

# Extract last Close per symbol so the ticking walk continues from it
_last_prices = seed_table.last_by("Sym").view(["Sym", "LastClose = Close"])

# Ticking: one row per symbol every 500ms, random walk continues from seed
_tick_base = time_table("PT00:00:00.500000000")
tick_table = (
    _tick_base.update(
        [
            "SymIdx = (int)(ii % 5)",
            "Sym    = new String[]{`AAPL`, `MSFT`, `GOOG`, `AMZN`, `TSLA`}[SymIdx]",
            "_Vol   = 1.2 + SymIdx * 0.25",
            "_Ret   = (Math.random() - 0.48) * _Vol",
        ]
    )
    .update_by(
        [uby.cum_sum(cols=["_Cum = _Ret"])],
        by=["Sym"],
    )
    .natural_join(
        _last_prices,
        on="Sym",
    )
    .update(
        [
            "Open   = LastClose + _Cum",
            "Close  = Open + (Math.random() - 0.48) * _Vol * 0.6",
            "High   = Math.max(Open, Close) + Math.random() * 2",
            "Low    = Math.min(Open, Close) - Math.random() * 2",
            "Volume = (long)(500_000 + Math.random() * 1_500_000)",
        ]
    )
    .view(["Sym", "Timestamp", "Open", "High", "Low", "Close", "Volume"])
)

# Combine seed + ticking stream
stock_data = merge([seed_table, tick_table])

# Per-symbol derived tables with EMA + Bollinger
stock_enriched = stock_data.update_by(
    [
        uby.ema_tick(decay_ticks=20, cols=["EMA20 = Close"]),
        uby.rolling_avg_tick(cols=["SMA20 = Close"], rev_ticks=20),
        uby.rolling_std_tick(cols=["StdDev = Close"], rev_ticks=20),
    ],
    by=["Sym"],
).update(
    [
        "BollingerUp   = SMA20 + 2 * StdDev",
        "BollingerDown = SMA20 - 2 * StdDev",
    ]
)


# =============================================================================
# 2. Simulated options data (static, refreshes aren't needed for the showcase)
# =============================================================================

options_data = empty_table(15).update(
    [
        "Strike = 100.0 + ii * 10",
        "CallIV = 0.35 - ii * 0.015 + Math.random() * 0.02",
        "PutIV  = 0.15 + ii * 0.018 + Math.random() * 0.02",
    ]
)

# =============================================================================
# 3. Trade markers table (table_publisher for Buy/Sell buttons)
# =============================================================================

_marker_blink, marker_publisher = table_publisher(
    "TradeMarkers",
    {
        "Timestamp": dht.Instant,
        "Position": dht.string,
        "Shape": dht.string,
        "Label": dht.string,
        "Color": dht.string,
    },
)
marker_table = _marker_blink.tail(500)

# =============================================================================
# 4. Dashboard component
# =============================================================================


@ui.component
def sizzle_layout():
    selected_sym, set_selected_sym = ui.use_state("AAPL")

    # ---- Filtered data for the selected symbol ----
    sym_data = ui.use_memo(
        lambda: stock_enriched.where(f"Sym = `{selected_sym}`"),
        [selected_sym],
    )

    # ---- PANEL 1: Options IV Smile (options chart, calls + puts) ----
    options_chart = ui.use_memo(
        lambda: tvl.chart(
            tvl.line_series(
                options_data, time="Strike", value="CallIV", title="Call IV"
            ),
            tvl.line_series(options_data, time="Strike", value="PutIV", title="Put IV"),
            chart_type="options",
            crosshair_mode="magnet",
        ),
        [options_data],
    )

    # ---- PANEL 2: Area chart with volume pane (no grid) ----
    area_volume = ui.use_memo(
        lambda: tvl.chart(
            tvl.area_series(
                sym_data, time="Timestamp", value="Close", title="Price", pane=0
            ),
            tvl.histogram_series(
                sym_data,
                time="Timestamp",
                value="Volume",
                price_scale_id="vol",
                pane=1,
            ),
            crosshair_mode="magnet",
            vert_lines_visible=False,
            horz_lines_visible=False,
            pane_stretch_factors=[3.0, 1.0],
        ),
        [sym_data, selected_sym],
    )

    # ---- Filtered data with all-time high/low via maxBy/minBy + natural_join ----
    # Use the pattern: t.natural_join(t.view("Col").maxBy(), "", "")
    sym_extremes_data = ui.use_memo(
        lambda: (
            sym_data.natural_join(
                sym_data.view(["HighMax = Close"]).max_by(), on=""
            ).natural_join(sym_data.view(["LowMin = Close"]).min_by(), on="")
        ),
        [sym_data],
    )

    # ---- PANEL 3: Area chart with dynamic min/max price lines (no grid) ----
    area_minmax = ui.use_memo(
        lambda: tvl.chart(
            tvl.area_series(
                sym_extremes_data,
                time="Timestamp",
                value="Close",
                price_lines=[
                    tvl.price_line(column="HighMax", title="High", line_style="dashed"),
                    tvl.price_line(column="LowMin", title="Low", line_style="dotted"),
                ],
            ),
            crosshair_mode="magnet",
            vert_lines_visible=False,
            horz_lines_visible=False,
        ),
        [sym_extremes_data, selected_sym],
    )

    # ---- PANEL 4: 5-line overlay (Close, EMA, SMA, Bollinger Up/Down) ----
    five_lines = ui.use_memo(
        lambda: tvl.chart(
            tvl.line_series(sym_data, time="Timestamp", value="Close", title="Close"),
            tvl.line_series(sym_data, time="Timestamp", value="EMA20", title="EMA 20"),
            tvl.line_series(sym_data, time="Timestamp", value="SMA20", title="SMA 20"),
            tvl.line_series(
                sym_data,
                time="Timestamp",
                value="BollingerUp",
                title="BB Upper",
                line_style="dashed",
            ),
            tvl.line_series(
                sym_data,
                time="Timestamp",
                value="BollingerDown",
                title="BB Lower",
                line_style="dashed",
            ),
            crosshair_mode="magnet",
        ),
        [sym_data, selected_sym],
    )

    # ---- PANEL 5: OHLC candlestick + EMA overlay + colored trade markers ----
    ohlc_chart = ui.use_memo(
        lambda: tvl.chart(
            tvl.candlestick_series(
                sym_data,
                time="Timestamp",
                open="Open",
                high="High",
                low="Low",
                close="Close",
                marker_spec=tvl.markers_from_table(
                    marker_table,
                    time="Timestamp",
                    text_column="Label",
                    position_column="Position",
                    shape_column="Shape",
                    color_column="Color",
                ),
            ),
            tvl.line_series(sym_data, time="Timestamp", value="EMA20", title="EMA 20"),
            crosshair_mode="magnet",
        ),
        [sym_data, selected_sym, marker_table],
    )

    # ---- Get first Open price for baseline midpoint ----
    first_open_table = ui.use_memo(
        lambda: sym_data.first_by().view(["Open"]),
        [sym_data],
    )
    first_open = ui.use_cell_data(first_open_table, "Open")

    # ---- PANEL 6: Baseline chart (Close vs opening price) ----
    baseline_chart = ui.use_memo(
        lambda: tvl.chart(
            tvl.baseline_series(
                sym_data,
                time="Timestamp",
                value="Close",
                base_value=first_open if first_open is not None else 150.0,
            ),
            tvl.line_series(sym_data, time="Timestamp", value="EMA20", title="EMA 20"),
            crosshair_mode="magnet",
        ),
        [sym_data, selected_sym, first_open],
    )

    # ---- Buy/Sell handlers ----
    def handle_buy(_event: Any) -> None:
        marker_publisher.add(
            new_table(
                [
                    datetime_col(
                        "Timestamp", [datetime.datetime.now(tz=datetime.timezone.utc)]
                    ),
                    string_col("Position", ["belowBar"]),
                    string_col("Shape", ["arrowUp"]),
                    string_col("Label", ["BUY"]),
                    string_col("Color", ["#26a69a"]),
                ]
            )
        )

    def handle_sell(_event: Any) -> None:
        marker_publisher.add(
            new_table(
                [
                    datetime_col(
                        "Timestamp", [datetime.datetime.now(tz=datetime.timezone.utc)]
                    ),
                    string_col("Position", ["aboveBar"]),
                    string_col("Shape", ["arrowDown"]),
                    string_col("Label", ["SELL"]),
                    string_col("Color", ["#ef5350"]),
                ]
            )
        )

    # ---- Symbol picker (text_field) ----
    sym_options = stock_data.view(["Sym"]).select_distinct(["Sym"])

    controls = ui.flex(
        ui.picker(
            sym_options,
            label="Symbol",
            label_position="side",
            selected_key=selected_sym,
            on_selection_change=set_selected_sym,
        ),
        ui.action_button("BUY", on_press=handle_buy),
        ui.action_button("SELL", on_press=handle_sell),
        direction="row",
    )

    # ---- Layout ----
    return ui.column(
        ui.row(
            ui.panel(controls, title="Controls"),
            height=7,
        ),
        ui.row(
            ui.stack(
                ui.panel(baseline_chart, title="Baseline"),
                ui.panel(options_chart, title="Options IV Smile"),
            ),
            ui.panel(area_volume, title="Price + Volume"),
            ui.panel(area_minmax, title="Price Range"),
            height=46,
        ),
        ui.row(
            ui.panel(five_lines, title="5-Line Technicals"),
            ui.panel(ohlc_chart, title="OHLC + Trades"),
            height=47,
        ),
    )


sizzle = ui.dashboard(sizzle_layout())
