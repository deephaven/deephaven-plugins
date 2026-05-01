"""Isolated Price+Volume test fixture.

Mimics the Sizzle dashboard's "Price + Volume" panel in isolation so
autobin/viewport behavior can be exercised without the cost of the full
dashboard. Loads as `pv_chart` in the IDE.

- Seed: 4000 1-minute rows for one symbol (AAPL).
- Tick: 0.5s synthetic minute-bar appender that continues from the seed.
- Two-pane chart: area_series (Close) + histogram_series (Volume).
"""

from deephaven import empty_table, merge, time_table, ui
from deephaven.time import to_j_instant
from deephaven import updateby as uby
from deephaven.plot import tradingview_lightweight as tvl

_SEED_ROWS = 4_000
_seed_start = to_j_instant("2024-05-29T09:30:00 ET")

seed = (
    empty_table(_SEED_ROWS)
    .update(
        [
            "Sym = `AAPL`",
            "Timestamp = _seed_start + (long)(ii * 60_000_000_000L)",
            "_Ret = (Math.random() - 0.48) * 1.2",
        ]
    )
    .update_by([uby.cum_sum(cols=["_Cum = _Ret"])])
    .update(
        [
            "Close  = 150.0 + _Cum",
            "Volume = (long)(500_000 + Math.random() * 1_500_000)",
        ]
    )
    .view(["Sym", "Timestamp", "Close", "Volume"])
)

_last_close = seed.last_by("Sym").view(["Sym", "LastClose = Close"])

ticker = (
    time_table("PT00:00:00.500000000")
    .drop_columns("Timestamp")
    .update(
        [
            "Sym = `AAPL`",
            f"Timestamp = _seed_start + (long)(({_SEED_ROWS}L + ii) * 60_000_000_000L)",
            "_Ret = (Math.random() - 0.48) * 1.2",
        ]
    )
    .update_by([uby.cum_sum(cols=["_Cum = _Ret"])], by=["Sym"])
    .natural_join(_last_close, on="Sym")
    .update(
        [
            "Close  = LastClose + _Cum",
            "Volume = (long)(500_000 + Math.random() * 1_500_000)",
        ]
    )
    .view(["Sym", "Timestamp", "Close", "Volume"])
)

pv_data = merge([seed, ticker])

pv_chart = tvl.chart(
    tvl.area_series(pv_data, time="Timestamp", value="Close", title="Price", pane=0),
    tvl.histogram_series(
        pv_data,
        time="Timestamp",
        value="Volume",
        price_scale_id="vol",
        pane=1,
    ),
    crosshair_mode="magnet",
    vert_lines_visible=False,
    horz_lines_visible=False,
    pane_stretch_factors=[3.0, 1.0],
)
