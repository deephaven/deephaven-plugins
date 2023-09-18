from typing import List, Any
import io
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from .._internal import get_component_name
from ..elements import TextField
from .TextFieldMessageStream import TextFieldMessageStream


class TextFieldType(BidirectionalObjectType):
    @property
    def name(self) -> str:
        return get_component_name(TextField)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, TextField)

    def create_client_connection(self, obj: TextField, connection: MessageStream):
        client_connection = TextFieldMessageStream(obj, connection)
        connection.on_data(obj.value.encode(), [])
        return client_connection
