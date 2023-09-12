from __future__ import annotations

from typing import Any

from deephaven.plugin.object_type import MessageStream

from ..deephaven_figure import DeephavenFigure
from .DeephavenFigureListener import DeephavenFigureListener
import jpy


class DeephavenFigureConnection(MessageStream):
    """
    Connection for DeephavenFigure
    """

    def __init__(self, figure: DeephavenFigure, client_connection: MessageStream):
        super().__init__()
        JLivenessScope = jpy.get_type("io.deephaven.engine.liveness.LivenessScope")
        self._liveness_scope = JLivenessScope()

        self._listener = DeephavenFigureListener(
            figure, client_connection, self._liveness_scope
        )
        self._client_connection = client_connection

    def on_data(self, payload: bytes, references: list[Any]) -> tuple[bytes, list[Any]]:
        """
        Args:
            payload: Payload to execute
            references: References to objects on the server
        """
        return self._listener.process_message(payload, references)

    def on_close(self) -> None:
        """
        Close the connection
        """
        self._liveness_scope.release()
