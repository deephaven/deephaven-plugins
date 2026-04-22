"""Minimal test fixture for Python-side downsampling."""

from deephaven.column import double_col, datetime_col
from deephaven import new_table, empty_table
from deephaven.time import to_j_instant
from deephaven.plot import tradingview_lightweight as tvl

# Small table (not downsampled)
small_table = new_table(
    [
        datetime_col(
            "Timestamp",
            [to_j_instant(f"2024-01-{i+2:02d}T10:00:00 ET") for i in range(10)],
        ),
        double_col("Value", [50.0 + i * 3 for i in range(10)]),
    ]
)
tvl_small = tvl.line(small_table, time="Timestamp", value="Value")

# Big table (10M rows - should be downsampled)
_big_start = to_j_instant("2014-01-01T00:00:00 ET")
big_table = empty_table(10_000_000).update(
    [
        "Timestamp = _big_start + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
        "Price = 100 + Math.sin(ii * 0.0001) * 50 + (ii * 0.000005)",
    ]
)
tvl_big = tvl.line(big_table, time="Timestamp", value="Price")
