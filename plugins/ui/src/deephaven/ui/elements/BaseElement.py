from __future__ import annotations

from typing import Any
from .Element import Element
from .._internal import dict_to_camel_case, RenderContext


class BaseElement(Element):
    """
    Base class for basic UI Elements that don't have any special rendering logic.
    Must provide a name for the element.
    """

    def __init__(self, name: str, /, *children: Any, **props: Any):
        self._name = name
        if len(children) > 0 and props.get("children") is not None:
            raise ValueError("Cannot provide both children and props.children")

        if len(children) > 1:
            props["children"] = list(children)
        if len(children) == 1:
            # If there's only one child, we pass it as a single child, not a list
            # There are many React elements that expect only a single child, and will fail if they get a list (even if it only has one element)
            props["children"] = children[0]
        self._props = dict_to_camel_case(props)

    @property
    def name(self) -> str:
        return self._name

    def render(self, context: RenderContext) -> dict[str, Any]:
        return self._props
