from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..elements import Element
from .._internal import get_component_name
from .ElementMessageStream import ElementMessageStream


class ElementType(BidirectionalObjectType):
    """
    Defines the Element type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "deephaven.ui.Element"

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, Element)

    def create_client_connection(self, obj: Element, connection: MessageStream):
        client_connection = ElementMessageStream(obj, connection)
        client_connection.start()
        return client_connection
