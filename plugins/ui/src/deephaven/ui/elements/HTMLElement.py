from .BaseElement import BaseElement
from .._internal import RenderContext


class HTMLElement(BaseElement):
    """
    Base class for all HTML elements
    """

    def __init__(self, tag, /, *children, **attributes):
        """
        Create a new HTML element. Render just returns the children that are passed in.

        Args:
            tag: The HTML tag for this element.
            *children: The children of the element.
            **attributes: Attributes to set on the element.
        """
        super().__init__(f"deephaven.ui.html.{tag}", *children, **attributes)
