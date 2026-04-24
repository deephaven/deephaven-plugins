# ruff: noqa
"""Benchmark with multiple value columns and foreground scenario.

Run with: dh exec notes/bench_ds2.py
"""
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
BG_BINS = 1000
FG_BINS = 2000  # simulating ~1920px chart

print(f"Creating {ROW_COUNT:,} row table with 3 value columns...")
t0 = time.perf_counter()
big_table = empty_table(ROW_COUNT).update(
    [
        "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
        "Price = 100 + Math.sin(ii * 0.0001) * 50 + (ii * 0.000005)",
        "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
        "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
    ]
)
print(f"Table created in {time.perf_counter() - t0:.2f}s")

tc = "Timestamp"
value_cols = ["Price", "Volume", "Spread"]
out_cols = [tc] + value_cols

# Time range
head_t = big_table.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big_table.tail(1).view(["__T = epochNanos(Timestamp)"])
range_min = int(
    head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey())
)
range_max = int(
    tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey())
)
duration = range_max - range_min


def bench(label, fn, repeats=3):
    times = []
    for i in range(repeats):
        t0 = time.perf_counter()
        result = fn()
        elapsed = time.perf_counter() - t0
        times.append(elapsed)
        rows = result.size if hasattr(result, "size") else "?"
    avg = sum(times) / len(times)
    best = min(times)
    print(f"  {label:45s}  avg={avg:.3f}s  best={best:.3f}s  rows={rows}")
    return result


def make_old(source, num_bins, rng_min, rng_max):
    """Original: epochNanos bin, all-in-one agg_by, select_distinct + sort."""
    bw = max((rng_max - rng_min) // num_bins, 1)
    av = source.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
    al = [
        agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
        agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
    ]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    views = [
        bs.view([f"{c}=__First_{c}" for c in out_cols]),
        bs.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    merged = dh_merge(views).select_distinct(out_cols).sort(tc)
    _ = merged.size
    return merged


def make_new_allinone(source, num_bins, rng_min, rng_max):
    """epochNanos bin, all-in-one agg_by, NO select_distinct, merge + sort."""
    bw = max((rng_max - rng_min) // num_bins, 1)
    av = source.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
    al = [
        agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
        agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
    ]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    views = [
        bs.view([f"{c}=__First_{c}" for c in out_cols]),
        bs.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    merged = dh_merge(views).sort(tc)
    _ = merged.size
    return merged


def make_split(source, num_bins, rng_min, rng_max):
    """first_by/last_by split, lighter agg_by for sorted only."""
    bw = max((rng_max - rng_min) // num_bins, 1)
    av = source.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
    first_rows = av.first_by("__Bin").view(out_cols)
    last_rows = av.last_by("__Bin").view(out_cols)
    views = [first_rows, last_rows]
    al = []
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    merged = dh_merge(views).sort(tc)
    _ = merged.size
    return merged


def make_lowerbin(source, num_bins, rng_min, rng_max):
    """lowerBin binning, all-in-one agg_by, merge + sort."""
    bw = max((rng_max - rng_min) // num_bins, 1)
    av = source.view([f"__Bin = lowerBin({tc}, {bw})"] + out_cols)
    al = [
        agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
        agg.last(cols=[f"__Last_{c}={c}" for c in out_cols]),
    ]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    views = [
        bs.view([f"{c}=__First_{c}" for c in out_cols]),
        bs.view([f"{c}=__Last_{c}" for c in out_cols]),
    ]
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    merged = dh_merge(views).sort(tc)
    _ = merged.size
    return merged


# ============================================================
# Scenario 1: Full range, 1000 bins (background)
# ============================================================
print(f"\n--- Background: 10M rows, {BG_BINS} bins, 3 value cols ---")
bench(
    "OLD (epochNanos + distinct)",
    lambda: make_old(big_table, BG_BINS, range_min, range_max),
)
bench(
    "NEW no-distinct (epochNanos)",
    lambda: make_new_allinone(big_table, BG_BINS, range_min, range_max),
)
bench(
    "Split first/last_by", lambda: make_split(big_table, BG_BINS, range_min, range_max)
)
bench(
    "lowerBin all-in-one",
    lambda: make_lowerbin(big_table, BG_BINS, range_min, range_max),
)


# ============================================================
# Scenario 2: Foreground (25% zoom, 2.5M rows, 2000 bins)
# ============================================================
from_nanos = range_min + duration // 4
to_nanos = range_min + duration // 2

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

# Pre-filter
filtered_epoch = big_table.where(
    f"epochNanos({tc}) >= {from_nanos} && epochNanos({tc}) <= {to_nanos}"
)
filtered_instant = big_table.where(f"{tc} >= '{from_iso}' && {tc} <= '{to_iso}'")
print(
    f"\n--- Foreground: ~{filtered_epoch.size:,} rows, {FG_BINS} bins, 3 value cols ---"
)

bench(
    "OLD (epochNanos filter+bin+distinct)",
    lambda: make_old(filtered_epoch, FG_BINS, from_nanos, to_nanos),
)
bench(
    "NEW no-distinct (epochNanos)",
    lambda: make_new_allinone(filtered_epoch, FG_BINS, from_nanos, to_nanos),
)
bench(
    "Instant filter + epochNanos bin",
    lambda: make_new_allinone(filtered_instant, FG_BINS, from_nanos, to_nanos),
)
bench(
    "Split first/last_by",
    lambda: make_split(filtered_epoch, FG_BINS, from_nanos, to_nanos),
)
bench(
    "lowerBin all-in-one",
    lambda: make_lowerbin(filtered_epoch, FG_BINS, from_nanos, to_nanos),
)


# ============================================================
# Scenario 3: Adaptive bins (1000 vs 2000 vs 4000) on full range
# ============================================================
print(f"\n--- Adaptive bins: 10M rows, varying bin count ---")
for bins in [1000, 2000, 3000, 4000]:
    bench(
        f"no-distinct, {bins} bins",
        lambda b=bins: make_new_allinone(big_table, b, range_min, range_max),
    )

print("\nDone.")
