import json
from abc import ABC, abstractmethod
from typing import Any, List
from deephaven.plugin.object_type import Exporter, FetchOnlyObjectType
from .._internal import get_component_name


class Element(ABC):
    """
    Interface for all custom UI elements that have children.
    """

    @property
    @abstractmethod
    def children(self):
        """
        Get the children of this element.

        Returns:
            The children of this element.
        """
        pass

    @property
    @abstractmethod
    def props(self):
        """
        Get the props of this element. Must be serializable to JSON.

        Returns:
            The props of this element.
        """
        pass


class ElementType(FetchOnlyObjectType):
    @property
    def name(self) -> str:
        return get_component_name(Element)

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, Element)

    def to_bytes(self, exporter: Exporter, element: Element) -> bytes:
        props = element.props
        if props is None:
            props = {}
        return json.dumps(props, separators=(",", ":")).encode()
