"""Server-side auto time-bin aggregation for Histogram, Candlestick, and Bar series.

Histogram / OHLC charts cannot be downsampled by min/max-per-bin (the JS-side
``runChartDownsample`` path used for Line / Area / Baseline). For raw tick
input the natural primitive is server-side time-bin aggregation:

    table.update_view(["Bin = upperBin(time, w)"])
         .agg_by([sum(value)], by=["Bin"])

Bin widths are chosen automatically from the visible time range and snapped to
"nice" durations. On zoom, the listener swaps in a finer-grained aggregation.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional

try:
    from deephaven import agg, merge as dh_merge
except ImportError:  # test envs without DH server
    agg = None  # type: ignore[assignment]
    dh_merge = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

# Approximate pixels per bar at "fat, visually distinct" density.
# Used to derive target_bins from the chart's pixel width: target_bins = width_px / BAR_PX.
#
# LWC v5's histogram bar width is `round(barSpacing) - 1`, plus a secondary
# adjustment loop that shrinks bars by 1 when accumulated rounding pushes
# neighbors closer than expected. In practice barSpacing ~5-6 yields bars
# in the 2-3 px range; targeting 8 px per bar keeps the rendered width
# comfortably above 4 across panel sizes after the snap-to-nice-duration
# rounding in nice_bin_width().
BAR_PX = 8

# Hard floor on bar pixel width. The client rounds widthPx up to the nearest
# 1000 for engine cache friendliness, so the rounded width can overshoot the
# actual chart by up to ~1000 px. Clamping target_bins by
# actualWidthPx / MIN_BAR_PX guarantees bars stay above the visible-bar
# threshold even with that overshoot.
MIN_BAR_PX = 5

# Default chart width assumed when widthPx isn't available (e.g., the initial
# RETRIEVE that runs before the client tells us how big the chart is).
DEFAULT_WIDTH_PX = 2000

# Target number of bins when widthPx isn't supplied. Calibrated as
# DEFAULT_WIDTH_PX / BAR_PX so the constant-default initial render and the
# width-aware zoom path agree on what "fat bar" means.
TARGET_BINS = DEFAULT_WIDTH_PX // BAR_PX

# Re-aggregate when fewer than this many of the current bins are visible
# (zoom-in trigger: bins are too coarse for the visible window).
MIN_VISIBLE_BINS = 80

# Re-aggregate when more than ``target_bins * MAX_VISIBLE_BINS_RATIO`` of the
# current bins are visible (zoom-out trigger: bins are too fine — leaves
# sub-pixel hash bars on the chart). The current width should give roughly
# target_bins; allow up to 2x before coarsening.
MAX_VISIBLE_BINS_RATIO = 2


def target_bins_for_width(
    width_px: Optional[int],
    actual_width_px: Optional[int] = None,
    fallback: int = TARGET_BINS,
) -> int:
    """Return target_bins for a chart pixel width.

    ``width_px`` is the cache-friendly rounded width (rounded up to a 1000-px
    bucket on the client). ``actual_width_px`` is the chart's real pixel width
    when known; if supplied, the result is clamped so that
    ``actual_width_px / target_bins >= MIN_BAR_PX`` — i.e. each bar is at
    least ``MIN_BAR_PX`` pixels even when the rounded width overshoots.
    """
    if width_px is None or width_px <= 0:
        return fallback
    base = max(1, int(width_px) // BAR_PX)
    if actual_width_px is not None and actual_width_px > 0:
        floor = max(1, int(actual_width_px) // MIN_BAR_PX)
        return min(base, floor)
    return base


NS_PER_US = 1_000
NS_PER_MS = 1_000_000
NS_PER_S = 1_000_000_000
NS_PER_MIN = 60 * NS_PER_S
NS_PER_HOUR = 60 * NS_PER_MIN
NS_PER_DAY = 24 * NS_PER_HOUR

# Allowed "nice" bin widths in nanoseconds. The first value >= the requested
# width is selected.
NICE_BIN_WIDTHS_NS: list[int] = [
    1,  # 1 ns
    100,  # 100 ns
    NS_PER_US,  # 1 µs
    100 * NS_PER_US,  # 100 µs
    NS_PER_MS,  # 1 ms
    10 * NS_PER_MS,  # 10 ms
    100 * NS_PER_MS,  # 100 ms
    NS_PER_S,  # 1 s
    5 * NS_PER_S,  # 5 s
    15 * NS_PER_S,  # 15 s
    30 * NS_PER_S,  # 30 s
    NS_PER_MIN,  # 1 m
    5 * NS_PER_MIN,  # 5 m
    15 * NS_PER_MIN,  # 15 m
    30 * NS_PER_MIN,  # 30 m
    NS_PER_HOUR,  # 1 h
    4 * NS_PER_HOUR,  # 4 h
    12 * NS_PER_HOUR,  # 12 h
    NS_PER_DAY,  # 1 d
    7 * NS_PER_DAY,  # 7 d
    30 * NS_PER_DAY,  # 30 d
    90 * NS_PER_DAY,  # 90 d (~1 quarter)
    365 * NS_PER_DAY,  # 1 y
]

# Histogram aggregation modes.
HIST_AGGS = {"sum", "count", "avg", "last"}


def nice_bin_width(range_ns: int, target_bins: int = TARGET_BINS) -> int:
    """Round ``range_ns / target_bins`` up to the nearest nice duration.

    Always returns at least 1ns; never larger than the largest nice value.
    """
    if range_ns <= 0 or target_bins <= 0:
        return 1
    raw = max(1, range_ns // target_bins)
    for w in NICE_BIN_WIDTHS_NS:
        if w >= raw:
            return w
    return NICE_BIN_WIDTHS_NS[-1]


# ISO 8601 duration: PnDTnHnMnS (we accept floats on seconds too)
_ISO_DURATION_RE = re.compile(
    r"^P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?"
    r"(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+(?:\.\d+)?)S)?)?$"
)


def parse_bin_width(spec: Any) -> int:
    """Parse an ISO 8601 duration string or numeric ns value to nanoseconds.

    Examples: ``'PT1S'``, ``'PT5M'``, ``'PT1H'``, ``'P1D'``.
    Numeric ints are passed through (mostly used by tests).
    """
    if spec is None:
        raise ValueError("bin_width must be provided")
    if isinstance(spec, int):
        if spec <= 0:
            raise ValueError(f"bin_width must be > 0, got {spec}")
        return spec
    if not isinstance(spec, str):
        raise ValueError(
            f"bin_width must be an ISO 8601 duration string or int ns, got {type(spec).__name__}"
        )

    m = _ISO_DURATION_RE.match(spec)
    if not m or all(g is None for g in m.groupdict().values()):
        raise ValueError(
            f"Invalid ISO 8601 duration {spec!r}. Examples: 'PT1S', 'PT5M', 'PT1H', 'P1D'"
        )
    days = int(m.group("days") or 0)
    hours = int(m.group("hours") or 0)
    minutes = int(m.group("minutes") or 0)
    seconds = float(m.group("seconds") or 0)
    total_ns = (
        days * NS_PER_DAY
        + hours * NS_PER_HOUR
        + minutes * NS_PER_MIN
        + int(seconds * NS_PER_S)
    )
    if total_ns <= 0:
        raise ValueError(f"bin_width must be > 0, got {spec!r}")
    return total_ns


def _epoch_ns_range(table: Any, time_col: str) -> Optional[tuple[int, int]]:
    """Return (min_ns, max_ns) for ``time_col`` in ``table``, or None on failure."""
    try:
        size = table.size
    except Exception:
        return None
    if size <= 0:
        return None
    if agg is None:
        return None
    try:
        summary = table.view([f"__T = epochNanos({time_col})"]).agg_by(
            [agg.min_("__Min=__T"), agg.max_("__Max=__T")]
        )
        snap = summary.snapshot()
        col_min = snap.j_table.getColumnSource("__Min").get(0)
        col_max = snap.j_table.getColumnSource("__Max").get(0)
        return int(col_min), int(col_max)
    except Exception:
        logger.exception("failed to compute time range for %s", time_col)
        return None


def get_full_range_ns(table: Any, time_col: str) -> Optional[tuple[int, int]]:
    """Public helper exposing the (min, max) epoch-ns range for a column."""
    return _epoch_ns_range(table, time_col)


def _common_aggregated_view(
    raw: Any,
    time_col: str,
    bin_width_ns: int,
    aggs: list[Any],
    extra_value_cols: list[str],
) -> Any:
    """Bin by upperBin(time, w) and aggregate, restoring the time column name.

    The output schema is ``[time_col, *extra_value_cols]`` so the renderer can
    consume it without knowing it was aggregated.
    """
    binned = raw.update_view([f"__Bin = upperBin({time_col}, {bin_width_ns}L)"])
    aggregated = binned.agg_by(aggs, by=["__Bin"])
    # Replace __Bin with the original time column name and order columns
    final = aggregated.update_view([f"{time_col} = __Bin"]).drop_columns(["__Bin"])
    return final.view([time_col, *extra_value_cols]).sort(time_col)


def _build_anchor(
    raw: Any,
    time_col: str,
    slice_filter: str,
    aggs: list[Any],
    out_cols: list[str],
    time_pos: str,
) -> Any:
    """Build a one-row anchor table from a filtered slice of ``raw``.

    The anchor's value columns come from ``aggs`` collapsed across the slice
    (no by argument). Its time column comes from ``agg.first(time_col)`` for
    ``time_pos='first'`` or ``agg.last(time_col)`` for ``time_pos='last'``;
    that's the leftmost / rightmost real row in the slice — which is at most
    ``body_from`` for the head and at least ``body_to`` for the tail. LWC
    only needs *something* at-or-before ``fullStart`` and at-or-after
    ``fullEnd`` for ``fixLeftEdge`` / ``fixRightEdge`` to clamp, so this is
    sufficient. If the slice is empty, ``agg_by`` returns 0 rows.
    """
    assert agg is not None, "_build_anchor requires deephaven.agg to be importable"
    time_agg = agg.first(time_col) if time_pos == "first" else agg.last(time_col)
    sliced = raw.where([slice_filter])
    return sliced.agg_by([time_agg, *aggs]).view([time_col, *out_cols])


def _build_scoped_view(
    raw: Any,
    time_col: str,
    bin_width_ns: int,
    aggs: list[Any],
    out_cols: list[str],
    body_range_ns: Optional[tuple[int, int]],
    full_range_ns: Optional[tuple[int, int]],
) -> Any:
    """Build the aggregated view, scoped to ``body_range_ns`` if provided.

    Returns:
      - Full-source aggregation @ ``bin_width_ns`` (no anchors) when
        ``body_range_ns`` is None or covers ``full_range_ns``.
      - ``head + body + tail`` merged & sorted, where the head and tail are
        single-row anchors flanking the body. The body covers the visible
        window at fine bin width; anchors give LWC ``fixLeftEdge`` /
        ``fixRightEdge`` something to clamp against.
    """
    full = (
        body_range_ns is None
        or full_range_ns is None
        or (
            body_range_ns[0] <= full_range_ns[0]
            and body_range_ns[1] >= full_range_ns[1]
        )
    )
    if full:
        return _common_aggregated_view(raw, time_col, bin_width_ns, aggs, out_cols)

    if dh_merge is None:
        raise RuntimeError("deephaven.merge is not available in this environment")

    body_from, body_to = body_range_ns  # type: ignore[misc]
    body_raw = raw.where(
        [
            f"epochNanos({time_col}) >= {int(body_from)}L",
            f"epochNanos({time_col}) <= {int(body_to)}L",
        ]
    )
    body = _common_aggregated_view(body_raw, time_col, bin_width_ns, aggs, out_cols)
    head = _build_anchor(
        raw,
        time_col,
        f"epochNanos({time_col}) < {int(body_from)}L",
        aggs,
        out_cols,
        time_pos="first",
    )
    tail = _build_anchor(
        raw,
        time_col,
        f"epochNanos({time_col}) > {int(body_to)}L",
        aggs,
        out_cols,
        time_pos="last",
    )
    return dh_merge([head, body, tail]).sort(time_col)


def build_histogram_view(
    raw: Any,
    time_col: str,
    value_col: str,
    bin_width_ns: int,
    agg_mode: str = "sum",
    color_col: Optional[str] = None,
    *,
    body_range_ns: Optional[tuple[int, int]] = None,
    full_range_ns: Optional[tuple[int, int]] = None,
) -> Any:
    """Build an aggregated histogram view over ``raw``.

    ``agg_mode`` selects the per-bin reduction: sum (default), count, avg, last.

    When ``body_range_ns`` is given and is strictly inside ``full_range_ns``,
    the result is ``head_anchor + body + tail_anchor`` where the body is
    binned at ``bin_width_ns`` over the visible window and the anchors are
    single agg rows over the head / tail slices. Otherwise the full source
    is binned at ``bin_width_ns``.
    """
    if agg_mode not in HIST_AGGS:
        raise ValueError(f"agg must be one of {sorted(HIST_AGGS)}, got {agg_mode!r}")
    if bin_width_ns <= 0:
        raise ValueError(f"bin_width_ns must be > 0, got {bin_width_ns}")
    if agg is None:
        raise RuntimeError("deephaven.agg is not available in this environment")

    if agg_mode == "sum":
        aggs = [agg.sum_(f"{value_col}={value_col}")]
    elif agg_mode == "count":
        # Count rows in each bin and present as the value column.
        aggs = [agg.count_(value_col)]
    elif agg_mode == "avg":
        aggs = [agg.avg(f"{value_col}={value_col}")]
    else:  # last
        aggs = [agg.last(f"{value_col}={value_col}")]

    out_cols = [value_col]
    if color_col is not None and color_col != value_col:
        # Color reduces to last(color) per bin (decision §Edge cases)
        aggs.append(agg.last(f"{color_col}={color_col}"))
        out_cols.append(color_col)

    return _build_scoped_view(
        raw, time_col, bin_width_ns, aggs, out_cols, body_range_ns, full_range_ns
    )


def build_ohlc_view(
    raw: Any,
    time_col: str,
    open_col: str,
    high_col: str,
    low_col: str,
    close_col: str,
    bin_width_ns: int,
    *,
    body_range_ns: Optional[tuple[int, int]] = None,
    full_range_ns: Optional[tuple[int, int]] = None,
) -> Any:
    """Build an aggregated OHLC view: first(open), max(high), min(low), last(close).

    When ``body_range_ns`` is strictly inside ``full_range_ns``, the result
    is head + body + tail (anchored single-row slices flanking a body that
    covers the visible window). Otherwise the full source is binned.
    """
    if bin_width_ns <= 0:
        raise ValueError(f"bin_width_ns must be > 0, got {bin_width_ns}")

    cols = {open_col, high_col, low_col, close_col}
    if len(cols) != 4:
        raise ValueError(
            "OHLC requires four distinct columns; got "
            f"open={open_col!r}, high={high_col!r}, low={low_col!r}, close={close_col!r}"
        )
    if agg is None:
        raise RuntimeError("deephaven.agg is not available in this environment")

    aggs = [
        agg.first(f"{open_col}={open_col}"),
        agg.max_(f"{high_col}={high_col}"),
        agg.min_(f"{low_col}={low_col}"),
        agg.last(f"{close_col}={close_col}"),
    ]
    return _build_scoped_view(
        raw,
        time_col,
        bin_width_ns,
        aggs,
        [open_col, high_col, low_col, close_col],
        body_range_ns,
        full_range_ns,
    )
