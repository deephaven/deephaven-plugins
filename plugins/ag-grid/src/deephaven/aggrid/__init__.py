from __future__ import annotations

import json
from typing import Any

from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from .AgGrid import AgGrid
from .AgGridMessageStream import AgGridMessageStream

NAME = "deephaven.aggrid.AgGrid"


class DeephavenAgGridType(BidirectionalObjectType):
    """
    DeephavenAgGridType for plugin registration

    """

    @property
    def name(self) -> str:
        """
        Returns the name of the plugin

        Returns:
            The name of the plugin
        """
        return NAME

    def is_type(self, obj: Any) -> bool:
        """
        Check if an object is a DeephavenAgGrid

        Args:
          obj: The object to check

        Returns:
            True if the object is of the correct type, False otherwise
        """
        return isinstance(obj, AgGrid)

    def create_client_connection(
        self, obj: AgGrid, connection: MessageStream
    ) -> MessageStream:
        """
        Create a client connection for the DeephavenAgGrid.
        This sends an initial figure to the client.

        Args:
          obj: The object to create the connection for
          connection: The connection to use

        Returns:
            The client connection
        """
        client_connection = AgGridMessageStream(obj, connection)
        client_connection.start()
        return client_connection
