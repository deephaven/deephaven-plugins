from .data_generators import (
    iris,
    tips,
    election,
    wind,
    gapminder,
)

# Datasets that only need Deephaven live in the deephaven-sample-data package
# Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
from deephaven.sample_data import (  # pyright: ignore[reportMissingImports]
    jobs,
    marketing,
    stocks,
    fish_market,
    outages,
    flights,
    OUTAGE_CENTER,
    FLIGHT_CENTER,
)
