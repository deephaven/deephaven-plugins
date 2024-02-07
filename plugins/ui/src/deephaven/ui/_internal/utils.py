from __future__ import annotations

from typing import Any, Callable

_UNSAFE_PREFIX = "UNSAFE_"
_ARIA_PREFIX = "aria_"
_ARIA_PREFIX_REPLACEMENT = "aria-"


def get_component_name(component: Any) -> str:
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    try:
        return component.__module__ + "." + component.__name__
    except Exception:
        return component.__class__.__module__ + "." + component.__class__.__name__


def get_component_qualname(component: Any) -> str:
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    try:
        return component.__module__ + "." + component.__qualname__
    except Exception:
        return component.__class__.__module__ + "." + component.__class__.__qualname__


def to_camel_case(snake_case_text: str) -> str:
    """
    Convert a snake_case string to camelCase.

    Args:
        snake_case_text: The snake_case string to convert.

    Returns:
        The camelCase string.
    """
    components = snake_case_text.split("_")
    return components[0] + "".join((x[0].upper() + x[1:]) for x in components[1:])


def to_react_prop_case(snake_case_text: str) -> str:
    """
    Convert a snake_case string to camelCase, with exceptions for special props like `UNSAFE_` or `aria_` props.

    Args:
        snake_case_text: The snake_case string to convert.

    Returns:
        The camelCase string with the `UNSAFE_` prefix intact if present, or `aria_` converted to `aria-`.
    """
    if snake_case_text.startswith(_UNSAFE_PREFIX):
        return _UNSAFE_PREFIX + to_camel_case(snake_case_text[len(_UNSAFE_PREFIX) :])
    if snake_case_text.startswith(_ARIA_PREFIX):
        return _ARIA_PREFIX_REPLACEMENT + to_camel_case(
            snake_case_text[len(_ARIA_PREFIX) :]
        )
    return to_camel_case(snake_case_text)


def dict_to_camel_case(
    snake_case_dict: dict[str, Any],
    omit_none: bool = True,
    convert_key: Callable[[str], str] = to_react_prop_case,
) -> dict[str, Any]:
    """
    Convert a dict with snake_case keys to a dict with camelCase keys.

    Args:
        snake_case_dict: The snake_case dict to convert.
        omit_none: Whether to omit keys with a value of None.
        convert_key: The function to convert the keys. Can be used to customize the conversion behaviour

    Returns:
        The camelCase dict.
    """
    camel_case_dict: dict[str, Any] = {}
    for key, value in snake_case_dict.items():
        if omit_none and value is None:
            continue
        camel_case_dict[convert_key(key)] = value
    return camel_case_dict


def remove_empty_keys(dict: dict[str, Any]) -> dict[str, Any]:
    """
    Remove keys from a dict that have a value of None.

    Args:
        dict: The dict to remove keys from.

    Returns:
        The dict with keys removed.
    """
    return {k: v for k, v in dict.items() if v is not None}
