from __future__ import annotations

from typing import Callable
from urllib.parse import urlencode

from ..types import QueryParams
from .use_query_params import use_query_params
from .use_send_event import use_send_event


_NAVIGATE_EVENT = "navigate.event"


def _query_params_to_query_string(query_params: QueryParams) -> str:
    """
    Convert a `QueryParams` dict to a URL query string.

    Args:
        query_params: The query params dict to convert.

    Returns:
        A query string like `"?page=1&tag=python&tag=java"`,
        or `""` if empty.
    """
    if not query_params:
        return ""
    return f"?{urlencode(query_params, doseq=True)}"


def _build_navigate_payload(
    query_params: QueryParams,
    replace: bool,
) -> dict:
    """
    Build a navigate event payload.

    Args:
        query_params: The full query params dict to set.
        replace: Whether to replace the current history entry.

    Returns:
        The event payload dict.
    """
    return {
        "queryParams": _query_params_to_query_string(query_params),
        "replace": replace,
    }


def use_set_query_param(
    key: str,
) -> Callable[..., None]:
    """
    Returns a setter function for a single URL query parameter.

    Calling the setter with no value, None, or [] removes the
    parameter from the URL.

    Args:
        key: The query parameter name.

    Returns:
        A callable that sets (or removes) the query parameter.

    Setter arguments:
        value: None | str | list[str].  None, [], or
            omitting the argument removes the key.
        replace: Whether to replace the current history entry (True,
            the default) or push a new one (False).
    """
    current_params = use_query_params()
    send_event = use_send_event()

    def setter(value: None | str | list[str] = None, replace: bool = True) -> None:
        # Build a new query params dict based on the current params
        new_params: QueryParams = dict(current_params)

        if value is None or value == []:
            # The value should be cleared
            new_params.pop(key, None)
        elif isinstance(value, str):
            new_params[key] = [value]
        elif isinstance(value, list):
            new_params[key] = value
        else:
            raise TypeError(
                f"use_set_query_param setter expects None, str, or list[str], "
                f"got {type(value).__name__}"
            )

        payload = _build_navigate_payload(new_params, replace)
        send_event(_NAVIGATE_EVENT, payload)

    return setter
