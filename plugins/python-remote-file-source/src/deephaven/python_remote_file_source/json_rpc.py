from typing import Any, TypeGuard
import uuid
from .types import JsonRpcRequest, JsonRpcResponse


def create_request_msg(method: str, params: dict) -> JsonRpcRequest:
    """
    Create a JSON-RPC v2 request message
    Args:
        method: The method to call
        params: The parameters to pass to the method
    Returns:
        JsonRpcRequest: The JSON-RPC request message
    """
    return {
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": method,
        "params": params,
    }


def create_response_msg(id: str, result: Any) -> JsonRpcResponse:
    """
    Create a JSON-RPC v2 response message
    Args:
        id: The id of the request
        result: The result of the request
    Returns:
        JsonRpcResponse: The JSON-RPC response message
    """
    return {"jsonrpc": "2.0", "id": id, "result": result}


def is_valid_json_rpc_request(msg: Any) -> TypeGuard[JsonRpcRequest]:
    """
    Check if the message is a valid JSON-RPC v2 message

    Args:
        msg: The message to check
    Returns:
        bool: True if the message is a valid JSON-RPC request, False otherwise
    """
    return (
        isinstance(msg, dict)
        and msg.get("jsonrpc") == "2.0"
        and "id" in msg
        and "method" in msg
    )


def is_valid_json_rpc_response(msg: Any) -> TypeGuard[JsonRpcResponse]:
    """
    Check if the message is a valid JSON-RPC v2 message

    Args:
        msg: The message to check
    Returns:
        bool: True if the message is a valid JSON-RPC response, False otherwise
    """
    return (
        isinstance(msg, dict)
        and msg.get("jsonrpc") == "2.0"
        and "id" in msg
        and ("result" in msg or "error" in msg)
    )
