from __future__ import annotations

import json
import logging
from typing import Any
from deephaven.plugin.object_type import MessageStream
from .AgGrid import AgGrid

logger = logging.getLogger(__name__)


class AgGridMessageStream(MessageStream):
    _grid: AgGrid

    def __init__(self, grid: AgGrid, connection: MessageStream):
        """
        Create a new AgGridMessageStream. Just passes a table reference to the client for now.

        Args:
            grid: The AgGrid to render
            connection: The connection to send the rendered element to
        """
        self._grid = grid
        self._connection = connection

    def start(self) -> None:
        """
        Start the message stream. Sends the options for the grid as a JSON payload, and the table
        instance that AgGrid is wrapping as a reference.
        """
        options: dict[str, Any] = {}
        if self._grid.column_defs:
            options["columnDefs"] = self._grid.column_defs
        self._connection.on_data(json.dumps(options).encode(), [self._grid.table])

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: list[Any]) -> None:
        """
        Handle incoming data from the client. Right now we're not expecting any bidirectional communication for the AG Grid plugin.

        Args:
            payload: The payload from the client
            references: The references from the client
        """
        # Right now no payload is expected from the client
        pass
