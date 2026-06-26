"""Deterministic example-data tables for TradingView Lightweight charts.

Mirrors :mod:`deephaven.plot.express.data`: every function returns a fresh,
deterministic :class:`deephaven.table.Table` for docs examples and snapshot
tests. Generators produce realistic-looking market data via deterministic
random walks (geometric-Brownian-motion style) rather than closed-form
sine waves, so charts have visible structure without being noisy.

Each function takes a ``ticking`` argument. When ``ticking=True`` (default)
the table seeds with an initial static block and a ``time_table`` appends
new rows every second. When ``ticking=False`` the static block is returned
on its own. The env var ``DEEPHAVEN_PLUGINS_STATIC_DATA=1`` forces every
generator into static mode regardless of the argument; the docs snapshotter
sets it so captured PNGs are reproducible.

Typical usage::

    from deephaven.plot import tradingview_lightweight as tvl

    t = tvl.data.ohlc()
    chart = tvl.candlestick(t, timestamp="Timestamp", open="Open", high="High",
                            low="Low", close="Close")
"""

from __future__ import annotations

import math
import os
from random import Random

from deephaven import empty_table, time_table, merge
from deephaven.table import Table
from deephaven.time import to_j_instant
from deephaven.updateby import ema_tick, rolling_sum_tick


__all__ = [
    "ohlc",
    "stocks",
    "volume",
    "yields",
    "options_chain",
    "values",
    "large_prices",
]


# Only SECOND is exported as a Python constant — it fits comfortably in a
# Java int and matches dx.data's convention. MINUTE/HOUR/DAY are NOT
# defined here: DH provides them as built-in `long` constants inside formula
# scope, and shadowing them with Python ints overflows the formula compiler.
SECOND = 1_000_000_000

STARTING_TIME = "2024-01-01T09:30:00 ET"


def _resolve_ticking(ticking: bool) -> bool:
    """Apply the ``DEEPHAVEN_PLUGINS_STATIC_DATA=1`` global override."""
    if os.environ.get("DEEPHAVEN_PLUGINS_STATIC_DATA") == "1":
        return False
    return ticking


def _seeded(base_rows: int, ticking: bool) -> "Table":
    """Return a static-only or static-plus-ticking index table.

    The result has a single ``Index`` column counting from zero. When
    ``ticking`` is true, ``time_table("PT1S")`` continues to append rows
    indexed ``base_rows, base_rows + 1, ...``.
    """
    static = empty_table(base_rows).update("Index = ii")
    if not ticking:
        return static
    return merge(
        [
            static,
            time_table("PT1S")
            .update(f"Index = ii + {base_rows}")
            .drop_columns("Timestamp"),
        ]
    )


def ohlc(ticking: bool = True) -> "Table":
    """Build a daily OHLCV candle series from a deterministic price walk.

    Each row represents one trading day starting 2024-01-01. The price path
    is a smoothed random walk (windowed cumulative sum of Gaussian log-returns
    plus an EMA), giving visible trends and reversals instead of a pure sine.
    High/Low straddle Open/Close by an absolute-Gaussian intra-bar range, and
    volume swells with absolute return so big moves print big bars.

    Args:
        ticking: If true (default), the seed block is followed by one new
            candle per second. If false, only the static seed is returned.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Timestamp`` (Instant): daily timestamps from 2024-01-01.
        - ``Open`` (double): opening price.
        - ``High`` (double): high price, ≥ max(Open, Close).
        - ``Low`` (double): low price, ≤ min(Open, Close).
        - ``Close`` (double): closing price.
        - ``Volume`` (long): bar volume; correlates with |return|.
        - ``Ema`` (double): 20-tick EMA of ``Close``, for overlay examples.
    """
    base_time = to_j_instant(STARTING_TIME)
    base_rows = 90
    init_price = 100.0

    def gauss(seed: int) -> float:
        return Random(seed).gauss(0.0, 1.0)

    def lognorm(seed: int) -> float:
        return Random(seed).lognormvariate(0.0, 0.5)

    return (
        _seeded(base_rows, _resolve_ticking(ticking))
        .update(
            [
                "Timestamp = base_time + (long)(Index * DAY)",
                "Step = (double)gauss((int)(Index + 1))",
            ]
        )
        .update_by(
            ops=[rolling_sum_tick(cols=["Drift = Step"], rev_ticks=20, fwd_ticks=0)]
        )
        .update_by(ops=[ema_tick(decay_ticks=5, cols=["Smooth = Drift"])])
        .update(
            [
                "Mid = init_price + Smooth * 2.0",
                "BarStep = (double)gauss((int)(Index + 11)) * 0.8",
                "Range = (double)Math.abs(gauss((int)(Index + 7))) * 1.5 + 0.4",
                "Open = Mid",
                "Close = Mid + BarStep",
                "High = Math.max(Open, Close) + Range",
                "Low = Math.min(Open, Close) - Range",
                "Volume = (long)Math.max(50.0, 1000.0 + Math.abs(BarStep) * 800.0 "
                "+ (double)lognorm((int)(Index + 13)) * 300.0)",
            ]
        )
        .update_by(ops=[ema_tick(decay_ticks=20, cols=["Ema = Close"])])
        .view(["Timestamp", "Open", "High", "Low", "Close", "Volume", "Ema"])
    )


def stocks(ticking: bool = True) -> "Table":
    """Build a multi-symbol trades table with per-symbol price walks.

    Three symbols (``AAA``, ``BBB``, ``CCC``) tick in round-robin. Each
    symbol has an independent random walk anchored at a distinct base
    price (90, 140, 60) with its own volatility, so by-grouped chart
    examples (line/area/baseline) show three visually distinct series.

    Args:
        ticking: If true (default), trades tick in once per second after
            an initial 120-row seed. If false, only the static seed is
            returned.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Timestamp`` (Instant): daily timestamps from 2024-01-01.
        - ``Sym`` (string): one of ``"AAA"``, ``"BBB"``, ``"CCC"``.
        - ``Price`` (double): symbol-dependent price walk.
        - ``Size`` (long): trade size; lognormal-ish, ~100 +/- 50.
    """
    base_time = to_j_instant(STARTING_TIME)
    base_rows = 360

    syms = ["AAA", "BBB", "CCC"]
    sym_bases = {"AAA": 90.0, "BBB": 140.0, "CCC": 60.0}
    sym_vols = {"AAA": 1.6, "BBB": 2.8, "CCC": 1.0}

    def pick_sym(seed: int) -> str:
        return syms[seed % 3]

    def sym_step(sym: str, seed: int) -> float:
        return Random(seed * 7 + hash(sym) % 1000).gauss(0.0, sym_vols[sym])

    def sym_base(sym: str) -> float:
        return sym_bases[sym]

    def size_lognorm(seed: int) -> int:
        return max(1, int(round(Random(seed).lognormvariate(4.0, 0.6))))

    return (
        _seeded(base_rows, _resolve_ticking(ticking))
        .update(
            [
                "Timestamp = base_time + (long)(Index * DAY)",
                "Sym = (String)pick_sym((int)Index)",
                "Step = (double)sym_step(Sym, (int)(Index + 3))",
            ]
        )
        .update_by(
            ops=[rolling_sum_tick(cols=["Drift = Step"], rev_ticks=30, fwd_ticks=0)],
            by=["Sym"],
        )
        .update_by(
            ops=[ema_tick(decay_ticks=3, cols=["Smooth = Drift"])],
            by=["Sym"],
        )
        .update(
            [
                "Price = (double)sym_base(Sym) + Smooth",
                "Size = (long)size_lognorm((int)(Index + 17))",
            ]
        )
        .view(["Timestamp", "Sym", "Price", "Size"])
    )


def volume(ticking: bool = True) -> "Table":
    """Build a standalone daily volume series with weekly seasonality.

    Designed for the histogram example. The volume curve is a lognormal
    base scaled by a weekday-of-week factor (Mondays/Fridays heavier),
    so the histogram has visible structure beyond pure noise.

    Args:
        ticking: If true (default), one new bar ticks in per second after
            the 60-row seed. If false, only the static seed is returned.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Timestamp`` (Instant): daily timestamps from 2024-01-01.
        - ``Volume`` (long): daily volume, lognormal w/ weekly seasonality.
    """
    base_time = to_j_instant(STARTING_TIME)
    base_rows = 60

    # Mon..Sun multipliers; weekends omitted from the synthetic feed.
    weekday_mult = [1.4, 0.9, 0.85, 0.95, 1.3]

    def weekday_factor(idx: int) -> float:
        return weekday_mult[idx % 5]

    def vol_noise(seed: int) -> float:
        return Random(seed).lognormvariate(0.0, 0.35)

    return (
        _seeded(base_rows, _resolve_ticking(ticking))
        .update(
            [
                "Timestamp = base_time + (long)(Index * DAY)",
                "Volume = (long)Math.max(50.0, 1000.0 "
                "* (double)weekday_factor((int)Index) "
                "* (double)vol_noise((int)(Index + 23)))",
            ]
        )
        .view(["Timestamp", "Volume"])
    )


def yields(ticking: bool = True) -> "Table":
    """Build an 11-point Treasury yield-curve snapshot.

    Tenors follow the canonical Treasury set (3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y,
    10Y, 20Y, 30Y, 40Y) and are emitted **in months** (3, 6, 12, 24, 36,
    60, 84, 120, 240, 360, 480) — the unit LWC's ``createYieldCurveChart``
    expects on its maturity axis. The yields use a Nelson-Siegel-style mix
    of level, slope, and curvature factors, producing a normal
    upward-sloping curve with a belly peak.

    In ticking mode a single replacement curve emits each second with the
    factors perturbed by small Gaussians, so the chart redraws a slowly
    drifting curve over time. ``last_by("Tenor")`` keeps the row count flat.

    Args:
        ticking: If true (default), the curve updates once per second.
            If false, a single static snapshot is returned.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Tenor`` (double): months to maturity.
        - ``Yield`` (double): yield in percent.
    """
    tenors = [3.0, 6.0, 12.0, 24.0, 36.0, 60.0, 84.0, 120.0, 240.0, 360.0, 480.0]

    def tenor_at(i: int) -> float:
        return tenors[i % len(tenors)]

    # Nelson-Siegel level/slope/curvature with a small per-tick drift.
    # `decay` is in years; convert tenor (months) to years inside yield_at.
    def curve_factor(seed: int, idx: int) -> tuple[float, float, float, float]:
        r = Random(seed)
        level = 4.0 + r.gauss(0.0, 0.05)
        slope = -2.0 + r.gauss(0.0, 0.05)
        curv = 2.0 + r.gauss(0.0, 0.05)
        decay = 1.5
        return level, slope, curv, decay

    def yield_at(tenor: float, seed: int, idx: int) -> float:
        level, slope, curv, decay = curve_factor(seed, idx)
        tenor_y = tenor / 12.0
        if tenor_y <= 0:
            return level + slope + curv
        x = tenor_y / decay
        expx = math.exp(-x)
        factor1 = (1.0 - expx) / x
        factor2 = factor1 - expx
        return round(level + slope * factor1 + curv * factor2, 3)

    static = empty_table(len(tenors)).update(
        [
            "Tenor = (double)tenor_at((int)ii)",
            "Yield = (double)yield_at(Tenor, 0, (int)ii)",
        ]
    )

    if not _resolve_ticking(ticking):
        return static

    ticking_curve = (
        time_table("PT1S")
        .update(
            [
                "Bucket = ii % 11",
                "Tenor = (double)tenor_at((int)Bucket)",
                "Yield = (double)yield_at(Tenor, (int)(ii / 11) + 1, (int)Bucket)",
            ]
        )
        .drop_columns(["Timestamp", "Bucket"])
        .last_by("Tenor")
    )

    return merge([static, ticking_curve]).last_by("Tenor")


def options_chain(ticking: bool = True) -> "Table":
    """Build a 21-strike options chain with a Black-Scholes-flavored smile.

    Strikes step by 5 from 50 to 150 (ATM = 100). Call and put mid prices
    follow intrinsic value plus a Gaussian-shaped time premium centered on
    the spot; bid/ask spreads widen at the wings to mimic real chains.
    A small volatility smile pushes wing IVs above the ATM IV.

    In ticking mode the chain refreshes every second with the spot drifting
    via a smoothed random walk, so the smile and intrinsic legs slide
    together.

    Args:
        ticking: If true (default), the chain refreshes once per second.
            If false, a single static snapshot at spot=100 is returned.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Strike`` (double): strike price, 50..150 by 5.
        - ``CallBid`` (double): call bid price.
        - ``CallAsk`` (double): call ask price.
        - ``PutBid`` (double): put bid price.
        - ``PutAsk`` (double): put ask price.
    """
    strike_count = 21

    def strike_at(i: int) -> float:
        return 50.0 + (i % strike_count) * 5.0

    def spot_at(seed: int) -> float:
        # Smooth drift around 100 for the ticking case; deterministic per second.
        steps = [Random(s).gauss(0.0, 0.4) for s in range(seed + 1)]
        return round(100.0 + sum(steps[-40:]), 2)

    def smile_iv(strike: float, spot: float) -> float:
        moneyness = (strike - spot) / spot
        return 0.22 + 0.6 * moneyness * moneyness

    def call_mid(strike: float, spot: float) -> float:
        intrinsic = max(0.0, spot - strike)
        time_value = 6.0 * math.exp(-((strike - spot) ** 2) / 600.0)
        return round(intrinsic + time_value * (1.0 + smile_iv(strike, spot) * 0.4), 2)

    def put_mid(strike: float, spot: float) -> float:
        intrinsic = max(0.0, strike - spot)
        time_value = 6.0 * math.exp(-((strike - spot) ** 2) / 600.0)
        return round(intrinsic + time_value * (1.0 + smile_iv(strike, spot) * 0.4), 2)

    def half_spread(strike: float, spot: float) -> float:
        moneyness = abs(strike - spot) / spot
        return round(0.1 + 0.6 * moneyness, 3)

    static = (
        empty_table(strike_count)
        .update(
            [
                "Strike = (double)strike_at((int)ii)",
                "Spot = 100.0",
                "CallMid = (double)call_mid(Strike, Spot)",
                "PutMid = (double)put_mid(Strike, Spot)",
                "Spread = (double)half_spread(Strike, Spot)",
                "CallBid = CallMid - Spread",
                "CallAsk = CallMid + Spread",
                "PutBid = PutMid - Spread",
                "PutAsk = PutMid + Spread",
            ]
        )
        .view(["Strike", "CallBid", "CallAsk", "PutBid", "PutAsk"])
    )

    if not _resolve_ticking(ticking):
        return static

    ticking_chain = (
        time_table("PT1S")
        .update(
            [
                "Bucket = ii % 21",
                "Strike = (double)strike_at((int)Bucket)",
                "Spot = (double)spot_at((int)(ii / 21))",
                "CallMid = (double)call_mid(Strike, Spot)",
                "PutMid = (double)put_mid(Strike, Spot)",
                "Spread = (double)half_spread(Strike, Spot)",
                "CallBid = CallMid - Spread",
                "CallAsk = CallMid + Spread",
                "PutBid = PutMid - Spread",
                "PutAsk = PutMid + Spread",
            ]
        )
        .drop_columns("Timestamp")
        .last_by("Strike")
        .view(["Strike", "CallBid", "CallAsk", "PutBid", "PutAsk"])
    )

    return merge([static, ticking_chain]).last_by("Strike")


def values(ticking: bool = True) -> "Table":
    """Build a single-value time series with visible structure.

    Designed for the simplest line/area/baseline/histogram example pages.
    The series is a smoothed random walk (Gaussian steps + EMA), so it
    has runs, reversals, and consolidations — readable shape but not
    pure noise.

    Args:
        ticking: If true (default), one new sample ticks in per second
            after the 90-row seed. If false, only the static seed is
            returned.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Timestamp`` (Instant): daily timestamps from 2024-01-01.
        - ``Value`` (double): smoothed walk centered at ~100.
    """
    base_time = to_j_instant(STARTING_TIME)
    base_rows = 90

    def gauss(seed: int) -> float:
        return Random(seed).gauss(0.0, 1.0)

    return (
        _seeded(base_rows, _resolve_ticking(ticking))
        .update(
            [
                "Timestamp = base_time + (long)(Index * DAY)",
                "Step = (double)gauss((int)(Index + 31))",
            ]
        )
        .update_by(
            ops=[rolling_sum_tick(cols=["Drift = Step"], rev_ticks=25, fwd_ticks=0)]
        )
        .update_by(ops=[ema_tick(decay_ticks=6, cols=["Smooth = Drift"])])
        .update("Value = 100.0 + Smooth * 3.0")
        .view(["Timestamp", "Value"])
    )


def large_prices(ticking: bool = True) -> "Table":
    """Build a 1,000,000-row intraday price series for the downsampling demos.

    Timestamps step uniformly so 1M rows cover ~10 years (~315 seconds per
    row). The price curve combines a low-frequency drift (cumulative sum of
    small Gaussians) with a higher-frequency wiggle, giving the downsampler
    structure to thin without making the chart look noisy.

    Args:
        ticking: If true (default), additional rows tick in once per second
            after the 1M-row seed. If false, only the static seed is
            returned. Note that 1M static + ticking is a large table —
            prefer ``ticking=False`` for the downsample comparison demo.

    Returns:
        A :class:`deephaven.table.Table` with columns:

        - ``Timestamp`` (Instant): ~315-second spaced timestamps from 2020-01-01.
        - ``Price`` (double): smoothed walk centered at ~100.
    """
    base_rows = 1_000_000
    # ~315 seconds = 10 years / 1M rows. Inlined as a Java long literal in
    # the formula below to avoid the Python-int-overflows-Java-int trap.
    STEP_NANOS_LITERAL = "315360000000L"

    def gauss(seed: int) -> float:
        return Random(seed).gauss(0.0, 1.0)

    return (
        _seeded(base_rows, _resolve_ticking(ticking))
        .update(
            [
                f"Timestamp = '2020-01-01T00:00:00Z' + (long)(Index * {STEP_NANOS_LITERAL})",
                "Step = (double)gauss((int)(Index + 47))",
            ]
        )
        .update_by(
            ops=[rolling_sum_tick(cols=["Drift = Step"], rev_ticks=5000, fwd_ticks=0)]
        )
        .update_by(ops=[ema_tick(decay_ticks=100, cols=["Smooth = Drift"])])
        .update(
            "Price = 100.0 + Smooth * 0.6 + (double)gauss((int)(Index + 991)) * 2.0"
        )
        .view(["Timestamp", "Price"])
    )
