#!/bin/bash
# Benchmark: current downsample vs DH-native MinMaxLTTB, isolated JVM per approach.
# Usage: bash notes/bench_lttb_dh.sh
cd "$(dirname "$0")/.."

# ============================================================
# A) Current: 1000 bins, first/last/min/max, merge+sort
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
    "Price = 100 + Math.sin(ii * 0.0001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = big.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
bw = max((rmax - rmin) // NUM_BINS, 1)

times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
          agg.last(cols=[f"__Last_{c}={c}" for c in out_cols])]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    views = [bs.view([f"{c}=__First_{c}" for c in out_cols]),
             bs.view([f"{c}=__Last_{c}" for c in out_cols])]
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    merged = dh_merge(views).sort(tc)
    _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "A) Current (1K bins, ~8K rows):           "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# B) DH-native MinMaxLTTB: 4K pre-bins → LTTB → ~3K points
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000; RATIO = 4
big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
    "Price = 100 + Math.sin(ii * 0.0001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = big.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
duration = rmax - rmin

pre_bins = NUM_BINS * RATIO
pre_bw = max(duration // pre_bins, 1)
lttb_bw = max(duration // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()

    # Stage 1: MinMax preselection (4K bins)
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {pre_bw}L)"])
    al = [agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
          agg.last(cols=[f"__Last_{c}={c}" for c in out_cols])]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    views = [bs.view([f"{c}=__First_{c}" for c in out_cols]),
             bs.view([f"{c}=__Last_{c}" for c in out_cols])]
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    preselected = dh_merge(views).sort(tc)
    pre_size = preselected.size

    # Stage 2: LTTB per value column (pure DH)
    lttb_results = []
    for v in value_cols:
        bucketed = preselected.update_view([
            f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)",
            f"__X = (double)epochNanos({tc})",
            f"__Y = (double){v}",
        ])
        avgs = bucketed.view(["__LB", "__X", "__Y"]).avg_by("__LB")
        prev_avgs = avgs.view(["__LB_p1 = __LB + 1", "__PX = __X", "__PY = __Y"])
        next_avgs = avgs.view(["__LB_m1 = __LB - 1", "__NX = __X", "__NY = __Y"])
        with_ctx = bucketed.natural_join(
            prev_avgs, on="__LB = __LB_p1", joins="__PX, __PY"
        ).natural_join(
            next_avgs, on="__LB = __LB_m1", joins="__NX, __NY"
        )
        with_area = with_ctx.update_view([
            "__PX = isNull(__PX) ? __X : __PX",
            "__PY = isNull(__PY) ? __Y : __PY",
            "__NX = isNull(__NX) ? __X : __NX",
            "__NY = isNull(__NY) ? __Y : __NY",
            "__Area = Math.abs((__PX - __NX) * (__Y - __PY) - (__PX - __X) * (__NY - __PY))",
        ])
        selected = with_area.agg_by(
            [agg.sorted_last("__Area", cols=[f"{c}={c}" for c in out_cols])],
            by="__LB",
        ).view(out_cols)
        lttb_results.append(selected)

    result = dh_merge(lttb_results).sort(tc) if len(lttb_results) > 1 else lttb_results[0]
    _ = result.size
    times_list.append(time.perf_counter() - t0)

print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  preselected={pre_size}")
PYEOF
echo -n "B) MinMaxLTTB ratio=4 (DH-native):       "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# C) DH-native MinMaxLTTB ratio=2
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000; RATIO = 2
big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
    "Price = 100 + Math.sin(ii * 0.0001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = big.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
duration = rmax - rmin

pre_bins = NUM_BINS * RATIO
pre_bw = max(duration // pre_bins, 1)
lttb_bw = max(duration // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {pre_bw}L)"])
    al = [agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
          agg.last(cols=[f"__Last_{c}={c}" for c in out_cols])]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    views = [bs.view([f"{c}=__First_{c}" for c in out_cols]),
             bs.view([f"{c}=__Last_{c}" for c in out_cols])]
    for v in value_cols:
        views.append(bs.view([f"{c}=__Min_{v}_{c}" for c in out_cols]))
        views.append(bs.view([f"{c}=__Max_{v}_{c}" for c in out_cols]))
    preselected = dh_merge(views).sort(tc)
    pre_size = preselected.size

    lttb_results = []
    for v in value_cols:
        bucketed = preselected.update_view([
            f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)",
            f"__X = (double)epochNanos({tc})",
            f"__Y = (double){v}",
        ])
        avgs = bucketed.view(["__LB", "__X", "__Y"]).avg_by("__LB")
        prev_avgs = avgs.view(["__LB_p1 = __LB + 1", "__PX = __X", "__PY = __Y"])
        next_avgs = avgs.view(["__LB_m1 = __LB - 1", "__NX = __X", "__NY = __Y"])
        with_ctx = bucketed.natural_join(
            prev_avgs, on="__LB = __LB_p1", joins="__PX, __PY"
        ).natural_join(
            next_avgs, on="__LB = __LB_m1", joins="__NX, __NY"
        )
        with_area = with_ctx.update_view([
            "__PX = isNull(__PX) ? __X : __PX",
            "__PY = isNull(__PY) ? __Y : __PY",
            "__NX = isNull(__NX) ? __X : __NX",
            "__NY = isNull(__NY) ? __Y : __NY",
            "__Area = Math.abs((__PX - __NX) * (__Y - __PY) - (__PX - __X) * (__NY - __PY))",
        ])
        selected = with_area.agg_by(
            [agg.sorted_last("__Area", cols=[f"{c}={c}" for c in out_cols])],
            by="__LB",
        ).view(out_cols)
        lttb_results.append(selected)

    result = dh_merge(lttb_results).sort(tc) if len(lttb_results) > 1 else lttb_results[0]
    _ = result.size
    times_list.append(time.perf_counter() - t0)

print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  preselected={pre_size}")
PYEOF
echo -n "C) MinMaxLTTB ratio=2 (DH-native):       "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# D) LTTB-only cost on 32K preselected rows (Stage 2 isolated)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
NUM_BINS = 1000

# Simulate preselected data: 32K rows already sorted
preselected = empty_table(32000).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 32000))",
    "Price = 100 + Math.sin(ii * 0.001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = preselected.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = preselected.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
lttb_bw = max((rmax - rmin) // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    lttb_results = []
    for v in value_cols:
        bucketed = preselected.update_view([
            f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)",
            f"__X = (double)epochNanos({tc})",
            f"__Y = (double){v}",
        ])
        avgs = bucketed.view(["__LB", "__X", "__Y"]).avg_by("__LB")
        prev_avgs = avgs.view(["__LB_p1 = __LB + 1", "__PX = __X", "__PY = __Y"])
        next_avgs = avgs.view(["__LB_m1 = __LB - 1", "__NX = __X", "__NY = __Y"])
        with_ctx = bucketed.natural_join(
            prev_avgs, on="__LB = __LB_p1", joins="__PX, __PY"
        ).natural_join(
            next_avgs, on="__LB = __LB_m1", joins="__NX, __NY"
        )
        with_area = with_ctx.update_view([
            "__PX = isNull(__PX) ? __X : __PX",
            "__PY = isNull(__PY) ? __Y : __PY",
            "__NX = isNull(__NX) ? __X : __NX",
            "__NY = isNull(__NY) ? __Y : __NY",
            "__Area = Math.abs((__PX - __NX) * (__Y - __PY) - (__PX - __X) * (__NY - __PY))",
        ])
        selected = with_area.agg_by(
            [agg.sorted_last("__Area", cols=[f"{c}={c}" for c in out_cols])],
            by="__LB",
        ).view(out_cols)
        lttb_results.append(selected)
    result = dh_merge(lttb_results).sort(tc)
    _ = result.size
    times_list.append(time.perf_counter() - t0)

print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  (LTTB stage only on 32K rows)")
PYEOF
echo -n "D) LTTB stage only (32K → ~3K, 3 cols):  "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# Cleanup
rm -f notes/_bench_tmp.py

echo ""
echo "All benchmarks run in isolated JVM processes."
echo "A = current approach. B/C = MinMaxLTTB with DH-native LTTB."
echo "D = isolated cost of the LTTB refinement stage."
