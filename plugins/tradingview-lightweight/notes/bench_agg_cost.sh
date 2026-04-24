#!/bin/bash
# Isolated measurement of each cost component.
cd "$(dirname "$0")/.."

SETUP='ROW_COUNT = 10_000_000; NUM_BINS = 1000
big = empty_table(ROW_COUNT).update(["Timestamp = '"'"'2020-01-01T00:00:00Z'"'"' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))","Price = 100 + Math.sin(ii * 0.0001) * 50","Volume = 1000 + Math.cos(ii * 0.0002) * 500","Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3"])
tc = "Timestamp"; vc = ["Price", "Volume", "Spread"]; oc = [tc] + vc
ht = big.head(1).view(["__T = epochNanos(Timestamp)"]); tt = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rn = int(ht.j_table.getColumnSource("__T").get(ht.j_table.getRowSet().firstRowKey()))
rx = int(tt.j_table.getColumnSource("__T").get(tt.j_table.getRowSet().firstRowKey()))
bw = max((rx - rn) // NUM_BINS, 1)'

make_bench() {
    local label="$1"
    local body="$2"
    cat > notes/_bench_tmp.py << PYEOF
import time
from deephaven import empty_table, agg, merge as dh_merge
$SETUP
times = []
for i in range(5):
    t0 = time.perf_counter()
$body
    times.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s")
PYEOF
    echo -n "$label"
    dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'
}

# Just bin materialization
make_bench "1) update(__Bin) only:                    " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"]); _ = av.size'

# 2 aggs: first+last
make_bench "2) update + agg(first,last):              " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    bs = av.agg_by([agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])], by=["__Bin"]); _ = bs.size'

# 4 aggs: first+last+min_+max_ (scalar)
make_bench "3) update + agg(first,last,min_,max_):    " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc]), agg.min_(cols=[f"__Mn_{v}={v}" for v in vc]), agg.max_(cols=[f"__Mx_{v}={v}" for v in vc])]
    bs = av.agg_by(al, by=["__Bin"]); _ = bs.size'

# 8 aggs: current (first+last+sorted_first×3+sorted_last×3)
make_bench "4) update + agg(first,last,sorted×6):     " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.first(cols=[f"__F_{c}={c}" for c in oc]), agg.last(cols=[f"__L_{c}={c}" for c in oc])]
    for v in vc:
        al.append(agg.sorted_first(v, cols=[f"__Mn_{v}_{c}={c}" for c in oc]))
        al.append(agg.sorted_last(v, cols=[f"__Mx_{v}_{c}={c}" for c in oc]))
    bs = av.agg_by(al, by=["__Bin"]); _ = bs.size'

# 8 aggs + full pipeline (current)
make_bench "5) Full pipeline (current):               " '
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
    merged = dh_merge(vw).sort(tc); _ = merged.size'

# first_by + last_by (dedicated ops, no agg_by)
make_bench "6) first_by + last_by (no agg_by):        " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    f = av.first_by("__Bin").view(oc)
    l = av.last_by("__Bin").view(oc)
    merged = dh_merge([f, l]).sort(tc); _ = merged.size'

# 2 aggs: sorted_first + sorted_last for 1 value col
make_bench "7) sorted_first+last 1 col (2 sorted):    " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    al = [agg.sorted_first("Price", cols=[f"__Mn_{c}={c}" for c in oc]), agg.sorted_last("Price", cols=[f"__Mx_{c}={c}" for c in oc])]
    bs = av.agg_by(al, by=["__Bin"]); _ = bs.size'

# min_by + max_by (dedicated) — just scalars, no row capture
make_bench "8) min_by + max_by (dedicated):            " '
    av = big.update([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"])
    mn = av.view(["__Bin"] + vc).min_by("__Bin")
    mx = av.view(["__Bin"] + vc).max_by("__Bin"); _ = mn.size'

rm -f notes/_bench_tmp.py
echo ""
echo "All isolated JVM. 10M rows, 3 value cols, 1000 bins."
echo "Each step builds incrementally to show marginal costs."
