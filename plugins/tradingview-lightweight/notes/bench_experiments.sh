#!/bin/bash
# Downsample optimization experiments — each in isolated dh exec process.
# Usage: bash notes/bench_experiments.sh
cd "$(dirname "$0")/.."

COMMON_SETUP='
import time
from deephaven import empty_table, agg, merge as dh_merge

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
bw = max((rmax - rmin) // NUM_BINS, 1)
'

run_experiment() {
    local label="$1"
    local file="$2"
    echo -n "$label: "
    dh exec "$file" 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'
}

AGG_BODY='
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
'

# ============================================================
# BASELINE: current code (view + epochNanos bin, no distinct)
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
    av = big.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
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
run_experiment "1) BASELINE view() + epochNanos          " notes/_bench_tmp.py


# ============================================================
# EXP 2: select() to materialize __Bin before agg_by
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
    av = big.select([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
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
run_experiment "2) select() materialized __Bin            " notes/_bench_tmp.py


# ============================================================
# EXP 3: update_view() — add __Bin to existing table lazily
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
    av = big.update_view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
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
run_experiment "3) update_view() lazy __Bin               " notes/_bench_tmp.py


# ============================================================
# EXP 4: lazy_update() — cached on-demand __Bin
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
    av = big.lazy_update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
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
run_experiment "4) lazy_update() cached __Bin             " notes/_bench_tmp.py


# ============================================================
# EXP 5: snapshot() to static, then merge_sorted
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge, merge_sorted as dh_merge_sorted
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
    av = big.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
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
    # snapshot each view to make static, then merge_sorted
    static_views = [v.snapshot() for v in views]
    merged = dh_merge_sorted(static_views, order_by=tc)
    _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
run_experiment "5) snapshot() views + merge_sorted        " notes/_bench_tmp.py


# ============================================================
# EXP 6: Skip unpivot — export wide bin_summary (no merge/sort)
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
    av = big.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
    al = [agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
          agg.last(cols=[f"__Last_{c}={c}" for c in out_cols])]
    for v in value_cols:
        al.append(agg.sorted_first(v, cols=[f"__Min_{v}_{c}={c}" for c in out_cols]))
        al.append(agg.sorted_last(v, cols=[f"__Max_{v}_{c}={c}" for c in out_cols]))
    bs = av.agg_by(al, by=["__Bin"])
    # No unpivot, no merge, no sort — just the wide bin_summary
    _ = bs.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={bs.size}")
PYEOF
run_experiment "6) Wide bin_summary only (no merge/sort)  " notes/_bench_tmp.py


# ============================================================
# EXP 7: update() to fully materialize __Bin eagerly
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
run_experiment "7) update() eager materialized __Bin      " notes/_bench_tmp.py


# ============================================================
# EXP 8: Fewer agg output cols — only capture (time, value) for sorted_first/last
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
    av = big.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
    # first/last still capture all cols (they need full rows)
    al = [agg.first(cols=[f"__First_{c}={c}" for c in out_cols]),
          agg.last(cols=[f"__Last_{c}={c}" for c in out_cols])]
    # sorted_first/last: only capture time + the specific value col
    for v in value_cols:
        min_cols = [f"__Min_{v}_{tc}={tc}", f"__Min_{v}_{v}={v}"]
        max_cols = [f"__Max_{v}_{tc}={tc}", f"__Max_{v}_{v}={v}"]
        al.append(agg.sorted_first(v, cols=min_cols))
        al.append(agg.sorted_last(v, cols=max_cols))
    bs = av.agg_by(al, by=["__Bin"])
    # Unpivot: first/last have all cols, min/max only have time+value
    views = [bs.view([f"{c}=__First_{c}" for c in out_cols]),
             bs.view([f"{c}=__Last_{c}" for c in out_cols])]
    for v in value_cols:
        views.append(bs.view([f"{tc}=__Min_{v}_{tc}", f"{v}=__Min_{v}_{v}"]))
        views.append(bs.view([f"{tc}=__Max_{v}_{tc}", f"{v}=__Max_{v}_{v}"]))
    # Can't merge views with different schemas — need to add missing cols as null
    # For this test, just measure the agg_by step (the key bottleneck)
    _ = bs.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={bs.size}  (agg_by only)")
PYEOF
run_experiment "8) Fewer sorted_first/last output cols    " notes/_bench_tmp.py


# Cleanup
rm -f notes/_bench_tmp.py

echo ""
echo "All experiments run in isolated JVM processes."
