from typing import Any, TypeGuard
import uuid
from .types import JsonRpcRequest, JsonRpcResponse


def create_request_msg(method: str, params: dict) -> JsonRpcRequest:
    """
    Create a JSON-RPC v2 request message
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
    """
    return {"jsonrpc": "2.0", "id": id, "result": result}


def is_valid_json_rpc_request(msg: Any) -> TypeGuard[JsonRpcRequest]:
    """
    Check if the message is a valid JSON-RPC v2 message

    Args:
        msg: The message to check
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
    """
    return (
        isinstance(msg, dict)
        and msg.get("jsonrpc") == "2.0"
        and "id" in msg
        and ("result" in msg or "error" in msg)
    )
