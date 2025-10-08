import asyncio
import sys
import io
import json
from typing import Any, Optional
from deephaven.plugin.object_type import MessageStream as MesssageStreamBase

from .plugin_object import PluginObject
from .json_rpc import (
    create_response_msg,
    is_valid_json_rpc_request,
    is_valid_json_rpc_response,
)
from .logger import Logger
from .module_loader import RemoteMetaPathFinder
from .types import JsonRpcRequest, JsonRpcResponse, MessageStreamRequestInterface

logger = Logger("MessageStream")


class MessageStream(MesssageStreamBase, MessageStreamRequestInterface):
    """
    A custom MessageStream between the client and the server plugin

    Attributes:
        id: Optional[str]: The connection id
    """

    id: Optional[str] = None
    _future_responses: dict[str, asyncio.Future[JsonRpcResponse]] = {}
    _meta_path_finder: Optional[RemoteMetaPathFinder] = None
    _plugin: PluginObject

    def __init__(self, obj: PluginObject, client_connection: MesssageStreamBase):
        logger.info("Creating MessageStream")
        super().__init__()
        self._plugin = obj
        self._client_connection = client_connection

        # Start the message stream. All we do is send a blank message to start. Client will respond with the initial state.
        # Additional messages can be sent to the client by calling on_data on the client connection at any time after this.
        # These additional messages are processed in PythonRemoteFileSourcePluginView.tsx
        self._client_connection.on_data(b"", [])

    def _deregister_meta_path_finder(self):
        if self._meta_path_finder is None:
            return

        sys.meta_path.remove(self._meta_path_finder)
        self._meta_path_finder = None

    def _register_meta_path_finder(self):
        self._meta_path_finder = RemoteMetaPathFinder(self, self._plugin)
        sys.meta_path.insert(0, self._meta_path_finder)

        count = sum(
            isinstance(finder, RemoteMetaPathFinder) for finder in sys.meta_path
        )
        logger.info("Registered RemoteMetaPathFinder:", count)

    def send_message(self, message: JsonRpcResponse | str) -> None:
        """
        Send a message to the client
        Args:
            message: The message to send (str or dict)
        Returns: None
        """
        if isinstance(message, dict):
            message = json.dumps(message)

        self._client_connection.on_data(message.encode(), [])

    def on_data(self, payload: bytes, references: list[Any]) -> None:
        """
        Handle a payload from the client. If it is a JSON-RPC v2 response with a matching id, set the result.
        Args:
            payload: The payload from the client
            references: Any references (not used)
        Returns: None
        """
        decoded_payload = io.BytesIO(payload).read().decode()

        try:
            msg = json.loads(decoded_payload)
        except Exception:
            logger.info(f"Received non-JSON payload: {decoded_payload}")
            return

        if is_valid_json_rpc_response(msg):
            if msg["id"] in self._future_responses:
                future_response = self._future_responses[msg["id"]]
                loop = future_response.get_loop()
                loop.call_soon_threadsafe(future_response.set_result, msg)

        elif is_valid_json_rpc_request(msg):
            match msg["method"]:
                case "request_plugin_info":
                    full_names = list(self._plugin.get_top_level_module_fullnames())
                    logger.info(
                        "Sending plugin info to client. Remote module count:",
                        len(full_names),
                    )
                    self.send_message(
                        create_response_msg(msg["id"], {"full_names": full_names})
                    )
                case "set_connection_id":
                    self.id = msg.get("id")
                    logger.info("Set connection id:", self.id)

                    self._deregister_meta_path_finder()
                    self._register_meta_path_finder()

                    self.send_message(create_response_msg(msg["id"], None))
        else:
            logger.error(f"Received invalid JSON-RPC payload: {decoded_payload}")
            return

    async def request_data(self, request_msg: JsonRpcRequest) -> JsonRpcResponse:
        """
        Request data from the client asynchronously, waiting for a response.
        Args:
            request_msg: The JSON-RPC request message to send
        Returns:
            Any: The data from the client
        """

        future_response = asyncio.get_event_loop().create_future()
        self._future_responses[request_msg["id"]] = future_response

        # Send the request as a JSON-RPC message
        self.send_message(json.dumps(request_msg))

        # Wait for the response
        result = await future_response
        del self._future_responses[request_msg["id"]]

        return result

    def request_data_sync(
        self, request_msg: JsonRpcRequest, timeout: float = 5.0
    ) -> JsonRpcResponse:
        """
        Synchronously request data from the client via JSON-RPC, blocking until a response is received.
        Args:
            request_msg: The JSON-RPC request message to send
            timeout: The timeout in seconds to wait for a response (default: 5.0)
        Returns:
            The JSON-RPC response from the client
        Raises:
            RuntimeError: If called from an active event loop
        """

        async def do_request():
            try:
                return await asyncio.wait_for(self.request_data(request_msg), timeout)
            except Exception as ex:
                logger.error("Error during request_data_sync:", ex)
                del self._future_responses[request_msg["id"]]
                raise

        try:
            running = asyncio.get_running_loop().is_running()
        except RuntimeError:
            running = False

        if running:
            raise RuntimeError(
                "Cannot call request_data_sync from an active event loop"
            )

        # TODO: Do we need to run on a separate thread to avoid deadlocks?
        return asyncio.run(do_request())

    def on_close(self) -> None:
        """
        Close the connection
        """
        logger.info("Closing connection", self.id)
        self._deregister_meta_path_finder()
