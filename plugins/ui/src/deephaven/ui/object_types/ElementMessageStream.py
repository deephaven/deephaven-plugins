from __future__ import annotations
import io
import json
from jsonrpc import JSONRPCResponseManager, Dispatcher
import logging
from typing import Any
from deephaven.plugin.object_type import MessageStream
from ..elements import Element
from ..renderer import NodeEncoder, Renderer, RenderedNode
from .._internal import RenderContext
from ..renderer.NodeEncoder import NodeEncoder

logger = logging.getLogger(__name__)


class ElementMessageStream(MessageStream):
    _manager: JSONRPCResponseManager
    """
    Handle incoming requests from the client.
    """

    _dispatcher: Dispatcher
    """
    The dispatcher to use when client calls callables.
    """

    _encoder: NodeEncoder
    """
    Encoder to use to encode the document.
    """

    _message_id: int
    """
    The next message ID to use.
    """

    _element: Element
    """
    The element to render.
    """

    _connection: MessageStream
    """
    The connection to send the rendered element to.
    """

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
        self._message_id = 0
        self._manager = JSONRPCResponseManager()
        self._dispatcher = Dispatcher()
        self._encoder = NodeEncoder(separators=(",", ":"))

    def start(self) -> None:
        context = RenderContext()
        renderer = Renderer(context)

        def update():
            logger.debug("ElementMessageStream update")
            node = renderer.render(self._element)
            self._send_document_update(node)

        context.set_on_change(update)
        update()

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: list[Any]) -> None:
        decoded_payload = io.BytesIO(payload).read().decode()
        logger.debug("Payload received: %s", decoded_payload)

        response = self._manager.handle(decoded_payload, self._dispatcher)

        if response is None:
            return

        response_payload = response.json
        logger.debug("Response: %s, %s", type(response_payload), response_payload)
        self._connection.on_data(response_payload.encode(), [])

    def _get_next_message_id(self) -> int:
        self._message_id += 1
        return self._message_id

    def _make_notification(self, method: str, *params: Any) -> dict[str, Any]:
        """
        Make a JSON-RPC notification. Can notify the client without expecting a response.

        Args:
            method: The method to call
            params: The parameters to pass to the method
        """
        return {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
        }

    def _make_request(self, method: str, *params: Any) -> dict[str, Any]:
        """
        Make a JSON-RPC request. Messages the client and expects a response.

        Args:
            method: The method to call
            params: The parameters to pass to the method
        """
        return {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": self._get_next_message_id(),
        }

    def _send_document_update(self, root: RenderedNode) -> None:
        """
        Send a document update to the client. Currently just sends the entire document for each update.

        Args:
            root: The root node of the document to send
        """

        # TODO(#67): Send a diff of the document instead of the entire document.
        encoder_result = self._encoder.encode_node(root)
        encoded_document = encoder_result["encoded_node"]
        new_objects = encoder_result["new_objects"]
        callable_id_dict = encoder_result["callable_id_dict"]

        request = self._make_notification("documentUpdated", encoded_document)
        payload = json.dumps(request)
        logger.debug(f"Sending payload: {payload}")

        dispatcher = Dispatcher()
        for callable, callable_id in callable_id_dict.items():
            logger.debug("Registering callable %s", callable_id)
            dispatcher[callable_id] = callable
        self._dispatcher = dispatcher
        self._connection.on_data(payload.encode(), new_objects)
