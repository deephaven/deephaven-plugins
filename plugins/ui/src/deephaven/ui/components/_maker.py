from typing import Any, Dict
from inspect import signature
from functools import wraps
from ..elements import BaseElement

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
    return_string: str | None = None,
):
    def decorator(f: Any):
        nonlocal return_string

        @wraps(f)
        def wrapper(*args, **kwargs):
            props = f(*args, **kwargs)
            return BaseElement(f"deephaven.ui.components.{f.__name__}", **props)

        sig = signature(f)
        if return_string is None:
            return_string = f"The rendered {f.__name__.replace('_', ' ')} component."

        wrapper.__doc__ = f"{description}\n\nArgs:\n"
        for name in (param.name for param in sig.parameters.values()):
            if name in override_params:
                wrapper.__doc__ += f"    {name}: {override_params[name]}\n"
            elif name in params:
                wrapper.__doc__ += f"    {name}: {params[name]}\n"
            else:
                raise ValueError(f'Docs of parameter "{name}" not specified.')
        wrapper.__doc__ += f"\nReturns:\n    {return_string}\n"

        return wrapper

    return decorator
