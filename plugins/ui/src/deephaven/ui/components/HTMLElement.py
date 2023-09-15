from .Element import Element


class HTMLElement(Element):
    """
    Base class for all HTML elements
    """

    def __init__(self, tag, /, *children, **attributes):
        """
        Create a new HTML element.

        Args:
            tag: The HTML tag for this element.
            *children: The children of the element.
        """
        self._tag = tag
        self._children = children
        self._attributes = attributes

    @property
    def tag(self):
        return self._tag

    @property
    def children(self):
        return self._children

    @property
    def attributes(self):
        return self._attributes

    @property
    def props(self):
        return {
            "attributes": self.attributes,
            "tag": self._tag,
        }
