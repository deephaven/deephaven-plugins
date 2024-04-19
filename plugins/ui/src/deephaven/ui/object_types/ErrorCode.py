from enum import Enum


class ErrorCode(int, Enum):
    """
    ServerErrorCode is a list of error codes that can be returned by the server. Values are based on the JSON-RPC 2.0
    specification. See https://www.jsonrpc.org/specification#error_object for more information.
    The range -32000 to -32099 are reserved for implementation-defined server-errors.
    """

    # General errors
    UNKNOWN = -32600
    """
    An unknown error occurred on the server.
    """

    RENDER_ERROR = -32601
    """
    There was an error when rendering the document.
    """
