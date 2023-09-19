from .Element import Element
from .._internal import RenderContext


class BaseElement(Element):
    """
    Base class for basic UI Elements that don't have any special rendering logic.
    Must provide a name for the element.
    """

    def __init__(self, name: str, *children, **props):
        self._name = name
        self._children = children
        self._props = props

    def render(self, context: RenderContext):
        return self._children if self._children is not None else []

    @property
    def props(self):
        return self._props

    @property
    def name(self) -> str:
        return self._name
