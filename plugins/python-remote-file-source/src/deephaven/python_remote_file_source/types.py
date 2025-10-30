from typing import Any, Literal, Optional, Protocol, TypedDict, Union


class JsonRpcRequest(TypedDict):
    jsonrpc: Literal["2.0"]
    id: str
    method: str
    params: dict


class JsonRpcSuccess(TypedDict):
    jsonrpc: Literal["2.0"]
    id: str
    result: Any


class JsonRpcError(TypedDict):
    jsonrpc: Literal["2.0"]
    id: str
    error: dict


JsonRpcResponse = Union[JsonRpcSuccess, JsonRpcError]


class RemoteModuleDescriptor(TypedDict):
    filepath: str
    source: Optional[str]


class MessageStreamRequestInterface(Protocol):
    id: str

    async def request_data(self, request_msg: JsonRpcRequest) -> JsonRpcResponse:
        """
        Asynchronously send a JSON-RPC request to the client and wait for a response.
        Args:
            request_msg: The JSON-RPC request message to send to the client.
        Returns:
            The JSON-RPC response from the client (either result or error).
        """
        ...

    def request_data_sync(
        self, request_msg: JsonRpcRequest, timeout: Optional[float] = None
    ) -> JsonRpcResponse:
        """
        Synchronously send a JSON-RPC request to the client and block until a response is received.
        Args:
            request_msg: The JSON-RPC request message to send to the client.
            timeout: Optional timeout in seconds to wait for a response.
        Returns:
            The JSON-RPC response from the client (either result or error).
        """
        ...

    def send_message(self, message: str) -> None:
        """
        Send a message to the client.
        Args:
            message: The message to send.
        """
        ...
