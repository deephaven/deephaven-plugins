from __future__ import annotations

from typing import Any, Callable, Set, cast, Sequence
from inspect import signature
import sys
from functools import partial

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


def _wrapped_callable(
    max_args: int | None,
    kwargs_set: set[str] | None,
    func: Callable,
    *args: Any,
    **kwargs: Any,
) -> None:
    """
    Filter the args and kwargs and call the specified function with the filtered args and kwargs.

    Args:
        max_args: The maximum number of positional arguments to pass to the function.
          If None, all args are passed.
        kwargs_set: The set of keyword arguments to pass to the function.
          If None, all kwargs are passed.
        func: The function to call
        *args: args, used by the dispatcher
        **kwargs: kwargs, used by the dispatcher
    """
    args = args if max_args is None else args[:max_args]
    kwargs = (
        kwargs
        if kwargs_set is None
        else {k: v for k, v in kwargs.items() if k in kwargs_set}
    )
    func(*args, **kwargs)


def wrap_callable(func: Callable) -> Callable:
    """
    Wrap the function so args are dropped if they are not in the signature.

    Args:
        func: The callable to wrap

    Returns:
        The wrapped callable
    """
    try:
        if sys.version_info.major == 3 and sys.version_info.minor >= 10:
            sig = signature(func, eval_str=True)  # type: ignore
        else:
            sig = signature(func)

        max_args: int | None = 0
        kwargs_set: Set | None = set()

        for param in sig.parameters.values():
            if param.kind == param.POSITIONAL_ONLY:
                max_args = cast(int, max_args)
                max_args += 1
            elif param.kind == param.POSITIONAL_OR_KEYWORD:
                # Don't know until runtime whether this will be passed as a positional or keyword arg
                max_args = cast(int, max_args)
                kwargs_set = cast(Set, kwargs_set)
                max_args += 1
                kwargs_set.add(param.name)
            elif param.kind == param.VAR_POSITIONAL:
                max_args = None
            elif param.kind == param.KEYWORD_ONLY:
                kwargs_set = cast(Set, kwargs_set)
                kwargs_set.add(param.name)
            elif param.kind == param.VAR_KEYWORD:
                kwargs_set = None

        return partial(_wrapped_callable, max_args, kwargs_set, func)
    except ValueError or TypeError:
        # This function has no signature, so we can't wrap it
        # Return the original function should be okay
        return func


def create_props(args: dict[str, Any]) -> tuple[tuple[Any], dict[str, Any]]:
    """
    Create props from the args. Combines the named props with the kwargs props.

    Args:
        args: A dictionary of arguments, from locals()

    Returns:
        A tuple of children and props
    """
    children, props = args.pop("children"), args.pop("props")
    props.update(args)
    return children, props
