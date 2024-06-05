from __future__ import annotations
from typing import Any
from ..elements import BaseElement


def base_element(name: str, /, *children: Any, **props: Any) -> BaseElement:
    """
    Base class for UI elements.
    All names are automatically prefixed with "deephaven.ui.components.", and
    all props are automatically camelCased.
    """
    return BaseElement(f"deephaven.ui.components.{name}", *children, **props)


def grid(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Grid component.
    https://react-spectrum.adobe.com/react-spectrum/Grid.html
    """
    return base_element("Grid", *children, **props)


def heading(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Heading component.
    https://react-spectrum.adobe.com/react-spectrum/Heading.html
    """
    return base_element("Heading", *children, **props)


def icon_wrapper(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Icon component.
    Named icon_wrapper so as not to conflict with the Deephaven icon component.
    TODO: This doesn't seem to work correctly. It throws an error saying `Cannot read properties of undefined (reading 'className')`.
    https://react-spectrum.adobe.com/react-spectrum/Icon.html
    """
    return base_element("Icon", *children, **props)


def illustrated_message(*children, **props):
    """
    Python implementation for the Adobe React Spectrum IllustratedMessage component.
    https://react-spectrum.adobe.com/react-spectrum/IllustratedMessage.html
    """
    return base_element("IllustratedMessage", *children, **props)


def form(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Form component.
    https://react-spectrum.adobe.com/react-spectrum/Form.html
    """
    return base_element("Form", *children, **props)


def switch(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Switch component.
    https://react-spectrum.adobe.com/react-spectrum/Switch.html
    """
    return base_element("Switch", *children, **props)


def tabs(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Tabs component.
    https://react-spectrum.adobe.com/react-spectrum/Tabs.html
    """
    return base_element("Tabs", *children, **props)


def tab_list(*children, **props):
    """
    Python implementation for the Adobe React Spectrum TabList component.
    https://react-spectrum.adobe.com/react-spectrum/Tabs.html
    """
    return base_element("TabList", *children, **props)


def tab_panels(*children, **props):
    """
    Python implementation for the Adobe React Spectrum TabPanels component.
    https://react-spectrum.adobe.com/react-spectrum/Tabs.html
    """
    return base_element("TabPanels", *children, **props)


def text(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Text component.
    https://react-spectrum.adobe.com/react-spectrum/Text.html
    """
    return base_element("Text", *children, **props)


def view(*children, **props):
    """
    Python implementation for the Adobe React Spectrum View component.
    https://react-spectrum.adobe.com/react-spectrum/View.html
    """
    return base_element("View", *children, **props)
