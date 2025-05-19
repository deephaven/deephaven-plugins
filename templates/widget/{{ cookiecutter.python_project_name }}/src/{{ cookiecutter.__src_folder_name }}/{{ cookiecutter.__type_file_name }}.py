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
        # Additional messages can be sent to the client by calling on_data on the client connection at any time after this.
        # These additional messages are processed in {{ cookiecutter.__js_plugin_view_obj }}.tsx
        self._client_connection.on_data(b"", [])

        obj.set_connection(self)

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
        decoded_payload = io.BytesIO(payload).read().decode()
        print(f"Received payload: {decoded_payload}")

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
        """
        Get the name of the object type

        Returns:
            str: The name of the object
        """
        # this name should match the supportedTypes in {{ cookiecutter.__js_plugin_obj }}.ts
        return "{{ cookiecutter.__registered_object_name }}"

    def is_type(self, obj: Any) -> bool:
        """
        Check if the object is an instance of the type that this plugin supports

        Args:
            obj: The object to check

        Returns:
            bool: True if the object is an instance of the type that this plugin supports
        """
        # check if the object is an instance of the type that this plugin supports
        # replace this with other objects or add additional checks as needed
        return isinstance(obj, {{ cookiecutter.__object_name }})

    def create_client_connection(
        self, obj: object, connection: MessageStream
    ) -> MessageStream:
        """
        Create a client connection for the object

        Args:
            obj: The object to create the connection for
            connection: The connection to the client

        Returns:
            MessageStream: The connection to the client
        """
        # Create the message stream for the object that can be used to send and receive messages
        # Note that each object will have its own message stream
        message_stream = {{ cookiecutter.__message_stream_name }}(obj, connection)
        return message_stream
