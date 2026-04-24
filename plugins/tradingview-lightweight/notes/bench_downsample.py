# ruff: noqa
"""Benchmark downsample approaches.

Run with: dh exec notes/bench_downsample.py
"""
import time
from deephaven import empty_table, agg, merge as dh_merge

# --- Setup: 10M row table with Instant time column + 1 value column ---
ROW_COUNT = 10_000_000
NUM_BINS = 1000

print(f"Creating {ROW_COUNT:,} row table...")
t0 = time.perf_counter()
big_table = empty_table(ROW_COUNT).update(
    [
        "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
        "Price = 100 + Math.sin(ii * 0.0001) * 50 + (ii * 0.000005)",
    ]
)
print(f"Table created in {time.perf_counter() - t0:.2f}s  ({big_table.size:,} rows)")

tc = "Timestamp"
out_cols = ["Timestamp", "Price"]
value_cols = ["Price"]

# Compute time range
head_t = big_table.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big_table.tail(1).view(["__T = epochNanos(Timestamp)"])
range_min = int(
    head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey())
)
range_max = int(
    tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey())
)
duration = range_max - range_min
bin_width = max(duration // NUM_BINS, 1)

print(
    f"\nBin width: {bin_width / 1e9:.1f}s, {NUM_BINS} bins over {duration / 1e9 / 86400:.0f} days"
)
print("=" * 60)


def bench(label, fn, repeats=3):
    """Run fn() multiple times, print timing."""
    times = []
    for i in range(repeats):
        t0 = time.perf_counter()
        result = fn()
        elapsed = time.perf_counter() - t0
        times.append(elapsed)
        rows = result.size if hasattr(result, "size") else "?"
    avg = sum(times) / len(times)
    best = min(times)
    print(f"{label:40s}  avg={avg:.3f}s  best={best:.3f}s  rows={rows}")
    return result


# ============================================================
# A) OLD: epochNanos bin + all-in-one agg_by + merge + sort
# ============================================================
def old_approach():
    agg_view = big_table.view(
        [f"__Bin = (long)(epochNanos({tc}) / {bin_width}L)"] + out_cols
    )

    agg_list = [
        agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
        agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
    ]
    for v in value_cols:
        agg_list.append(
            agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols])
        )
        agg_list.append(
            agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols])
        )

    bin_summary = agg_view.agg_by(agg_list, by=["__Bin"])

    views = [
        bin_summary.view([f"{c}=__First_{c}" for c in out_cols]),
        bin_summary.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in value_cols:
        views.append(bin_summary.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bin_summary.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))

    merged = dh_merge(views).select_distinct(out_cols).sort(tc)
    # Force materialization
    _ = merged.size
    return merged


# ============================================================
# B) NEW: lowerBin + first_by/last_by + lighter agg_by + merge + sort
# ============================================================
def new_approach():
    agg_view = big_table.view([f"__Bin = lowerBin({tc}, {bin_width})"] + out_cols)

    first_rows = agg_view.first_by("__Bin").view(out_cols)
    last_rows = agg_view.last_by("__Bin").view(out_cols)

    views = [first_rows, last_rows]

    if value_cols:
        agg_list = []
        for v in value_cols:
            agg_list.append(
                agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols])
            )
            agg_list.append(
                agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols])
            )
        bin_summary = agg_view.agg_by(agg_list, by=["__Bin"])
        for v in value_cols:
            views.append(bin_summary.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
            views.append(bin_summary.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))

    merged = dh_merge(views).sort(tc)
    _ = merged.size
    return merged


# ============================================================
# C) lowerBin + all-in-one agg_by (no first_by/last_by split)
# ============================================================
def lowerbin_allinone():
    agg_view = big_table.view([f"__Bin = lowerBin({tc}, {bin_width})"] + out_cols)

    agg_list = [
        agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
        agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
    ]
    for v in value_cols:
        agg_list.append(
            agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols])
        )
        agg_list.append(
            agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols])
        )

    bin_summary = agg_view.agg_by(agg_list, by=["__Bin"])

    views = [
        bin_summary.view([f"{c}=__First_{c}" for c in out_cols]),
        bin_summary.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in value_cols:
        views.append(bin_summary.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bin_summary.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))

    merged = dh_merge(views).sort(tc)
    _ = merged.size
    return merged


# ============================================================
# D) epochNanos bin + all-in-one agg_by + merge + sort (no select_distinct)
# ============================================================
def old_no_distinct():
    agg_view = big_table.view(
        [f"__Bin = (long)(epochNanos({tc}) / {bin_width}L)"] + out_cols
    )

    agg_list = [
        agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
        agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
    ]
    for v in value_cols:
        agg_list.append(
            agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols])
        )
        agg_list.append(
            agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols])
        )

    bin_summary = agg_view.agg_by(agg_list, by=["__Bin"])

    views = [
        bin_summary.view([f"{c}=__First_{c}" for c in out_cols]),
        bin_summary.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in value_cols:
        views.append(bin_summary.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bin_summary.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))

    merged = dh_merge(views).sort(tc)
    _ = merged.size
    return merged


# ============================================================
# E) Instant filter vs epochNanos filter (foreground scenario)
# ============================================================
from_nanos = range_min + duration // 4
to_nanos = range_min + duration // 2
from_iso = "2022-07-02T12:00:00Z"  # approximate quarter-range
to_iso = "2025-01-01T00:00:00Z"  # approximate half-range

# Compute precise ISO strings
import datetime


def nanos_to_iso(nanos):
    secs, rem = divmod(nanos, 1_000_000_000)
    dt = datetime.datetime.fromtimestamp(secs, tz=datetime.timezone.utc)
    iso = dt.strftime("%Y-%m-%dT%H:%M:%S")
    if rem > 0:
        return f"{iso}.{rem:09d}Z"
    return f"{iso}Z"


from_iso = nanos_to_iso(from_nanos)
to_iso = nanos_to_iso(to_nanos)


def filter_epochnanos():
    filtered = big_table.where(
        f"epochNanos({tc}) >= {from_nanos} && epochNanos({tc}) <= {to_nanos}"
    )
    _ = filtered.size
    return filtered


def filter_instant():
    filtered = big_table.where(f"{tc} >= '{from_iso}' && {tc} <= '{to_iso}'")
    _ = filtered.size
    return filtered


# ============================================================
# Run benchmarks
# ============================================================
print("\n--- Full downsample (10M rows, 1000 bins) ---")
bench("A) OLD: epochNanos + agg_by + distinct", old_approach)
bench("B) NEW: lowerBin + first/last_by split", new_approach)
bench("C) lowerBin + all-in-one agg_by", lowerbin_allinone)
bench("D) OLD minus select_distinct only", old_no_distinct)

print("\n--- Filter 25%-50% range (2.5M rows) ---")
bench("E1) epochNanos filter", filter_epochnanos)
bench("E2) Instant literal filter", filter_instant)

print("\nDone.")
