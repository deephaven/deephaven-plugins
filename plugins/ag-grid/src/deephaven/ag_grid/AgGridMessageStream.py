from __future__ import annotations

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
        Start the message stream. All this does right now is send the table instance that AgGrid is wrapping to the client.
        If we added some options on AgGrid that we'd want to pass along to the client as well, we could serialize those as JSON options.
        """
        # Just send the table reference to the client
        self._connection.on_data("".encode(), [self._grid.table])

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
