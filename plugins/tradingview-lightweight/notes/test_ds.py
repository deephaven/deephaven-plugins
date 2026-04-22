import traceback
from deephaven.plot.tradingview_lightweight.downsample import DownsampleState

try:
    ds = DownsampleState(big_table, "Timestamp", ["Price"])
    result = ds.compute_initial()
    with open("/tmp/ds_result.txt", "w") as f:
        f.write(f"OK: {result.size} rows\n")
except Exception:
    with open("/tmp/ds_result.txt", "w") as f:
        f.write(traceback.format_exc())
