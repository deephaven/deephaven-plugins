"""
Provides a set of functions for creating raw HTML elements.

The components provided in deephaven.ui should be preferred over this module.
"""
from ..elements import HTMLElement


def create_element(tag, *children, **attributes):
    """
    Create a new HTML element. Render just returns the children that are passed in.

    Args:
        tag: The HTML tag for this element.
        *children: The children of the element.
        **attributes: Attributes to set on the element
    """
    return HTMLElement(tag, *children, **attributes)


def div(*children, **attributes):
    return HTMLElement("div", *children, **attributes)


def span(*children, **attributes):
    return HTMLElement("span", *children, **attributes)


def h1(*children, **attributes):
    return HTMLElement("h1", *children, **attributes)


def h2(*children, **attributes):
    return HTMLElement("h2", *children, **attributes)


def h3(*children, **attributes):
    return HTMLElement("h3", *children, **attributes)


def h4(*children, **attributes):
    return HTMLElement("h4", *children, **attributes)


def h5(*children, **attributes):
    return HTMLElement("h5", *children, **attributes)


def h6(*children, **attributes):
    return HTMLElement("h6", *children, **attributes)


def p(*children, **attributes):
    return HTMLElement("p", *children, **attributes)


def a(*children, **attributes):
    return HTMLElement("a", *children, **attributes)


def ul(*children, **attributes):
    return HTMLElement("ul", *children, **attributes)


def ol(*children, **attributes):
    return HTMLElement("ol", *children, **attributes)


def li(*children, **attributes):
    return HTMLElement("li", *children, **attributes)


def table(*children, **attributes):
    return HTMLElement("table", *children, **attributes)


def thead(*children, **attributes):
    return HTMLElement("thead", *children, **attributes)


def tbody(*children, **attributes):
    return HTMLElement("tbody", *children, **attributes)


def tr(*children, **attributes):
    return HTMLElement("tr", *children, **attributes)


def th(*children, **attributes):
    return HTMLElement("th", *children, **attributes)


def td(*children, **attributes):
    return HTMLElement("td", *children, **attributes)


def b(*children, **attributes):
    return HTMLElement("b", *children, **attributes)


def i(*children, **attributes):
    return HTMLElement("i", *children, **attributes)


def br(*children, **attributes):
    return HTMLElement("br", *children, **attributes)


def hr(*children, **attributes):
    return HTMLElement("hr", *children, **attributes)


def pre(*children, **attributes):
    return HTMLElement("pre", *children, **attributes)


def code(*children, **attributes):
    return HTMLElement("code", *children, **attributes)


def img(*children, **attributes):
    return HTMLElement("img", *children, **attributes)


def button(*children, **attributes):
    return HTMLElement("button", *children, **attributes)


def input(*children, **attributes):
    return HTMLElement("input", *children, **attributes)


def form(*children, **attributes):
    return HTMLElement("form", *children, **attributes)


def label(*children, **attributes):
    return HTMLElement("label", *children, **attributes)


def select(*children, **attributes):
    return HTMLElement("select", *children, **attributes)


def option(*children, **attributes):
    return HTMLElement("option", *children, **attributes)


def textarea(*children, **attributes):
    return HTMLElement("textarea", *children, **attributes)


def style(*children, **attributes):
    return HTMLElement("style", *children, **attributes)
