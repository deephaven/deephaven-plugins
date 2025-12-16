from __future__ import annotations

from typing import Any
from deephaven.plugin.object_type import BidirectionalObjectType

from .message_stream import MessageStream
from .plugin_object import PluginObject


# The object type that will be registered with the plugin system.
# The object is bidirectional, meaning it can send messages to and from the client.
# A MessageStream is created for each object that is created. This needs to be saved and tied to the object.
# The value returned by name() should match supportedTypes in PythonRemoteFileSourcePlugin.ts
class PluginType(BidirectionalObjectType):
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
        # this name should match the supportedTypes in PythonRemoteFileSourcePlugin.ts
        return "DeephavenPythonRemoteFileSourcePlugin"

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
        return isinstance(obj, PluginObject)

    def create_client_connection(
        self, obj: PluginObject, connection: MessageStream
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
        message_stream = MessageStream(obj, connection)
        return message_stream
