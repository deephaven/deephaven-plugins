"""Test fixture for disconnect comparison: iris-grid table, plotly-express chart, TVL chart."""
from deephaven import empty_table
from deephaven.time import to_j_instant
from deephaven.plot import express as dx
from deephaven.plot import tradingview_lightweight as tvl

_start = to_j_instant("2024-01-01T00:00:00 ET")
test_table = empty_table(1000).update(
    [
        "Timestamp = _start + (long)(ii * 86_400_000_000_000L)",
        "Price = 100 + Math.sin(ii * 0.05) * 20",
    ]
)

# iris-grid panel (plain table)
grid_panel = test_table

# plotly-express panel
dx_panel = dx.line(test_table, x="Timestamp", y="Price")

# TVL panel
tvl_panel = tvl.line(test_table, time="Timestamp", value="Price")
