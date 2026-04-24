#!/bin/bash
# Test: does removing isNull checks speed up the LTTB stage?
cd "$(dirname "$0")/.."

# D-baseline: with isNull checks
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
NUM_BINS = 1000
pre = empty_table(32000).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 32000))",
    "Price = 100 + Math.sin(ii * 0.001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = pre.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = pre.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
lttb_bw = max((rmax - rmin) // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    lttb_results = []
    for v in value_cols:
        bucketed = pre.update_view([
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
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}")
PYEOF
echo -n "D1) LTTB with isNull checks:              "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# D2: skip isNull — just compute area directly (NULLs propagate)
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
NUM_BINS = 1000
pre = empty_table(32000).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 32000))",
    "Price = 100 + Math.sin(ii * 0.001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = pre.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = pre.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
lttb_bw = max((rmax - rmin) // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    lttb_results = []
    for v in value_cols:
        bucketed = pre.update_view([
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
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}")
PYEOF
echo -n "D2) LTTB no isNull checks:                "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# D3: skip natural_joins entirely — use single-column LTTB with just avg_by + sorted_last
# Approximate: area = abs(Y - bucket_avg_Y) — max deviation from mean
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
NUM_BINS = 1000
pre = empty_table(32000).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 32000))",
    "Price = 100 + Math.sin(ii * 0.001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = pre.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = pre.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
lttb_bw = max((rmax - rmin) // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    lttb_results = []
    for v in value_cols:
        bucketed = pre.update_view([
            f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)",
            f"__Y = (double){v}",
        ])
        # Simple: max deviation from bucket average
        avgs = bucketed.view(["__LB", "__Y"]).avg_by("__LB").rename_columns(["__AvgY = __Y"])
        with_dev = bucketed.natural_join(avgs, on="__LB", joins="__AvgY").update_view([
            "__Dev = Math.abs(__Y - __AvgY)",
        ])
        selected = with_dev.agg_by(
            [agg.sorted_last("__Dev", cols=[f"{c}={c}" for c in out_cols])],
            by="__LB",
        ).view(out_cols)
        lttb_results.append(selected)
    result = dh_merge(lttb_results).sort(tc)
    _ = result.size
    times_list.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}")
PYEOF
echo -n "D3) Max-deviation (1 join, no triangle):  "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


# D4: single agg_by for all value cols at once (no per-column loop)
cat > notes/_bench_tmp.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge
NUM_BINS = 1000
pre = empty_table(32000).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 32000))",
    "Price = 100 + Math.sin(ii * 0.001) * 50",
    "Volume = 1000 + Math.cos(ii * 0.002) * 500",
    "Spread = 0.5 + Math.sin(ii * 0.003) * 0.3",
])
tc = "Timestamp"; value_cols = ["Price", "Volume", "Spread"]; out_cols = [tc] + value_cols
head_t = pre.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = pre.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey()))
rmax = int(tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey()))
lttb_bw = max((rmax - rmin) // NUM_BINS, 1)

times_list = []
for i in range(5):
    t0 = time.perf_counter()
    bucketed = pre.update_view([
        f"__LB = (long)(epochNanos({tc}) / {lttb_bw}L)",
    ])
    # Compute per-column avg in one pass
    avg_cols = [f"__Avg_{v} = {v}" for v in value_cols]
    avgs = bucketed.view(["__LB"] + [f"{v}" for v in value_cols]).avg_by("__LB").rename_columns(avg_cols)

    with_dev = bucketed.natural_join(avgs, on="__LB", joins=", ".join([f"__Avg_{v}" for v in value_cols]))

    # Compute max deviation per value col, select via sorted_last per col
    agg_list = []
    for v in value_cols:
        agg_list.append(agg.sorted_last(f"__Dev_{v}", cols=[f"__Sel_{v}_{c}={c}" for c in out_cols]))

    with_devs = with_dev.update_view([f"__Dev_{v} = Math.abs((double){v} - __Avg_{v})" for v in value_cols])
    summary = with_devs.agg_by(agg_list, by="__LB")

    # Unpivot per-column selections
    views = []
    for v in value_cols:
        views.append(summary.view([f"{c}=__Sel_{v}_{c}" for c in out_cols]))
    result = dh_merge(views).sort(tc)
    _ = result.size
    times_list.append(time.perf_counter() - t0)
print(f"RESULT: avg={sum(times_list)/len(times_list):.3f}s  best={min(times_list):.3f}s  rows={result.size}")
PYEOF
echo -n "D4) Single-pass max-dev all cols:         "
dh exec notes/_bench_tmp.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'


rm -f notes/_bench_tmp.py
echo ""
echo "All isolated JVM. D1-D4 all operate on 32K preselected rows."
