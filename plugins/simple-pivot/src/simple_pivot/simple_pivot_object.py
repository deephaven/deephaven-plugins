from __future__ import annotations
from typing import Protocol


class MessageStreamInterface(Protocol):
    def send_message(self, message: str) -> None:
        ...


class SimplePivotObject:
    """
    This is a simple object that demonstrates how to send messages to the client.
    When the object is created, it will be passed a connection to the client.
    This connection can be used to send messages back to the client.

    Attributes:
        _connection: MessageStreamInterface: The connection to the client
    """

    def __init__(self):
        self._connection: MessageStreamInterface | None = None

    def send_message(self, message: str) -> None:
        """
        Send a message to the client

        Args:
            message: The message to send
        """
        if self._connection:
            self._connection.send_message(message)

    def set_connection(self, connection: MessageStreamInterface) -> None:
        """
        Set the connection to the client.
        This is called on the object when it is created.

        Args:
            connection: The connection to the client
        """
        self._connection = connection
