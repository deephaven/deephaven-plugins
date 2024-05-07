from __future__ import annotations

import io
from typing import Any
from deephaven.plugin.object_type import MessageStream, BidirectionalObjectType

from .{{ cookiecutter.__object_file_name }} import {{ cookiecutter.__object_name }}

# Create a custom message stream to send messages to the client

class {{ cookiecutter.__message_stream_name }}(MessageStream):
    """
    A custom MessageStream

    Attributes:
        _client_connection: MessageStream: The connection to the client
    """

    def __init__(self, obj: Any, client_connection: MessageStream):
        super().__init__()
        self._client_connection = client_connection

        # Start the message stream. All we do is send a blank message to start. Client will respond with the initial state.
        self._client_connection.on_data(b"", [])

        obj._set_connection(self)

    def send_message(self, message: str) -> None:
        """
        Send a message to the client

        Args:
            message: The message to send
        """
        self._client_connection.on_data(message.encode(), [])

    def on_data(self, payload: bytes, references: list[Any]) -> None:
        """
        Handle a payload from the client.

        Args:
            payload: Payload to execute
            references: References to objects on the server

        Returns:
            The payload to send to the client and the references to send to the client
        """
        # This is where you would process the payload.
        # This is just an acknowledgement that the payload was received,
        # so print.
        payload = io.BytesIO(payload).read().decode()
        print(f"Received payload: {payload}")

    def on_close(self) -> None:
        """
        Close the connection
        """
        pass

# The object type that will be registered with the plugin system.
# The object is bidirectional, meaning it can send messages to and from the client.
# A MessageStream is created for each object that is created. This needs to be saved and tied to the object.
# The value returned by name() should match supportedTypes in {{ cookiecutter.__js_plugin_obj }}.ts
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
