#!/bin/bash
# Creative downsample approaches — measure agg_by cost by aggregation type.
# Each in isolated JVM.
cd "$(dirname "$0")/.."

PREAMBLE='
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update([
    "Timestamp = '"'"'2020-01-01T00:00:00Z'"'"' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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
'

# ============================================================
# A) BASELINE: current approach (update + 8 aggs + unpivot + merge + sort)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    for v in vc:
        al.append(agg.sorted_first(v, cols=[f"__Mn_{v}_{c}={c}" for c in oc]))
        al.append(agg.sorted_last(v, cols=[f"__Mx_{v}_{c}={c}" for c in oc]))
    bs = av.agg_by(al, by=["__Bin"])
    vw = [bs.view([f"{c}=__F_{c}" for c in oc]), bs.view([f"{c}=__L_{c}" for c in oc])]
    for v in vc:
        vw.append(bs.view([f"{c}=__Mn_{v}_{c}" for c in oc]))
        vw.append(bs.view([f"{c}=__Mx_{v}_{c}" for c in oc]))
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "A) Current (8 aggs, full pipeline):       "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# B) first+last only (2 aggs) — floor measurement
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    bs = av.agg_by(al, by=["__Bin"])
    vw = [bs.view([f"{c}=__F_{c}" for c in oc]), bs.view([f"{c}=__L_{c}" for c in oc])]
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "B) first+last only (2 aggs):              "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# C) first+last + min_/max_ scalars (4 aggs, no row capture)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [
        agg.first(cols=[f"__F_{c}={c}" for c in oc]),
        agg.last(cols=[f"__L_{c}={c}" for c in oc]),
        agg.min_(cols=[f"__Min_{v}={v}" for v in vc]),
        agg.max_(cols=[f"__Max_{v}={v}" for v in vc]),
    ]
    bs = av.agg_by(al, by=["__Bin"])
    # Unpivot: first, last, then min/max use first_time as approximate ts
    vw = [bs.view([f"{c}=__F_{c}" for c in oc]), bs.view([f"{c}=__L_{c}" for c in oc])]
    for v in vc:
        vw.append(bs.view([f"{tc}=__F_{tc}"] + [f"{v}=__Min_{v}"] + [f"{v2}=__F_{v2}" for v2 in vc if v2 != v]))
        vw.append(bs.view([f"{tc}=__L_{tc}"] + [f"{v}=__Max_{v}"] + [f"{v2}=__L_{v2}" for v2 in vc if v2 != v]))
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "C) first+last + min_/max_ (4 aggs):       "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# D) agg_by only (no unpivot) — measure pure aggregation cost
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)

# D1: 2 aggs (first+last)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    bs = av.agg_by(al, by=["__Bin"]); _ = bs.size
    times.append(time.perf_counter() - t0)
print(f"RESULT D1 (2 aggs, agg_by only): avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s")

# D2: 4 aggs (first+last+min_+max_)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc]),
          agg.min_(cols=[f"__Min_{v}={v}" for v in vc]), agg.max_(cols=[f"__Max_{v}={v}" for v in vc])]
    bs = av.agg_by(al, by=["__Bin"]); _ = bs.size
    times.append(time.perf_counter() - t0)
print(f"RESULT D2 (4 aggs, agg_by only): avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s")

# D3: 8 aggs (current: first+last+sorted_first×3+sorted_last×3)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    for v in vc:
        al.append(agg.sorted_first(v, cols=[f"__Mn_{v}_{c}={c}" for c in oc]))
        al.append(agg.sorted_last(v, cols=[f"__Mx_{v}_{c}={c}" for c in oc]))
    bs = av.agg_by(al, by=["__Bin"]); _ = bs.size
    times.append(time.perf_counter() - t0)
print(f"RESULT D3 (8 aggs, agg_by only): avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s")

# D4: just update(__Bin) — measure bin materialization cost alone
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"]); _ = av.size
    times.append(time.perf_counter() - t0)
print(f"RESULT D4 (update only, no agg): avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s")
PYEOF
echo -n "D) Agg cost breakdown:                    "
echo ""
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT"


# ============================================================
# E) group_by + vector ops (min/max/first/last on arrays)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    grouped = av.view(["__Bin"] + oc).group_by("__Bin")
    # Use vector ops: first(), last() on grouped arrays
    wide = grouped.update([
        f"__FirstT = (Instant)first({tc})", f"__LastT = (Instant)last({tc})",
    ] + [f"__First_{v} = first({v})" for v in vc]
      + [f"__Last_{v} = last({v})" for v in vc]
      + [f"__Min_{v} = min({v})" for v in vc]
      + [f"__Max_{v} = max({v})" for v in vc])
    # Unpivot
    vw = [
        wide.view([f"{tc}=__FirstT"] + [f"{v}=__First_{v}" for v in vc]),
        wide.view([f"{tc}=__LastT"] + [f"{v}=__Last_{v}" for v in vc]),
    ]
    for v in vc:
        vw.append(wide.view([f"{tc}=__FirstT"] + [f"{v}=__Min_{v}"] + [f"{v2}=__First_{v2}" for v2 in vc if v2 != v]))
        vw.append(wide.view([f"{tc}=__LastT"] + [f"{v}=__Max_{v}"] + [f"{v2}=__Last_{v2}" for v2 in vc if v2 != v]))
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "E) group_by + vector ops:                 "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# F) view() instead of update() for __Bin (recheck)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + oc)
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    for v in vc:
        al.append(agg.sorted_first(v, cols=[f"__Mn_{v}_{c}={c}" for c in oc]))
        al.append(agg.sorted_last(v, cols=[f"__Mx_{v}_{c}={c}" for c in oc]))
    bs = av.agg_by(al, by=["__Bin"])
    vw = [bs.view([f"{c}=__F_{c}" for c in oc]), bs.view([f"{c}=__L_{c}" for c in oc])]
    for v in vc:
        vw.append(bs.view([f"{c}=__Mn_{v}_{c}" for c in oc]))
        vw.append(bs.view([f"{c}=__Mx_{v}_{c}" for c in oc]))
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "F) view() for __Bin (current uses update):"
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# G) where_in approach: cheap agg → find min/max rows via where_in
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    # Cheap agg: first, last, min_, max_ (no row capture for min/max)
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc]),
          agg.min_(cols=[f"__Min_{v}={v}" for v in vc]), agg.max_(cols=[f"__Max_{v}={v}" for v in vc])]
    summary = av.agg_by(al, by=["__Bin"])
    # where_in to find actual min/max rows
    vw = [summary.view([f"{c}=__F_{c}" for c in oc]), summary.view([f"{c}=__L_{c}" for c in oc])]
    for v in vc:
        mk = summary.view(["__Bin", f"__Min_{v}"])
        mn = av.where_in(mk, ["__Bin", f"{v} = __Min_{v}"]).first_by("__Bin").view(oc)
        xk = summary.view(["__Bin", f"__Max_{v}"])
        mx = av.where_in(xk, ["__Bin", f"{v} = __Max_{v}"]).first_by("__Bin").view(oc)
        vw.extend([mn, mx])
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "G) where_in min/max row lookup:           "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# ============================================================
# H) Sorted_first/last with fewer output cols (only time + sort col)
# ============================================================
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)
times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    # sorted_first/last only capture time + the sort column (2 cols instead of 4)
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    for v in vc:
        al.append(agg.sorted_first(v, cols=[f"__Mn_{v}_T={tc}", f"__Mn_{v}_V={v}"]))
        al.append(agg.sorted_last(v, cols=[f"__Mx_{v}_T={tc}", f"__Mx_{v}_V={v}"]))
    bs = av.agg_by(al, by=["__Bin"])
    vw = [bs.view([f"{c}=__F_{c}" for c in oc]), bs.view([f"{c}=__L_{c}" for c in oc])]
    for v in vc:
        # Min/max rows only have time + their own value; fill other cols from first row
        other = [f"{v2}=__F_{v2}" for v2 in vc if v2 != v]
        vw.append(bs.view([f"{tc}=__Mn_{v}_T", f"{v}=__Mn_{v}_V"] + other))
        vw.append(bs.view([f"{tc}=__Mx_{v}_T", f"{v}=__Mx_{v}_V"] + other))
    merged = dh_merge(vw).sort(tc); _ = merged.size
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "H) sorted_first/last fewer output cols:   "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


rm -f notes/_bench_tmp.py
echo ""
echo "All isolated JVM. 10M rows, 3 value cols, 1000 bins."
