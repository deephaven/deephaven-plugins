"""E2E fixtures for the in-chart legend.

One chart per behaviour the spec asserts: the default rows legend, the OHLC
row form, a series that starts hidden, and a capped legend. The spec reads the
``data-tvl-legend`` DOM seam and clicks rows to toggle series.

Data comes from ``tvl.data`` with ``ticking=False``, so the charts hold still.
"""

from deephaven.updateby import ema_tick
from deephaven.plot import tradingview_lightweight as tvl  # type: ignore[attr-defined]

_t = (
    tvl.data.values(ticking=False)
    .update_view(["Price = Value"])
    .update_by(ops=[ema_tick(decay_ticks=10, cols=["Ema = Price"])])
)

# Default: variant="auto" over two series, so this resolves to rows.
tvl_legend_chart = tvl.chart(
    tvl.line(_t, timestamp="Timestamp", value="Price", title="Price"),
    tvl.line(_t, timestamp="Timestamp", value="Ema", title="EMA"),
    legend=tvl.legend(),
)

# A series that starts hidden, so its row renders dimmed from first paint.
tvl_legend_hidden_start_chart = tvl.chart(
    tvl.line(_t, timestamp="Timestamp", value="Price", title="Primary"),
    tvl.line(
        _t,
        timestamp="Timestamp",
        value="Ema",
        title="Optional overlay",
        visible=False,
    ),
    legend=tvl.legend(),
)

# Two series, so "auto" resolves to rows and the OHLC row form is exercised
# alongside a plain single-value row.
_ohlc = tvl.data.ohlc(ticking=False).update_view(["Vwap = (High + Low + Close) / 3"])

tvl_legend_ohlc_chart = tvl.chart(
    tvl.candlestick(_ohlc, timestamp="Timestamp", title="ES futures"),
    tvl.line(_ohlc, timestamp="Timestamp", value="Vwap", title="VWAP"),
    legend=tvl.legend(),
)

# More series than max_rows, for the "+N more" line and hover promotion.
# tvl.data has no wide multi-series helper, so this stacks offsets onto the
# real value walk: the SHAPE is a genuine random walk, just repeated.
_wide = tvl.data.values(ticking=False).update_view(
    [f"V{i} = Value + {i * 12}" for i in range(8)]
)

tvl_legend_capped_chart = tvl.chart(
    *[
        tvl.line(_wide, timestamp="Timestamp", value=f"V{i}", title=f"S{i}")
        for i in range(8)
    ],
    legend=tvl.legend(max_rows=3),
)
