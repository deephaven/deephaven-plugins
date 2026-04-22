import traceback
import json
from deephaven.plot.tradingview_lightweight.communication.listener import (
    TvlChartListener,
)

try:
    # Mimic what __init__.py does
    chart = tvl_big_line  # the chart object created in app.d fixture
    # Create a mock client connection
    class MockStream:
        def on_data(self, payload: bytes, refs: list) -> None:
            pass

    mock_conn = MockStream()
    listener = TvlChartListener(chart, mock_conn)
    payload, refs = listener.process_message(
        json.dumps({"type": "RETRIEVE"}).encode(), []
    )
    msg = json.loads(payload.decode("utf-8"))
    with open("/tmp/ds_result3.txt", "w") as f:
        f.write(f'type={msg["type"]}\n')
        f.write(f"num_refs={len(refs)}\n")
        if "figure" in msg:
            fig = msg["figure"]
            f.write(f'series_count={len(fig.get("series", []))}\n')
            f.write(f'downsampleInfo={json.dumps(fig.get("downsampleInfo", "NONE"))}\n')
except Exception:
    with open("/tmp/ds_result3.txt", "w") as f:
        f.write(traceback.format_exc())
