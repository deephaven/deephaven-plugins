from abc import ABC, abstractmethod
from typing import List, Union
from .._internal import RenderContext, get_component_qualname


class Element(ABC):
    """
    Interface for all custom UI elements that have children.
    """

    @property
    def name(self) -> str:
        """
        Get the name of this element.

        Returns:
            The unique name of this element.
        """
        return get_component_qualname(self)

    @abstractmethod
    def render(self, context: RenderContext) -> dict:
        """
        Renders this element, and returns the result as a dictionary of props for the element.
        If you just want to render children, pass back a dict with children only, e.g. { "children": ... }

        Returns:
            The props of this element.
        """
        pass
