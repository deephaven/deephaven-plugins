from __future__ import annotations

from typing import Any
from deephaven.plugin.object_type import MessageStream, BidirectionalObjectType

from .{{ cookiecutter.__object_file_name }} import {{ cookiecutter.__object_name }}

class {{ cookiecutter.__message_stream_name }}(MessageStream):
    """
    A custom MessageStream

    Attributes:
        _client_connection: MessageStream: The connection to the client
    """

    def __init__(self, obj: Any, client_connection: MessageStream):
        super().__init__()
        self._client_connection = client_connection

    def on_data(self, payload: bytes, references: list[Any]) -> tuple[bytes, list[Any]]:
        """
        Args:
            payload: Payload to execute
            references: References to objects on the server

        Returns:
            The payload to send to the client and the references to send to the client
        """
        return payload, references

    def on_close(self) -> None:
        """
        Close the connection
        """
        pass


class {{ cookiecutter.__type_name }}(BidirectionalObjectType):
    """
    Defines the Element type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "{{ cookiecutter.__registered_object_name }}"

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, {{ cookiecutter.__object_name }})

    def create_client_connection(
        self, obj: object, connection: MessageStream
    ) -> MessageStream:
        message_stream = {{ cookiecutter.__message_stream_name }}(obj, connection)
        return message_stream
