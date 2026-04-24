#!/bin/bash
# Final: current vs MinMaxLTTB (D4 single-pass max-dev), isolated JVM.
cd "$(dirname "$0")/.."

# A) Current
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
echo -n "A) Current (1K bins):                     "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# B) MinMaxLTTB ratio=4, single-pass max-dev
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
pre_bw = max(duration // (NUM_BINS * RATIO), 1)
lttb_bw = max(duration // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    # Stage 1: MinMax preselection
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

    # Stage 2: Single-pass max-deviation refinement
    bucketed = preselected.update_view([f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)"])
    avg_cols = [f"__Avg_{v} = {v}" for v in value_cols]
    avgs = bucketed.view(["__LB"] + list(value_cols)).avg_by("__LB").rename_columns(avg_cols)
    with_dev = bucketed.natural_join(
        avgs, on="__LB", joins=", ".join(f"__Avg_{v}" for v in value_cols)
    ).update_view([f"__Dev_{v} = Math.abs((double){v} - __Avg_{v})" for v in value_cols])
    refine_aggs = []
    for v in value_cols:
        refine_aggs.append(agg.sorted_last(f"__Dev_{v}", cols=[f"__Sel_{v}_{c}={c}" for c in out_cols]))
    refined = with_dev.agg_by(refine_aggs, by="__LB")
    refine_views = []
    for v in value_cols:
        refine_views.append(refined.view([f"{c}=__Sel_{v}_{c}" for c in out_cols]))
    result = dh_merge(refine_views).sort(tc)
    _ = result.size

    times_list.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  preselected={pre_size}")
PYEOF
echo -n "B) MinMaxLTTB r=4 (single-pass max-dev): "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# C) MinMaxLTTB ratio=2, single-pass max-dev
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
pre_bw = max(duration // (NUM_BINS * RATIO), 1)
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

    bucketed = preselected.update_view([f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)"])
    avg_cols = [f"__Avg_{v} = {v}" for v in value_cols]
    avgs = bucketed.view(["__LB"] + list(value_cols)).avg_by("__LB").rename_columns(avg_cols)
    with_dev = bucketed.natural_join(
        avgs, on="__LB", joins=", ".join(f"__Avg_{v}" for v in value_cols)
    ).update_view([f"__Dev_{v} = Math.abs((double){v} - __Avg_{v})" for v in value_cols])
    refine_aggs = []
    for v in value_cols:
        refine_aggs.append(agg.sorted_last(f"__Dev_{v}", cols=[f"__Sel_{v}_{c}={c}" for c in out_cols]))
    refined = with_dev.agg_by(refine_aggs, by="__LB")
    refine_views = []
    for v in value_cols:
        refine_views.append(refined.view([f"{c}=__Sel_{v}_{c}" for c in out_cols]))
    result = dh_merge(refine_views).sort(tc)
    _ = result.size

    times_list.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}  preselected={pre_size}")
PYEOF
echo -n "C) MinMaxLTTB r=2 (single-pass max-dev): "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

rm -f notes/_bench_tmp.py
echo ""
echo "All isolated JVM. 10M rows, 3 value cols, 1000 output bins."
