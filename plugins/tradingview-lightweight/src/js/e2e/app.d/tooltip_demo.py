"""E2E fixture: a two-series line chart with the tracking tooltip enabled.

Loaded as a Deephaven Application-mode field (see ``tooltip.app``) so the chart
auto-opens as a panel when the e2e server boots. The Playwright spec hovers the
chart and asserts the ``data-tvl-tooltip`` DOM seam.
"""
from deephaven import empty_table
from deephaven.time import to_j_instant
from deephaven.plot import tradingview_lightweight as tvl  # type: ignore[attr-defined]

_start = to_j_instant("2024-01-01T00:00:00 ET")
_t = empty_table(500).update(
    [
        "Timestamp = _start + (long)(ii * 86_400_000_000_000L)",
        "Price = 100 + Math.sin(ii * 0.05) * 20",
        "Ema = 100 + Math.sin(ii * 0.05 - 0.4) * 16",
    ]
)

tooltip_chart = tvl.chart(
    tvl.line(_t, timestamp="Timestamp", value="Price", title="Price"),
    tvl.line(_t, timestamp="Timestamp", value="Ema", title="EMA"),
    tooltip_visible=True,
    tooltip_value_precision=2,
)
