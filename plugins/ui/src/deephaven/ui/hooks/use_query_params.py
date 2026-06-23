from ..types import QueryParams
from .._internal import get_context
from ._url_parse import get_query_params as _get_query_params


def use_query_params() -> QueryParams:
    """
    Returns the current URL query parameters as a dictionary.

    Returns:
        A dictionary mapping parameter names to lists of string values.
    """
    context = get_context()
    url = context.get_url()
    return _get_query_params(url)
