from urllib.parse import SplitResult

from .._internal import get_context
from ._url_parse import parse_url


def use_url_components() -> SplitResult:
    """
    Get the current URL broken into components.

    Returns:
        A SplitResult named tuple with fields:

        - scheme: URL scheme (e.g. "https")
        - netloc: Network location (e.g. "example.com:8080")
        - path: Path component
        - query: Query string (without leading "?")
        - fragment: Fragment (without leading "#")
    """
    context = get_context()
    url = context.get_url()
    return parse_url(url)
