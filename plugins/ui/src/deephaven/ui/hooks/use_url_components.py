from urllib.parse import SplitResult, urlsplit

from .._internal import get_context


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
    href = context.get_href()
    return urlsplit(href)
