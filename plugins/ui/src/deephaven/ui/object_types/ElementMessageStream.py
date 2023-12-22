from __future__ import annotations
import io
import json
from jsonrpc import JSONRPCResponseManager, Dispatcher
import logging
import threading
from queue import Queue
from typing import Any, Callable
from deephaven.plugin.object_type import MessageStream
from ..elements import Element
from ..renderer import NodeEncoder, Renderer, RenderedNode
from .._internal import RenderContext, StateUpdateCallable
from ..renderer.NodeEncoder import NodeEncoder

logger = logging.getLogger(__name__)

_render_queue: Queue[Callable[[], None]] = Queue()

_render_thread: threading.Thread | None = None


def _render_loop():
    global _render_queue
    while True:
        item = _render_queue.get()
        try:
            item()
        except Exception as e:
            logger.exception(e)


def _start_render_loop():
    """
    Start the render loop if it is not already running.
    """
    global _render_thread
    if not (_render_thread and _render_thread.is_alive()):
        _render_thread = threading.Thread(
            target=_render_loop, name="deephaven.ui render loop"
        )
        _render_thread.start()


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

    _context: RenderContext
    """
    Render context for this element
    """

    _renderer: Renderer
    """
    Renderer for this element
    """

    _queued_updates: Queue[StateUpdateCallable]
    """
    State updates that need to be applied on the next render.
    """

    _is_render_queued: bool
    """
    Whether or not a render is queued.
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
        self._context = RenderContext(self._queue_state_update, self._queue_callable)
        self._renderer = Renderer(self._context)
        self._queued_updates = Queue()
        self._is_render_queued = False

    def _render(self) -> None:
        logger.debug("ElementMessageStream._render")

        # Resolve any pending state updates first
        while not self._queued_updates.empty():
            state_update = self._queued_updates.get()
            state_update()

        node = self._renderer.render(self._element)
        self._send_document_update(node)
        self._is_render_queued = False

    def _queue_render(self) -> None:
        """
        Queue a render to be resolved on the next render.
        """
        if self._is_render_queued:
            return
        self._is_render_queued = True
        _render_queue.put(self._render)

    def _queue_state_update(self, state_update: StateUpdateCallable) -> None:
        """
        Queue a state update to be resolved on the next render.

        Args:
            state_update: The state update to queue
        """
        current_thread = threading.current_thread()
        if current_thread is not _render_thread:
            raise ValueError(
                f"State update called from non-render thread '{current_thread.name}'. Use the `use_render_queue` hook to queue state updates when multi-threading."
            )
        self._queued_updates.put(state_update)
        self._queue_render()

    def _queue_callable(self, callable: Callable[[], None]) -> None:
        """
        Queue a callable to put on the render queue.

        Args:
            callable: The callable to queue
        """
        _render_queue.put(callable)

    def start(self) -> None:
        """
        Start the message stream. This will start the render loop and queue up the initial render.
        """
        _start_render_loop()
        self._queue_render()

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: list[Any]) -> None:
        """
        Handle incoming data from the client. Dispatches commands on the render thread.

        Args:
            payload: The payload from the client
            references: The references from the client
        """
        decoded_payload = io.BytesIO(payload).read().decode()
        logger.debug("Payload received: %s", decoded_payload)

        def handle_message():
            response = self._manager.handle(decoded_payload, self._dispatcher)

            if response is None:
                return

            response_payload = response.json
            logger.debug("Response: %s, %s", type(response_payload), response_payload)
            self._connection.on_data(response_payload.encode(), [])

        # Queue up handling of all incoming messages from the client onto the render thread
        _render_queue.put(handle_message)

    def _get_next_message_id(self) -> int:
        """
        Get the next message ID to use for JSON-RPC requests. Increments after each call.

        Returns:
            The next message ID to use
        """
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
