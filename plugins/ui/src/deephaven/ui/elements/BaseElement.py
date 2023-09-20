from .Element import Element
from .._internal import RenderContext


class BaseElement(Element):
    """
    Base class for basic UI Elements that don't have any special rendering logic.
    Must provide a name for the element.
    """

    def __init__(self, name: str, *children, **props):
        self._name = name
        if len(children) == 0:
            self._children = None
        elif len(children) == 1:
            self._children = children[0]
        else:
            self._children = list(children)
        self._props = props

    def render(self, context: RenderContext):
        return self._children

    @property
    def props(self):
        return self._props

    @property
    def name(self) -> str:
        return self._name
