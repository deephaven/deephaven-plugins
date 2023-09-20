from typing import List, Any
import io
from deephaven.plugin.object_type import MessageStream
from ..elements import TextField


class TextFieldMessageStream(MessageStream):
    def __init__(self, field: TextField, connection: MessageStream):
        self._text_field = field
        self._connection = connection

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        decoded_payload = io.BytesIO(payload).read().decode()
        self._text_field.value = decoded_payload
