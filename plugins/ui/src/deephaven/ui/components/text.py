from typing import List, Any
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from .._internal import get_component_name


class Text:
    def __init__(self, value):
        self._value = value

    @property
    def value(self):
        return self._value


class TextMessageStream(MessageStream):
    def __init__(self, item: Text, connection: MessageStream):
        self._text = item
        self._connection = connection

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        pass


class TextType(BidirectionalObjectType):
    @property
    def name(self) -> str:
        return get_component_name(Text)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, Text)

    def create_client_connection(self, obj: Text, connection: MessageStream):
        client_connection = TextMessageStream(obj, connection)
        connection.on_data(obj.value.encode(), [])
        return client_connection


def text(value):
    """
    Create a Text component.

    Args:
        value: The value of the text.
    """
    return Text(value)
