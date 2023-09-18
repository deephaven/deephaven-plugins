import json
from typing import List, Any
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..elements import Element
from ..renderer import Document, Renderer, RenderedNode
from .._internal import RenderContext


class ElementMessageStream(MessageStream):
    def __init__(self, element: Element, connection: MessageStream):
        """
        Create a new ElementMessageStream. Renders the element in a render context, and sends the rendered result to the
        client. Automatically re-renders the element when the element changes and sends updates to the client as well.

        Args:
            element: The element to render
            connection: The connection to send the rendered element to
        """
        self._element = element
        self._connection = connection

    def start(self) -> None:
        context = RenderContext()
        renderer = Renderer(context)

        def handle_change():
            result = renderer.render(self._element)
            self._send_result(result)

        context.set_on_change(handle_change)
        result = renderer.render(self._element)
        self._send_result(result)

    def _send_result(self, result: RenderedNode) -> None:
        document = Document(result)
        payload = json.dumps(document.root, separators=(",", ":")).encode()
        self._connection.on_data(payload, document.exported_objects)

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        print(f"Data received: {payload}")
