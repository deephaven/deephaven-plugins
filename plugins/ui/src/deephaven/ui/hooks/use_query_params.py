from ..types import QueryParams
from .._internal import get_context


def use_query_params() -> QueryParams:
    """
    Returns the current URL query parameters as a dictionary.

    Returns:
        A dictionary mapping parameter names to lists of string values.
    """
    context = get_context()
    return context.get_query_params()
