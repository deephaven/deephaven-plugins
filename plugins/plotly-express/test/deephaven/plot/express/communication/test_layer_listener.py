from __future__ import annotations

import json
import time
import threading
import unittest

from deephaven import time_table
from deephaven.plugin.object_type import MessageStream

import src.deephaven.plot.express as dx
from src.deephaven.plot.express import DeephavenFigureType


class TrackingClient(MessageStream):
    """A mock client that tracks messages received."""

    def __init__(self):
        super().__init__()
        self.lock = threading.Lock()
        self.messages: list[dict] = []

    def on_data(self, payload: bytes, references: list):
        with self.lock:
            data = json.loads(payload.decode())
            self.messages.append({"data": data, "references": references})
        return b"", []

    def on_close(self):
        pass


class LayerListenerTestCase(unittest.TestCase):
    """Tests for the DeephavenFigureListener race condition fix.

    When a layer contains a partitioned figure (e.g. dx.line with y as a list),
    the partition may already exist by the time the client connects. The listener
    must replay the current state so the figure is not stuck as a placeholder.
    """

    def test_layer_partitioned_figure_not_stuck_as_placeholder(self):
        """After connection, a layer with a partitioned child should produce a
        figure with proper scattergl traces and data mappings, not a default
        placeholder scatter trace."""
        tt = time_table("PT0.01S").update("Y = Math.sin(ii)")

        # Wait for at least one tick so the partition exists before connection
        time.sleep(0.5)

        fig = dx.layer(
            dx.line(tt, x="Timestamp", y=["Y"]),
            dx.scatter(tt, x="Timestamp", y="Y"),
        )

        obj_type = DeephavenFigureType()
        client = TrackingClient()
        obj_type.create_client_connection(fig, client)

        # Allow listener updates to arrive
        time.sleep(1.0)

        with client.lock:
            # At least the RETRIEVE message
            self.assertGreaterEqual(len(client.messages), 1)

            # Use the latest message as the final state
            last = client.messages[-1]["data"]
            figure = last["figure"]
            traces = [t["type"] for t in figure["plotly"]["data"]]
            mappings = figure["deephaven"]["mappings"]

            # Both traces should be scattergl (the proper rendered type),
            # not plain 'scatter' which would indicate a default_figure placeholder
            self.assertTrue(
                all(t == "scattergl" for t in traces),
                f"Expected all scattergl traces, got {traces}",
            )

            # Both child figures should have data mappings with table references
            self.assertGreaterEqual(
                len(mappings),
                2,
                f"Expected at least 2 mappings, got {len(mappings)}",
            )


if __name__ == "__main__":
    unittest.main()
