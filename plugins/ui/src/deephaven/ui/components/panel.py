from ..elements import BaseElement, Element


def panel(*children: Element, title: str | None = None):
    """
    A panel is a container that can be used to group elements.

    Args:
        children: Elements to render in the panel.
        title: Title of the panel.
    """
    return BaseElement("deephaven.ui.components.Panel", *children, title=title)
