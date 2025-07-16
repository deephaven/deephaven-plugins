class UriNode:
    """
    Represents a remote object to be fetched by the client.
    """

    _uri: str

    def __init__(self, uri: str):
        """
        Stores a URI for a remote object.

        Args:
            uri: The URI to fetch.
        """
        self._uri = uri

    @property
    def uri(self) -> str:
        """
        Get the URI of the node.
        """
        return self._uri


def resolve(uri: str) -> UriNode:
    """
    Resolve a URI to a UriNode which can be used to fetch an object on the client from another query.

    Args:
        uri: The URI to resolve.

    Returns:
        A UriNode with the given URI.
    """
    return UriNode(uri)
