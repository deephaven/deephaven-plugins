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
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

tvl_bar = tvl.bar(
    ohlc_source,
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

tvl_line = tvl.line(value_source, timestamp="Timestamp", value="Value")

tvl_area = tvl.area(value_source, timestamp="Timestamp", value="Value")

tvl_baseline = tvl.baseline(
    value_source, timestamp="Timestamp", value="Value", base_value=60.0
)

tvl_histogram = tvl.histogram(volume_source, timestamp="Timestamp", value="Volume")

# =============================================================================
# 7. Candlestick with explicit custom colors (tests non-default styling)
# =============================================================================
tvl_candlestick_styled = tvl.chart(
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
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
    ),
    watermark_text="AAPL",
)

# =============================================================================
# 8. Multi-series: Candlestick + SMA line overlay
# =============================================================================
tvl_candlestick_with_sma = tvl.chart(
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.line(
        value_source,
        timestamp="Timestamp",
        value="SMA_5",
        title="SMA 5",
    ),
    crosshair_mode="magnet",
)

# =============================================================================
# 9. Multi-series: Candlestick + Volume histogram
# =============================================================================
tvl_candlestick_with_volume = tvl.chart(
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.histogram(
        volume_source,
        timestamp="Timestamp",
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
    timestamp="Timestamp",
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
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
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
tvl_line_custom_grid = tvl.chart(
    tvl.line(value_source, timestamp="Timestamp", value="Value"),
    background_color="#1E222D",
    text_color="#D1D4DC",
    crosshair_mode="magnet",
)

# =============================================================================
# 13. Area chart with watermark
# =============================================================================
tvl_area_watermark = tvl.chart(
    tvl.area(value_source, timestamp="Timestamp", value="Value"),
    watermark_text="DH Stock",
)

# =============================================================================
# 14. Multi-series: Two line series overlay
# =============================================================================
tvl_dual_line = tvl.chart(
    tvl.line(value_source, timestamp="Timestamp", value="Value", title="Price"),
    tvl.line(value_source, timestamp="Timestamp", value="SMA_5", title="SMA 5"),
)

# =============================================================================
# 15. Full trading dashboard: Candlestick + SMA + Volume
# =============================================================================
tvl_full_dashboard = tvl.chart(
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.line(value_source, timestamp="Timestamp", value="SMA_5", title="SMA 5"),
    tvl.histogram(
        volume_source,
        timestamp="Timestamp",
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
    tvl.line(value_source, timestamp="Timestamp", value="Value", title="Value (Right)"),
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
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
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
        pane=0,
    ),
    tvl.histogram(
        volume_source,
        timestamp="Timestamp",
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
    tvl.candlestick(
        ohlc_source,
        timestamp="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
        pane=0,
    ),
    tvl.line(
        value_source,
        timestamp="Timestamp",
        value="SMA_5",
        title="SMA 5",
        pane=1,
    ),
    tvl.histogram(
        volume_source,
        timestamp="Timestamp",
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
    tvl.line(options_source, timestamp="Strike", value="CallPremium", title="Calls"),
    tvl.line(options_source, timestamp="Strike", value="PutPremium", title="Puts"),
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
    timestamp="Timestamp",
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
    timestamp="Timestamp",
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
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    marker_spec=tvl.markers_from_table(
        signals_source,
        timestamp="SignalTime",
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
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    marker_spec=tvl.markers_from_table(
        signals_source,
        timestamp="SignalTime",
        text_column="Label",
        position="below_bar",
        shape="arrow_up",
    ),
)

# =============================================================================
# By (partitioned) ticking chart — tests dynamic partition key discovery
# =============================================================================


def _by_sym_rows(sym: str, base_price: float, step: float):
    return new_table(
        [
            string_col("Sym", [sym] * 10),
            datetime_col(
                "Timestamp",
                [to_j_instant(f"2024-01-{i + 2:02d}T10:00:00 ET") for i in range(10)],
            ),
            double_col("Price", [base_price + i * step for i in range(10)]),
        ]
    )


@ui.component
def _tvl_by_ticking_component():
    added, set_added = ui.use_state(False)

    # The publisher is scoped to this component instance (one per panel
    # open) rather than module-level: a shared publisher accumulates GOOG
    # rows the first time ANY test clicks the button, polluting the
    # "one trace before click" baseline for every later browser project
    # against the same server.
    def _make_tables():
        blink, publisher = table_publisher(
            "By Test",
            {"Sym": dht.string, "Timestamp": dht.Instant, "Price": dht.double},
        )
        # Accumulate rows across publishes (blink only shows latest tick)
        accum = blink.tail(100)
        # Seed with 10 rows of AAPL
        publisher.add(_by_sym_rows("AAPL", 150.0, 1.0))
        return accum, publisher

    by_table, by_publisher = ui.use_memo(_make_tables, [])

    def handle_add(_event: Any) -> None:
        by_publisher.add(_by_sym_rows("GOOG", 100.0, 2.0))
        set_added(True)

    plot = ui.use_memo(
        lambda: tvl.line(by_table, timestamp="Timestamp", value="Price", by="Sym"),
        [by_table],
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
# Downsampling test: 1M rows over 10 years
# =============================================================================

_big_start = to_j_instant("2014-01-01T00:00:00 ET")
# update_view (not update): keep these formula columns lazy so 1M rows are
# never materialized in RAM for the whole session. Downsample/auto-bin scan
# them on demand; holding them resident across every test inflates the heap
# and invites GC pauses that can drop in-flight widget streams.
# 1M rows is still 1000x the JS DOWNSAMPLE_THRESHOLD while keeping the
# per-scan memory footprint a tenth of the previous 10M-row fixture.
# Row count is sized to exercise the reduction paths, not to stress the engine.
# Downsample engages above 1,000 rows and auto-bin above 500 (2 x TARGET_BINS),
# so 25k rows crosses both with ~100 rows per bin — while a 1M-row fixture made
# every zoom/pan round trip slow enough that e2e tests measuring the *result*
# of a swap were really measuring engine scan time, and flaked accordingly.
#
# The 10-year span is deliberately unchanged: bin widths derive from the visible
# time range and the target bin count, never from row count, so every bin-width
# and scoping assertion in the suite is unaffected by this reduction. The ii
# coefficients scale with the row count (40x here, as they did for the earlier
# 10M -> 1M reduction) to keep the waveform identical as a function of *time*,
# so rendered charts are unchanged too.
_BIG_N = 25_000
big_table = empty_table(_BIG_N).update_view(
    [
        # Spread the rows evenly over 10 years
        "Timestamp = _big_start + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 25_000))",
        # Trending sine wave: base 100, amplitude 50, slow upward drift.
        "Price = 100 + Math.sin(ii * 0.04) * 50 + (ii * 0.002)",
    ]
)

tvl_big_line = tvl.line(
    big_table,
    timestamp="Timestamp",
    value="Price",
)

# Small table that should NOT be downsampled (10 rows)
small_table = new_table(
    [
        datetime_col(
            "Timestamp",
            [to_j_instant(f"2024-01-{i+2:02d}T10:00:00 ET") for i in range(10)],
        ),
        double_col("Value", [50.0 + i * 3 for i in range(10)]),
    ]
)
tvl_small_line = tvl.line(small_table, timestamp="Timestamp", value="Value")

# Ticking table: 100K historical + 1 row/sec live
from deephaven import updateby as uby

_TICK_N = 100_000
_ticking_table = (
    merge(
        [
            empty_table(_TICK_N).update("Index = ii"),
            time_table("PT1S")
            .update(f"Index = ii + {_TICK_N}")
            .drop_columns("Timestamp"),
        ]
    )
    .update(
        [
            "Timestamp = '2024-01-01T00:00:00Z' + (long)(Index * 1_000_000_000L)",
            "Step = (Math.random() - 0.499) * 0.5",
        ]
    )
    .update_by([uby.cum_sum(cols=["Walk = Step"])])
    .update("Price = 100 + Walk")
    .view(["Timestamp", "Price"])
)
tvl_ticking_line = tvl.line(_ticking_table, timestamp="Timestamp", value="Price")


# =============================================================================
# Auto-bin fixtures — server-side time-bucket aggregation
# =============================================================================

# A 1M-row "tick" table with derived OHLC columns. Auto-bin reduces this to a
# few hundred bars on initial load. update_view keeps the derived columns lazy
# (see big_table above) so the OHLC variant adds no resident 1M-row cost.
big_ohlc_table = big_table.update_view(
    [
        "Open = Price - 1.0",
        "High = Price + 2.0",
        "Low = Price - 2.0",
        "Close = Price",
        "Volume = 1000.0 + Math.abs(Math.sin(ii * 0.01)) * 500.0",
    ]
)

# Histogram (default agg=sum) — auto-binned
tvl_big_hist = tvl.histogram(
    big_table,
    timestamp="Timestamp",
    value="Price",
)

# Histogram with count aggregation
tvl_big_hist_count = tvl.histogram(
    big_table,
    timestamp="Timestamp",
    value="Price",
    agg="count",
)

# Candlestick with four distinct OHLC columns (replaces the previously
# unsupported single-price Candlestick fixture).
tvl_big_candlestick = tvl.candlestick(
    big_ohlc_table,
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

# Bar (OHLC) variant
tvl_big_bar = tvl.bar(
    big_ohlc_table,
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

# Small histogram — should NOT trigger auto-bin
_small_hist_table = new_table(
    [
        datetime_col(
            "Timestamp",
            [to_j_instant(f"2024-01-{i+2:02d}T10:00:00 ET") for i in range(10)],
        ),
        double_col("Volume", [100.0 + i * 5 for i in range(10)]),
    ]
)
tvl_small_hist = tvl.histogram(_small_hist_table, timestamp="Timestamp", value="Volume")

# Ticking histogram — verify aggregated view ticks
tvl_ticking_hist = tvl.histogram(_ticking_table, timestamp="Timestamp", value="Price")

# Mixed series: Line (downsample path) + Histogram (auto-bin path)
# on different source tables.
tvl_mixed_line_hist = tvl.chart(
    tvl.line(big_table, timestamp="Timestamp", value="Price"),
    tvl.histogram(big_table, timestamp="Timestamp", value="Price"),
)

# Histogram with explicit bin_width override.
# Use a 1-month subset so PT5M produces ~8640 bins, not millions.
_bin_override_table = empty_table(1_000_000).update_view(
    [
        "Timestamp = '2024-01-01T00:00:00 ET' + (long)(ii * (30L * 24 * 3600 * 1_000_000_000L / 1_000_000))",
        "Price = 100 + Math.sin(ii * 0.0001) * 50",
    ]
)
tvl_big_hist_pt5m = tvl.histogram(
    _bin_override_table,
    timestamp="Timestamp",
    value="Price",
    bin_width="PT5M",
)

# Histogram with bin_count override. The default auto target is ~250 bins
# (DEFAULT_WIDTH_PX / BAR_PX), which over 10 years snaps to 30-day bins. A far
# smaller bin_count asks for fewer, coarser bins — landing in a wider "nice"
# bucket (90-day) so the override is observably distinct from the default.
tvl_big_hist_bc50 = tvl.histogram(
    big_table,
    timestamp="Timestamp",
    value="Price",
    bin_count=50,
)

# Histogram with auto_bin=False — opts out (small derived table to avoid
# shipping 1M rows to the client).
_optout_table = big_table.head(2000)
tvl_big_hist_optout = tvl.histogram(
    _optout_table,
    timestamp="Timestamp",
    value="Price",
    auto_bin=False,
)

# Diagnostic: area + volume histogram on big_table in 2 panes (mimics
# Sizzle Price+Volume panel shape).
tvl_big_area_volume_panes = tvl.chart(
    tvl.area(
        big_ohlc_table, timestamp="Timestamp", value="Close", title="Price", pane=0
    ),
    tvl.histogram(
        big_ohlc_table,
        timestamp="Timestamp",
        value="Volume",
        price_scale_id="vol",
        pane=1,
    ),
    pane_stretch_factors=[3.0, 1.0],
)

# Diagnostic: same shape as Sizzle Price+Volume — area+histogram on a
# FILTERED ticking table (uses where()).
from deephaven import updateby as _uby_diag

_diag_seed = empty_table(4000).update(
    [
        "Sym = ii % 5 == 0 ? `AAPL` : `OTHER`",
        "Timestamp = '2024-05-29T09:30:00 ET' + (long)(ii * 60_000_000_000L)",
        "Close = 150.0 + Math.sin(ii * 0.01) * 20",
        "Volume = (long)(500_000 + Math.random() * 1_500_000)",
    ]
)
_diag_aapl = _diag_seed.where("Sym = `AAPL`")
tvl_diag_filtered_panes = tvl.chart(
    tvl.area(_diag_aapl, timestamp="Timestamp", value="Close", pane=0),
    tvl.histogram(
        _diag_aapl, timestamp="Timestamp", value="Volume", price_scale_id="vol", pane=1
    ),
    pane_stretch_factors=[3.0, 1.0],
)
