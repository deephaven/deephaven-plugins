from __future__ import annotations
import io
import json
from jsonrpc import JSONRPCResponseManager, Dispatcher
import logging
import threading
from enum import Enum
from queue import Queue
from typing import Any, Callable
from deephaven.plugin.object_type import MessageStream
from deephaven.server.executors import submit_task
from deephaven.execution_context import ExecutionContext, get_exec_ctx
from ..elements import Element
from ..renderer import NodeEncoder, Renderer, RenderedNode
from .._internal import RenderContext, StateUpdateCallable
from ..renderer.NodeEncoder import NodeEncoder

logger = logging.getLogger(__name__)


class _RenderState(Enum):
    """
    The state of the render loop.
    """

    IDLE = 0
    """
    The render loop is idle.
    """

    RENDERING = 1
    """
    The render loop is currently rendering.
    """

    QUEUED = 2
    """
    The render loop has a render queued.
    """


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

    _update_queue: Queue[StateUpdateCallable]
    """
    State updates that need to be applied on the next render. 
    These are stored in their own queue so all updates are batched together.
    """

    _callable_queue: Queue[Callable[[], None]]
    """
    Callables and render functions to be called on the next render loop.
    """

    _render_lock: threading.Lock
    """
    Lock to ensure only one thread is rendering at a time.
    """

    _render_state: _RenderState
    """
    The state of the render loop.
    """

    _render_thread: threading.Thread | None
    """
    The thread the render loop is running on.
    """

    _is_dirty: bool
    """
    Whether or not the element needs a re-render.
    """

    _exec_context: ExecutionContext
    """
    Captured ExecutionContext for this stream, to wrap all user code.
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
        self._update_queue = Queue()
        self._callable_queue = Queue()
        self._render_lock = threading.Lock()
        self._is_dirty = False
        self._render_state = _RenderState.IDLE
        self._exec_context = get_exec_ctx()

    def _render(self) -> None:
        logger.debug("ElementMessageStream._render")

        # Resolve any pending state updates first
        while not self._update_queue.empty():
            state_update = self._update_queue.get()
            state_update()

        self._is_dirty = False

        try:
            node = self._renderer.render(self._element)
        except Exception as e:
            logger.exception("Error rendering %s", self._element.name)
            raise e

        self._send_document_update(node)

    def _process_callable_queue(self) -> None:
        """
        Process any queued callables, then re-renders the element if it is dirty.
        """
        with self._exec_context:
            with self._render_lock:
                self._render_thread = threading.current_thread()
                self._render_state = _RenderState.RENDERING

            while not self._callable_queue.empty():
                item = self._callable_queue.get()
                try:
                    item()
                except Exception as e:
                    logger.exception(e)

            if self._is_dirty:
                self._render()

            with self._render_lock:
                self._render_thread = None
                if not self._callable_queue.empty() or self._is_dirty:
                    # There are still callables to process, so queue up another render
                    self._render_state = _RenderState.QUEUED
                    submit_task("concurrent", self._process_callable_queue)
                else:
                    self._render_state = _RenderState.IDLE

    def _mark_dirty(self) -> None:
        """
        Mark the element as dirty and queue up a render
        """
        if self._is_dirty:
            return
        self._is_dirty = True
        self._queue_render()

    def _queue_render(self) -> None:
        with self._render_lock:
            if self._render_state is _RenderState.IDLE:
                self._render_state = _RenderState.QUEUED
                submit_task("concurrent", self._process_callable_queue)

    def _queue_state_update(self, state_update: StateUpdateCallable) -> None:
        """
        Queue a state update to be resolved on the next render.

        Args:
            state_update: The state update to queue
        """
        current_thread = threading.current_thread()
        if current_thread is not self._render_thread:
            raise ValueError(
                f"State update called from non-render thread '{current_thread.name}'. Use the `use_render_queue` hook to queue state updates when multi-threading."
            )
        self._update_queue.put(state_update)
        self._mark_dirty()

    def _queue_callable(self, callable: Callable[[], None]) -> None:
        """
        Queue a callable to put on the render queue.

        Args:
            callable: The callable to queue
        """
        self._callable_queue.put(callable)
        self._queue_render()

    def start(self) -> None:
        """
        Start the message stream. This will start the render loop and queue up the initial render.
        """
        self._mark_dirty()

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
        self._queue_callable(handle_message)

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
