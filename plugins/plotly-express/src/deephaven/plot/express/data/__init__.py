"""
Deprecated: the sample datasets have moved to the ``deephaven-sample-data`` package.
Use :mod:`deephaven.sample_data` instead.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from . import data_generators
from ._deprecation import get_deprecated_attr, import_sample_data

if TYPE_CHECKING:
    # Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
    from deephaven.sample_data import (  # pyright: ignore[reportMissingImports]
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

# Only the names this module provided before it was deprecated, so datasets added to
# deephaven.sample_data later are not exposed here
_LEGACY_NAMES = [
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


def __getattr__(name: str) -> Any:
    if name == "__all__":
        return [*_LEGACY_NAMES, "data_generators"]
    if name.startswith("__"):
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    if name not in _LEGACY_NAMES:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    return get_deprecated_attr(__name__, import_sample_data(), name)


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(_LEGACY_NAMES))
