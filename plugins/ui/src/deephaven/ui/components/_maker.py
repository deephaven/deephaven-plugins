from __future__ import annotations
from typing import Any
from inspect import signature
from functools import wraps

from ..elements import BaseElement
from .._internal.utils import create_props, to_camel_case

param_descs = {
    "wrap": "Whether children should wrap when they exceed the panel's width.",
    "justify_content": "The distribution of space around items along the main axis.",
    "align_content": "The distribution of space between and around items along the cross axis.",
    "align_items": "The alignment of children within their container.",
    "gap": "The space to display between both rows and columns of children.",
    "column_gap": "The space to display between columns of children.",
    "row_gap": "The space to display between rows of children.",
    "key": "A unique key for the element",
}


def make_element(
    description: str,
    override_name: str | None = None,
    override_param_descs: dict[str, str] = {},
    override_return: str | None = None,
):
    """
    A decorator creator thats turns a function (that returns `global() of its props`) into a component.

    Args:
        description: The description of the component.
        override_name: The name of the component that will override the default (the function name in camel case).
        override_param_descs: A dictionary of prop descriptions that will override the default ones.
        override_return: The string that will override the default ("The rendered {name} component.") return value.
    """

    def decorator(f: Any):
        nonlocal override_name
        nonlocal override_return

        sig = signature(f)

        # Run here so it's run once
        if override_name is None:
            override_name = to_camel_case(f.__name__)
        if override_return is None:
            override_return = f"The rendered {override_name} component."

        @wraps(f)
        def wrapper(*args, key: str | None = None, **kwargs):
            children, props = create_props(f(*args, **kwargs))
            props["key"] = key
            return BaseElement(
                f"deephaven.ui.components.{override_name}", *children, **props
            )

        wrapper.__doc__ = f"{description}\n\nArgs:\n"
        for param_name in (param.name for param in sig.parameters.values()):
            if param_name in override_param_descs:
                wrapper.__doc__ += (
                    f"    {param_name}: {override_param_descs[param_name]}\n"
                )
            elif param_name in param_descs:
                wrapper.__doc__ += f"    {param_name}: {param_descs[param_name]}\n"
            else:
                raise ValueError(f'Docs of parameter "{param_name}" not specified.')
        wrapper.__doc__ += f"    key: A unique key for the element\n"
        wrapper.__doc__ += f"\nReturns:\n    {override_return}\n"

        return wrapper

    return decorator
