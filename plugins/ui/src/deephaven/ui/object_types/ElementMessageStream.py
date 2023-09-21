import json
import logging
from typing import List, Any
from deephaven.plugin.object_type import MessageStream
from ..elements import Element
from ..renderer import NodeEncoder, Renderer, RenderedNode
from .._internal import RenderContext
from ..renderer.NodeEncoder import NodeEncoder

logger = logging.getLogger(__name__)


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
        self._callables = []

    def start(self) -> None:
        context = RenderContext()
        renderer = Renderer(context)

        def update():
            node = renderer.render(self._element)
            self._send_node(node)

        context.set_on_change(update)
        update()

    def _send_node(self, node: RenderedNode) -> None:
        encoder = NodeEncoder(separators=(",", ":"))
        payload = encoder.encode(node)

        logger.debug(f"Sending payload: {payload}")

        self._callables = encoder.callables
        self._connection.on_data(payload, encoder.objects)

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        logger.debug("Payload received: %s", payload)
        # TODO: Use JSON rpc to handle calling the right method
