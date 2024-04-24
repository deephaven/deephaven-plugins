from __future__ import annotations

from typing import Any
from deephaven.plugin.object_type import MessageStream, BidirectionalObjectType

from .{{cookiecutter.project_slug}}_object import {{cookiecutter.py_pascal_case}}Object

class {{cookiecutter.py_pascal_case}}MessageStream(MessageStream):
    """
    Connection for DeephavenFigure

    Attributes:
        _listener: DeephavenFigureListener: The listener for the figure
        _client_connection: MessageStream: The connection to the client
    """

    def __init__(self, obj, client_connection: MessageStream):
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


class {{cookiecutter.py_pascal_case}}Type(BidirectionalObjectType):
    """
    Defines the Element type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "{{ cookiecutter.object_name }}"

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, {{cookiecutter.py_pascal_case}}Object)

    def create_client_connection(
        self, obj: object, connection: MessageStream
    ) -> MessageStream:
        message_stream = {{cookiecutter.py_pascal_case}}MessageStream(obj, connection)
        #message_stream.on_data(payload, references)
        return message_stream
