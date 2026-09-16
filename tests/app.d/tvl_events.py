"""Fixture for the press-event Playwright spec.

A partitioned (`by=`) line chart with two series far apart in price at a known
time T (key ``A`` ~= 10, key ``B`` ~= 90). Crosshair magnet mode snaps clicks
to the nearest data point so the inversion-oracle is deterministic. The
``on_press`` handler writes each event into ``tvl_events_result`` so the spec
can prove the full canvas -> JS -> wire -> Python -> handler -> table round
trip by reading that table back through the JS API.
"""

from typing import Any

from deephaven import new_table
from deephaven.column import datetime_col, double_col, string_col
from deephaven.time import to_j_instant
from deephaven.stream.table_publisher import table_publisher
from deephaven import dtypes as dht
from deephaven.plot import tradingview_lightweight as tvl

# Known time T the spec clicks on (and a few flanking points so each line has
# extent). ET offsets are resolved by to_j_instant.
_TIMES = [
    "2024-06-03T10:00:00 ET",
    "2024-06-04T10:00:00 ET",
    "2024-06-05T10:00:00 ET",
    "2024-06-06T10:00:00 ET",
    "2024-06-07T10:00:00 ET",
]

# Two partitions: A flat ~10, B flat ~90 — far apart so a click unambiguously
# lands on one series under magnet snapping.
_src = new_table(
    [
        datetime_col(
            "Timestamp",
            [to_j_instant(t) for t in _TIMES] + [to_j_instant(t) for t in _TIMES],
        ),
        string_col("Sym", ["A"] * len(_TIMES) + ["B"] * len(_TIMES)),
        double_col(
            "Price",
            [10.0, 10.0, 10.0, 10.0, 10.0] + [90.0, 90.0, 90.0, 90.0, 90.0],
        ),
    ]
)

# Result table the handler appends to (round-trip proof).
_result_pub_table, _result_pub = table_publisher(
    "tvl_events_result",
    {
        "Type": dht.string,
        "SeriesId": dht.string,
        "Price": dht.double,
        "Time": dht.Instant,
    },
)
tvl_events_result = _result_pub_table.tail(50)


def _on_press(e: Any) -> None:
    # The press event has no top-level price; it lives in seriesData under the
    # hovered series' friendly id.
    series = e.get("hoveredSeries")
    point = (e.get("seriesData") or {}).get(series) if series is not None else None
    price = point.get("value") if isinstance(point, dict) else None
    t = e.get("timestamp")
    if t is None or price is None:
        return  # press landed off the data - nothing to round-trip
    _result_pub.add(
        new_table(
            [
                string_col("Type", [str(e.get("type", ""))]),
                string_col("SeriesId", [str(series)]),
                double_col("Price", [float(price)]),
                datetime_col("Time", [t]),
            ]
        )
    )


# Compose so the chart carries crosshair magnet mode + the handlers; the
# per-type line carries the `by=` partition template.
tvl_events_chart = tvl.chart(
    tvl.line(_src, timestamp="Timestamp", value="Price", by="Sym"),
    crosshair=tvl.crosshair(mode="magnet"),
    on_press=_on_press,
    on_double_press=lambda e: None,
)
