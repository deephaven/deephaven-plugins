from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..elements import FunctionElement
from .._internal import get_component_name
from .FunctionElementMessageStream import FunctionElementMessageStream


class FunctionElementType(BidirectionalObjectType):
    @property
    def name(self) -> str:
        return get_component_name(FunctionElement)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, FunctionElement)

    def create_client_connection(self, obj: FunctionElement, connection: MessageStream):
        client_connection = FunctionElementMessageStream(obj, connection)
        client_connection.start()
        return client_connection
