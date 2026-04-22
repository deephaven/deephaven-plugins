"""Connection for TvlChart bidirectional communication."""

from __future__ import annotations

import json
from typing import Any, Optional

from deephaven.plugin.object_type import MessageStream

from ..chart import TvlChart
from .listener import TvlChartListener


class TvlChartConnection(MessageStream):
    """Connection for TvlChart.

    Attributes:
        _listener: TvlChartListener: The listener for the chart
        _client_connection: MessageStream: The connection to the client
    """

    def __init__(self, chart: TvlChart, client_connection: MessageStream):
        super().__init__()
        self._listener: Optional[TvlChartListener] = TvlChartListener(
            chart, client_connection
        )
        self._client_connection: Optional[MessageStream] = client_connection

    def on_data(self, payload: bytes, references: list[Any]) -> tuple[bytes, list[Any]]:
        """Process incoming data from the client.

        For the initial RETRIEVE, the response is returned and pushed by
        create_client_connection in __init__.py.  For subsequent messages
        (ZOOM, RESET) sent via widget.sendMessage(), the framework does
        NOT automatically push the return value to the client.  We must
        explicitly call client_connection.on_data() to deliver the
        response as a Widget.EVENT_MESSAGE on the JS side.
        """
        if self._listener is None:
            raise RuntimeError("Connection is closed")

        response_payload, response_refs = self._listener.process_message(
            payload, references
        )

        # Push DOWNSAMPLE_READY responses to the client explicitly.
        # The initial NEW_FIGURE response is pushed by create_client_connection.
        if response_payload and self._client_connection is not None:
            try:
                # Check if this is a DOWNSAMPLE_READY (not NEW_FIGURE)
                raw = (
                    response_payload.decode("utf-8")
                    if isinstance(response_payload, bytes)
                    else bytes(response_payload).decode("utf-8")
                )
                msg = json.loads(raw)
                if msg.get("type") == "DOWNSAMPLE_READY":
                    self._client_connection.on_data(response_payload, response_refs)
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass

        return response_payload, response_refs

    def on_close(self) -> None:
        """Close the connection and release resources."""
        if self._listener is not None:
            self._listener.close()
        self._listener = None
        self._client_connection = None
