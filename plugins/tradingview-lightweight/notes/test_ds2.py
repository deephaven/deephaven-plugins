import traceback
from deephaven.plot.tradingview_lightweight.downsample import DownsampleState
from deephaven.liveness_scope import LivenessScope

try:
    # Mimic what happens in listener._handle_retrieve:
    # The plugin framework has a liveness scope active
    outer_scope = LivenessScope()
    with outer_scope.open():
        ds = DownsampleState(big_table, "Timestamp", ["Price"])
        result = ds.compute_initial()
        with open("/tmp/ds_result2.txt", "w") as f:
            f.write(f"OK: {result.size} rows\n")
except Exception:
    with open("/tmp/ds_result2.txt", "w") as f:
        f.write(traceback.format_exc())
