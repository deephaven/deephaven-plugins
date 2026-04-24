# ruff: noqa
"""Final validation: test actual DownsampleState class performance.

Run with: dh exec notes/bench_final.py
"""
import time
import sys

sys.path.insert(0, "src")

from deephaven import empty_table
from deephaven.plot.tradingview_lightweight.downsample import DownsampleState

ROW_COUNT = 10_000_000
big = empty_table(ROW_COUNT).update(
    [
        "Timestamp = '2020-01-01T00:00:00Z' + (long)(ii * (10L * 365 * 24 * 3600 * 1_000_000_000L / 10_000_000))",
        "Price = 100 + Math.sin(ii * 0.0001) * 50",
        "Volume = 1000 + Math.cos(ii * 0.0002) * 500",
        "Spread = 0.5 + Math.sin(ii * 0.0003) * 0.3",
    ]
)
print(f"Table: {big.size:,} rows, 3 value cols")

# Background (1000 bins, full range)
times = []
for i in range(3):
    ds = DownsampleState(big, "Timestamp", ["Price", "Volume", "Spread"])
    t0 = time.perf_counter()
    r = ds.compute_initial()
    _ = r.size
    elapsed = time.perf_counter() - t0
    times.append(elapsed)
print(
    f"BG (1000 bins):  avg={sum(times)/len(times):.3f}s  best={min(times):.3f}s  rows={r.size}"
)

# Time range for foreground
head_t = big.head(1).view(["__T = epochNanos(Timestamp)"])
tail_t = big.tail(1).view(["__T = epochNanos(Timestamp)"])
rmin = int(
    head_t.j_table.getColumnSource("__T").get(head_t.j_table.getRowSet().firstRowKey())
)
rmax = int(
    tail_t.j_table.getColumnSource("__T").get(tail_t.j_table.getRowSet().firstRowKey())
)
dur = rmax - rmin
fn = rmin + dur // 4
tn = rmin + dur // 2

# Foreground with adaptive bins (1920px -> 2000 bins)
times2 = []
for i in range(3):
    ds2 = DownsampleState(big, "Timestamp", ["Price", "Volume", "Spread"])
    ds2.compute_initial()
    t0 = time.perf_counter()
    r2 = ds2.compute_hybrid(fn, tn, width=1920)
    _ = r2.size
    elapsed = time.perf_counter() - t0
    times2.append(elapsed)
print(
    f"FG (2000 bins, ~2.5M rows):  avg={sum(times2)/len(times2):.3f}s  best={min(times2):.3f}s  rows={r2.size}"
)

# Check Instant detection worked
ds3 = DownsampleState(big, "Timestamp", ["Price"])
print(f"Instant detected: {ds3._time_col_is_instant}")
print(f"Filter example: {ds3._time_filter('>=', fn)}")
