"""Server-side downsampling for TradingView Lightweight Charts.

Mirrors the JSAPI RunChartDownsample approach: divide the time range into
equal-width bins, keep the first/last/min/max rows per bin.  The aggregation
output IS the result — ``sorted_first``/``sorted_last`` capture all output
columns directly from the min/max source rows.  No ``ii``, ``k``, or
``where_in`` — works on ticking tables with O(bins) memory.

Architecture: hybrid background + foreground merge.
- Background: ~BACKGROUND_POINTS rows covering the full time range (computed once)
- Foreground: ~FOREGROUND_POINTS rows covering the area of interest (recomputed on zoom/pan)
- The server merges background rows OUTSIDE the foreground range with
  all foreground rows, producing a single sorted table of ~6000 rows.
"""

from __future__ import annotations

import datetime
import logging
import math
from typing import Any, Optional

try:
    from deephaven import agg, merge as dh_merge
    from deephaven.table import Table
    from deephaven.liveness_scope import LivenessScope, liveness_scope
except ImportError:
    # Allow import in test environments without a Deephaven server
    agg = None  # type: ignore[assignment]
    dh_merge = None  # type: ignore[assignment]
    Table = None  # type: ignore[assignment,misc]
    LivenessScope = None  # type: ignore[assignment,misc]
    liveness_scope = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

FOREGROUND_POINTS = 3000
"""High-fidelity points for the area of interest."""

BACKGROUND_POINTS = 1000
"""Low-fidelity points covering the full time range."""

# Keep TARGET_POINTS as alias for eligibility checks in listener.py
TARGET_POINTS = BACKGROUND_POINTS


def compute_adaptive_bins(width: int) -> int:
    """Compute foreground bin count from chart pixel width.

    Rounds up to the next 1000 so similar-width charts share the same
    Deephaven table cache entries.  Clamped to [BACKGROUND_POINTS, FOREGROUND_POINTS].
    """
    if width <= 0:
        return FOREGROUND_POINTS
    rounded = math.ceil(width / 1000) * 1000
    return min(FOREGROUND_POINTS, max(BACKGROUND_POINTS, rounded))


def _nanos_to_instant_literal(nanos: int) -> str:
    """Convert nanosecond epoch to ISO 8601 string for DH Instant comparison."""
    secs, rem = divmod(nanos, 1_000_000_000)
    dt = datetime.datetime.fromtimestamp(secs, tz=datetime.timezone.utc)
    iso = dt.strftime("%Y-%m-%dT%H:%M:%S")
    if rem > 0:
        return f"{iso}.{rem:09d}Z"
    return f"{iso}Z"


class DownsampleState:
    """Manages downsampled table lifecycle for a single source table.

    Holds a reference to the original table, the background (low-fi full
    range) and foreground (high-fi area of interest) downsampled tables.

    The source table is assumed to be sorted by the time column.
    """

    def __init__(
        self,
        source_table: Any,
        time_col: str,
        value_cols: list[str],
    ) -> None:
        self.source_table = source_table
        self.time_col = time_col
        self.value_cols = value_cols
        self.current_table: Any = None

        # Background: computed once, cached permanently
        self._background_table: Any = None
        self._background_intermediates: Any = None

        # Foreground + merge intermediates (released on each re-zoom)
        self._fg_intermediates: Any = None

        # Cached time range to avoid repeated intermediate table creation
        self._cached_time_range: Optional[tuple[int, int]] = None

        self._time_col_is_instant: bool = self._detect_instant_type()

    def compute_initial(self) -> Any:
        """Compute the initial background downsample (full range).

        The background is the low-fidelity view of the entire dataset.
        On initial load the user sees the full range, so this is all
        that's needed.  The background is cached for later merges.
        """
        bg_table, bg_ints = self._downsample(num_bins=BACKGROUND_POINTS)
        self._background_table = bg_table
        self._background_intermediates = bg_ints
        self.current_table = bg_table
        return bg_table

    def compute_hybrid(
        self,
        from_nanos: int,
        to_nanos: int,
        width: int = 0,
    ) -> Any:
        """Compute a hybrid merged table for a zoom/pan range.

        Merges background rows OUTSIDE [from_nanos, to_nanos] with a
        high-fidelity foreground covering [from_nanos, to_nanos].
        Returns a single table of ~6000 rows, already sorted (each
        segment is pre-sorted and merged in time order).
        """
        assert dh_merge is not None, "deephaven.merge required"

        source_size = self.source_table.size
        if source_size <= FOREGROUND_POINTS:
            self.current_table = self.source_table
            return self.source_table

        if self._background_table is None:
            self.compute_initial()

        # Release previous foreground intermediates
        self._fg_intermediates = None

        # Foreground: high-fidelity downsample of the zoom range
        fg_bins = compute_adaptive_bins(width)
        fg_table, fg_ints = self._downsample(
            num_bins=fg_bins,
            from_nanos=from_nanos,
            to_nanos=to_nanos,
        )

        # Split background into before/after foreground so the merge
        # preserves sort order without an explicit sort.
        bg_before = self._background_table.where(self._time_filter("<", from_nanos))
        bg_after = self._background_table.where(self._time_filter(">", to_nanos))

        # Each segment is individually sorted; concatenation is in order.
        merged = dh_merge([bg_before, fg_table, bg_after])

        # Prevent GC of intermediates
        self._fg_intermediates = [
            fg_table,
            fg_ints,
            bg_before,
            bg_after,
            merged,
        ]
        self.current_table = merged
        return merged

    def get_background_table(self) -> Any:
        """Return the cached background table (for RESET)."""
        return self._background_table

    def get_time_range(self) -> Optional[tuple[int, int]]:
        """Public accessor for the source table's time range (cached)."""
        if self._cached_time_range is not None:
            return self._cached_time_range
        self._cached_time_range = self._get_time_range()
        return self._cached_time_range

    def compute_reset(self) -> Any:
        """Recompute the background for a RESET (double-click).

        Invalidates the cached time range so ticking tables pick up
        newly appended data, then recomputes the background from scratch.
        """
        self._cached_time_range = None
        self._fg_intermediates = None
        # Release old background before recomputing
        self._background_table = None
        self._background_intermediates = None
        return self.compute_initial()

    def release_foreground(self) -> None:
        """Release foreground/merge intermediates, keep background."""
        self._fg_intermediates = None
        self.current_table = self._background_table

    def release(self) -> None:
        """Release all references (on close)."""
        self.current_table = None
        self._background_table = None
        self._background_intermediates = None
        self._fg_intermediates = None

    def _detect_instant_type(self) -> bool:
        """Check if the time column is a temporal type supporting direct comparison."""
        try:
            for col in self.source_table.columns:
                if col.name == self.time_col:
                    return col.data_type.j_name in (
                        "java.time.Instant",
                        "java.time.ZonedDateTime",
                    )
        except Exception:
            return False
        return False

    def _time_filter(self, op: str, nanos: int) -> str:
        """Build a filter expression comparing the time column against nanos.

        For Instant/ZonedDateTime columns, uses a direct literal comparison
        so the engine can leverage sorted-column optimizations.
        For other types, falls back to epochNanos().
        """
        tc = self.time_col
        if self._time_col_is_instant:
            return f"{tc} {op} '{_nanos_to_instant_literal(nanos)}'"
        return f"epochNanos({tc}) {op} {nanos}"

    def _downsample(
        self,
        num_bins: int,
        from_nanos: Optional[int] = None,
        to_nanos: Optional[int] = None,
    ) -> tuple[Any, list[Any]]:
        """Core downsampling: single-pass aggregation.

        Uses ``agg_by`` with ``first``/``last``/``sorted_first``/
        ``sorted_last`` to capture first, last, min-value, and max-value
        rows per bin.  The wide bin summary is unpivoted into individual
        rows, merged, and sorted by time for LWC consumption.

        No ``ii``, ``k``, or ``where_in`` — works on ticking tables with
        O(bins) memory.

        Returns:
            (result_table, list_of_intermediate_tables_to_keep_alive)
        """
        assert agg is not None, "deephaven.agg required"
        assert dh_merge is not None, "deephaven.merge required"

        source = self.source_table
        tc = self.time_col
        out_cols = [self.time_col] + list(self.value_cols)

        if from_nanos is not None and to_nanos is not None:
            source = source.where(
                f"{self._time_filter('>=', from_nanos)} "
                f"&& {self._time_filter('<=', to_nanos)}"
            )
            range_min = from_nanos
            range_max = to_nanos
        else:
            tr = self.get_time_range()
            if tr is None:
                return source.view(out_cols), []
            range_min, range_max = tr

        if source.size <= num_bins:
            return source.view(out_cols), []

        duration = range_max - range_min
        if duration <= 0:
            return source.view(out_cols), []

        bin_width = max(duration // num_bins, 1)

        # Materialize __Bin so agg_by reads pre-computed longs.
        agg_view = source.update([f"__Bin = (long)(epochNanos({tc}) / {bin_width}L)"])

        agg_list = [
            agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
            agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
        ]
        for v in self.value_cols:
            agg_list.append(
                agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols])
            )
            agg_list.append(
                agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols])
            )

        bin_summary = agg_view.agg_by(agg_list, by=["__Bin"])

        # Unpivot: rename each category's prefixed columns back to the
        # original names, producing one view per category.
        views = [
            bin_summary.view([f"{c}=__First_{c}" for c in out_cols]),
            bin_summary.view([f"{c}=__Last_{c}" for c in out_cols]),
        ]
        for v in self.value_cols:
            views.append(bin_summary.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
            views.append(bin_summary.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))

        # merge concatenates by category; sort restores time order for LWC.
        merged = dh_merge(views).sort(tc)

        intermediates = [agg_view, bin_summary] + views
        return merged, intermediates

    def _get_time_range(self) -> Optional[tuple[int, int]]:
        """Get (min_nanos, max_nanos) for the time column."""
        try:
            if liveness_scope is not None:
                with liveness_scope():
                    return self._get_time_range_impl()
            return self._get_time_range_impl()
        except Exception:
            return None

    def _get_time_range_impl(self) -> Optional[tuple[int, int]]:
        """Inner implementation — O(1) using head/tail on sorted source."""
        tc = self.time_col
        head_t = self.source_table.head(1).view([f"__T = epochNanos({tc})"])
        tail_t = self.source_table.tail(1).view([f"__T = epochNanos({tc})"])
        min_val = head_t.j_table.getColumnSource("__T").get(
            head_t.j_table.getRowSet().firstRowKey()
        )
        max_val = tail_t.j_table.getColumnSource("__T").get(
            tail_t.j_table.getRowSet().firstRowKey()
        )
        if min_val is None or max_val is None:
            return None
        return (int(min_val), int(max_val))
