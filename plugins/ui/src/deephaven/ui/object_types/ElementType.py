from typing import Any

from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..elements import Element
from .ElementMessageStream import ElementMessageStream


class ElementType(BidirectionalObjectType):
    """
    Defines the Element type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "deephaven.ui.Element"

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, Element)

    def create_client_connection(
        self, obj: object, connection: MessageStream
    ) -> MessageStream:
        if not isinstance(obj, Element):
            raise TypeError(f"Expected Element, got {type(obj)}")
        client_connection = ElementMessageStream(obj, connection)
        client_connection.start()
        return client_connection
