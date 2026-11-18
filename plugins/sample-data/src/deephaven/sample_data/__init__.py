"""
Deterministic, optionally ticking sample datasets for Deephaven.
Datasets based on public data are vendored in this package; see NOTICE for their sources.

Each function returns a :class:`deephaven.table.Table`. Tables are ticking by
default; pass ``ticking=False`` to get a static table.
"""

# The deprecated deephaven.plot.express.data and deephaven.plot.tradingview_lightweight.data
# shims import the private _generators and _tradingview modules directly; do not rename them.
from ._generators import (
    iris,
    jobs,
    marketing,
    stocks,
    tips,
    election,
    wind,
    gapminder,
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
    "iris",
    "jobs",
    "marketing",
    "stocks",
    "tips",
    "election",
    "wind",
    "gapminder",
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
