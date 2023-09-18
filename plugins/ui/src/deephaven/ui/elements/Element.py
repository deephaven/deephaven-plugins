from abc import ABC, abstractmethod
from typing import List, Union
from .._internal import RenderContext, get_component_qualname


class Element(ABC):
    """
    Interface for all custom UI elements that have children.
    """

    @property
    def props(self) -> Union[dict, None]:
        """
        Get the props of this element. Must be serializable to JSON.

        Returns:
            The props of this element.
        """
        return None

    @abstractmethod
    def render(self, context: RenderContext) -> Union[None, List["Element"]]:
        """
        Get the children of this element.

        Returns:
            The children of this element.
        """
        pass

    @property
    def name(self) -> str:
        """
        Get the name of this element.

        Returns:
            The unique name of this element.
        """
        return get_component_qualname(self)
