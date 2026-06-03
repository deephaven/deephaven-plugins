"""Compare downsample output sizes: plotly-express vs TVL.

Creates the SAME 100K-row table. Charts are created interactively
in the console to avoid startup load.
"""
from deephaven import empty_table
from deephaven.time import to_j_instant

# Shared source: 100K rows, 1 year of data
_start = to_j_instant("2024-01-01T00:00:00 ET")
source_100k = empty_table(100_000).update(
    [
        "Timestamp = _start + (long)(ii * (365L * 24 * 3600 * 1_000_000_000L / 100_000))",
        "Price = 100 + Math.sin(ii * 0.001) * 50 + (ii * 0.0003)",
    ]
)
