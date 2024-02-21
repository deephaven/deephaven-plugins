"""
Provides a set of functions for creating raw HTML elements.

The components provided in deephaven.ui should be preferred over this module.
"""
from ..elements import BaseElement


def html_element(tag: str, *children, **attributes):
    """
    Create a new HTML element. Render just returns the children that are passed in.

    Args:
        tag: The HTML tag for this element.
        *children: The children of the element.
        **attributes: Attributes to set on the element
    """
    return BaseElement(f"deephaven.ui.html.{tag}", *children, **attributes)


def div(*children, **attributes):
    return html_element("div", *children, **attributes)


def span(*children, **attributes):
    return html_element("span", *children, **attributes)


def h1(*children, **attributes):
    return html_element("h1", *children, **attributes)


def h2(*children, **attributes):
    return html_element("h2", *children, **attributes)


def h3(*children, **attributes):
    return html_element("h3", *children, **attributes)


def h4(*children, **attributes):
    return html_element("h4", *children, **attributes)


def h5(*children, **attributes):
    return html_element("h5", *children, **attributes)


def h6(*children, **attributes):
    return html_element("h6", *children, **attributes)


def p(*children, **attributes):
    return html_element("p", *children, **attributes)


def a(*children, **attributes):
    return html_element("a", *children, **attributes)


def ul(*children, **attributes):
    return html_element("ul", *children, **attributes)


def ol(*children, **attributes):
    return html_element("ol", *children, **attributes)


def li(*children, **attributes):
    return html_element("li", *children, **attributes)


def table(*children, **attributes):
    return html_element("table", *children, **attributes)


def thead(*children, **attributes):
    return html_element("thead", *children, **attributes)


def tbody(*children, **attributes):
    return html_element("tbody", *children, **attributes)


def tr(*children, **attributes):
    return html_element("tr", *children, **attributes)


def th(*children, **attributes):
    return html_element("th", *children, **attributes)


def td(*children, **attributes):
    return html_element("td", *children, **attributes)


def b(*children, **attributes):
    return html_element("b", *children, **attributes)


def i(*children, **attributes):
    return html_element("i", *children, **attributes)


def br(*children, **attributes):
    return html_element("br", *children, **attributes)


def hr(*children, **attributes):
    return html_element("hr", *children, **attributes)


def pre(*children, **attributes):
    return html_element("pre", *children, **attributes)


def code(*children, **attributes):
    return html_element("code", *children, **attributes)


def img(*children, **attributes):
    return html_element("img", *children, **attributes)


def button(*children, **attributes):
    return html_element("button", *children, **attributes)


def input(*children, **attributes):
    return html_element("input", *children, **attributes)


def form(*children, **attributes):
    return html_element("form", *children, **attributes)


def label(*children, **attributes):
    return html_element("label", *children, **attributes)


def select(*children, **attributes):
    return html_element("select", *children, **attributes)


def option(*children, **attributes):
    return html_element("option", *children, **attributes)


def textarea(*children, **attributes):
    return html_element("textarea", *children, **attributes)


def style(*children, **attributes):
    return html_element("style", *children, **attributes)
