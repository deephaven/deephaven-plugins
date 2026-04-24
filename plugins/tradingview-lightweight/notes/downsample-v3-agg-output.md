# Downsample v3: Direct Aggregation Output

## File Paths

| File | Role |
|---|---|
| `plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/downsample.py` | Core downsample algorithm — **rewrite `_downsample()`** |
| `plugins/tradingview-lightweight/src/deephaven/plot/tradingview_lightweight/communication/listener.py` | Message handler — **no changes needed** |
| `tests/app.d/tvl_downsample_test.py` | Test fixtures (static 10M `tvl_big`, ticking 100M `tvl_big_ticking`) |
| `plugins/tradingview-lightweight/src/js/src/TradingViewChart.tsx` | JS client — **no changes needed** |
| `plugins/tradingview-lightweight/src/js/src/TradingViewChartModel.ts` | JS model — **no changes needed** |

## Hard Constraints

1. **No `ii`, `i`, or `k` in any formula.** All tables must be assumed ticking
   (refreshing). These special variables are rejected by DH on refreshing tables.
2. **All work must use DH table operations.** No Python-side row iteration, no
   jpy RowSet manipulation. DH engine operations run in optimized Java; anything
   in Python will be orders of magnitude slower on 100M+ rows.
3. **Source table is always sorted by the time column.** This is a precondition
   of the downsample (same as JSAPI RunChartDownsample).

## Current State of the Code

The file on disk (`downsample.py`) is mid-transition from v1 → v2. It uses:
- `view` with `"__RowIdx = ii"` (blocked on ticking)
- `agg.sorted_first`/`sorted_last` tracking `__RowIdx` (correct idea, wrong key)
- `where_in` to filter source by keeper indices (second scan, OOM risk)
- `update_view(["__RowIdx = ii"])` on source (blocked on ticking)

**The agent should read the current file and rewrite `_downsample()` entirely,
not patch it.** Other methods (`compute_initial`, `compute_hybrid`,
`_get_time_range`, etc.) are fine and should be preserved as-is.

## API Reference: `agg.sorted_first` / `agg.sorted_last`

```text
agg.sorted_first(order_by: str, cols: Union[str, list[str]]) -> Aggregation
agg.sorted_last(order_by: str, cols: Union[str, list[str]]) -> Aggregation
```

- `order_by`: column name to sort by within each group
- `cols`: column(s) to output, as rename expressions: `"NewName=OrigCol"`
- `sorted_first` picks the row with the minimum `order_by` value in the group
  and outputs the specified columns FROM THAT SPECIFIC ROW
- `sorted_last` picks the row with the maximum `order_by` value
- Can return multiple columns from the same row:
  `agg.sorted_first("Price", cols=["MinTime=Timestamp", "MinPrice=Price"])`
  returns both `Timestamp` and `Price` from the row that had the minimum `Price`

Similarly, `agg.first(cols=["A=X", "B=Y"])` returns columns X and Y from the
first row (by row order) in the group. `agg.last(cols=...)` returns from the
last row.

## Problem

The current `_downsample()` in `downsample.py` has two fundamental issues:

1. **OOM on large tables (100M rows)**: Uses `update`/`view` with `ii` to add
   helper columns to the full source, then `agg_by` + `where_in` to filter.
   Even with `view` (lazy), the DH engine maintains internal structures for the
   full DAG. On 100M rows this causes Java heap OOM.

2. **`ii` blocked on ticking tables**: DH rejects `ii`, `i`, and `k` in formulas
   on refreshing tables. Our code uses `ii` for row identification, so it fails
   on any ticking source.

The JSAPI `RunChartDownsample` avoids both: it's a single-pass Java operation
that builds a filtered RowSet with O(bins) memory and handles ticking natively.
We can't call it directly (we need different head/tail behavior for hybrid
merge), but we can match its architecture.

## Solution: Aggregation IS the Output

Instead of using `agg_by` to find keeper row indices and then filtering back to
the source with `where_in`, have the `agg_by` output the final data directly.

`sorted_first`/`sorted_last` can return **all columns** from the specific source
row — not just one column. So the bin summary contains complete reconstructed
rows copied from the exact first/last/min/max source rows.

The bin summary is then "unpivoted" (wide → tall) into individual rows and
merged. No `where_in`, no `ii`, no second scan of the source.

### Before (current)

```
source (100M) → view(__RowIdx=ii, __Bin, values)
             → agg_by(first/last/sorted_first/sorted_last tracking __RowIdx)
             → bin_summary (~1000 rows with keeper indices)
             → collect indices → where_in on source → result
```

- Two full scans of source (agg_by + where_in)
- Uses `ii` (blocked on ticking)
- Intermediate DAG on 100M rows
- OOM risk from engine overhead

### After (v3)

```
source (100M) → view(__Bin, time_col, value_cols)
             → agg_by(first/last/sorted_first/sorted_last returning ALL columns)
             → bin_summary (~1000 rows, 4+ column groups per bin)
             → unpivot via view + merge → result (~4000 rows)
```

- **One scan** of source (single `agg_by`)
- **No `ii` or `k`** — works on ticking tables
- **No `where_in`** — no second scan, no duplicate timestamp issue
- **Result is the agg output** — O(bins) memory, not O(source)
- **Live**: `agg_by` updates incrementally when source ticks

## Detailed Design

### `_downsample()` rewrite

```python
def _downsample(self, num_bins, from_nanos=None, to_nanos=None):
    source = self.source_table

    # Optional range filter for foreground
    if from_nanos is not None and to_nanos is not None:
        source = source.where(
            f"epochNanos({tc}) >= {from_nanos} " f"&& epochNanos({tc}) <= {to_nanos}"
        )
        range_min, range_max = from_nanos, to_nanos
    else:
        range_min, range_max = self.get_time_range()

    if source.size <= num_bins:
        return source, []

    bin_width = max((range_max - range_min) // num_bins, 1)

    # Columns the output needs: time + all value cols
    out_cols = [self.time_col] + list(self.value_cols)

    # View for aggregation: just __Bin + the output columns
    agg_view = source.view(
        [f"__Bin = (long)(epochNanos({self.time_col}) / {bin_width}L)"] + out_cols
    )

    # Build aggregation: for each of first/last/min/max, capture ALL
    # output columns from that specific row.
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

    # Unpivot: each category (first/last/min_v/max_v) becomes rows
    # with the original column names restored.
    views = [
        bin_summary.view([f"{c}=__First_{c}" for c in out_cols]),
        bin_summary.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in self.value_cols:
        views.append(bin_summary.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bin_summary.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))

    # Merge all category rows, deduplicate (same source row may be
    # first AND min), sort by time.
    merged = dh_merge(views).select_distinct(out_cols).sort(self.time_col)

    intermediates = [agg_view, bin_summary] + views
    return merged, intermediates
```

### Key properties

**Single scan**: The `agg_by` scans the source once. No second pass.

**No `ii`/`k`**: The `view` only adds `__Bin` (computed from `epochNanos`).
The `agg_by` tracks complete source rows internally. No row index column needed.

**Ticking safe**: `epochNanos()` is safe on refreshing tables. The `agg_by`
updates incrementally when the source ticks. The downstream views/merge/distinct
propagate changes.

**O(bins) memory**: The bin_summary has ~num_bins rows. Each row has
`(2 + 2*len(value_cols)) * len(out_cols)` columns — wide but shallow. For 1000
bins × 2 value cols × 3 out cols = 12,000 cells. Trivial.

**Correct values**: `sorted_first(v, cols=[...])` copies the column values from
the specific source row that has the minimum `v` within the bin. All columns are
from the same row. The output is not interpolated or averaged — it contains
exact values from actual source rows.

**No duplicate timestamp issue**: The output is the aggregation result, not a
`where_in` filter. Each row in the output corresponds to exactly one
conceptual source row (first, last, min, or max). Even if multiple source rows
share a timestamp, the agg picks one specific row and copies its values.

### `select_distinct` for deduplication

The same source row may be the first AND the min (or the last AND the max) for
a bin. After unpivoting, these appear as duplicate rows. `select_distinct` on
all output columns removes exact duplicates. This matches the current behavior
where `unique_idx` deduplicates keeper row indices.

Note: `select_distinct` deduplicates by value equality. If two different source
rows have identical values across all output columns, one will be dropped. This
is acceptable — identical-value rows are visually indistinguishable on the chart.

### Sort after merge

The current code avoids sorting by assuming the source is pre-sorted and
`where_in` preserves order. With the unpivot approach, rows from different
categories (first/last/min/max) are interleaved by the merge. A final
`.sort(time_col)` is needed to restore time order.

This sort operates on ~4000 rows (not 100M), so it's negligible.

## Changes to `compute_hybrid()`

No changes needed. It calls `_downsample()` for the foreground, then merges
with background. The bg_before/fg/bg_after merge still works — each segment
is individually time-sorted.

The only consideration: the output table's columns are now exactly
`[time_col] + value_cols` (the out_cols). Previously it was all source columns.
This is actually better — less data transferred to the client, and the client
only subscribes to these columns anyway.

## Changes to `_get_time_range_impl()`

Keep the current `head(1)`/`tail(1)` approach. It's O(1) and works on ticking
tables (`head`/`tail` are safe on refreshing tables).

## Changes to `listener.py`

No changes needed. The listener creates `DownsampleState` with `time_col` and
`value_cols`, calls `compute_initial()`/`compute_hybrid()`/`compute_reset()`,
and exports the result table. The result table's schema is compatible — it has
the time column and value columns the client expects.

## Changes to JS/TS client

No changes needed. The client receives a table with time + value columns,
subscribes, and renders. The data format is identical.

## Intermediates / Memory Management

### What stays alive

For the **background** (cached permanently):
- `agg_view`: lazy view of source. No materialized columns on source.
- `bin_summary`: ~1000 rows. Trivial.
- Category views: ~1000 rows each. Trivial.
- `merged` (result): ~4000 rows after dedup. Trivial.

Total background memory: O(bins) — a few thousand rows of metadata.

For the **foreground** (released on each re-zoom):
- Same structure, ~5000 bins. Still trivial.

### What's freed vs current

| Resource | Current (v2) | New (v3) |
|---|---|---|
| Source columns materialized | 100M × 2-3 cols (`update`) | 0 (`view` is lazy) |
| `where_in` scan | 100M rows | None |
| Intermediates kept alive | agg_view (100M lazy), bin_summary, idx tables, tagged (100M lazy) | agg_view (100M lazy), bin_summary, category views (all tiny) |
| `ii` / `k` usage | Yes (blocks ticking) | None |
| Result table size | ~4000 rows (filtered source) | ~4000 rows (agg output) |

### DH engine overhead

The `agg_by` maintains internal state: group index mapping rows to bins, and
per-bin aggregation state (first/last/sorted_first/sorted_last). For
`sorted_first`/`sorted_last`, the per-bin state is: current min/max value +
all column values from that row. This is O(bins × cols) — trivial.

The group index for 100M rows with ~1000 bins is the main engine cost. DH's
internal implementation uses compressed row sets per group. This is the same
cost as any `agg_by` on 100M rows — well within normal DH usage.

## Ticking Behavior

When the source ticks (new row appended):

1. `agg_view` sees the new row. `__Bin` is computed lazily.
2. `agg_by` updates incrementally:
   - `last()` for the new row's bin updates to the new row's values
   - `sorted_first`/`sorted_last` check if the new value is a new min/max
   - If it is, the stored column values for that category update
3. `bin_summary` changes — one or more cells update.
4. Category views reflect the change.
5. `dh_merge` propagates.
6. `select_distinct` re-evaluates.
7. Result updates.

Each tick is O(1) work — update one bin's state. Not a full recompute.

## Edge Cases

### Empty bins
If a bin has no rows (possible for foreground with sparse data), it doesn't
appear in `bin_summary`. No issue — no rows emitted for that bin.

### Single row per bin
All four categories (first/last/min/max) point to the same row.
`select_distinct` collapses them to one row. Correct.

### Null values in value columns
`sorted_first`/`sorted_last` skip nulls when determining min/max (DH default
null handling). If all values in a bin are null for a column, the aggregation
produces null for the min/max columns. The unpivoted row will have nulls.
`select_distinct` treats nulls as equal, so duplicate null rows collapse.

### Multiple value columns with different min/max rows
Each value column has its own `sorted_first`/`sorted_last` entry. The min-Price
row may differ from the min-Volume row. Both are captured as separate rows in
the output, each with all columns from their respective source rows.
`select_distinct` deduplicates if they happen to be the same row.

## Implementation Steps

1. **Read the current `downsample.py`** to understand the full class structure.
   Preserve `compute_initial`, `compute_hybrid`, `get_time_range`,
   `release_foreground`, `release`, and `_get_time_range_impl` as-is.

2. **Rewrite `_downsample()`** with the v3 approach (the core change). The
   method signature and return type stay the same:
   `_downsample(self, num_bins, from_nanos=None, to_nanos=None) -> tuple[Any, list[Any]]`

3. **Update the module docstring** to reflect the new approach (no more
   `where_in`, no more `ii`).

4. **Clean up imports**: remove `new_table` and `long_col` (no longer needed).
   Keep `agg`, `merge as dh_merge`, `Table`, `liveness_scope`. The `liveness_scope`
   is still used by `_get_time_range`.

5. **Verify** that `compute_hybrid`'s bg_before/fg/bg_after merge still works.
   The v3 `_downsample` output has columns `[time_col] + value_cols` (not all
   source columns). The `where` filters in `compute_hybrid` reference
   `epochNanos(tc)` which operates on the time column — this must be present in
   the background table. Since `_downsample` includes `time_col` in `out_cols`,
   this is satisfied.

6. **Test** with `tvl_big` (static 10M) and `tvl_big_ticking` (ticking 100M)
   fixtures in `tests/app.d/tvl_downsample_test.py`.
