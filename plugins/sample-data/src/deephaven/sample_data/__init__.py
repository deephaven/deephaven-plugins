"""
Deterministic, optionally ticking sample datasets for Deephaven.
The datasets only depend on Deephaven itself.

Each function returns a :class:`deephaven.table.Table`. Tables are ticking by
default; pass ``ticking=False`` to get a static table.
"""

# The deprecated deephaven.plot.tradingview_lightweight.data shim imports the private
# _tradingview module directly; do not rename it.
from ._generators import (
    jobs,
    marketing,
    stocks,
    fish_market,
    outages,
    flights,
    OUTAGE_CENTER,
    FLIGHT_CENTER,
)
from ._tradingview import (
    ohlc,
    stock_trades,
    volume,
    yields,
    options_chain,
    values,
    large_prices,
)

__all__ = [
    "jobs",
    "marketing",
    "stocks",
    "fish_market",
    "outages",
    "flights",
    "OUTAGE_CENTER",
    "FLIGHT_CENTER",
    "ohlc",
    "stock_trades",
    "volume",
    "yields",
    "options_chain",
    "values",
    "large_prices",
]
