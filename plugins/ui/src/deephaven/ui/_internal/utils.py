from __future__ import annotations

from typing import Any, Callable


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
    return components[0] + "".join(x.title() for x in components[1:])


def to_camel_case_skip_unsafe(snake_case_text: str) -> str:
    """
    Convert a snake_case string to camelCase. Does not convert it if the string starts with `UNSAFE_`

    Args:
        snake_case_text: The snake_case string to convert.

    Returns:
        The camelCase string, or the original string if it starts with `UNSAFE_`.
    """
    if snake_case_text.startswith("UNSAFE_"):
        return snake_case_text
    return to_camel_case(snake_case_text)


def dict_to_camel_case(
    snake_case_dict: dict[str, Any],
    omit_none: bool = True,
    convert_key: Callable[[str], str] = to_camel_case_skip_unsafe,
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
