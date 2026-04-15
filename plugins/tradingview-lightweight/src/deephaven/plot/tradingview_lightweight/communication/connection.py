"""Connection for TvlChart bidirectional communication."""

from __future__ import annotations

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
        """Process incoming data from the client."""
        if self._listener is None:
            raise RuntimeError("Connection is closed")
        return self._listener.process_message(payload, references)

    def on_close(self) -> None:
        """Close the connection and release resources."""
        self._listener = None
        self._client_connection = None
