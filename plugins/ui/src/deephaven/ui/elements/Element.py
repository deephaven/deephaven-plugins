from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict
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

    @abstractmethod
    def render(self, context: RenderContext) -> PropsType:
        """
        Renders this element, and returns the result as a dictionary of props for the element.
        If you just want to render children, pass back a dict with children only, e.g. { "children": ... }

        Returns:
            The props of this element.
        """
        pass
