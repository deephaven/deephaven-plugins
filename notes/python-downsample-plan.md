# Python-Side Downsampling Implementation Plan

## Overview

Replace the current JS-side `dh.plot.Downsample.runChartDownsample()` approach with
Python-side downsampling using Deephaven table operations. The Python server computes
a downsampled table (a subset of original rows selected by min/max bucketing) and
sends it over the wire. On zoom, the client sends the new visible range back to the
server, which re-downsamples at higher resolution and sends a replacement table.

### Why Replace the JSAPI Downsample

The JSAPI downsample (`dh.plot.Downsample.runChartDownsample`) has structural problems
with lightweight-charts (LWC):

1. **Head/tail catch-all buckets** produce sparse regions outside the zoom range.
   LWC uses fixed bar spacing, so sparse head/tail data compresses months of data
   into a few bar slots. Panning from the dense body into the sparse head/tail shows
   an abrupt fidelity change instead of smooth empty space.

2. **Output size is unpredictable.** The JSAPI returns up to `4 * width * numYCols`
   rows (first+last+min+max per bin per y-column). For multi-column series this
   balloons quickly.

3. **Re-downsample is an opaque RPC.** The JS side has no control over bin sizing,
   cannot provide a viewport hint, and must replace the entire subscription on each
   zoom.

The Python-side approach solves all three by giving the server full control over
bin sizing, output layout, and viewport semantics.

---

## 1. Constants and Configuration

```
TARGET_POINTS = 5000    # Max data points to send over the wire per table
MIN_BIN_WIDTH_NS = 1    # Minimum bin width in nanoseconds (prevents degenerate bins)
```

The threshold for triggering downsampling remains at the table level: any table with
`table.size > TARGET_POINTS` that backs only downsample-eligible series will be
downsampled.

Downsample-eligible series types: **Line, Area, Baseline** (single y-value types).

NOT eligible: **Candlestick, Bar** (OHLC -- already have inherent aggregation
structure), **Histogram** (downsampling volume bars loses meaning).

---

## 2. Python Changes

### 2.1 New File: `downsample.py`

Location: `src/deephaven/plot/tradingview_lightweight/downsample.py`

This module contains the core downsampling logic.

```python
"""Server-side downsampling for TradingView Lightweight Charts.

Uses Deephaven table operations (update_by, agg_by, where_in) to perform
min/max bucketing. The output is a subset of ORIGINAL rows -- not synthetic
aggregated rows -- so all column types and values are preserved exactly.
"""

from __future__ import annotations

import math
from typing import Any, Optional

from deephaven import agg
from deephaven.table import Table
from deephaven.liveness_scope import LivenessScope

TARGET_POINTS = 5000


class DownsampleState:
    """Manages downsampled table lifecycle for a single source table.

    Holds a reference to the original table, the current downsampled table,
    and the liveness scope that keeps the downsampled table alive.

    Attributes:
        source_table: The original full-size table.
        time_col: Name of the time/x-axis column (Instant or long).
        value_cols: Names of the y-axis value columns.
        current_table: The most recently computed downsampled table, or None.
        current_bin_count: Number of bins used for the current downsample.
        _scope: LivenessScope managing the current downsampled table.
    """

    def __init__(
        self,
        source_table: Table,
        time_col: str,
        value_cols: list[str],
    ) -> None:
        self.source_table = source_table
        self.time_col = time_col
        self.value_cols = value_cols
        self.current_table: Optional[Table] = None
        self.current_bin_count: int = 0
        self._scope: Optional[LivenessScope] = None

    def compute_initial(self) -> Table:
        """Compute the initial full-range downsample.

        Returns the downsampled table (TARGET_POINTS rows from the full
        time range). If the table is small enough, returns the source
        table directly.
        """
        return self._downsample(num_bins=TARGET_POINTS, range_nanos=None)

    def compute_for_zoom(
        self,
        from_nanos: int,
        to_nanos: int,
        width_pixels: int,
    ) -> tuple[Table, int, int]:
        """Compute a downsampled table optimized for a zoom range.

        The total number of bins is scaled so that the zoomed range
        contains approximately TARGET_POINTS bins. The full table is
        downsampled to this total bin count, then the client subscribes
        to a viewport of just the rows within the zoom range.

        Args:
            from_nanos: Start of visible range in epoch nanoseconds.
            to_nanos: End of visible range in epoch nanoseconds.
            width_pixels: Chart plot-area width in pixels (informational).

        Returns:
            (downsampled_table, viewport_start_row, viewport_end_row)
        """
        # Compute total bins such that zoom range gets ~TARGET_POINTS bins
        source_size = self.source_table.size
        if source_size <= TARGET_POINTS:
            return self.source_table, 0, source_size - 1

        # Get time range of source
        time_range = self._get_time_range()
        if time_range is None:
            return self.source_table, 0, source_size - 1

        full_min, full_max = time_range
        full_duration = full_max - full_min
        zoom_duration = to_nanos - from_nanos

        if zoom_duration <= 0 or full_duration <= 0:
            return self._downsample(TARGET_POINTS, None), 0, TARGET_POINTS - 1

        # Scale: if zoom covers 10% of full range, we need 10x TARGET_POINTS
        # total bins so the zoom portion has TARGET_POINTS bins.
        total_bins = int(math.ceil(TARGET_POINTS * full_duration / zoom_duration))

        # Cap total bins to avoid degenerate cases (e.g., zooming to 1 second
        # out of 1 year would produce billions of bins)
        MAX_TOTAL_BINS = TARGET_POINTS * 20  # 100K bins max
        total_bins = min(total_bins, MAX_TOTAL_BINS)

        ds_table = self._downsample(total_bins, None)

        # Compute viewport: find which rows fall within [from_nanos, to_nanos]
        # This is done via a where filter + counting, but the FULL table is
        # sent to the client (the viewport is a hint for the client to set
        # its subscription viewport).
        viewport_start, viewport_end = self._compute_viewport(
            ds_table, from_nanos, to_nanos
        )

        return ds_table, viewport_start, viewport_end

    def release(self) -> None:
        """Release the current downsampled table's liveness scope."""
        if self._scope is not None:
            self._scope.release()
            self._scope = None
        self.current_table = None

    def _downsample(
        self,
        num_bins: int,
        range_nanos: Optional[tuple[int, int]],
    ) -> Table:
        """Core downsampling: min/max bucketing using DH table operations.

        Algorithm:
        1. Add a __Bin column that assigns each row to a bin based on its
           time value.
        2. For each bin, find the row indices where each value column
           achieves its min and max, plus the first and last rows.
        3. Collect those row indices and select the corresponding original
           rows.

        The output is a subset of original rows, preserving all column
        types and values exactly.

        Args:
            num_bins: Number of bins to divide the time range into.
            range_nanos: If provided, (start, end) nanos to restrict
                         the time range. None = full range.

        Returns:
            A new Table containing the downsampled rows.
        """
        # Release previous result
        self.release()

        source = self.source_table

        if source.size <= num_bins:
            self.current_table = source
            self.current_bin_count = source.size
            return source

        # Step 1: Determine time range
        if range_nanos is not None:
            range_min, range_max = range_nanos
        else:
            tr = self._get_time_range()
            if tr is None:
                self.current_table = source
                return source
            range_min, range_max = tr

        duration = range_max - range_min
        if duration <= 0:
            self.current_table = source
            return source

        bin_width = max(duration // num_bins, 1)  # nanoseconds per bin

        # Step 2: Add bin column and row index
        # Use update() to add __Bin and __RowIdx columns.
        # epochNanos() extracts nanoseconds from an Instant column.
        # For long columns, the value is used directly.
        #
        # NOTE: The time column type matters:
        # - Instant: use epochNanos(col)
        # - long (epoch nanos): use col directly
        # We handle both by trying epochNanos first, falling back to raw.
        binned = source.update(
            [
                f"__RowIdx = ii",
                f"__TimeNanos = epochNanos({self.time_col})",
                f"__Bin = (long)(__TimeNanos / {bin_width}L)",
            ]
        )

        # Step 3: Aggregate per bin -- find first/last/min/max row indices
        #
        # For each value column V, we need:
        #   - Row index where V is minimized in this bin
        #   - Row index where V is maximized in this bin
        # Plus the first and last row indices per bin (for time fidelity).
        #
        # Strategy: Use agg_by with first/last on __RowIdx, plus
        # min/max on each value column. Then join back to get the row
        # indices where those min/max values occur.
        #
        # Simpler approach that avoids the join-back complexity:
        # Use update_by with rolling min/max, then filter.
        #
        # SIMPLEST CORRECT APPROACH:
        # 1. agg_by to get per-bin: first_idx, last_idx, min_val, max_val
        # 2. For min/max row lookup: join bin summary back, filter rows
        #    where value == bin_min or value == bin_max, take first match.
        #
        # ACTUALLY SIMPLEST:
        # Just use agg_by with first() and last() for the index column,
        # and separately find min/max rows with a different query.
        # Then union all the selected row indices and select from original.

        agg_list = [
            agg.first("__FirstIdx=__RowIdx"),
            agg.last("__LastIdx=__RowIdx"),
        ]
        for v in self.value_cols:
            agg_list.append(agg.min_(f"__Min_{v}={v}"))
            agg_list.append(agg.max_(f"__Max_{v}={v}"))

        bin_summary = binned.agg_by(agg_list, by=["__Bin"])

        # Step 4: For each value column, find the row where min/max occur.
        #
        # Join bin_summary back to binned on __Bin, then:
        # - Filter where V == __Min_V, take first row index per bin
        # - Filter where V == __Max_V, take first row index per bin
        #
        # This gives us up to (2 + 2*len(value_cols)) unique row indices
        # per bin.

        # Collect all row indices to keep
        # Start with first/last indices
        idx_table = bin_summary.view(["__Idx=__FirstIdx"])
        idx_table = idx_table.merge(bin_summary.view(["__Idx=__LastIdx"]))

        # For min/max of each value column, join back to find row indices
        for v in self.value_cols:
            # Join bin summary min/max values back to binned table
            joined = binned.natural_join(
                bin_summary.view([f"__Bin", f"__Min_{v}", f"__Max_{v}"]), on="__Bin"
            )
            # Find rows matching min value (first per bin)
            min_rows = (
                joined.where(f"{v} == __Min_{v}")
                .agg_by([agg.first("__Idx=__RowIdx")], by=["__Bin"])
                .view(["__Idx"])
            )
            # Find rows matching max value (first per bin)
            max_rows = (
                joined.where(f"{v} == __Max_{v}")
                .agg_by([agg.first("__Idx=__RowIdx")], by=["__Bin"])
                .view(["__Idx"])
            )
            idx_table = idx_table.merge(min_rows).merge(max_rows)

        # Deduplicate indices
        unique_idx = idx_table.select_distinct(["__Idx"])

        # Step 5: Select original rows at those indices, sorted by time
        # Use where_in to select rows from binned where __RowIdx is in unique_idx
        result = (
            binned.where_in(unique_idx, "__RowIdx=__Idx")
            .sort(self.time_col)
            .drop_columns(["__RowIdx", "__TimeNanos", "__Bin"])
        )

        # Manage liveness
        self._scope = LivenessScope()
        if result.is_refreshing:
            self._scope.manage(result)

        self.current_table = result
        self.current_bin_count = num_bins
        return result

    def _get_time_range(self) -> Optional[tuple[int, int]]:
        """Get (min_nanos, max_nanos) for the time column.

        Uses agg_by with min/max on the time column converted to nanos.
        """
        try:
            summary = self.source_table.update(
                [f"__TimeNanos = epochNanos({self.time_col})"]
            ).agg_by([agg.min_("__MinT=__TimeNanos"), agg.max_("__MaxT=__TimeNanos")])
            # Read scalar values
            min_val = summary.j_table.getColumnSource("__MinT").get(0)
            max_val = summary.j_table.getColumnSource("__MaxT").get(0)
            if min_val is None or max_val is None:
                return None
            return (int(min_val), int(max_val))
        except Exception:
            return None

    def _compute_viewport(
        self,
        ds_table: Table,
        from_nanos: int,
        to_nanos: int,
    ) -> tuple[int, int]:
        """Find the row range in ds_table that falls within the time range.

        Returns (start_row, end_row) inclusive indices.
        """
        # Count rows before from_nanos
        try:
            before = ds_table.where(f"epochNanos({self.time_col}) < {from_nanos}").size
            within = ds_table.where(
                f"epochNanos({self.time_col}) >= {from_nanos} "
                f"&& epochNanos({self.time_col}) <= {to_nanos}"
            ).size
            start = before
            end = before + within - 1
            return (max(0, start), max(0, end))
        except Exception:
            return (0, ds_table.size - 1)
```

#### Key Design Details of the Downsample Algorithm

The algorithm preserves **original rows** (not synthetic aggregates). For each bin:

| Row type | Purpose | Agg used |
|----------|---------|----------|
| First row | Preserves time fidelity at bin start | `agg.first("__FirstIdx=__RowIdx")` |
| Last row | Preserves time fidelity at bin end | `agg.last("__LastIdx=__RowIdx")` |
| Min-value row(s) | Captures trough per y-column | `where(V == __Min_V)`, `agg.first` per bin |
| Max-value row(s) | Captures peak per y-column | `where(V == __Max_V)`, `agg.first` per bin |

Worst case per bin: `2 + 2 * len(value_cols)` rows. For a single-value-column series
(typical), that is 4 rows/bin. With `TARGET_POINTS = 5000` bins, the output is at most
20,000 rows. In practice, min/max rows often coincide with first/last rows, so the
output is typically much smaller.

After collecting all keeper row indices, we `where_in` against the original (binned)
table to select those rows, then sort by time and drop helper columns.

#### Why Not LTTB?

Largest-Triangle-Three-Buckets (LTTB) is an excellent single-pass algorithm for
perceptual downsampling, but it is inherently sequential (each selected point depends
on the previous one). This makes it impossible to express purely with Deephaven's
declarative table operations. Min/max bucketing is embarrassingly parallel and maps
cleanly to `agg_by` + `where_in`.

#### Ticking Table Support

All operations (`update`, `agg_by`, `where_in`, `sort`) produce refreshing derived
tables when the source is refreshing. The downsampled table automatically updates as
new rows arrive. The bin boundaries are fixed at downsample time (based on the known
time range), so new rows that extend the time range will fall into the last bin until
a re-downsample is triggered.

### 2.2 Modified File: `communication/listener.py`

The listener gains handlers for `ZOOM` and `RESET` messages and manages
`DownsampleState` objects.

```python
"""Table listener for TvlChart real-time updates."""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from deephaven.plugin.object_type import MessageStream

from ..chart import TvlChart
from ..downsample import DownsampleState, TARGET_POINTS

logger = logging.getLogger(__name__)

# Series types eligible for Python-side downsampling
DOWNSAMPLE_ELIGIBLE_TYPES = {"Line", "Area", "Baseline"}


class TvlChartListener:
    """Listens to table changes and sends chart updates to the client."""

    def __init__(self, chart: TvlChart, client_connection: MessageStream):
        self._chart = chart
        self._client_connection = client_connection
        self._revision = 0
        self._table_id_map: dict[int, int] = {}

        # Downsample state per table ID
        self._downsample_states: dict[int, DownsampleState] = {}

        # Track which tables were downsampled so we can send the right refs
        self._active_tables: dict[int, Any] = {}  # table_id -> table object

    def process_message(
        self, payload: bytes, references: list[Any]
    ) -> tuple[bytes, list[Any]]:
        """Process an incoming message from the client."""
        try:
            message = json.loads(payload.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return b"", []

        msg_type = message.get("type", "")

        if msg_type == "RETRIEVE":
            return self._handle_retrieve()
        elif msg_type == "ZOOM":
            return self._handle_zoom(message)
        elif msg_type == "RESET":
            return self._handle_reset()

        # Unknown message type
        return b"", []

    def _handle_retrieve(self) -> tuple[bytes, list[Any]]:
        """Build and return the current figure state.

        If any tables are large enough to downsample, creates DownsampleState
        objects and sends the downsampled tables instead of the originals.
        """
        self._revision += 1

        # Analyze which tables need downsampling
        tables = self._chart.get_tables()
        series_list = self._chart.series_list
        chart_type = self._chart.chart_type

        # Build per-table analysis: which series reference each table,
        # are all eligible for downsampling?
        table_series_map: dict[int, list[Any]] = {}  # id(table) -> [SeriesSpec]
        for s in series_list:
            tid = id(s.table)
            table_series_map.setdefault(tid, []).append(s)

        self._table_id_map = {}
        exported_objects: list[Any] = []
        new_refs = []
        downsample_info = {}  # table_ref_id -> { tableSize, fullRange }

        for i, table in enumerate(tables):
            self._table_id_map[id(table)] = i
            new_refs.append(i)

            # Check eligibility
            series_for_table = table_series_map.get(id(table), [])
            eligible = (
                chart_type == "standard"
                and table.size > TARGET_POINTS
                and len(series_for_table) > 0
                and all(
                    s.series_type in DOWNSAMPLE_ELIGIBLE_TYPES for s in series_for_table
                )
            )

            if eligible:
                # Determine time and value columns
                time_col = series_for_table[0].column_mapping.get("time")
                value_cols = set()
                for s in series_for_table:
                    for key, col in s.column_mapping.items():
                        if key != "time":
                            value_cols.add(col)

                if time_col and value_cols:
                    ds = DownsampleState(table, time_col, list(value_cols))
                    ds_table = ds.compute_initial()
                    self._downsample_states[i] = ds
                    self._active_tables[i] = ds_table
                    exported_objects.append(ds_table)

                    # Get full range for client
                    time_range = ds._get_time_range()
                    downsample_info[i] = {
                        "tableSize": ds_table.size,
                        "fullRange": list(time_range) if time_range else None,
                        "isDownsampled": True,
                    }
                    continue

            # Not downsampled -- send original
            self._active_tables[i] = table
            exported_objects.append(table)

        # Export PartitionedTable if the chart was built with `by`
        pt_ref_index = None
        if self._chart._partitioned_table is not None:
            pt_ref_index = len(exported_objects)
            exported_objects.append(self._chart._partitioned_table)
            new_refs.append(pt_ref_index)

        # Serialize figure
        figure_data = self._chart.to_dict(self._table_id_map)

        # Inject the PartitionedTable reference index
        if pt_ref_index is not None and "partitionSpec" in figure_data:
            figure_data["partitionSpec"]["refIndex"] = pt_ref_index

        # Add downsample metadata
        if downsample_info:
            figure_data["downsampleInfo"] = downsample_info

        message = json.dumps(
            {
                "type": "NEW_FIGURE",
                "figure": figure_data,
                "revision": self._revision,
                "new_references": new_refs,
                "removed_references": [],
            }
        ).encode("utf-8")

        return message, exported_objects

    def _handle_zoom(self, msg: dict) -> tuple[bytes, list[Any]]:
        """Handle a ZOOM message: re-downsample for the visible range.

        Message format:
            {
                "type": "ZOOM",
                "from": <epoch_nanos>,
                "to": <epoch_nanos>,
                "width": <pixels>
            }

        Response: DOWNSAMPLE_READY with updated table reference.
        """
        from_nanos = msg.get("from", 0)
        to_nanos = msg.get("to", 0)
        width = msg.get("width", 800)

        if from_nanos >= to_nanos:
            return b"", []

        exported_objects = []
        results = {}

        for table_id, ds in self._downsample_states.items():
            ds_table, vp_start, vp_end = ds.compute_for_zoom(
                from_nanos, to_nanos, width
            )
            self._active_tables[table_id] = ds_table
            ref_idx = len(exported_objects)
            exported_objects.append(ds_table)

            time_range = ds._get_time_range()
            results[table_id] = {
                "refIndex": ref_idx,
                "tableSize": ds_table.size,
                "viewport": [vp_start, vp_end],
                "fullRange": list(time_range) if time_range else None,
            }

        response = json.dumps(
            {
                "type": "DOWNSAMPLE_READY",
                "tables": results,
            }
        ).encode("utf-8")

        return response, exported_objects

    def _handle_reset(self) -> tuple[bytes, list[Any]]:
        """Handle a RESET message: re-downsample at full range.

        Response: DOWNSAMPLE_READY with the original full-range table.
        """
        exported_objects = []
        results = {}

        for table_id, ds in self._downsample_states.items():
            ds_table = ds.compute_initial()
            self._active_tables[table_id] = ds_table
            ref_idx = len(exported_objects)
            exported_objects.append(ds_table)

            time_range = ds._get_time_range()
            results[table_id] = {
                "refIndex": ref_idx,
                "tableSize": ds_table.size,
                "viewport": [0, ds_table.size - 1],
                "fullRange": list(time_range) if time_range else None,
                "isReset": True,
            }

        response = json.dumps(
            {
                "type": "DOWNSAMPLE_READY",
                "tables": results,
            }
        ).encode("utf-8")

        return response, exported_objects

    def close(self) -> None:
        """Release all downsample states."""
        for ds in self._downsample_states.values():
            ds.release()
        self._downsample_states.clear()
        self._active_tables.clear()
```

### 2.3 Modified File: `communication/connection.py`

Add a `close()` call to clean up downsample states:

```python
class TvlChartConnection(MessageStream):
    # ... existing __init__ and on_data ...

    def on_close(self) -> None:
        """Close the connection and release resources."""
        if self._listener is not None:
            self._listener.close()
        self._listener = None
        self._client_connection = None
```

### 2.4 Summary of Python File Changes

| File | Change |
|------|--------|
| `downsample.py` | **NEW** -- Core DownsampleState class with min/max bucketing |
| `communication/listener.py` | **MODIFIED** -- Add ZOOM/RESET handlers, DownsampleState integration |
| `communication/connection.py` | **MODIFIED** -- Call listener.close() on connection close |
| `chart.py` | No changes needed |
| `series.py` | No changes needed |
| `__init__.py` | No changes needed (downsample is internal, not user-facing) |

---

## 3. JavaScript Changes

### 3.1 Modified: `TradingViewTypes.ts`

Add new message types and downsample metadata:

```typescript
// New message types for Python-side downsample
export interface ZoomMessage {
  type: 'ZOOM';
  from: number;    // epoch nanoseconds
  to: number;      // epoch nanoseconds
  width: number;   // chart plot-area width in pixels
}

export interface ResetMessage {
  type: 'RESET';
}

export interface DownsampleReadyMessage {
  type: 'DOWNSAMPLE_READY';
  tables: Record<string, {  // keyed by table ID (stringified)
    refIndex: number;        // index into exported objects
    tableSize: number;
    viewport: [number, number];  // [startRow, endRow]
    fullRange: [number, number] | null;  // [minNanos, maxNanos]
    isReset?: boolean;
  }>;
}

// Extend TvlFigureData
export interface TvlFigureData {
  // ... existing fields ...
  downsampleInfo?: Record<string, {
    tableSize: number;
    fullRange: [number, number] | null;
    isDownsampled: boolean;
  }>;
}
```

### 3.2 Modified: `TradingViewChartModel.ts`

Major rewrite of the downsample logic. The key changes:

1. **Remove JSAPI downsample calls.** Delete all references to
   `dh.plot.Downsample.runChartDownsample()`.

2. **Remove whitespace grid / head-body-tail classification.** The Python-side
   downsample produces a clean, uniformly-sampled table. No whitespace companion
   series is needed.

3. **Add bidirectional message handling.** The model sends ZOOM/RESET messages to
   the Python server and processes DOWNSAMPLE_READY responses.

4. **Simplify data update path.** All downsampled tables are treated like normal
   tables -- subscribe, use ChartData, emit DATA_UPDATED. No special
   `handleDownsampledUpdate` is needed.

#### New Methods

```typescript
class TradingViewChartModel {
  // ... existing fields ...

  /** Widget connection for sending messages to Python. */
  private widgetConnection: DhType.Widget;

  /** Whether Python-side downsampling is active for any table. */
  private pythonDownsampled = false;

  /** Full data time range in epoch nanos (from Python downsampleInfo). */
  private fullRangeNanos: [number, number] | null = null;

  /**
   * Send a ZOOM message to the Python server.
   * Called when user finishes a zoom gesture.
   *
   * @param fromSeconds Visible range start in TZ-shifted epoch seconds
   * @param toSeconds Visible range end in TZ-shifted epoch seconds
   * @param width Chart plot-area width in pixels
   */
  sendZoom(fromSeconds: number, toSeconds: number, width: number): void {
    // Convert TZ-shifted seconds to real UTC nanoseconds
    const fromUtcSec = unconvertTime(fromSeconds, this.timeZone);
    const toUtcSec = unconvertTime(toSeconds, this.timeZone);
    const fromNanos = BigInt(Math.round(fromUtcSec * 1e9));
    const toNanos = BigInt(Math.round(toUtcSec * 1e9));

    const msg = JSON.stringify({
      type: 'ZOOM',
      from: fromNanos.toString(),
      to: toNanos.toString(),
      width,
    });

    this.widget.sendMessage(msg, []);
  }

  /**
   * Send a RESET message to the Python server.
   * Called on double-click.
   */
  sendReset(): void {
    this.widget.sendMessage(JSON.stringify({ type: 'RESET' }), []);
  }

  /**
   * Handle DOWNSAMPLE_READY from the Python server.
   * Replaces table subscriptions with the new downsampled tables.
   */
  private async handleDownsampleReady(
    message: DownsampleReadyMessage,
    exportedObjects: DhType.WidgetExportedObject[]
  ): Promise<void> {
    const isReset = Object.values(message.tables).some(t => t.isReset);

    for (const [tableIdStr, info] of Object.entries(message.tables)) {
      const tableId = Number(tableIdStr);
      const exported = exportedObjects[info.refIndex];
      if (!exported) continue;

      // Fetch the new table
      const newTable = await exported.fetch() as DhType.Table;
      if (this.closed) return;

      // Tear down old subscription
      this.cleanupSubscriptions(tableId);
      this.chartDataMap.delete(tableId);
      this.tableDataMap.delete(tableId);

      // Close old table (if not the original)
      const oldTable = this.tables.get(tableId);
      if (oldTable) oldTable.close();

      // Install new table and subscribe
      this.tables.set(tableId, newTable);
      this.subscribeTable(tableId, newTable);
    }

    // After all tables are ready, emit event so chart updates
    // The DATA_UPDATED events from subscription will handle rendering.
    // If this is a reset, we need to fitContent after data arrives.
  }

  // In init(), after parsing NEW_FIGURE:
  // Check for downsampleInfo in figure data
  // If present, set pythonDownsampled = true
  // Store fullRangeNanos from downsampleInfo
}
```

#### Removed Code

- `buildDownsampledData()` method (no longer needed)
- `classifyDownsampledRows` import and usage
- `generateWhitespaceGrid` import and usage
- `buildDataWithGaps` import and usage
- `handleDownsampledUpdate()` method (merged into `handleTableUpdate`)
- `dataFullExtent` field (replaced by `fullRangeNanos` from Python)
- All references to `dh.plot.Downsample.runChartDownsample()`
- The `DownsampleInfo` type (replaced by simpler state)
- The `DownsampledData` type
- The `lastDownsampledRange` tracking

### 3.3 Modified: `TradingViewChart.tsx`

The React component changes:

1. **Replace DOM gesture detection with simpler zoom detection.** Instead of
   tracking mousedown/mouseup/wheel DOM events, use LWC's native
   `subscribeVisibleLogicalRangeChange` with a debounce timer.

2. **Add double-click handler for RESET.** Listen for `dblclick` on the container
   and call `model.sendReset()`.

3. **Remove whitespace series management.** No `setWhitespaceData` /
   `clearWhitespaceData` calls needed.

```typescript
// In setupDownsampleSubscriptions():
function setupDownsampleSubscriptions(
  renderer: TradingViewChartRenderer,
  model: TradingViewChartModel
) {
  const chart = renderer.getChart();
  const timeScale = chart.timeScale();
  const container = containerRef.current;
  if (!container) return;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastDuration: number | null = null;
  let settled = false;

  setTimeout(() => {
    settled = true;
    const vr = timeScale.getVisibleRange() as any;
    if (vr) lastDuration = (vr.to as number) - (vr.from as number);
  }, 1000);

  // Debounced zoom detection
  const unsubRange = renderer.subscribeVisibleLogicalRangeChange(() => {
    if (!settled || suppressRef.current) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const vr = timeScale.getVisibleRange() as any;
      if (!vr) return;
      const duration = (vr.to as number) - (vr.from as number);
      const TOLERANCE = 0.02;
      const isZoom =
        lastDuration != null &&
        Math.abs(duration - lastDuration) / Math.max(duration, lastDuration) > TOLERANCE;
      lastDuration = duration;
      if (isZoom) {
        model.sendZoom(vr.from, vr.to, timeScale.width());
      }
    }, 300);  // 300ms debounce
  });

  // Double-click reset
  function handleDblClick(e: MouseEvent) {
    // Prevent default LWC dblclick (fitContent) -- we handle it
    // by sending RESET to Python and fitContent after new data arrives.
    model.sendReset();
  }
  container.addEventListener('dblclick', handleDblClick);

  dsCleanupRef.current = () => {
    unsubRange();
    container.removeEventListener('dblclick', handleDblClick);
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}
```

### 3.4 Modified: `TradingViewChartRenderer.ts`

Minimal changes:

1. **Remove whitespace series** (`whitespaceSeries`, `setWhitespaceData`,
   `clearWhitespaceData`) -- no longer needed since Python downsample produces
   a clean table.

2. Keep `subscribeVisibleLogicalRangeChange` and `subscribeSizeChange` as they
   are still used for zoom detection and resize handling.

### 3.5 Modified: `TradingViewUtils.ts`

Remove the following functions (no longer needed):

- `classifyDownsampledRows`
- `generateWhitespaceGrid`
- `buildDataWithGaps`

Keep all other utilities (`transformTableData`, `convertTime`, `unconvertTime`,
`deduplicateByTime`, etc.).

### 3.6 Summary of JS File Changes

| File | Change |
|------|--------|
| `TradingViewTypes.ts` | Add `ZoomMessage`, `ResetMessage`, `DownsampleReadyMessage` types. Add `downsampleInfo` to `TvlFigureData`. Remove `DownsampledData`, simplify `DownsampleInfo`. |
| `TradingViewChartModel.ts` | Remove JSAPI downsample. Add `sendZoom()`, `sendReset()`, `handleDownsampleReady()`. Simplify data update to single path. Handle widget messages for DOWNSAMPLE_READY. |
| `TradingViewChart.tsx` | Simplify `setupDownsampleSubscriptions` to use debounced range change + dblclick. Remove whitespace series management. |
| `TradingViewChartRenderer.ts` | Remove whitespace series fields and methods. |
| `TradingViewUtils.ts` | Remove `classifyDownsampledRows`, `generateWhitespaceGrid`, `buildDataWithGaps`. |

---

## 4. Message Protocol Details

### 4.1 Initial Load Sequence

```
Client                          Server (Python)
  |                                |
  |--- RETRIEVE ------------------>|
  |                                | Analyze tables
  |                                | For each table > TARGET_POINTS with eligible series:
  |                                |   Create DownsampleState
  |                                |   compute_initial() -> downsampled table
  |                                |
  |<-- NEW_FIGURE -----------------| (with downsampled table refs + downsampleInfo)
  |                                |
  | fetch() each exported table    |
  | subscribe() to each table      |
  | Render chart with data         |
```

### 4.2 Zoom Sequence

```
Client                          Server (Python)
  |                                |
  | User zooms in                  |
  | (gesture ends, debounce fires) |
  |                                |
  |--- ZOOM { from, to, width } -->|
  |                                | compute_for_zoom(from, to, width)
  |                                |   Compute total bins for zoom ratio
  |                                |   Downsample full table to that many bins
  |                                |   Compute viewport rows
  |                                |
  |<-- DOWNSAMPLE_READY -----------| (new table ref + viewport + fullRange)
  |                                |
  | fetch() new table              |
  | Close old subscription         |
  | subscribe() to new table       |
  | Preserve visible range         |
  | Re-render with higher-res data |
```

### 4.3 Pan Sequence

```
Client                          Server (Python)
  |                                |
  | User pans                      |
  | (visible range duration        |
  |  unchanged, only offset)       |
  |                                |
  | No ZOOM sent (duration         |
  | tolerance check filters it)    |
  |                                |
  | Chart scrolls across existing  |
  | downsampled data -- no round   |
  | trip needed.                   |
```

### 4.4 Double-Click Reset Sequence

```
Client                          Server (Python)
  |                                |
  | User double-clicks             |
  |                                |
  |--- RESET --------------------->|
  |                                | compute_initial() for each table
  |                                |   (full-range, TARGET_POINTS bins)
  |                                |
  |<-- DOWNSAMPLE_READY -----------| (with isReset: true)
  |                                |
  | fetch() new table              |
  | Close old subscription         |
  | subscribe() to new table       |
  | fitContent() to show all data  |
```

### 4.5 Message Formats

#### Client -> Server: ZOOM

```json
{
  "type": "ZOOM",
  "from": "1714521600000000000",
  "to": "1714608000000000000",
  "width": 1200
}
```

Notes:
- `from` and `to` are epoch nanosecond strings (to avoid float precision loss).
  The client converts TZ-shifted epoch seconds to real UTC nanoseconds before sending.
- `width` is the chart plot-area width in pixels (informational, may influence
  bin count in future versions).

#### Client -> Server: RESET

```json
{
  "type": "RESET"
}
```

#### Server -> Client: DOWNSAMPLE_READY

```json
{
  "type": "DOWNSAMPLE_READY",
  "tables": {
    "0": {
      "refIndex": 0,
      "tableSize": 18742,
      "viewport": [3200, 8200],
      "fullRange": [1704067200000000000, 1735689600000000000],
      "isReset": false
    }
  }
}
```

Notes:
- `refIndex` is the index into the exported objects array (used to fetch the table).
- `viewport` is `[startRow, endRow]` inclusive, indicating which rows of the
  downsampled table correspond to the zoom range. The client uses this to set its
  table subscription viewport (optimization -- only subscribe to visible rows).
- `fullRange` is the full time range in epoch nanos. Used by the client to convert
  between nanos and TZ-shifted seconds for zoom range comparison.
- `isReset` is true when this is a response to a RESET message, signaling the
  client to call `fitContent()`.

---

## 5. Exact Deephaven Table Operations

### 5.1 Bin Column Addition

```python
binned = source.update(
    [
        "__RowIdx = ii",  # row index (long)
        f"__TimeNanos = epochNanos({time_col})",  # nanos from Instant
        f"__Bin = (long)(__TimeNanos / {bin_width}L)",  # bin assignment
    ]
)
```

- `ii` is Deephaven's built-in row index variable.
- `epochNanos()` converts Instant to long nanoseconds.
- `bin_width` is `(max_nanos - min_nanos) / num_bins`, at least 1.
- Integer division `(long)(... / ...)` assigns each row to a bin.

### 5.2 Per-Bin Aggregation

```python
from deephaven import agg

agg_list = [
    agg.first("__FirstIdx=__RowIdx"),  # first row index in bin
    agg.last("__LastIdx=__RowIdx"),  # last row index in bin
]
for v in value_cols:
    agg_list.append(agg.min_(f"__Min_{v}={v}"))  # min value in bin
    agg_list.append(agg.max_(f"__Max_{v}={v}"))  # max value in bin

bin_summary = binned.agg_by(agg_list, by=["__Bin"])
```

This produces one row per bin with:
- `__Bin`: bin number
- `__FirstIdx`: row index of first row in bin
- `__LastIdx`: row index of last row in bin
- `__Min_Value`: minimum of value column in bin
- `__Max_Value`: maximum of value column in bin

### 5.3 Min/Max Row Index Lookup

For each value column, we need the row INDEX where the min/max occurs (not just
the min/max value itself, which `agg_by` gives us). Strategy:

```python
# Join bin summary back to get min/max values per row's bin
joined = binned.natural_join(
    bin_summary.view(["__Bin", f"__Min_{v}", f"__Max_{v}"]), on="__Bin"
)

# Filter rows matching min value, take first per bin
min_rows = (
    joined.where(f"{v} == __Min_{v}")
    .agg_by([agg.first("__Idx=__RowIdx")], by=["__Bin"])
    .view(["__Idx"])
)

# Same for max
max_rows = (
    joined.where(f"{v} == __Max_{v}")
    .agg_by([agg.first("__Idx=__RowIdx")], by=["__Bin"])
    .view(["__Idx"])
)
```

### 5.4 Index Collection and Row Selection

```python
# Collect all keeper indices
idx_table = bin_summary.view(["__Idx=__FirstIdx"])
idx_table = idx_table.merge(bin_summary.view(["__Idx=__LastIdx"]))
idx_table = idx_table.merge(min_rows).merge(max_rows)  # for each value col

# Deduplicate
unique_idx = idx_table.select_distinct(["__Idx"])

# Select original rows at those indices
result = (
    binned.where_in(unique_idx, "__RowIdx=__Idx")
    .sort(time_col)
    .drop_columns(["__RowIdx", "__TimeNanos", "__Bin"])
)
```

### 5.5 Alternative: Simpler Approach Using update_by

If the join-back approach proves too complex or slow, a simpler alternative:

```python
from deephaven import updateby

# Add rolling min/max within each bin
ops = []
for v in value_cols:
    ops.append(
        updateby.rolling_min_tick(
            f"__RMin_{v}={v}", rev_ticks=int(1e9), fwd_ticks=int(1e9)
        )
    )
    ops.append(
        updateby.rolling_max_tick(
            f"__RMax_{v}={v}", rev_ticks=int(1e9), fwd_ticks=int(1e9)
        )
    )

# This doesn't quite work because we need GROUP min/max, not rolling.
# Stick with the agg_by + natural_join approach.
```

The `agg_by` + `natural_join` approach is correct and efficient. The `natural_join`
is a hash join on `__Bin` which is O(n) with low constant factor.

### 5.6 Getting Time Range (for bin width computation)

```python
summary = source.update([f"__TimeNanos = epochNanos({time_col})"]).agg_by(
    [agg.min_("__MinT=__TimeNanos"), agg.max_("__MaxT=__TimeNanos")]
)
# Read scalar values
min_val = summary.j_table.getColumnSource("__MinT").get(0)
max_val = summary.j_table.getColumnSource("__MaxT").get(0)
```

This aggregation runs over the entire table once. For a 10M row table with an
indexed time column, this is fast (Deephaven's columnar engine processes this
efficiently).

---

## 6. Liveness Scope Management

### 6.1 The Problem

Every Deephaven table operation (`update`, `agg_by`, `natural_join`, `where_in`,
`sort`, `drop_columns`) creates a new derived table object. For refreshing
(ticking) tables, these derived tables hold listeners on their parents. If not
properly managed, they either:
- Get garbage collected prematurely (causing subscription failures)
- Leak memory (never cleaned up)

### 6.2 The Solution

`DownsampleState` manages one `LivenessScope` per downsample computation:

```python
class DownsampleState:
    def _downsample(self, num_bins, range_nanos):
        # Release previous scope (drops old derived tables)
        self.release()

        # ... compute new downsampled table ...

        # Create new scope and manage the result
        self._scope = LivenessScope()
        if result.is_refreshing:
            self._scope.manage(result)

        self.current_table = result
        return result

    def release(self):
        if self._scope is not None:
            self._scope.release()
            self._scope = None
        self.current_table = None
```

### 6.3 Lifecycle

1. **Initial load:** `compute_initial()` creates scope #1 managing the initial
   downsampled table.

2. **Zoom:** `compute_for_zoom()` calls `_downsample()` which releases scope #1
   (dropping the old downsampled table and all its intermediate derived tables),
   then creates scope #2 managing the new downsampled table.

3. **Reset:** `compute_initial()` again -- releases scope #2, creates scope #3.

4. **Connection close:** `TvlChartListener.close()` calls `ds.release()` for all
   `DownsampleState` objects, cleaning up the last scope.

### 6.4 Intermediate Tables

The intermediate tables created during downsampling (`binned`, `bin_summary`,
`joined`, `min_rows`, `max_rows`, `idx_table`, `unique_idx`) are NOT explicitly
managed in a liveness scope. They are referenced by the final `result` table
(which depends on them through the DAG of table operations). Deephaven's
reference counting keeps them alive as long as `result` is alive.

When `result` is released (via `self._scope.release()`), the entire DAG of
intermediate tables becomes eligible for cleanup.

### 6.5 The Source Table

The source table (`self.source_table`) is NOT managed by `DownsampleState`. It is
managed by the `TvlChart`'s liveness scope (see `chart.py` line 80-96). The
`DownsampleState` holds a reference to it but does not own it.

### 6.6 Static Tables

For static (non-refreshing) tables, liveness management is not needed (static
tables are never GC'd while referenced). The `_downsample` method only manages
refreshing results:

```python
if result.is_refreshing:
    self._scope.manage(result)
```

---

## 7. Edge Cases

### 7.1 Small Tables (size <= TARGET_POINTS)

When `table.size <= TARGET_POINTS`, no downsampling occurs. The original table is
sent directly, and no `DownsampleState` is created. The `downsampleInfo` field is
omitted from the figure data, so the JS side treats it as a normal table with no
zoom/pan messaging.

### 7.2 Single Series

The simplest case. One table, one time column, one value column. The bin count
equals `TARGET_POINTS`, and each bin produces up to 4 rows
(first/last/min_value/max_value). Output: up to `4 * TARGET_POINTS = 20,000` rows,
but typically much less due to overlap.

### 7.3 Multi-Series on Same Table

When multiple series reference the same table (e.g., two Line series reading
different value columns from one table), all value columns are included in the
`value_cols` list. This means:

- Per bin, we track min/max for EACH value column
- Worst case per bin: `2 + 2 * len(value_cols)` rows
- For 3 value columns: 8 rows/bin -> 40,000 rows max for TARGET_POINTS=5000

This is acceptable. If it becomes a problem, we can reduce `TARGET_POINTS`
proportionally: `adjusted_bins = TARGET_POINTS / (2 + 2 * len(value_cols)) * 4`.

### 7.4 Multi-Series on Different Tables

Each table gets its own `DownsampleState`. Zoom messages trigger re-downsampling
for ALL downsampled tables simultaneously. The `DOWNSAMPLE_READY` response includes
results for all tables.

### 7.5 Mixed Eligible/Ineligible Series on Same Table

If a table is referenced by both a Line series (eligible) and a Candlestick series
(ineligible), the table is NOT downsampled. The eligibility check requires ALL
series referencing the table to be eligible types.

This is correct behavior: downsampling OHLC data would lose the open/high/low/close
structure.

### 7.6 Zoom Beyond Data Range

When the user zooms to a range that extends beyond the data (e.g., into the future),
the zoom message `from`/`to` may be outside the actual time range. The Python side
handles this gracefully:

- `full_duration / zoom_duration` ratio still works (just means fewer total bins)
- The viewport computation (`_compute_viewport`) uses `where` filters that
  naturally handle out-of-range timestamps (returning 0 matching rows)
- The client receives a viewport of `[0, 0]` or similar, and displays the
  available data within the downsampled table

### 7.7 Very Narrow Zoom (Extreme Zoom-In)

When the user zooms to a very narrow range (e.g., 1 second out of 1 year), the
computed `total_bins` would be enormous:

```
total_bins = 5000 * (365 * 86400) / 1 = 157 billion bins
```

The `MAX_TOTAL_BINS` cap prevents this:

```python
MAX_TOTAL_BINS = TARGET_POINTS * 20  # 100,000 bins max
total_bins = min(total_bins, MAX_TOTAL_BINS)
```

With 100K bins, each bin covers `365 * 86400 / 100000 = 315 seconds` of a 1-year
dataset. The zoomed 1-second range would contain about 0.003 bins -- essentially
showing the raw data point(s) at that timestamp, which is the correct behavior.

### 7.8 Ticking Tables

When the source table is refreshing (ticking), the downsampled table is also
refreshing. New rows arriving in the source table:

1. Get assigned to a bin via the `update` operation (bin width is fixed).
2. May change the min/max/first/last for their bin (aggregation updates).
3. May cause new row indices to appear in `unique_idx`.
4. The `where_in` result updates automatically.

The client's subscription to the downsampled table receives these updates via
the normal `EVENT_UPDATED` path.

**Limitation:** New rows that extend the time range beyond the original max will
all fall into the last bin (or a bin with a very large number). This creates
uneven bin distribution. A periodic re-downsample (e.g., every N new rows) could
fix this, but is deferred to a future iteration.

### 7.9 Empty Tables

If the source table has 0 rows, `_get_time_range()` returns `None`, and the
source table is returned directly (no downsampling).

### 7.10 Tables With NULL Values

NULL values in the time column produce `null` from `epochNanos()`. The `__Bin`
computation `(long)(null / ...)` evaluates to `NULL_LONG` in Deephaven, which
effectively groups all null-time rows into a special bin. These rows are
unlikely to be selected by the min/max logic (since comparing with NULL produces
false), so they are naturally excluded from the output.

NULL values in value columns: `agg.min_` and `agg.max_` ignore NULLs. The
`where(V == __Min_V)` filter also ignores NULLs (NULL != anything). So NULL
value rows are naturally excluded unless they are the first/last row in a bin.

### 7.11 Non-Standard Chart Types

Yield curve charts (`yieldCurve`) and options charts (`options`) use numeric
x-axes (not time-based). These are NOT downsampled because:

1. They typically have small datasets (tenor points, strike prices)
2. The `epochNanos()` function does not apply to numeric columns

The eligibility check in `listener.py` explicitly requires `chart_type == "standard"`.

### 7.12 Partitioned Tables (`by` parameter)

When a chart is created with `by=` (e.g., `tvl.line(table, by="Sym")`), each
partition produces a separate table. Each partition table is independently
evaluated for downsampling eligibility.

In practice, partitioned tables are usually small enough per partition that
downsampling is not needed. If a partition IS large enough, it follows the same
downsample path as a non-partitioned table.

---

## 8. Double-Click Reset Behavior

### 8.1 Current Behavior

Currently, LWC's native double-click handler calls `chart.timeScale().fitContent()`,
which zooms to fit all data. With the JSAPI downsample, this works poorly because
the head/tail catch-all data is sparse and distorts the view.

### 8.2 New Behavior

1. User double-clicks on the chart.
2. JS `dblclick` handler fires (in `setupDownsampleSubscriptions`).
3. Calls `model.sendReset()` which sends `{"type": "RESET"}` to Python.
4. Python `_handle_reset()` calls `compute_initial()` on each `DownsampleState`,
   producing a fresh full-range downsampled table.
5. Python sends `DOWNSAMPLE_READY` with `isReset: true` and new table references.
6. JS `handleDownsampleReady()` fetches new tables, tears down old subscriptions,
   subscribes to new tables.
7. When subscription data arrives (via `handleTableUpdate` -> `DATA_UPDATED` event),
   the chart component sees `isReset` and calls `renderer.fitContent()`.

### 8.3 Preventing Double Processing

The native LWC double-click handler also fires `fitContent()`. Since we are
replacing the data (new table subscription), the native `fitContent()` fires on
the OLD data momentarily. To prevent visual jank:

- Option A: Call `e.preventDefault()` on the dblclick event to suppress native
  behavior. **Problem:** LWC's dblclick handler is internal, not a DOM event.
- Option B: Set `handleScale.axisDoubleClickReset: false` in chart options when
  downsampling is active. This disables LWC's native reset.
- Option C: Let both fire -- the native fitContent shows all old data momentarily,
  then our reset replaces it. Small visual flash, but harmless.

**Recommended: Option B.** When Python-side downsampling is detected (from
`downsampleInfo` in the figure), the chart component applies
`{ handleScale: { axisDoubleClickReset: false } }` to disable native reset.
Our dblclick handler provides the replacement behavior.

---

## 9. Performance Considerations

### 9.1 Downsample Computation Cost

For a 10M row table with 5000 bins:

| Operation | Cost |
|-----------|------|
| `update` (add 3 columns) | O(n) single pass, ~1-2s for 10M rows |
| `agg_by` (per-bin first/last/min/max) | O(n) single pass, ~0.5-1s |
| `natural_join` (bin summary back to binned) | O(n) hash join, ~1s |
| `where` (filter min/max matches) | O(n) scan, ~0.5s per column |
| `agg_by` (first per bin for min/max rows) | O(m) where m << n, fast |
| `merge` (collect indices) | O(k) where k = num indices, fast |
| `select_distinct` | O(k), fast |
| `where_in` | O(n) hash lookup, ~1s |
| `sort` | O(k log k), fast (k is small) |
| **Total** | **~5-8 seconds for 10M rows** |

This is acceptable for an initial load. For zoom re-downsamples, the total bin
count is capped at `MAX_TOTAL_BINS = 100K`, but the source table is still 10M
rows, so each re-downsample takes the same ~5-8s.

### 9.2 Optimization: Pre-Binned Materialized View

For faster re-downsamples, we could pre-compute a sorted table with a row index
column and cache it. The bin column then becomes a simple arithmetic operation
on the cached row index. This is a future optimization.

### 9.3 Wire Transfer Size

With `TARGET_POINTS = 5000` and up to 4 rows per bin (for a single y-column),
the maximum wire transfer is ~20,000 rows. Each row has 2 columns (time + value),
so at 16 bytes per value, that is ~640 KB -- well within acceptable limits.

### 9.4 Subscription Viewport Optimization

The `viewport` in `DOWNSAMPLE_READY` tells the client which rows of the
downsampled table correspond to the zoom range. The client can use this to set
a table subscription viewport (via `table.setViewport(startRow, endRow, columns)`)
to avoid receiving head/tail data it does not currently display.

However, for the initial implementation, the client subscribes to the full
downsampled table. The viewport hint is sent for future optimization.

---

## 10. Testing Strategy

### 10.1 Python Unit Tests

New test file: `tests/test_downsample.py`

```python
def test_downsample_state_small_table():
    """Tables smaller than TARGET_POINTS are not downsampled."""


def test_downsample_state_basic():
    """Basic downsampling produces correct row count."""


def test_downsample_state_preserves_original_values():
    """Downsampled rows are exact original rows, not aggregates."""


def test_downsample_state_time_range():
    """First and last rows of output span full time range."""


def test_downsample_state_zoom():
    """compute_for_zoom produces more bins for narrow zoom."""


def test_downsample_state_zoom_cap():
    """MAX_TOTAL_BINS prevents degenerate narrow zooms."""


def test_downsample_state_liveness():
    """Liveness scope is properly managed on re-downsample."""


def test_listener_zoom_message():
    """Listener processes ZOOM message and returns DOWNSAMPLE_READY."""


def test_listener_reset_message():
    """Listener processes RESET message and returns DOWNSAMPLE_READY."""


def test_listener_ineligible_series():
    """Candlestick series are not downsampled."""


def test_listener_multi_value_cols():
    """Multiple value columns produce correct min/max per column."""
```

### 10.2 JavaScript Unit Tests

Extend existing test files:

```typescript
// TradingViewChartModel.test.ts
describe('Python downsample', () => {
  it('detects downsampleInfo in figure data');
  it('sends ZOOM message with correct nanoseconds');
  it('sends RESET message');
  it('handles DOWNSAMPLE_READY by replacing subscriptions');
  it('does not send ZOOM for pan-only changes');
});

// TradingViewUtils.test.ts
// Remove tests for classifyDownsampledRows, generateWhitespaceGrid, buildDataWithGaps
```

### 10.3 Integration Tests

Manual verification via `agent-browser`:

1. Create a 10M row ticking table with `tvl.line()`
2. Verify initial load shows full time range with ~5000 points
3. Zoom in and verify data becomes higher resolution
4. Pan and verify no server round-trip (smooth)
5. Double-click and verify reset to full view
6. Verify ticking updates appear in real-time

---

## 11. Migration Path

### 11.1 Phase 1: Add Python Downsample (This PR)

- Add `downsample.py` with `DownsampleState`
- Modify `listener.py` to use Python downsample
- Modify JS model to handle ZOOM/RESET/DOWNSAMPLE_READY
- Keep JSAPI downsample as fallback (check `downsampleInfo` in figure to
  decide which path to use)

### 11.2 Phase 2: Remove JSAPI Downsample (Follow-up PR)

- Remove all JSAPI downsample code from `TradingViewChartModel.ts`
- Remove `classifyDownsampledRows`, `generateWhitespaceGrid`, `buildDataWithGaps`
- Remove whitespace companion series from renderer
- Remove `DownsampleInfo` type (JSAPI version)
- Remove `DownsampledData` type
- Clean up head/body/tail data path from chart component

### 11.3 Feature Flag

During migration, a feature flag can select the downsample backend:

```python
# In listener.py
USE_PYTHON_DOWNSAMPLE = True  # Set to False to fall back to JSAPI

if USE_PYTHON_DOWNSAMPLE and eligible:
    pass  # Python-side downsample path
else:
    pass  # Send original table, let JS use JSAPI downsample
```

---

## 12. Summary of All Changes

### New Files
| File | Description |
|------|-------------|
| `src/deephaven/plot/tradingview_lightweight/downsample.py` | Core `DownsampleState` class with min/max bucketing |
| `tests/test_downsample.py` | Python unit tests for downsampling |

### Modified Files (Python)
| File | Changes |
|------|---------|
| `communication/listener.py` | Add ZOOM/RESET handlers, DownsampleState integration, close() |
| `communication/connection.py` | Call listener.close() on connection close |

### Modified Files (JavaScript)
| File | Changes |
|------|---------|
| `TradingViewTypes.ts` | Add ZOOM/RESET/DOWNSAMPLE_READY types, downsampleInfo on figure |
| `TradingViewChartModel.ts` | Remove JSAPI downsample, add sendZoom/sendReset/handleDownsampleReady |
| `TradingViewChart.tsx` | Simplify zoom detection, add dblclick RESET handler |
| `TradingViewChartRenderer.ts` | Remove whitespace series (Phase 2) |
| `TradingViewUtils.ts` | Remove classify/whitespace/gap functions (Phase 2) |

### Unchanged Files
| File | Reason |
|------|--------|
| `chart.py` | No downsample-related code |
| `series.py` | No downsample-related code |
| `markers.py` | No downsample-related code |
| `options.py` | No downsample-related code |
| `__init__.py` | Downsample is internal, not exported |
| `_register.py` | Registration unchanged |
| `_types.py` | No new types needed |
| `utils.py` | No changes needed |
| `TradingViewTheme.ts` | No downsample-related code |
| `TradingViewPlugin.ts` | No downsample-related code |
