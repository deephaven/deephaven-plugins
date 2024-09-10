from typing import Any, Dict, Optional
from inspect import signature
from functools import wraps

from ..elements import BaseElement
from .._internal.utils import create_props

params = {
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
    override_params: Dict[str, str] = {},
    return_string: Optional[str] = None,
):
    def decorator(f: Any):
        nonlocal return_string
        # Get name here so it's run once
        name = "".join(word.capitalize() for word in f.__name__.split("_"))

        @wraps(f)
        def wrapper(*args, **kwargs):
            children, props = create_props(f(*args, **kwargs))
            return BaseElement(f"deephaven.ui.components.{name}", *children, **props)

        sig = signature(f)
        if return_string is None:
            return_string = f"The rendered {name} component."

        wrapper.__doc__ = f"{description}\n\nArgs:\n"
        for param_name in (param.name for param in sig.parameters.values()):
            if param_name in override_params:
                wrapper.__doc__ += f"    {param_name}: {override_params[param_name]}\n"
            elif param_name in params:
                wrapper.__doc__ += f"    {param_name}: {params[param_name]}\n"
            else:
                raise ValueError(f'Docs of parameter "{param_name}" not specified.')
        wrapper.__doc__ += f"\nReturns:\n    {return_string}\n"

        return wrapper

    return decorator
