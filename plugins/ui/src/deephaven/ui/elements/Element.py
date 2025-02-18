from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Union
from .._internal import RenderContext

PropsType = Dict[str, Any]


class Element(ABC):
    """
    Interface for all custom UI elements that have children.
    """

    @property
    def name(self) -> str:
        """
        Get the name of this element. Custom subclasses that want to be rendered differently on the client should override this a provide their own unique name.

        Returns:
            The unique name of this element.
        """
        return "deephaven.ui.Element"

    @property
    def key(self) -> str | None:
        """
        Get the key prop of this element. Useful to check if a key prop was provided.

        Returns:
            The unique key prop of this element.
        """
        return None

    @abstractmethod
    def render(self, context: RenderContext) -> PropsType:
        """
        Renders this element, and returns the result as a dictionary of props for the element.
        If you just want to render children, pass back a dict with children only, e.g. { "children": ... }

        Args:
            context: Deprecated. The context to render the element in. Should already be opened before calling this method.

        Returns:
            The props of this element.
        """
        pass


# Some props don't support Undefined, so they need to add it themselves
NodeType = Union[None, bool, int, str, Element, List["NodeType"]]
