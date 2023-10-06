from ..elements import BaseElement


def panel(*children, title=None):
    """
    A panel is a container that can be used to group elements.

    Args:
        children: Elements to render in the panel.
        title: Title of the panel.
    """
    return BaseElement("deephaven.ui.components.Panel", *children, title=title)
