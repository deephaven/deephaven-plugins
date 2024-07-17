from __future__ import annotations
from typing import Any
from ..elements import BaseElement


def component_element(name: str, /, *children: Any, **props: Any) -> BaseElement:
    """
    Base class for UI elements.
    All names are automatically prefixed with "deephaven.ui.components.", and
    all props are automatically camelCased.
    """
    return BaseElement(f"deephaven.ui.components.{name}", *children, **props)


def text(*children, **props):
    """
    Python implementation for the Adobe React Spectrum Text component.
    https://react-spectrum.adobe.com/react-spectrum/Text.html
    """
    return component_element("Text", *children, **props)
