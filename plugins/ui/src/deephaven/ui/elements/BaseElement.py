from __future__ import annotations

from typing import Any
from .Element import Element
from .._internal import dict_to_react_props, RenderContext


class BaseElement(Element):
    """
    Base class for basic UI Elements that don't have any special rendering logic.
    Must provide a name for the element.

    Args:
        name: The name of the element, e.g. "div", "span", "deephaven.ui.button", etc.
        children: The children
        key: The key for the element
        _nullable_props: A list of props that can be nullable
        props: The props for the element
    """

    def __init__(
        self,
        name: str,
        /,
        *children: Any,
        key: str | None = None,
        _nullable_props: list[str] = [],
        **props: Any,
    ):
        self._name = name
        self._key = key
        props["key"] = key

        if len(children) > 0 and props.get("children") is not None:
            raise ValueError("Cannot provide both children and props.children")

        if len(children) > 1:
            props["children"] = list(children)
        if len(children) == 1:
            # If there's only one child, we pass it as a single child, not a list
            # There are many React elements that expect only a single child, and will fail if they get a list (even if it only has one element)
            props["children"] = children[0]
        self._props = dict_to_react_props(props, _nullable_props)

    @property
    def name(self) -> str:
        return self._name

    @property
    def key(self) -> str | None:
        return self._key

    def render(self, context: RenderContext) -> dict[str, Any]:
        return self._props
