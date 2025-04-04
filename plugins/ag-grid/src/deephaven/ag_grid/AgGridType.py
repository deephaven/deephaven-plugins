from typing import Any

from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from .AgGrid import AgGrid
from .AgGridMessageStream import AgGridMessageStream


class AgGridType(BidirectionalObjectType):
    """
    Defines the Element type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "deephaven.ag_grid.AgGrid"

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, AgGrid)

    def create_client_connection(
        self, obj: object, connection: MessageStream
    ) -> MessageStream:
        if not isinstance(obj, AgGrid):
            raise TypeError(f"Expected AgGrid, got {type(obj)}")
        client_connection = AgGridMessageStream(obj, connection)
        client_connection.start()
        return client_connection
