from __future__ import annotations
from typing import Any
from ..elements import BaseElement

NamePrefix = "deephaven.ui.components."


def component_element(name: str, /, *children: Any, **props: Any) -> BaseElement:
    """
    Base class for UI elements.
    All names are automatically prefixed with "deephaven.ui.components.", and
    all props are automatically camelCased.
    """
    return BaseElement(f"{NamePrefix}{name}", *children, **props)
