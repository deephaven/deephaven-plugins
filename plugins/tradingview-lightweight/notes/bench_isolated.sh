#!/bin/bash
# Run each downsample approach in its own dh exec process to avoid JVM warmup bias.
# Usage: bash notes/bench_isolated.sh

cd "$(dirname "$0")/.."

SETUP='
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
NUM_BINS = 1000
FG_BINS = 2000

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
bw_bg = max(duration // NUM_BINS, 1)
bw_fg = max(duration // FG_BINS, 1)

fn = rmin + duration // 4
tn = rmin + duration // 2

import datetime
def nanos_to_iso(nanos):
    secs, rem = divmod(nanos, 1_000_000_000)
    dt = datetime.datetime.fromtimestamp(secs, tz=datetime.timezone.utc)
    iso = dt.strftime("%Y-%m-%dT%H:%M:%S")
    if rem > 0:
        return f"{iso}.{rem:09d}Z"
    return f"{iso}Z"

from_iso = nanos_to_iso(fn)
to_iso = nanos_to_iso(tn)
'

run_bench() {
    local label="$1"
    local code="$2"
    local repeats=5

    echo -n "$label: "
    dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'
}

# --- A) OLD: epochNanos bin + agg_by + select_distinct + sort ---
cat > notes/bench_one.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
NUM_BINS = 1000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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
    merged = dh_merge(views).select_distinct(out_cols).sort(tc)
    _ = merged.size
    times.append(time.perf_counter() - t0)

print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "A) OLD (epochNanos + distinct):        "
dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# --- B) NEW: epochNanos bin + agg_by + NO distinct + sort ---
cat > notes/bench_one.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
NUM_BINS = 1000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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
echo -n "B) NEW (epochNanos, no distinct):      "
dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# --- C) lowerBin + agg_by + no distinct + sort ---
cat > notes/bench_one.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
NUM_BINS = 1000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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

times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.view([f"__Bin = lowerBin({tc}, {bw})"] + out_cols)
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
echo -n "C) lowerBin (no distinct):             "
dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# --- D) Split first_by/last_by ---
cat > notes/bench_one.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
NUM_BINS = 1000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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

times = []
for i in range(5):
    t0 = time.perf_counter()
    av = big.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
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
    times.append(time.perf_counter() - t0)

print(f"RESULT: avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={merged.size}")
PYEOF
echo -n "D) Split first_by/last_by:             "
dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# --- E) Foreground: epochNanos filter ---
cat > notes/bench_one.py << 'PYEOF'
import time
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
FG_BINS = 2000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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
fn = rmin + duration // 4
tn = rmin + duration // 2
bw = max((tn - fn) // FG_BINS, 1)

times = []
for i in range(5):
    t0 = time.perf_counter()
    source = big.where(f"epochNanos({tc}) >= {fn} && epochNanos({tc}) <= {tn}")
    av = source.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
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
echo -n "E) FG epochNanos filter+bin (2k bins):  "
dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# --- F) Foreground: Instant literal filter ---
cat > notes/bench_one.py << 'PYEOF'
import time, datetime
from deephaven import empty_table, agg, merge as dh_merge

ROW_COUNT = 10_000_000
FG_BINS = 2000

big = empty_table(ROW_COUNT).update([
    "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
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
fn = rmin + duration // 4
tn = rmin + duration // 2
bw = max((tn - fn) // FG_BINS, 1)

def nanos_to_iso(nanos):
    secs, rem = divmod(nanos, 1_000_000_000)
    dt = datetime.datetime.fromtimestamp(secs, tz=datetime.timezone.utc)
    iso = dt.strftime("%Y-%m-%dT%H:%M:%S")
    if rem > 0:
        return f"{iso}.{rem:09d}Z"
    return f"{iso}Z"

from_iso = nanos_to_iso(fn)
to_iso = nanos_to_iso(tn)

times = []
for i in range(5):
    t0 = time.perf_counter()
    source = big.where(f"{tc} >= '{from_iso}' && {tc} <= '{to_iso}'")
    av = source.view([f"__Bin = (long)(epochNanos({tc}) / {bw}L)"] + out_cols)
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
echo -n "F) FG Instant filter+bin (2k bins):     "
dh exec notes/bench_one.py 2>&1 | grep "^RESULT:" | sed 's/^RESULT: //'

# Cleanup
rm -f notes/bench_one.py

echo ""
echo "All benchmarks run in isolated JVM processes."
