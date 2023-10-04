from __future__ import annotations
import json
import io
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
        self._message_id = 0
        self._manager = JSONRPCResponseManager()
        self._dispatcher = Dispatcher()

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

        payload = response.json
        logger.debug("Response: %s, %s", type(payload), payload)
        self._connection.on_data(payload.encode(), [])

    def _get_next_message_id(self) -> int:
        self._message_id += 1
        return self._message_id

    def _make_notification(self, method: str, *params: list[Any]) -> None:
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

    def _make_request(self, method: str, *params: list[Any]) -> None:
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
        # We use an ID prefix to ensure that the callable ids are unique across each document render/update
        # That way we don't have to worry about callables from previous renders being called accidentally
        self._update_count += 1
        id_prefix = f"cb_{self._update_count}_"

        # TODO(#67): Send a diff of the document instead of the entire document.
        request = self._make_notification("documentUpdated", root)
        encoder = NodeEncoder(callable_id_prefix=id_prefix, separators=(",", ":"))
        payload = encoder.encode(request)

        logger.debug(f"Sending payload: {payload}")

        dispatcher = Dispatcher()
        for i, callable in enumerate(encoder.callables):
            key = f"{id_prefix}{i}"
            logger.debug("Registering callable %s", key)
            dispatcher[key] = callable
        self._dispatcher = dispatcher
        self._connection.on_data(payload.encode(), encoder.objects)
