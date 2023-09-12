# The UI widget plugin

from deephaven.plugin import Registration, Callback
from deephaven.plugin.object_type import (
    Exporter,
    BidirectionalObjectType,
    MessageStream,
)
from typing import List, Any
import json
import io
from .render import RenderContext
from .node import ComponentNode, component
from .components import *

__version__ = "0.0.1.dev0"

# TODO: Everything needs tests, docstrings, etc


def _get_component_name(comp):
    """
    Get the name of the component
    """
    return comp.__module__ + "." + comp.__qualname__


class ComponentNodeMessageStream(MessageStream):
    def __init__(self, node: ComponentNode, connection: MessageStream):
        self._node = node
        self._connection = connection

    def start(self) -> None:
        context = RenderContext()

        def handle_change():
            result = self._node.render(context)
            self.send_result(result)

        context.set_on_change(handle_change)
        result = self._node.render(context)
        self.send_result(result)

    def send_result(self, result) -> None:
        # Make it an array if it's not already.
        # TODO: Should we do this? Probably should just return one single component
        if not isinstance(result, list):
            result = [result]

        # Automatically promote any strings to Text components automagically
        # TODO: Doesn't work? Maybe shouldn't do it anyway?
        # for item, i in enumerate(result):
        #     if isinstance(item, str):
        #         result[i] = Text(item)

        self._connection.on_data("updated".encode(), result)

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        print(f"Data received: {payload}")


class ComponentNodeType(BidirectionalObjectType):
    @property
    def name(self) -> str:
        return _get_component_name(ComponentNode)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, ComponentNode)

    def create_client_connection(self, obj: ComponentNode, connection: MessageStream):
        client_connection = ComponentNodeMessageStream(obj, connection)
        client_connection.start()
        return client_connection


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
        return _get_component_name(TextField)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, TextField)

    def create_client_connection(self, obj: TextField, connection: MessageStream):
        client_connection = TextFieldMessageStream(obj, connection)
        connection.on_data(obj.value.encode(), [])
        return client_connection


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
        return _get_component_name(Text)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, Text)

    def create_client_connection(self, obj: Text, connection: MessageStream):
        client_connection = TextMessageStream(obj, connection)
        connection.on_data(obj.value.encode(), [])
        return client_connection


class UIRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        callback.register(ComponentNodeType)
        callback.register(TextFieldType)
        callback.register(TextType)
