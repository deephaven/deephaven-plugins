from typing import Any

from deephaven.column import int_col, string_col, double_col, datetime_col, long_col
from deephaven import new_table, empty_table, time_table, merge, ui
from deephaven.time import to_j_instant
from deephaven.stream.table_publisher import table_publisher
from deephaven import dtypes as dht
from deephaven.plot import tradingview_lightweight as tvl

# =============================================================================
# Test data tables
# =============================================================================

# OHLC data for candlestick and bar charts
ohlc_source = new_table(
    [
        datetime_col(
            "Timestamp",
            [
                to_j_instant("2024-01-02T10:00:00 ET"),
                to_j_instant("2024-01-03T10:00:00 ET"),
                to_j_instant("2024-01-04T10:00:00 ET"),
                to_j_instant("2024-01-05T10:00:00 ET"),
                to_j_instant("2024-01-08T10:00:00 ET"),
                to_j_instant("2024-01-09T10:00:00 ET"),
                to_j_instant("2024-01-10T10:00:00 ET"),
                to_j_instant("2024-01-11T10:00:00 ET"),
                to_j_instant("2024-01-12T10:00:00 ET"),
                to_j_instant("2024-01-16T10:00:00 ET"),
            ],
        ),
        double_col(
            "Open",
            [100.0, 102.0, 101.0, 105.0, 103.0, 106.0, 108.0, 107.0, 110.0, 109.0],
        ),
        double_col(
            "High",
            [103.0, 104.0, 106.0, 107.0, 108.0, 110.0, 112.0, 111.0, 113.0, 112.0],
        ),
        double_col(
            "Low", [99.0, 100.0, 100.0, 103.0, 101.0, 104.0, 106.0, 105.0, 108.0, 107.0]
        ),
        double_col(
            "Close",
            [102.0, 101.0, 105.0, 103.0, 106.0, 108.0, 107.0, 110.0, 109.0, 111.0],
        ),
        long_col(
            "Volume", [1200, 1500, 1800, 1100, 2000, 1700, 1400, 1900, 1600, 2100]
        ),
    ]
)

# Simple value data for line, area, baseline, histogram charts
value_source = new_table(
    [
        datetime_col(
            "Timestamp",
            [
                to_j_instant("2024-01-02T10:00:00 ET"),
                to_j_instant("2024-01-03T10:00:00 ET"),
                to_j_instant("2024-01-04T10:00:00 ET"),
                to_j_instant("2024-01-05T10:00:00 ET"),
                to_j_instant("2024-01-08T10:00:00 ET"),
                to_j_instant("2024-01-09T10:00:00 ET"),
                to_j_instant("2024-01-10T10:00:00 ET"),
                to_j_instant("2024-01-11T10:00:00 ET"),
                to_j_instant("2024-01-12T10:00:00 ET"),
                to_j_instant("2024-01-16T10:00:00 ET"),
            ],
        ),
        double_col(
            "Value", [50.0, 55.0, 48.0, 60.0, 58.0, 65.0, 62.0, 70.0, 68.0, 75.0]
        ),
        double_col(
            "SMA_5", [50.0, 52.5, 51.0, 53.3, 54.2, 57.2, 58.6, 63.0, 64.6, 68.0]
        ),
    ]
)

# Volume data for histogram overlay
volume_source = new_table(
    [
        datetime_col(
            "Timestamp",
            [
                to_j_instant("2024-01-02T10:00:00 ET"),
                to_j_instant("2024-01-03T10:00:00 ET"),
                to_j_instant("2024-01-04T10:00:00 ET"),
                to_j_instant("2024-01-05T10:00:00 ET"),
                to_j_instant("2024-01-08T10:00:00 ET"),
                to_j_instant("2024-01-09T10:00:00 ET"),
                to_j_instant("2024-01-10T10:00:00 ET"),
                to_j_instant("2024-01-11T10:00:00 ET"),
                to_j_instant("2024-01-12T10:00:00 ET"),
                to_j_instant("2024-01-16T10:00:00 ET"),
            ],
        ),
        double_col(
            "Volume",
            [
                1200.0,
                1500.0,
                1800.0,
                1100.0,
                2000.0,
                1700.0,
                1400.0,
                1900.0,
                1600.0,
                2100.0,
            ],
        ),
    ]
)


# =============================================================================
# 1-6. Single-series charts — all defaults (theme colors, time visible)
# =============================================================================
tvl_candlestick = tvl.candlestick(
    ohlc_source,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

tvl_bar = tvl.bar(
    ohlc_source,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

tvl_line = tvl.line(value_source, time="Timestamp", value="Value")

tvl_area = tvl.area(value_source, time="Timestamp", value="Value")

tvl_baseline = tvl.baseline(
    value_source, time="Timestamp", value="Value", base_value=60.0
)

tvl_histogram = tvl.histogram(volume_source, time="Timestamp", value="Volume")

# =============================================================================
# 7. Candlestick with explicit custom colors (tests non-default styling)
# =============================================================================
tvl_candlestick_styled = tvl.candlestick(
    ohlc_source,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    up_color="#00C805",
    down_color="#FF2A04",
    border_up_color="#00C805",
    border_down_color="#FF2A04",
    wick_up_color="#00C805",
    wick_down_color="#FF2A04",
    watermark_text="AAPL",
)

# =============================================================================
# 8. Multi-series: Candlestick + SMA line overlay
# =============================================================================
tvl_candlestick_with_sma = tvl.chart(
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.line_series(
        value_source,
        time="Timestamp",
        value="SMA_5",
        title="SMA 5",
    ),
    crosshair_mode="magnet",
)

# =============================================================================
# 9. Multi-series: Candlestick + Volume histogram
# =============================================================================
tvl_candlestick_with_volume = tvl.chart(
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.histogram_series(
        volume_source,
        time="Timestamp",
        value="Volume",
        color="rgba(38, 166, 154, 0.5)",
        price_scale_id="volume",
    ),
    right_price_scale_visible=True,
)

# =============================================================================
# 10. Candlestick with price lines
# =============================================================================
tvl_candlestick_price_lines = tvl.candlestick(
    ohlc_source,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    price_lines=[
        tvl.price_line(105.0, title="Resistance"),
        tvl.price_line(100.0, title="Support"),
    ],
)

# =============================================================================
# 11. Candlestick with markers
# =============================================================================
tvl_candlestick_markers = tvl.chart(
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
        markers=[
            tvl.marker(
                time="2024-01-04", position="below_bar", shape="arrow_up", text="Buy"
            ),
            tvl.marker(
                time="2024-01-10", position="above_bar", shape="arrow_down", text="Sell"
            ),
        ],
    ),
)

# =============================================================================
# 12. Line chart with custom grid
# =============================================================================
tvl_line_custom_grid = tvl.line(
    value_source,
    time="Timestamp",
    value="Value",
    background_color="#1E222D",
    text_color="#D1D4DC",
    crosshair_mode="magnet",
)

# =============================================================================
# 13. Area chart with watermark
# =============================================================================
tvl_area_watermark = tvl.area(
    value_source,
    time="Timestamp",
    value="Value",
    watermark_text="DH Stock",
)

# =============================================================================
# 14. Multi-series: Two line series overlay
# =============================================================================
tvl_dual_line = tvl.chart(
    tvl.line_series(value_source, time="Timestamp", value="Value", title="Price"),
    tvl.line_series(value_source, time="Timestamp", value="SMA_5", title="SMA 5"),
)

# =============================================================================
# 15. Full trading dashboard: Candlestick + SMA + Volume
# =============================================================================
tvl_full_dashboard = tvl.chart(
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.line_series(value_source, time="Timestamp", value="SMA_5", title="SMA 5"),
    tvl.histogram_series(
        volume_source,
        time="Timestamp",
        value="Volume",
        color="rgba(38, 166, 154, 0.5)",
        price_scale_id="volume",
    ),
    crosshair_mode="magnet",
    watermark_text="AAPL",
    right_price_scale_visible=True,
)

# =============================================================================
# 16. Two price scales: line on right, candlestick on left
# =============================================================================
tvl_two_price_scales = tvl.chart(
    tvl.line_series(
        value_source, time="Timestamp", value="Value", title="Value (Right)"
    ),
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
        price_scale_id="left",
    ),
    right_price_scale_visible=True,
    left_price_scale_visible=True,
    crosshair_mode="normal",
)

# =============================================================================
# 17. Panes: Candlestick (top) + Volume histogram (bottom pane)
# =============================================================================
tvl_panes_basic = tvl.chart(
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
        pane=0,
    ),
    tvl.histogram_series(
        volume_source,
        time="Timestamp",
        value="Volume",
        color="rgba(38, 166, 154, 0.5)",
        pane=1,
    ),
    pane_stretch_factors=[3.0, 1.0],
)

# =============================================================================
# 18. Panes: Three panes with custom separator styling
# =============================================================================
tvl_panes_three = tvl.chart(
    tvl.candlestick_series(
        ohlc_source,
        time="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
        pane=0,
    ),
    tvl.line_series(
        value_source,
        time="Timestamp",
        value="SMA_5",
        title="SMA 5",
        pane=1,
    ),
    tvl.histogram_series(
        volume_source,
        time="Timestamp",
        value="Volume",
        color="rgba(38, 166, 154, 0.5)",
        pane=2,
    ),
    pane_separator_color="#ff4444",
    pane_separator_hover_color="rgba(255, 68, 68, 0.3)",
    pane_enable_resize=False,
    pane_stretch_factors=[3.0, 2.0, 1.0],
)

# =============================================================================
# Yield curve data
# =============================================================================
yield_curve_source = new_table(
    [
        int_col("Maturity", [1, 3, 6, 12, 24, 60, 120, 360]),
        double_col("Yield", [5.30, 5.25, 5.10, 4.80, 4.50, 4.20, 4.00, 3.80]),
    ]
)

# =============================================================================
# 19. Yield curve chart (line)
# =============================================================================
tvl_yield_curve = tvl.yield_curve(
    yield_curve_source,
    maturity="Maturity",
    value="Yield",
    title="US Treasury",
    base_resolution=1,
    minimum_time_range=400,
    watermark_text="Yield Curve",
)

# =============================================================================
# 20. Yield curve chart (area)
# =============================================================================
tvl_yield_curve_area = tvl.yield_curve(
    yield_curve_source,
    maturity="Maturity",
    value="Yield",
    series_type="area",
    title="US Treasury",
    base_resolution=1,
    minimum_time_range=400,
)

# =============================================================================
# Options chart data
# =============================================================================
options_source = new_table(
    [
        double_col("Strike", [90.0, 95.0, 100.0, 105.0, 110.0, 115.0, 120.0]),
        double_col("CallPremium", [12.0, 8.5, 5.0, 2.5, 1.0, 0.4, 0.1]),
        double_col("PutPremium", [0.1, 0.3, 0.8, 2.0, 4.5, 8.0, 12.5]),
    ]
)

# =============================================================================
# 21. Options chart (single series)
# =============================================================================
tvl_options_single = tvl.options_chart(
    options_source,
    strike="Strike",
    value="CallPremium",
    title="Call Premium",
    watermark_text="Options",
)

# =============================================================================
# 22. Options chart (multi-series: calls + puts)
# =============================================================================
tvl_options_multi = tvl.chart(
    tvl.line_series(options_source, time="Strike", value="CallPremium", title="Calls"),
    tvl.line_series(options_source, time="Strike", value="PutPremium", title="Puts"),
    chart_type="options",
    watermark_text="Call vs Put",
)

# =============================================================================
# Dynamic price line data – add computed columns to the source table
# =============================================================================
from deephaven import updateby as uby

ohlc_with_stats = ohlc_source.update_by(
    [
        uby.cum_max("MaxHigh = High"),
        uby.cum_min("MinLow = Low"),
        uby.rolling_avg_tick("AvgClose = Close", rev_ticks=5),
    ]
)

# =============================================================================
# 23. Candlestick with dynamic price lines (column-based)
# =============================================================================
tvl_dynamic_price_lines = tvl.candlestick(
    ohlc_with_stats,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    price_lines=[
        tvl.price_line(column="MaxHigh", title="Max High"),
        tvl.price_line(column="MinLow", title="Min Low"),
        tvl.price_line(column="AvgClose", line_style="dashed", title="Avg Close"),
    ],
)

# =============================================================================
# 24. Candlestick with mixed static + dynamic price lines
# =============================================================================
tvl_mixed_price_lines = tvl.candlestick(
    ohlc_with_stats,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    price_lines=[
        tvl.price_line(price=105.0, title="Target"),
        tvl.price_line(column="AvgClose", line_style="dashed", title="Avg Close"),
    ],
)

# =============================================================================
# Table-driven markers
# =============================================================================

# A signals table: buy on 2024-01-04, sell on 2024-01-10
signals_source = new_table(
    [
        datetime_col(
            "SignalTime",
            [
                to_j_instant("2024-01-04T10:00:00 ET"),
                to_j_instant("2024-01-10T10:00:00 ET"),
            ],
        ),
        string_col("Label", ["Buy", "Sell"]),
        string_col("Position", ["belowBar", "aboveBar"]),
        string_col("Shape", ["arrowUp", "arrowDown"]),
        string_col("Color", ["#26a69a", "#ef5350"]),
    ]
)

# =============================================================================
# 25. Candlestick with table-driven markers (per-row columns)
# =============================================================================
tvl_table_markers = tvl.candlestick(
    ohlc_source,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    marker_spec=tvl.markers_from_table(
        signals_source,
        time="SignalTime",
        text_column="Label",
        position_column="Position",
        shape_column="Shape",
        color_column="Color",
    ),
)

# =============================================================================
# 26. Candlestick with table-driven markers (fixed styling)
# =============================================================================
tvl_table_markers_fixed = tvl.candlestick(
    ohlc_source,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    marker_spec=tvl.markers_from_table(
        signals_source,
        time="SignalTime",
        text_column="Label",
        position="below_bar",
        shape="arrow_up",
    ),
)

# =============================================================================
# By (partitioned) ticking chart — tests dynamic partition key discovery
# =============================================================================

# Create publisher: Sym (string), Timestamp (Instant), Price (double)
_by_blink, _by_publisher = table_publisher(
    "By Test",
    {"Sym": dht.string, "Timestamp": dht.Instant, "Price": dht.double},
)
# Accumulate rows across publishes (blink only shows latest tick)
_by_table = _by_blink.tail(100)

# Seed with 10 rows of AAPL
_by_publisher.add(
    new_table(
        [
            string_col("Sym", ["AAPL"] * 10),
            datetime_col(
                "Timestamp",
                [to_j_instant(f"2024-01-{i + 2:02d}T10:00:00 ET") for i in range(10)],
            ),
            double_col("Price", [150.0 + i for i in range(10)]),
        ]
    )
)


@ui.component
def _tvl_by_ticking_component():
    added, set_added = ui.use_state(False)

    def handle_add(_event: Any) -> None:
        _by_publisher.add(
            new_table(
                [
                    string_col("Sym", ["GOOG"] * 10),
                    datetime_col(
                        "Timestamp",
                        [
                            to_j_instant(f"2024-01-{i + 2:02d}T10:00:00 ET")
                            for i in range(10)
                        ],
                    ),
                    double_col("Price", [100.0 + i * 2 for i in range(10)]),
                ]
            )
        )
        set_added(True)

    plot = ui.use_memo(
        lambda: tvl.line(_by_table, time="Timestamp", value="Price", by="Sym"),
        [_by_table],
    )

    return ui.flex(
        ui.action_button(
            "Added" if added else "Add GOOG",
            on_press=handle_add,
        ),
        plot,
        direction="column",
        flex_grow=1,
    )


tvl_by_ticking = _tvl_by_ticking_component()

# =============================================================================
# Downsampling test: 10M rows over 10 years
# =============================================================================

_big_start = to_j_instant("2014-01-01T00:00:00 ET")
big_table = empty_table(10_000_000).update(
    [
        # Spread 10M rows evenly over 10 years (~3.15s apart)
        "Timestamp = _big_start + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
        # Trending sine wave: base 100, amplitude 50, slow upward drift
        "Price = 100 + Math.sin(ii * 0.0001) * 50 + (ii * 0.000005)",
    ]
)

tvl_big_line = tvl.line(
    big_table,
    time="Timestamp",
    value="Price",
)
