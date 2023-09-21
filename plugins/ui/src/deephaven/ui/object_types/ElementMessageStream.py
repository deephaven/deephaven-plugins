import io
from jsonrpc import JSONRPCResponseManager, Dispatcher
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
        self._update_count = 0
        self._manager = JSONRPCResponseManager()
        self._dispatcher = Dispatcher()

    def start(self) -> None:
        context = RenderContext()
        renderer = Renderer(context)

        def update():
            node = renderer.render(self._element)
            self._send_node(node)

        context.set_on_change(update)
        update()

    def _send_node(self, node: RenderedNode) -> None:
        # We use an ID prefix to ensure that the callable ids are unique across each document render/update
        # That way we don't have to worry about callables from previous renders being called accidentally
        self._update_count += 1
        id_prefix = f"cb_{self._update_count}_"
        encoder = NodeEncoder(callable_id_prefix=id_prefix, separators=(",", ":"))
        payload = encoder.encode(node)

        logger.debug(f"Sending payload: {payload}")

        dispatcher = Dispatcher()
        for i, callable in enumerate(encoder.callables):
            key = f"{id_prefix}{i}"
            logger.debug("Registering callable %s", key)
            dispatcher[key] = callable
        self._dispatcher = dispatcher
        self._connection.on_data(payload.encode(), encoder.objects)

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        decoded_payload = io.BytesIO(payload).read().decode()
        logger.debug("Payload received: %s", decoded_payload)
        response = self._manager.handle(decoded_payload, self._dispatcher)
        logger.debug("Response: %s", response.json)
        # TODO: Actually send the response back to client... need to make document updates as a "request" to the client as well.
