from __future__ import annotations

from typing import overload

from .use_query_params import use_query_params


@overload
def use_query_param(key: str, default: None = None) -> str | None:
    ...


@overload
def use_query_param(key: str, default: list[str]) -> list[str]:
    ...


def use_query_param(
    key: str,
    default: None | list[str] = None,
) -> str | None | list[str]:
    """
    Returns the value of a single URL query parameter.

    The type of default determines the return type:

    default=None returns str | None.
      Returns the last value for the key if present or None if the key is absent.
      Returns an empty string if the key is present without a value.
    default=list[str]: returns list[str].
      Returns a list of all values for the key if present or the default list if the key is absent.
      Returns a list of empty strings if the key is present without a value.

    Args:
        key: The query parameter name.
        default: Returned when the key is absent from the URL.  Also
            controls the return type.

    Returns:
        The parameter value(s), or default if the key is absent.
    """
    params = use_query_params()
    values = params.get(key)

    if values is None:
        return default

    if isinstance(default, list):
        return values

    # default is None -> return the last value as a single string
    return values[-1] if values else ""
