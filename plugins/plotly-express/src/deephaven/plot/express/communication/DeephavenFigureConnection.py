from __future__ import annotations

from typing import Any

from deephaven.plugin.object_type import MessageStream

from ..deephaven_figure import DeephavenFigure
from .DeephavenFigureListener import DeephavenFigureListener


class DeephavenFigureConnection(MessageStream):
    """
    Connection for DeephavenFigure

    Attributes:
        _listener: DeephavenFigureListener: The listener for the figure
        _client_connection: MessageStream: The connection to the client
    """

    def __init__(self, figure: DeephavenFigure, client_connection: MessageStream):
        super().__init__()

        self._listener = DeephavenFigureListener(
            figure,
            client_connection,
        )
        self._client_connection = client_connection

    def on_data(self, payload: bytes, references: list[Any]) -> tuple[bytes, list[Any]]:
        """
        Args:
            payload: Payload to execute
            references: References to objects on the server

        Returns:
            The payload to send to the client and the references to send to the client
        """
        return self._listener.process_message(payload, references)

    def on_close(self) -> None:
        """
        Close the connection
        """
        pass
