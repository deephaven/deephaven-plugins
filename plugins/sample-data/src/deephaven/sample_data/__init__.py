"""
Deterministic, optionally ticking sample datasets for Deephaven.

Each function returns a :class:`deephaven.table.Table`. Tables are ticking by
default; pass ``ticking=False`` to get a static table.
"""

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
]
