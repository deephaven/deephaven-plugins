"""Server-side downsampling for TradingView Lightweight Charts.

Uses Deephaven table operations (update, agg_by, natural_join, where_in) to
perform min/max bucketing.  The output is a subset of ORIGINAL rows -- not
synthetic aggregated rows -- so all column types and values are preserved
exactly.

Architecture: hybrid background + foreground merge.
- Background: ~BACKGROUND_POINTS rows covering the full time range (computed once)
- Foreground: ~FOREGROUND_POINTS rows covering the area of interest (recomputed on zoom/pan)
- The server merges background rows OUTSIDE the foreground range with
  all foreground rows, producing a single sorted table of ~6000 rows.
"""

from __future__ import annotations

import logging
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

FOREGROUND_POINTS = 5000
"""High-fidelity points for the area of interest."""

BACKGROUND_POINTS = 1000
"""Low-fidelity points covering the full time range."""

# Keep TARGET_POINTS as alias for eligibility checks in listener.py
TARGET_POINTS = BACKGROUND_POINTS


class DownsampleState:
    """Manages downsampled table lifecycle for a single source table.

    Holds a reference to the original table, the background (low-fi full
    range) and foreground (high-fi area of interest) downsampled tables.
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
    ) -> Any:
        """Compute a hybrid merged table for a zoom/pan range.

        Merges background rows OUTSIDE [from_nanos, to_nanos] with a
        high-fidelity foreground covering [from_nanos, to_nanos].
        Returns a single sorted table of ~6000 rows.
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
        fg_table, fg_ints = self._downsample(
            num_bins=FOREGROUND_POINTS,
            from_nanos=from_nanos,
            to_nanos=to_nanos,
        )

        # Background rows outside the foreground range
        tc = self.time_col
        bg_outside = self._background_table.where(
            f"epochNanos({tc}) < {from_nanos} || epochNanos({tc}) > {to_nanos}"
        )

        # Merge and sort
        merged = dh_merge([bg_outside, fg_table]).sort(tc)

        # Prevent GC of intermediates
        self._fg_intermediates = [fg_table, fg_ints, bg_outside, merged]
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

    def _downsample(
        self,
        num_bins: int,
        from_nanos: Optional[int] = None,
        to_nanos: Optional[int] = None,
    ) -> tuple[Any, list[Any]]:
        """Core downsampling: min/max bucketing using DH table operations.

        When from_nanos/to_nanos are provided, filters the source to that
        range before bucketing (used for foreground).  Otherwise uses the
        full source table (used for background).

        Returns:
            (result_table, list_of_intermediate_tables_to_keep_alive)
        """
        assert agg is not None, "deephaven.agg required"
        assert dh_merge is not None, "deephaven.merge required"

        source = self.source_table

        # Optional range filter for foreground
        if from_nanos is not None and to_nanos is not None:
            tc = self.time_col
            source = source.where(
                f"epochNanos({tc}) >= {from_nanos} "
                f"&& epochNanos({tc}) <= {to_nanos}"
            )
            range_min = from_nanos
            range_max = to_nanos
        else:
            tr = self.get_time_range()
            if tr is None:
                return source, []
            range_min, range_max = tr

        if source.size <= num_bins:
            return source, []

        duration = range_max - range_min
        if duration <= 0:
            return source, []

        bin_width = max(duration // num_bins, 1)

        # Add bin column and row index
        binned = source.update(
            [
                "__RowIdx = ii",
                f"__TimeNanos = epochNanos({self.time_col})",
                f"__Bin = (long)(__TimeNanos / {bin_width}L)",
            ]
        )

        # Aggregate per bin
        agg_list = [
            agg.first("__FirstIdx=__RowIdx"),
            agg.last("__LastIdx=__RowIdx"),
        ]
        for v in self.value_cols:
            agg_list.append(agg.min_(f"__Min_{v}={v}"))
            agg_list.append(agg.max_(f"__Max_{v}={v}"))

        bin_summary = binned.agg_by(agg_list, by=["__Bin"])

        # Collect keeper row indices (first/last per bin)
        idx_table = dh_merge(
            [
                bin_summary.view(["__Idx=__FirstIdx"]),
                bin_summary.view(["__Idx=__LastIdx"]),
            ]
        )

        # Add min/max row indices for each value column
        for v in self.value_cols:
            joined = binned.natural_join(
                bin_summary.view(["__Bin", f"__Min_{v}", f"__Max_{v}"]),
                on="__Bin",
            )
            min_rows = (
                joined.where(f"{v} == __Min_{v}")
                .agg_by([agg.first("__Idx=__RowIdx")], by=["__Bin"])
                .view(["__Idx"])
            )
            max_rows = (
                joined.where(f"{v} == __Max_{v}")
                .agg_by([agg.first("__Idx=__RowIdx")], by=["__Bin"])
                .view(["__Idx"])
            )
            idx_table = dh_merge([idx_table, min_rows, max_rows])

        # Deduplicate and select original rows
        unique_idx = idx_table.select_distinct(["__Idx"])
        result = (
            binned.where_in(unique_idx, "__RowIdx=__Idx")
            .sort(self.time_col)
            .drop_columns(["__RowIdx", "__TimeNanos", "__Bin"])
        )

        intermediates = [binned, bin_summary, idx_table, unique_idx]
        return result, intermediates

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
        """Inner implementation of _get_time_range."""
        assert agg is not None, "deephaven.agg required"
        summary = self.source_table.update(
            [f"__TimeNanos = epochNanos({self.time_col})"]
        ).agg_by([agg.min_("__MinT=__TimeNanos"), agg.max_("__MaxT=__TimeNanos")])
        min_val = summary.j_table.getColumnSource("__MinT").get(0)
        max_val = summary.j_table.getColumnSource("__MaxT").get(0)
        if min_val is None or max_val is None:
            return None
        return (int(min_val), int(max_val))
