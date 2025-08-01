from __future__ import annotations

from .Element import Element, PropsType
from .._internal import RenderContext


class UriElement(Element):
    """
    Represents a remote object to be fetched by the client.

    Args:
        uri: The URI to fetch.
        key: An optional key for the element.
    """

    _uri: str

    _key: str | None = None

    def __init__(self, uri: str, key: str | None = None):
        self._uri = uri
        self._key = key

    @property
    def name(self) -> str:
        return "deephaven.ui.elements.UriElement"

    @property
    def key(self) -> str | None:
        return self._key

    def render(self, context: RenderContext) -> PropsType:
        return {"uri": self._uri}

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, UriElement):
            return False
        return self._uri == other._uri and self._key == other._key


def resolve(uri: str) -> UriElement:
    """
    Resolve a URI to a UriNode which can be used to fetch an object on the client from another query.

    Args:
        uri: The URI to resolve.

    Returns:
        A UriNode with the given URI.
    """
    return UriElement(uri)
