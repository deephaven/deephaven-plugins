from typing import Any

"""
Provides a set of functions for creating raw HTML elements.

The components provided in deephaven.ui should be preferred over this module.
"""
from ..elements import BaseElement


def html_element(tag: str, *children: Any, **attributes: Any) -> BaseElement:
    """
    Create a new HTML element. Render just returns the children that are passed in.

    Args:
        tag: The HTML tag for this element.
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        A new HTML element.
    """
    return BaseElement(f"deephaven.ui.html.{tag}", *children, **attributes)


def div(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "div" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "div" with the specified children and attributes.
    """
    return html_element("div", *children, **attributes)


def span(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "span" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "span" with the specified children and attributes.
    """
    return html_element("span", *children, **attributes)


def h1(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "h1" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "h1" with the specified children and attributes.
    """
    return html_element("h1", *children, **attributes)


def h2(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "h2" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "h2" with the specified children and attributes.
    """
    return html_element("h2", *children, **attributes)


def h3(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "h3" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "h3" with the specified children and attributes.
    """
    return html_element("h3", *children, **attributes)


def h4(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "h4" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "h4" with the specified children and attributes.
    """
    return html_element("h4", *children, **attributes)


def h5(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "h5" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "h5" with the specified children and attributes.
    """
    return html_element("h5", *children, **attributes)


def h6(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "h6" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "h6" with the specified children and attributes.
    """
    return html_element("h6", *children, **attributes)


def p(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "p" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "p" with the specified children and attributes.
    """
    return html_element("p", *children, **attributes)


def a(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "a" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "a" with the specified children and attributes.
    """
    return html_element("a", *children, **attributes)


def ul(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "ul" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "ul" with the specified children and attributes.
    """
    return html_element("ul", *children, **attributes)


def ol(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "ol" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "ol" with the specified children and attributes.
    """
    return html_element("ol", *children, **attributes)


def li(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "li" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "li" with the specified children and attributes.
    """
    return html_element("li", *children, **attributes)


def table(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "table" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "table" with the specified children and attributes.
    """
    return html_element("table", *children, **attributes)


def thead(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "thead" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "thead" with the specified children and attributes.
    """
    return html_element("thead", *children, **attributes)


def tbody(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "tbody" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "tbody" with the specified children and attributes.
    """
    return html_element("tbody", *children, **attributes)


def tr(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "tr" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "tr" with the specified children and attributes.
    """
    return html_element("tr", *children, **attributes)


def th(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "th" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "th" with the specified children and attributes.
    """
    return html_element("th", *children, **attributes)


def td(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "td" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "td" with the specified children and attributes.
    """
    return html_element("td", *children, **attributes)


def b(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "b" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "b" with the specified children and attributes.
    """
    return html_element("b", *children, **attributes)


def i(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "i" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "i" with the specified children and attributes.
    """
    return html_element("i", *children, **attributes)


def br(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "br" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "br" with the specified children and attributes.
    """
    return html_element("br", *children, **attributes)


def hr(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "hr" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "hr" with the specified children and attributes.
    """
    return html_element("hr", *children, **attributes)


def pre(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "pre" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "pre" with the specified children and attributes.
    """
    return html_element("pre", *children, **attributes)


def code(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "code" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "code" with the specified children and attributes.
    """
    return html_element("code", *children, **attributes)


def img(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "img" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "img" with the specified children and attributes.
    """
    return html_element("img", *children, **attributes)


def button(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "button" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "button" with the specified children and attributes.
    """
    return html_element("button", *children, **attributes)


def input(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "input" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "input" with the specified children and attributes.
    """
    return html_element("input", *children, **attributes)


def form(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "form" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "form" with the specified children and attributes.
    """
    return html_element("form", *children, **attributes)


def label(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "label" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "label" with the specified children and attributes.
    """
    return html_element("label", *children, **attributes)


def select(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "select" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "select" with the specified children and attributes.
    """
    return html_element("select", *children, **attributes)


def option(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "option" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "option" with the specified children and attributes.
    """
    return html_element("option", *children, **attributes)


def textarea(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "textarea" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "textarea" with the specified children and attributes.
    """
    return html_element("textarea", *children, **attributes)


def style(*children: Any, **attributes: Any) -> BaseElement:
    """
    Creates an HTML "style" element with the specified children and attributes.

    Args:
        *children: The children of the element.
        **attributes: Attributes to set on the element

    Returns:
        An HTML element representing a "style" with the specified children and attributes.
    """
    return html_element("style", *children, **attributes)
