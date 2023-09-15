from typing import List, Any
import io
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from .._internal import get_component_name


class TextField:
    def __init__(self, value, /, on_change):
        self._value = value
        self._on_change = on_change

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, new_value):
        self._value = new_value
        self._on_change(new_value)


class TextFieldMessageStream(MessageStream):
    def __init__(self, field: TextField, connection: MessageStream):
        self._text_field = field
        self._connection = connection

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        decoded_payload = io.BytesIO(payload).read().decode()
        self._text_field.value = decoded_payload


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


def text_field(value, /, on_change):
    """
    Create a TextField component.

    Args:
        value: The initial value of the text field.
        on_change: The function to call when the text field changes.
    """
    return TextField(value, on_change=on_change)
