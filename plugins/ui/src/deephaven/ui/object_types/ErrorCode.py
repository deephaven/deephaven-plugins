from enum import Enum


class ErrorCode(int, Enum):
    """
    ErrorCode is a list of error codes that can be returned by the server.
    """

    # General errors
    UNKNOWN = 0
    """
    An unknown error occurred on the server.
    """

    DOCUMENT_ERROR = 1
    """
    There was an error when rendering the document.
    """
