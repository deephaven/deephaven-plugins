#!/bin/bash
# Benchmark: current downsample vs MinMaxLTTB, isolated JVM per approach.
# Usage: bash notes/bench_lttb.sh
cd "$(dirname "$0")/.."

TABLE_SETUP='
import time
from deephaven import empty_table, agg, merge as dh_merge
import deephaven.pandas as dhpd
import math

ROW_COUNT = 10_000_000
NUM_BINS = 1000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '"'"'2020-01-01T00:00:00Z'"'"' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
    "Price = 100 + Math.sin(ii * 0.0001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
])
tc = "Timestamp"
value_cols = ["Price", "Volume", "Spread"]
out_cols = [tc] + value_cols
head_t = big.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
duration = rmax - rmin
'

# ============================================================
# A) Current: update() + agg_by + merge + sort (1000 bins)
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
echo -n "A) Current (1000 bins, ~8K rows):        "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# B) MinMaxLTTB: 4000 preselect bins → LTTB → 1000 points
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time, math
from deephaven import empty_table, agg, merge as dh_merge
import deephaven.pandas as dhpd

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

def lttb(times, values, n_out):
    n = len(times)
    if n <= n_out:
        return list(range(n))
    selected = [0]
    bucket_size = (n - 2) / (n_out - 2)
    a = 0
    for i in range(n_out - 2):
        ns = int(math.floor((i + 1) * bucket_size)) + 1
        ne = min(int(math.floor((i + 2) * bucket_size)) + 1, n)
        span = ne - ns
        if span <= 0:
            continue
        avg_x = sum(times[ns:ne]) / span
        avg_y = sum(values[ns:ne]) / span
        cs = int(math.floor(i * bucket_size)) + 1
        ce = min(int(math.floor((i + 1) * bucket_size)) + 1, n)
        max_area = -1.0; best = cs
        ax, ay = times[a], values[a]
        for j in range(cs, ce):
            area = abs((ax - avg_x) * (values[j] - ay) - (ax - times[j]) * (avg_y - ay))
            if area > max_area:
                max_area = area; best = j
        selected.append(best)
        a = best
    selected.append(n - 1)
    return selected

preselect_bins = NUM_BINS * RATIO
bw = max((rmax - rmin) // preselect_bins, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()

    # Stage 1: MinMax preselection
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
    preselected = dh_merge(views).sort(tc)
    pre_size = preselected.size

    # Stage 2: LTTB in Python
    df = dhpd.to_pandas(preselected)
    time_arr = df[tc].values.astype("int64").astype("float64")
    all_idx = set()
    for v in value_cols:
        val_arr = df[v].values.astype("float64")
        idx = lttb(time_arr.tolist(), val_arr.tolist(), NUM_BINS)
        all_idx.update(idx)
    all_idx.add(0)
    all_idx.add(len(df) - 1)
    selected_df = df.iloc[sorted(all_idx)][out_cols]
    result = dhpd.to_table(selected_df)
    _ = result.size

    times_list.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  preselected={pre_size}")
PYEOF
echo -n "B) MinMaxLTTB (4K pre → LTTB → ~1K):    "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# C) MinMaxLTTB with ratio=2 (fewer preselect bins)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time, math
from deephaven import empty_table, agg, merge as dh_merge
import deephaven.pandas as dhpd

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

def lttb(times, values, n_out):
    n = len(times)
    if n <= n_out:
        return list(range(n))
    selected = [0]
    bucket_size = (n - 2) / (n_out - 2)
    a = 0
    for i in range(n_out - 2):
        ns = int(math.floor((i + 1) * bucket_size)) + 1
        ne = min(int(math.floor((i + 2) * bucket_size)) + 1, n)
        span = ne - ns
        if span <= 0:
            continue
        avg_x = sum(times[ns:ne]) / span
        avg_y = sum(values[ns:ne]) / span
        cs = int(math.floor(i * bucket_size)) + 1
        ce = min(int(math.floor((i + 1) * bucket_size)) + 1, n)
        max_area = -1.0; best = cs
        ax, ay = times[a], values[a]
        for j in range(cs, ce):
            area = abs((ax - avg_x) * (values[j] - ay) - (ax - times[j]) * (avg_y - ay))
            if area > max_area:
                max_area = area; best = j
        selected.append(best)
        a = best
    selected.append(n - 1)
    return selected

preselect_bins = NUM_BINS * RATIO
bw = max((rmax - rmin) // preselect_bins, 1)

times_list = []
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
    preselected = dh_merge(views).sort(tc)
    pre_size = preselected.size

    df = dhpd.to_pandas(preselected)
    time_arr = df[tc].values.astype("int64").astype("float64")
    all_idx = set()
    for v in value_cols:
        val_arr = df[v].values.astype("float64")
        idx = lttb(time_arr.tolist(), val_arr.tolist(), NUM_BINS)
        all_idx.update(idx)
    all_idx.add(0)
    all_idx.add(len(df) - 1)
    selected_df = df.iloc[sorted(all_idx)][out_cols]
    result = dhpd.to_table(selected_df)
    _ = result.size

    times_list.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  preselected={pre_size}")
PYEOF
echo -n "C) MinMaxLTTB ratio=2 (2K pre → ~1K):   "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# D) Just MinMax preselection (no LTTB), same 4K bins as B
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000; PRESELECT_BINS = 4000
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
bw = max((rmax - rmin) // PRESELECT_BINS, 1)

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
echo -n "D) MinMax only, 4K bins (no LTTB):       "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# Cleanup
rm -f notes/_bench_tmp.py

echo ""
echo "All benchmarks run in isolated JVM processes."
echo "Rows comparison: A sends ~8K rows, B/C send ~1-2K rows (LTTB-selected)."
