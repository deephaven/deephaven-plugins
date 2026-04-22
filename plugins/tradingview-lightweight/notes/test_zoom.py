"""Test the ZOOM message flow directly."""
import traceback
import json
from deephaven.plot.tradingview_lightweight.communication.listener import (
    TvlChartListener,
)

try:
    chart = tvl_big

    class MockStream:
        def on_data(self, payload: bytes, refs: list) -> None:
            pass

    mock_conn = MockStream()
    listener = TvlChartListener(chart, mock_conn)

    # First, do a RETRIEVE to set up downsample states
    payload, refs = listener.process_message(
        json.dumps({"type": "RETRIEVE"}).encode(), []
    )
    retrieve_msg = json.loads(payload.decode("utf-8"))
    ds_info = retrieve_msg.get("figure", {}).get("downsampleInfo", {})

    result_lines = []
    result_lines.append(f"RETRIEVE: type={retrieve_msg['type']}, refs={len(refs)}")
    result_lines.append(f"downsampleInfo: {json.dumps(ds_info)}")
    result_lines.append(
        f"downsample_states: {list(listener._downsample_states.keys())}"
    )

    # Now send a ZOOM message
    full_range = ds_info.get("0", {}).get("fullRange")
    if full_range:
        # Zoom to middle 10% of the range
        rmin, rmax = full_range
        duration = rmax - rmin
        zoom_from = rmin + int(duration * 0.45)
        zoom_to = rmin + int(duration * 0.55)
        zoom_msg = json.dumps(
            {"type": "ZOOM", "from": str(zoom_from), "to": str(zoom_to), "width": 1200}
        )
        result_lines.append(f"\nZOOM: from={zoom_from}, to={zoom_to}")

        zoom_payload, zoom_refs = listener.process_message(zoom_msg.encode(), [])
        if zoom_payload:
            zoom_response = json.loads(zoom_payload.decode("utf-8"))
            result_lines.append(f"ZOOM response type: {zoom_response.get('type')}")
            for tid, tinfo in zoom_response.get("tables", {}).items():
                result_lines.append(
                    f"  table {tid}: size={tinfo['tableSize']}, viewport={tinfo['viewport']}"
                )
            result_lines.append(f"ZOOM refs: {len(zoom_refs)}")
        else:
            result_lines.append("ZOOM returned empty payload!")
    else:
        result_lines.append("No fullRange in downsampleInfo!")

    with open("/tmp/ds_zoom_result.txt", "w") as f:
        f.write("\n".join(result_lines) + "\n")

except Exception:
    with open("/tmp/ds_zoom_result.txt", "w") as f:
        f.write(traceback.format_exc())
