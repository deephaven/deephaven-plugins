from .Element import Element
from .._internal import dict_to_camel_case, RenderContext


class BaseElement(Element):
    """
    Base class for basic UI Elements that don't have any special rendering logic.
    Must provide a name for the element.
    """

    def __init__(self, name: str, *children, **props):
        self._name = name
        if len(children) > 0 and props.get("children") is not None:
            raise ValueError("Cannot provide both children and props.children")

        if len(children) > 1:
            props["children"] = list(children)
        if len(children) == 1:
            props["children"] = children[0]
        self._props = dict_to_camel_case(props)

    @property
    def name(self) -> str:
        return self._name

    def render(self, context: RenderContext):
        return self._props
